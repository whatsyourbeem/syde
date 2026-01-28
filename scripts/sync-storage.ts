import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local if present
dotenv.config({ path: '.env.local' });

const LOCAL_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const LOCAL_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Local service role key (usually in .env.local or defaults)

// Command line arguments: <PROJECT_REF> <REMOTE_SERVICE_KEY>
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('Usage: npx tsx scripts/sync-storage.ts <PROJECT_REF> <REMOTE_SERVICE_ROLE_KEY>');
    console.log('\nError: Missing arguments.');
    process.exit(1);
}

const [PROJECT_REF, REMOTE_SERVICE_KEY] = args;
const REMOTE_SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

// We need a local service key. If not in env, we might fail or need to ask user.
// For local dev, the default anon/service keys are well known, but let's rely on .env.local usually.
// If the user hasn't set SUPABASE_SERVICE_ROLE_KEY in .env.local, we can try the default local one or warn.
// Typical local service key is often needed for admin tasks.
if (!LOCAL_SERVICE_KEY) {
    console.warn("⚠️  Warning: SUPABASE_SERVICE_ROLE_KEY not found in .env.local.");
    console.warn("   Using default local service key is not reliable if you changed it.");
    console.warn("   Please ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local for local admin access.");
}

async function syncStorage() {
    console.log(`\n🚀 Starting Storage Sync...`);
    console.log(`   From: ${REMOTE_SUPABASE_URL}`);
    console.log(`   To:   ${LOCAL_SUPABASE_URL}`);

    const remote = createClient(REMOTE_SUPABASE_URL, REMOTE_SERVICE_KEY);
    const local = createClient(LOCAL_SUPABASE_URL, LOCAL_SERVICE_KEY || 'place-holder-key-if-missing');

    // 1. Get List of Buckets from Local (Target)
    // We assume buckets already exist in local because user ran 'db pull' or 'db reset'
    const { data: localBuckets, error: bucketError } = await local.storage.listBuckets();

    if (bucketError) {
        console.error('❌ Failed to list local buckets:', bucketError.message);
        console.error('   Make sure your local Supabase is running (npx supabase start).');
        process.exit(1);
    }

    console.log(`\n📋 Found ${localBuckets.length} buckets in local: ${localBuckets.map(b => b.name).join(', ')}`);

    for (const bucket of localBuckets) {
        console.log(`\n📂 Syncing bucket: [${bucket.name}]`);

        // 2. List files in Remote & Local Buckets for comparison
        const remoteFiles = await listAllFiles(remote, bucket.name);
        const localFiles = await listAllFiles(local, bucket.name); // We need to see what we already have

        const localFileSet = new Set(localFiles.map(f => f.name));

        console.log(`   Found ${remoteFiles.length} files in remote.`);
        console.log(`   Found ${localFiles.length} files in local.`);

        let successCount = 0;
        let failCount = 0;
        let skipCount = 0;

        for (const file of remoteFiles) {
            if (!file.name) continue;

            // Check if file exists locally
            if (localFileSet.has(file.name)) {
                // We could also check metadata like size or updated_at if needed, but name check is good for basic "resume"
                // process.stdout.write('S'); // Skipped
                skipCount++;
                continue;
            }

            // 3. Download from Remote
            const { data: fileData, error: downloadError } = await remote.storage
                .from(bucket.name)
                .download(file.name);

            if (downloadError) {
                console.error(`   ❌ Download failed: ${file.name} - ${downloadError.message}`);
                failCount++;
                continue;
            }

            // 4. Upload to Local (Upsert)
            const { error: uploadError } = await local.storage
                .from(bucket.name)
                .upload(file.name, fileData, {
                    upsert: true,
                    contentType: file.metadata?.mimetype,
                });

            if (uploadError) {
                console.error(`   ❌ Upload failed: ${file.name} - ${uploadError.message}`);
                failCount++;
            } else {
                process.stdout.write('.'); // Progress dot
                successCount++;
            }
        }
        console.log(`\n   result: ${successCount} synced, ${skipCount} skipped, ${failCount} failed.`);
    }

    console.log('\n✨ Sync completed!');
}

async function listAllFiles(client: any, bucketName: string, path = ''): Promise<any[]> {
    let allFiles: any[] = [];
    const { data, error } = await client.storage.from(bucketName).list(path, { limit: 100 });

    if (error) {
        console.error(`   ⚠️ Failed to list files in ${bucketName}/${path}: ${error.message}`);
        return [];
    }

    for (const item of data) {
        if (item.id === null) {
            // It's a folder
            const subFiles = await listAllFiles(client, bucketName, `${path}${item.name}/`);
            allFiles = allFiles.concat(subFiles);
        } else {
            // It's a file. The name returned by list() is just the filename relative to the search path.
            // We need the full path for download/upload.
            // Actually, Supabase list returns relative names.
            // If we searched in 'folder/', item.name is 'file.png', full path 'folder/file.png'.
            const fullPath = path ? `${path}${item.name}` : item.name;
            allFiles.push({ ...item, name: fullPath });
        }
    }
    return allFiles;
}

syncStorage();
