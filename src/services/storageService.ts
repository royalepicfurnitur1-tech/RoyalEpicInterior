import { supabase } from './productService';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Uploads a product image file or base64 data directly to Supabase Storage.
 * Supabase Storage bucket 'products' is the single production source of truth.
 * Returns the permanent public CDN URL.
 */
export async function uploadProductImage(
  fileOrBase64: File | Blob | string,
  filenamePrefix: string = 'prod'
): Promise<UploadResult> {
  try {
    let fileBlob: Blob;
    let extension = 'png';

    if (typeof fileOrBase64 === 'string') {
      if (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://')) {
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
        const mimeType = match[1] === 'jpg' || match[1] === 'jpeg' ? 'image/jpeg' : `image/${match[1]}`;
        fileBlob = new Blob([byteArray], { type: mimeType });
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
    const contentType = fileBlob.type || (extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`);

    // Upload directly to Supabase Storage bucket 'products'
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filename, fileBlob, {
        cacheControl: '31536000',
        upsert: true,
        contentType
      });

    if (error) {
      console.warn('Supabase storage upload notice:', error.message || error);
      // Fallback: If input was base64 string or fileBlob, upload to /api/storage/upload
      try {
        let base64Payload: string = '';
        if (typeof fileOrBase64 === 'string') {
          base64Payload = fileOrBase64;
        } else {
          // Convert Blob to Base64
          base64Payload = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(fileBlob);
          });
        }

        const fallbackRes = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Payload, filenamePrefix })
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success && fallbackData.url) {
          return { success: true, url: fallbackData.url };
        }
      } catch (fallbackErr) {
        console.error('Local fallback upload error:', fallbackErr);
      }

      return { success: false, error: error.message || 'Failed to upload image to Supabase Storage.' };
    }

    if (data?.path) {
      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);

      if (publicUrlData?.publicUrl) {
        return { success: true, url: publicUrlData.publicUrl };
      }
    }

    return { success: false, error: 'Failed to retrieve public URL from Supabase Storage.' };
  } catch (err: any) {
    console.error('uploadProductImage error:', err);
    return { success: false, error: err.message || 'Image upload failed.' };
  }
}

