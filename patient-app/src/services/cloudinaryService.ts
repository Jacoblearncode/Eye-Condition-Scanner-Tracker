const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Uses Cloudinary's unsigned upload API so the app can upload directly without
// a backend. Requires an unsigned upload preset configured in the Cloudinary
// dashboard (Settings > Upload > Upload presets > Signing Mode: Unsigned).
export async function uploadPhotoToCloudinary(photoUri: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', {
    uri: photoUri,
    type: 'image/jpeg',
    name: 'scan.jpg',
  } as unknown as Blob);
  formData.append('upload_preset', UPLOAD_PRESET ?? '');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload photo. Please try again.');
  }

  const data = await response.json();
  return data.secure_url as string;
}
