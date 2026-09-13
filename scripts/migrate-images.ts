/**
 * 기존 대용량 PNG 파일을 WebP로 재압축하고 cacheControl을 1년으로 설정하는 마이그레이션 스크립트
 *
 * 안전 원칙:
 *   1. 새 파일 업로드 성공 후 DB 업데이트
 *   2. DB 업데이트 확인 후 기존 파일 삭제
 *   3. 어느 단계든 실패 시 해당 파일 건너뜀 (기존 파일 보존)
 *   4. 재실행 안전: 이미 마이그레이션된 파일은 건너뜀
 *
 * 사용법:
 *   npx tsx scripts/migrate-images.ts              # 실제 실행
 *   npx tsx scripts/migrate-images.ts --dry-run    # 변경 없이 대상 목록만 출력
 *   npx tsx scripts/migrate-images.ts --bucket=showcases  # 특정 버킷만 실행
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ .env.local에 NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.');
  process.exit(1);
}

const isDryRun = process.argv.includes('--dry-run');
const targetBucket = process.argv.find(a => a.startsWith('--bucket='))?.split('=')[1];

// 버킷 → DB 컬럼 매핑
// isArray: true인 경우 text[] 컬럼으로 URL 배열 내 항목을 교체
const BUCKET_CONFIG: Record<string, Array<{ table: string; column: string; isArray?: boolean }>> = {
  'showcases': [
    { table: 'showcases', column: 'thumbnail_url' },
    { table: 'showcases', column: 'images', isArray: true },
  ],
  'logs': [
    { table: 'logs', column: 'image_url' },
  ],
  'meetups': [
    { table: 'meetups', column: 'thumbnail_url' },
  ],
  'insight-images': [
    { table: 'insights', column: 'image_url' },
  ],
};

function getCompressionType(path: string): 'thumbnail' | 'detail' {
  return path.includes('/details/') || path.includes('/editor/') ? 'detail' : 'thumbnail';
}

async function compressToWebP(buffer: Buffer, type: 'thumbnail' | 'detail'): Promise<Buffer> {
  const maxPx = type === 'thumbnail' ? 600 : 1200;
  const quality = type === 'thumbnail' ? 75 : 80;
  return sharp(buffer)
    .resize(maxPx, maxPx, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}

function stripExtension(path: string): string {
  return path.replace(/\.[^/.]+$/, '');
}

function getPublicUrl(client: SupabaseClient, bucket: string, path: string): string {
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function listAllFiles(
  client: SupabaseClient,
  bucket: string,
  prefix = '',
): Promise<Array<{ path: string; mimetype: string; size: number }>> {
  const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) {
    console.error(`  ⚠️ 파일 목록 조회 실패 [${bucket}/${prefix}]: ${error.message}`);
    return [];
  }

  let files: Array<{ path: string; mimetype: string; size: number }> = [];
  for (const item of data ?? []) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      // 폴더
      files = files.concat(await listAllFiles(client, bucket, fullPath));
    } else {
      files.push({
        path: fullPath,
        mimetype: item.metadata?.mimetype ?? '',
        size: item.metadata?.size ?? 0,
      });
    }
  }
  return files;
}

// 단순 URL 컬럼 업데이트
async function updateSimpleColumn(
  client: SupabaseClient,
  table: string,
  column: string,
  oldUrl: string,
  newUrl: string,
): Promise<number> {
  const { data, error } = await client
    .from(table)
    .update({ [column]: newUrl })
    .eq(column, oldUrl)
    .select('id');

  if (error) throw new Error(`DB 업데이트 실패 [${table}.${column}]: ${error.message}`);
  return data?.length ?? 0;
}

// text[] 컬럼 업데이트: old URL을 포함하는 row를 찾아 배열 내 URL을 교체
async function updateArrayColumn(
  client: SupabaseClient,
  table: string,
  column: string,
  oldUrl: string,
  newUrl: string,
): Promise<number> {
  // 1. old URL이 포함된 row 조회
  const { data: rows, error: fetchError } = await client
    .from(table)
    .select(`id, ${column}`)
    .contains(column, [oldUrl]);

  if (fetchError) throw new Error(`DB 조회 실패 [${table}.${column}]: ${fetchError.message}`);
  if (!rows || rows.length === 0) return 0;

  // 2. 각 row의 배열에서 URL 교체 후 업데이트
  let updatedCount = 0;
  for (const row of rows as unknown as { id: string; [key: string]: unknown }[]) {
    const oldArray: string[] = (row[column] as string[]) ?? [];
    const newArray = oldArray.map((url: string) => (url === oldUrl ? newUrl : url));

    const { error: updateError } = await client
      .from(table)
      .update({ [column]: newArray })
      .eq('id', row.id);

    if (updateError) throw new Error(`DB 배열 업데이트 실패 [${table}.${column}] id=${row.id}: ${updateError.message}`);
    updatedCount++;
  }
  return updatedCount;
}

interface LogEntry {
  bucket: string;
  path: string;
  status: 'success' | 'skipped' | 'failed';
  reason?: string;
  oldSizeKB?: number;
  newSizeKB?: number;
  dbUpdatedRows?: number;
}

async function migrateBucket(
  client: SupabaseClient,
  bucket: string,
  configs: typeof BUCKET_CONFIG[string],
  log: LogEntry[],
) {
  console.log(`\n📂 [${bucket}]`);

  const allFiles = await listAllFiles(client, bucket);
  const targets = allFiles.filter(f =>
    f.mimetype === 'image/png' || f.path.toLowerCase().endsWith('.png')
  );

  console.log(`  전체 ${allFiles.length}개 | PNG 대상 ${targets.length}개`);
  if (targets.length === 0) return;

  let success = 0, skipped = 0, failed = 0;

  for (const file of targets) {
    const oldPath = file.path;
    const newPath = `${stripExtension(oldPath)}.webp`;
    const compressionType = getCompressionType(oldPath);

    process.stdout.write(`  ${oldPath} → `);

    if (isDryRun) {
      console.log(`${newPath} [${Math.round(file.size / 1024)}KB] [DRY-RUN]`);
      log.push({ bucket, path: oldPath, status: 'skipped', reason: 'dry-run', oldSizeKB: Math.round(file.size / 1024) });
      skipped++;
      continue;
    }

    try {
      // 1. 다운로드
      const { data: blob, error: dlErr } = await client.storage.from(bucket).download(oldPath);
      if (dlErr || !blob) throw new Error(`다운로드 실패: ${dlErr?.message}`);
      const originalBuf = Buffer.from(await blob.arrayBuffer());

      // 2. WebP 압축
      const compressedBuf = await compressToWebP(originalBuf, compressionType);

      // 3. 새 경로로 업로드
      const { error: upErr } = await client.storage.from(bucket).upload(newPath, compressedBuf, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: false,
      });
      if (upErr) throw new Error(`업로드 실패: ${upErr.message}`);

      // 4. DB 업데이트
      const oldUrl = getPublicUrl(client, bucket, oldPath);
      const newUrl = getPublicUrl(client, bucket, newPath);
      let totalUpdatedRows = 0;

      for (const config of configs) {
        const updated = config.isArray
          ? await updateArrayColumn(client, config.table, config.column, oldUrl, newUrl)
          : await updateSimpleColumn(client, config.table, config.column, oldUrl, newUrl);
        totalUpdatedRows += updated;
      }

      // 5. 기존 파일 삭제
      const { error: delErr } = await client.storage.from(bucket).remove([oldPath]);
      if (delErr) {
        // 삭제 실패는 치명적이지 않음 (새 파일 + DB는 정상)
        console.log(`완료 ⚠️ (구 파일 삭제 실패 - 수동 삭제 필요)`);
      } else {
        const oldKB = Math.round(originalBuf.length / 1024);
        const newKB = Math.round(compressedBuf.length / 1024);
        const reduction = Math.round((1 - compressedBuf.length / originalBuf.length) * 100);
        console.log(`완료 (${oldKB}KB → ${newKB}KB, -${reduction}%, DB ${totalUpdatedRows}행 업데이트)`);
      }

      log.push({
        bucket,
        path: oldPath,
        status: 'success',
        oldSizeKB: Math.round(originalBuf.length / 1024),
        newSizeKB: Math.round(compressedBuf.length / 1024),
        dbUpdatedRows: totalUpdatedRows,
      });
      success++;

    } catch (err: any) {
      console.log(`실패 (${err.message})`);
      log.push({ bucket, path: oldPath, status: 'failed', reason: err.message });
      failed++;
    }
  }

  console.log(`  → 성공 ${success}, 건너뜀 ${skipped}, 실패 ${failed}`);
}

async function main() {
  console.log(`\n🚀 이미지 마이그레이션 ${isDryRun ? '[DRY-RUN]' : '시작'}`);

  const client = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
  const log: LogEntry[] = [];

  const bucketsToProcess = targetBucket
    ? Object.fromEntries(
        Object.entries(BUCKET_CONFIG).filter(([key]) => key === targetBucket)
      )
    : BUCKET_CONFIG;

  if (Object.keys(bucketsToProcess).length === 0) {
    console.error(`❌ 알 수 없는 버킷: ${targetBucket}`);
    console.error(`   사용 가능: ${Object.keys(BUCKET_CONFIG).join(', ')}`);
    process.exit(1);
  }

  for (const [bucket, configs] of Object.entries(bucketsToProcess)) {
    await migrateBucket(client, bucket, configs, log);
  }

  // 결과 요약
  const succeeded = log.filter(r => r.status === 'success');
  const failed = log.filter(r => r.status === 'failed');
  const savedKB = succeeded.reduce((acc, r) => acc + (r.oldSizeKB ?? 0) - (r.newSizeKB ?? 0), 0);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 성공: ${succeeded.length}개 | ❌ 실패: ${failed.length}개 | 전체: ${log.length}개`);
  if (succeeded.length > 0) {
    console.log(`💾 절약 용량: ${Math.round(savedKB / 1024 * 10) / 10} MB`);
  }
  if (failed.length > 0) {
    console.log('\n❌ 실패 목록:');
    failed.forEach(r => console.log(`   ${r.bucket}/${r.path}: ${r.reason}`));
  }

  const logFile = `scripts/migrate-images-${new Date().toISOString().slice(0, 10)}.log.json`;
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
  console.log(`\n📄 로그 저장: ${logFile}`);
}

main().catch(err => {
  console.error('❌ 예기치 않은 오류:', err);
  process.exit(1);
});
