import { DocPageClient } from "@/components/DocPageClient";

type SpreadsheetEditorPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Spreadsheet editor: loads document, real-time sync, presence, and optional Google auth.
 */
export default async function SpreadsheetEditorPage({
  params,
}: SpreadsheetEditorPageProps) {
  const { id } = await params;

  return <DocPageClient docId={id} />;
}
