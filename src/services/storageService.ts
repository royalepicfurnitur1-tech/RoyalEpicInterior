import { supabase } from './productService';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Uploads a product image file or base64 data to Storage.
 * Strategy:
 * 1. Attempts Supabase Storage upload if bucket is provisioned.
 * 2. Seamlessly falls back to the resilient Express server storage endpoint (/api/storage/upload)
 *    which writes to the static persistent /storage/products/ directory.
 * 3. Never stores raw multi-megabyte base64 strings directly in the database.
 */
export async function uploadProductImage(
  fileOrBase64: File | Blob | string,
  filenamePrefix: string = 'prod'
): Promise<UploadResult> {
  try {
    let fileBlob: Blob;
    let extension = 'png';

    if (typeof fileOrBase64 === 'string') {
      if (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://') || fileOrBase64.startsWith('/storage/')) {
        // Already a hosted URL, no need to upload
        return { success: true, url: fileOrBase64 };
      }

      // Base64 data URL
      const match = fileOrBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        extension = match[1] === 'jpeg' ? 'jpg' : match[1];
        const byteCharacters = atob(match[2]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        fileBlob = new Blob([byteArray], { type: `image/${match[1]}` });
      } else {
        return { success: false, error: 'Invalid image format provided.' };
      }
    } else {
      fileBlob = fileOrBase64;
      const name = (fileOrBase64 as File).name;
      if (name && name.includes('.')) {
        extension = name.split('.').pop()?.toLowerCase() || 'png';
      }
    }

    const cleanPrefix = filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanPrefix}-${Date.now()}.${extension}`;

    // 1. Try Supabase Storage first if available
    try {
      const { data, error } = await supabase.storage
        .from('products')
        .upload(filename, fileBlob, {
          cacheControl: '31536000',
          upsert: true,
          contentType: fileBlob.type || `image/${extension}`
        });

      if (!error && data?.path) {
        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(data.path);
        if (publicUrlData?.publicUrl) {
          return { success: true, url: publicUrlData.publicUrl };
        }
      }
    } catch (_) {
      // Supabase storage bucket not configured or permission denied, fall through to server storage
    }

    // 2. Server storage upload endpoint
    const formData = new FormData();
    formData.append('file', fileBlob, filename);
    formData.append('filename', filename);

    const res = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.success && data.url) {
      return { success: true, url: data.url };
    }

    return { success: false, error: data.error || 'Failed to upload image to storage service.' };
  } catch (err: any) {
    console.error('uploadProductImage error:', err);
    return { success: false, error: err.message || 'Image upload failed.' };
  }
}
