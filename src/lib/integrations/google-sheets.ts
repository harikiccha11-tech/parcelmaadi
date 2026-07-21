export async function exportToSheets(data: any[], sheetName: string): Promise<string | null> {
  if (!process.env.GOOGLE_SHEETS_CREDENTIALS) return null;
  return null;
}
