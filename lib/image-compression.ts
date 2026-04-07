import imageCompression from "browser-image-compression";

export const FILE_SIZE_LIMIT = 20 * 1024 * 1024; // 20MB

export async function compressImage(
  file: File,
  type: "thumbnail" | "detail",
): Promise<File> {
  const options = {
    maxSizeMB: type === "thumbnail" ? 1 : 2,
    maxWidthOrHeight: type === "thumbnail" ? 1200 : 1920,
    useWebWorker: true,
    fileType: file.type,
  };
  return imageCompression(file, options);
}
