import imageCompression from "browser-image-compression";

export const FILE_SIZE_LIMIT = 20 * 1024 * 1024; // 20MB

export async function compressImage(
  file: File,
  type: "thumbnail" | "detail",
): Promise<File> {
  const options = {
    maxSizeMB: type === "thumbnail" ? 0.3 : 1,
    maxWidthOrHeight: type === "thumbnail" ? 600 : 1200,
    useWebWorker: true,
    fileType: "image/webp",
  };
  const compressed = await imageCompression(file, options);
  return new File([compressed], compressed.name, { type: "image/webp" });
}
