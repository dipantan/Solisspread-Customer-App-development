import { API_BASE_URL, API_TIMEOUT_MS } from '../config/env';
import { getAccessToken } from './tokenStorage';
import { ApiError } from './client';

export interface UploadedFile {
  url: string;
  fileName?: string;
}

/**
 * Upload a single asset (image picker asset or similar) to backend storage.
 * The backend stores it on Cloudflare R2/S3 and returns a public URL.
 */
export async function uploadFile(asset: {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}): Promise<UploadedFile> {
  const token = await getAccessToken();
  const form = new FormData();
  const name = asset.fileName ?? asset.uri.split('/').pop() ?? 'upload.jpg';
  const type = asset.mimeType ?? 'image/jpeg';
  // React Native fetch accepts {uri,name,type} parts for multipart bodies.
  form.append('file', { uri: asset.uri, name, type } as unknown as Blob);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/storage/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      throw new ApiError('Upload timed out. Please try again.', 0);
    }
    throw new ApiError('Network error while uploading.', 0);
  }
  clearTimeout(timer);

  const json = await res.json().catch(() => undefined);
  if (!res.ok) {
    throw new ApiError(json?.message || 'Upload failed', res.status);
  }
  const data = json?.data ?? json;
  if (!data?.url) {
    throw new ApiError('Upload failed — no file URL returned', res.status);
  }
  return data as UploadedFile;
}
