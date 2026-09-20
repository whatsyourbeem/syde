/**
 * insight-images 버킷의 모든 파일을 blog-images 버킷으로 "같은 경로 그대로" 복사하는 스크립트 (B10 4단계)
 *
 * 버킷 이름은 바꿀 수 없어서 새 버킷을 만들고 파일을 복사한다. 원본은 지우지 않는다.
 * 복사가 끝나고 검증을 통과한 뒤에 scripts/blog-images-url-replace.sql로 DB의 저장된 URL을 교체한다.
 *
 * 안전 원칙:
 *   1. 대상은 SUPABASE_URL이 가리키는 프로젝트뿐이다. 127.0.0.1 / localhost가 아니면 --prod 없이는 시작하지 않는다.
 *   2. 원본은 읽기만 한다. 대상에는 없는 파일만 쓰고, 이미 있는 파일은 덮어쓰지 않는다.
 *   3. 재실행 안전: 같은 경로에 같은 크기의 파일이 이미 있으면 건너뛴다.
 *   4. 같은 경로에 크기가 다른 파일이 이미 있으면 덮어쓰지 않고 실패로 보고한다.
 *   5. 끝나면 두 버킷의 파일 수와 전체 크기를 출력하고, 원본의 모든 파일이 같은 크기로 대상에 있어야 통과한다.
 *      (배포 후 blog-images에 새로 올라온 글 이미지는 "대상에만 있는 파일"로 따로 센다. 통과 여부에는 영향 없음)
 *
 * 사용법:
 *   npx tsx scripts/migrate-blog-images.ts                      # 로컬 (기본 .env.local)
 *   npx tsx scripts/migrate-blog-images.ts --dry-run            # 변경 없이 복사 대상만 출력
 *   npx tsx scripts/migrate-blog-images.ts --prod --dry-run     # 운영 프로젝트를 가리킬 때 (먼저 dry-run으로 확인)
 *   npx tsx scripts/migrate-blog-images.ts --prod               # 운영 실행
 *   npx tsx scripts/migrate-blog-images.ts --force-fallback     # copy 대신 다운로드+업로드 경로를 강제 (리허설용)
 *
 * 필요한 환경 변수(.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SOURCE_BUCKET = 'insight-images';
const DEST_BUCKET = 'blog-images';
const PAGE_SIZE = 100;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isDryRun = process.argv.includes('--dry-run');
const allowProd = process.argv.includes('--prod');
const forceFallback = process.argv.includes('--force-fallback');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ .env.local에 NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.');
  process.exit(1);
}

// 클라이언트를 만들기 전에 대상부터 확인한다. 로컬이 아니면 --prod 없이는 어떤 요청도 보내지 않는다.
let targetHost: string;
try {
  targetHost = new URL(SUPABASE_URL).hostname;
} catch {
  console.error(`❌ NEXT_PUBLIC_SUPABASE_URL을 해석할 수 없습니다: ${SUPABASE_URL}`);
  process.exit(1);
}
const isLocalTarget = targetHost === '127.0.0.1' || targetHost === 'localhost';

if (!isLocalTarget && !allowProd) {
  console.error(`❌ 대상이 로컬이 아닙니다: ${SUPABASE_URL}`);
  console.error('   운영 프로젝트에 실행하려면 --prod 플래그를 명시하세요. (먼저 --prod --dry-run을 권장합니다)');
  process.exit(1);
}

console.log(`대상 프로젝트: ${SUPABASE_URL} ${isLocalTarget ? '(로컬)' : '(⚠️ 로컬이 아님, --prod)'}`);
console.log(`복사: ${SOURCE_BUCKET} → ${DEST_BUCKET}${isDryRun ? '  [dry-run: 변경 없음]' : ''}\n`);

const client: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface StoredFile {
  path: string;
  size: number;
  mimetype: string;
  cacheControl: string;
}

/** 버킷 안의 모든 파일을 (폴더를 따라 내려가며, 페이지 단위로) 나열한다. */
async function listAllFiles(bucket: string, prefix = ''): Promise<StoredFile[]> {
  const files: StoredFile[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`파일 목록 조회 실패 [${bucket}/${prefix}]: ${error.message}`);
    for (const item of data ?? []) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        // 폴더
        files.push(...(await listAllFiles(bucket, fullPath)));
      } else {
        files.push({
          path: fullPath,
          size: Number(item.metadata?.size ?? 0),
          mimetype: item.metadata?.mimetype ?? '',
          cacheControl: item.metadata?.cacheControl ?? '',
        });
      }
    }
    if ((data?.length ?? 0) < PAGE_SIZE) break;
  }
  return files;
}

function totalSize(files: StoredFile[]): number {
  return files.reduce((sum, f) => sum + f.size, 0);
}

function formatBytes(bytes: number): string {
  return `${bytes.toLocaleString('en-US')} bytes`;
}

/** "max-age=3600" → "3600" (upload()의 cacheControl은 초 단위 문자열) */
function cacheControlSeconds(value: string): string | undefined {
  const match = value.match(/max-age=(\d+)/);
  return match ? match[1] : undefined;
}

