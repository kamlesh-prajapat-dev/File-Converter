/**
 * XLSX / XLS / ODS Spreadsheet Parser Module
 * Reads Excel (.xlsx, .xls) and OpenDocument (.ods) files using SheetJS (XLSX).
 */
import { getXLSX } from "../../core/xlsx-provider.js";

export class XLSXParser {
    /**
     * Parse binary ArrayBuffer into normalized { headers, rows, totalRows, totalColumns }
     * @param {ArrayBuffer} arrayBuffer 
     * @param {function(number, string): void} [onProgress]
     * @returns {Promise<{ headers: Array<string>, rows: Array<Array<any>>, totalRows: number, totalColumns: number }>}
     */
    static async parse(arrayBuffer, onProgress) {
        if (onProgress) onProgress(12, "Loading Excel parser engine...");
        const XLSX = await getXLSX();

        if (onProgress) onProgress(18, "Reading spreadsheet workbook structure...");
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error("Spreadsheet contains no worksheets.");
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
            throw new Error(`Worksheet '${firstSheetName}' is empty.`);
        }

        if (onProgress) onProgress(22, `Extracting worksheet data from '${firstSheetName}'...`);
        // Convert sheet to Array of Arrays (AOA)
        const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        if (!aoa || aoa.length === 0) {
            throw new Error("No data rows found in spreadsheet.");
        }

        const headers = aoa[0].map((h, idx) => String(h || `Column_${idx + 1}`).trim());
        const rows = aoa.slice(1).map(row => {
            return headers.map((_, idx) => row[idx] !== undefined ? row[idx] : "");
        });

        return {
            headers,
            rows,
            totalRows: rows.length,
            totalColumns: headers.length
        };
    }
}
