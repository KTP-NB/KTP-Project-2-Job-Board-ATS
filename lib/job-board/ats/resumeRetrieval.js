import crypto from 'node:crypto';
import { getJobBoardServiceClient } from '../supabaseServer.js';

export async function getLatestResumeForUser(userId) {
  const service = getJobBoardServiceClient();
  const { data: profile, error } = await service
    .from('member_profiles')
    .select('id, user_id, resume_bucket, resume_storage_path, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!profile?.resume_storage_path) {
    const err = new Error('Upload a PDF resume from your profile before running ATS analysis.');
    err.status = 400;
    throw err;
  }

  const bucket = profile.resume_bucket || 'member-resumes';
  const { data, error: downloadError } = await service.storage
    .from(bucket)
    .download(profile.resume_storage_path);

  if (downloadError) throw downloadError;

  const buffer = Buffer.from(await data.arrayBuffer());
  const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');

  return {
    profile,
    bucket,
    path: profile.resume_storage_path,
    version: profile.updated_at || contentHash,
    buffer,
    contentHash,
  };
}
