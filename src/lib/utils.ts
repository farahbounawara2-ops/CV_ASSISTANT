/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Get the file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toUpperCase() : "";
}

/**
 * Validate file type against allowed extensions
 */
export function isValidFileType(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  return allowedExtensions.map((e) => e.toLowerCase()).includes(ext);
}

/**
 * Maximum file size: 10 MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate file size (max 10 MB)
 */
export function isValidFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

