import { Directory, File, Paths } from 'expo-file-system';

// Photos live in the app's private document folder, which other apps can't read. Records store
// only the file name, so the folder can move without breaking them. Nothing here touches the network.
function scansDir(): Directory {
  return new Directory(Paths.document, 'scans');
}

function extensionOf(uri: string): string {
  const match = /\.([A-Za-z0-9]{2,5})(?:\?.*)?$/.exec(uri);
  return match ? `.${match[1].toLowerCase()}` : '.jpg';
}

// Copies a camera photo (which sits in a cache folder the OS may clear) into permanent storage
// and returns the stored file name.
export function storePhoto(sourceUri: string, scanId: string): string {
  const dir = scansDir();
  dir.create({ intermediates: true, idempotent: true });
  const fileName = `${scanId}${extensionOf(sourceUri)}`;
  new File(sourceUri).copy(new File(dir, fileName));
  return fileName;
}

export function photoUri(fileName: string): string {
  return new File(scansDir(), fileName).uri;
}

export function deletePhoto(fileName: string): void {
  const file = new File(scansDir(), fileName);
  if (file.exists) file.delete();
}
