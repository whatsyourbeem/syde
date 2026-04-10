import imageCompression from "browser-image-compression";

export const FILE_SIZE_LIMIT = 20 * 1024 * 1024; // 20MB

export async function compressImage(
  file: File,
  type: "thumbnail" | "thumbnail-lg" | "detail",
): Promise<File> {
  const options = {
    maxSizeMB: type === "detail" ? 1 : 0.3,
    maxWidthOrHeight: type === "detail" ? 1200 : type === "thumbnail-lg" ? 800 : 600,
    useWebWorker: true,
    fileType: "image/webp",
  };
  const compressed = await imageCompression(file, options);
  return new File([compressed], compressed.name, { type: "image/webp" });
}
