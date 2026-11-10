import { PDFParse } from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; numPages: number; info?: any }> {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return {
      text: result.text || '',
      numPages: result.total || 1,
    };
  } catch (error: any) {
    console.warn('[PDF Service] PDF parse warning or scanned document without embedded text:', error.message);
    return {
      text: '',
      numPages: 1,
    };
  }
}
