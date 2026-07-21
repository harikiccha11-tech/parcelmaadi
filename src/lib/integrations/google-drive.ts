interface DriveUploadResult { url: string; provider: "google-drive" | "local"; }
export async function uploadToStorage(file: Buffer, filename: string): Promise<DriveUploadResult> {
  if (!process.env.GOOGLE_DRIVE_CREDENTIALS) return { url: `/uploads/${filename}`, provider: "local" };
  return { url: `/uploads/${filename}`, provider: "local" };
}
