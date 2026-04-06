import imageCompression from "browser-image-compression";

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