/** 서버 측 복사(copy)를 먼저 시도하고, 실패하면 내려받아 같은 contentType·cacheControl로 올린다. */
async function copyOne(file: StoredFile): Promise<'copied' | 'copied-by-upload' | 'failed'> {
  if (!forceFallback) {
    const { error: copyError } = await client.storage
      .from(SOURCE_BUCKET)
      .copy(file.path, file.path, { destinationBucket: DEST_BUCKET });
    if (!copyError) return 'copied';
    console.warn(`  ↪ copy 실패, 내려받아 업로드로 대체: ${file.path} (${copyError.message})`);
  }
  const { data: blob, error: downloadError } = await client.storage.from(SOURCE_BUCKET).download(file.path);
  if (downloadError || !blob) {
    console.error(`  ❌ 다운로드 실패: ${file.path} (${downloadError?.message ?? 'empty'})`);
    return 'failed';
  }
  const { error: uploadError } = await client.storage.from(DEST_BUCKET).upload(file.path, blob, {
    contentType: file.mimetype || blob.type || undefined,
    cacheControl: cacheControlSeconds(file.cacheControl),
    upsert: false,
  });
  if (uploadError) {
    console.error(`  ❌ 업로드 실패: ${file.path} (${uploadError.message})`);
    return 'failed';
  }
  return 'copied-by-upload';
}

async function main() {
  const source = await listAllFiles(SOURCE_BUCKET);
  const destBefore = await listAllFiles(DEST_BUCKET);
  const destSizes = new Map(destBefore.map((f) => [f.path, f.size]));

  const toCopy: StoredFile[] = [];
  const alreadyCopied: StoredFile[] = [];
  const conflicts: StoredFile[] = [];
  for (const file of source) {
    const existing = destSizes.get(file.path);
    if (existing === undefined) toCopy.push(file);
    else if (existing === file.size) alreadyCopied.push(file);
    else conflicts.push(file);
  }

  console.log(`원본 ${SOURCE_BUCKET}: ${source.length}개, ${formatBytes(totalSize(source))}`);
  console.log(`대상 ${DEST_BUCKET}: ${destBefore.length}개, ${formatBytes(totalSize(destBefore))} (시작 시점)`);
  console.log(`  이미 복사됨(건너뜀): ${alreadyCopied.length}개`);
  console.log(`  복사 대상: ${toCopy.length}개, ${formatBytes(totalSize(toCopy))}`);
  console.log(`  크기가 다른 같은 경로(덮어쓰지 않음): ${conflicts.length}개\n`);
  for (const file of conflicts) {
    console.error(`  ❌ 충돌: ${file.path} 원본 ${file.size} / 대상 ${destSizes.get(file.path)}`);
  }

  if (isDryRun) {
    for (const file of toCopy) console.log(`  [dry-run] 복사 예정: ${file.path} (${file.size} bytes)`);
    console.log('\ndry-run이므로 아무것도 변경하지 않았습니다.');
    process.exit(conflicts.length > 0 ? 1 : 0);
  }

  let copied = 0;
  let copiedByUpload = 0;
  let failed = 0;
  for (const file of toCopy) {
    const result = await copyOne(file);
    if (result === 'copied') copied++;
    else if (result === 'copied-by-upload') copiedByUpload++;
    else failed++;
  }
  console.log(`복사 결과: copy ${copied}개, 업로드 대체 ${copiedByUpload}개, 실패 ${failed}개\n`);

  // 검증은 쓰기와 별개로, 다시 나열해서 실제 상태를 본다.
  const sourceAfter = await listAllFiles(SOURCE_BUCKET);
  const destAfter = await listAllFiles(DEST_BUCKET);
  const destAfterSizes = new Map(destAfter.map((f) => [f.path, f.size]));
  const sourcePaths = new Set(sourceAfter.map((f) => f.path));

  const missing = sourceAfter.filter((f) => !destAfterSizes.has(f.path));
  const sizeMismatch = sourceAfter.filter((f) => destAfterSizes.has(f.path) && destAfterSizes.get(f.path) !== f.size);
  const destOnly = destAfter.filter((f) => !sourcePaths.has(f.path));

  console.log('=== 검증 ===');
  console.log(`${SOURCE_BUCKET}: ${sourceAfter.length}개, ${formatBytes(totalSize(sourceAfter))}`);
  console.log(`${DEST_BUCKET}: ${destAfter.length}개, ${formatBytes(totalSize(destAfter))}`);
  console.log(`  원본에는 있는데 대상에 없는 파일: ${missing.length}개`);
  console.log(`  크기가 다른 파일: ${sizeMismatch.length}개`);
  console.log(`  대상에만 있는 파일(배포 후 새로 올라온 이미지): ${destOnly.length}개, ${formatBytes(totalSize(destOnly))}`);
  const totalsEqual = sourceAfter.length === destAfter.length && totalSize(sourceAfter) === totalSize(destAfter);
  console.log(`  파일 수·전체 크기 일치: ${totalsEqual ? '예' : '아니오'}`);

  const ok = failed === 0 && conflicts.length === 0 && missing.length === 0 && sizeMismatch.length === 0;
  if (ok) {
    console.log('\n✅ 원본의 모든 파일이 같은 경로·같은 크기로 대상에 있습니다. URL 교체를 진행해도 됩니다.');
    if (!totalsEqual) {
      console.log('   (수·크기가 다른 것은 대상에만 있는 새 이미지 때문입니다. 위 수치로 확인하세요.)');
    }
    process.exit(0);
  }
  console.error('\n❌ 검증 실패: URL 교체를 하지 마세요. 위 목록을 확인하고 이 스크립트를 다시 실행하세요.');
  process.exit(1);
}

main().catch((error) => {
  console.error('❌ 예기치 못한 오류:', error);
  process.exit(1);
});
