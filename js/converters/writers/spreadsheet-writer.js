/**
 * Spreadsheet Writer Module (XLSX, ODS)
 * Generates Excel (.xlsx) and OpenDocument (.ods) files using SheetJS.
 */
import { getXLSX } from "../../core/xlsx-provider.js";
import { MemoryManager } from "../../core/memory-manager.js";
import { IntegrityValidator } from "../../core/integrity-validator.js";
import { OutputManager } from "../../core/output-manager.js";
import { LargeFileManager } from "../../core/large-file-manager.js";
import { CONFIG } from "../../config/config.js";

export class SpreadsheetWriter {
    /**
     * Write normalized data into XLSX or ODS Blob result
     * @param {{ headers: Array<string>, rows: Array<Array<any>>, totalRows: number, totalColumns: number }} data 
     * @param {string} targetFormat ('xlsx' or 'ods')
     * @param {string} baseName 
     * @param {function(number, string): void} onProgress 
     * @returns {Promise<object>}
     */
    static async write(data, targetFormat, baseName, onProgress) {
        const XLSX = await getXLSX();
        const { headers, rows, totalRows, totalColumns } = data;

        const validator = new IntegrityValidator();
        validator.setInputRecords(totalRows);

        const ext = targetFormat === "ods" ? "ods" : "xlsx";
        const bookType = targetFormat === "ods" ? "ods" : "xlsx";
        const mimeType = targetFormat === "ods" ? CONFIG.MIME_TYPES.ods : CONFIG.MIME_TYPES.xlsx;

        onProgress(30, `Building single ${targetFormat.toUpperCase()} workbook...`);

        // STEP 1: Attempt Single File Serialization
        try {
            const maxRowsPerSheet = CONFIG.EXCEL_MAX_ROWS_PER_SHEET || 500000;
            const workbook = XLSX.utils.book_new();

            let currentSheetRows = [headers];
            let currentSheetIndex = 1;
            let totalWritten = 0;

            if (data.tablesMap && Object.keys(data.tablesMap).length > 1) {
                // Multi-table mode (e.g. SQL dump with multiple tables)
                for (const [tblName, tblData] of Object.entries(data.tablesMap)) {
                    const sheetRows = [tblData.headers, ...tblData.rows];
                    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
                    XLSX.utils.book_append_sheet(workbook, ws, tblName.substring(0, 31));
                    totalWritten += tblData.rows.length;
                }
            } else {
                for (let i = 0; i < totalRows; i += chunkSize) {
                    const end = Math.min(i + chunkSize, totalRows);
                    const count = end - i;

                    for (let r = i; r < end; r++) {
                        currentSheetRows.push(rows[r]);
                        if (currentSheetRows.length - 1 >= maxRowsPerSheet) {
                            const ws = XLSX.utils.aoa_to_sheet(currentSheetRows);
                            XLSX.utils.book_append_sheet(workbook, ws, `Data_${currentSheetIndex}`);
                            currentSheetIndex++;
                            currentSheetRows = [headers];
                        }
                    }

                    totalWritten += count;
                    const progressPct = 30 + Math.round((end / totalRows) * 50);
                    onProgress(progressPct, `Building sheet records (${end.toLocaleString()} / ${totalRows.toLocaleString()})...`);
                }

                if (currentSheetRows.length > 1 || workbook.SheetNames.length === 0) {
                    const ws = XLSX.utils.aoa_to_sheet(currentSheetRows);
                    XLSX.utils.book_append_sheet(workbook, ws, `Data_${currentSheetIndex}`);
                }
            }

            validator.addCheckpoint({
                chunkIndex: 0,
                startRecord: 0,
                endRecord: totalRows,
                expectedRecords: totalRows,
                processedRecords: totalRows,
                writtenRecords: totalWritten
            });

            const validation = validator.validate();
            if (!validation.isValid) {
                throw new Error(validation.error.reason);
            }

            onProgress(85, `Serializing single ${targetFormat.toUpperCase()} Blob...`);
            const fileBytes = XLSX.write(workbook, { bookType, type: "array" });
            const blob = new Blob([fileBytes], { type: mimeType });

            onProgress(100, `Conversion to ${targetFormat.toUpperCase()} completed successfully.`);
            return OutputManager.createSingleFileResult(blob, `${baseName}.${ext}`, {
                totalRows,
                writtenRows: totalWritten,
                totalColumns,
                totalWorksheets: workbook.SheetNames.length
            });
        } catch (singleErr) {
            console.warn(`Single file ${targetFormat} serialization memory limit reached, switching to multi-part fallback:`, singleErr);
        }

        // STEP 2: Multi-Part Fallback
        onProgress(35, `Switching to validated multi-part fallback for ${targetFormat.toUpperCase()}...`);
        validator.reset();
        validator.setInputRecords(totalRows);

        const safeLimit = CONFIG.MAX_SAFE_XLSX_ROWS || 50000;
        const { chunkSize, totalParts } = LargeFileManager.calculateChunks(totalRows, safeLimit);
        const generatedFiles = [];
        let totalWritten = 0;

        for (let partIndex = 0; partIndex < totalParts; partIndex++) {
            const start = partIndex * chunkSize;
            const end = Math.min(start + chunkSize, totalRows);
            const count = end - start;

            const progressPct = 35 + Math.round(((partIndex + 1) / totalParts) * 55);
            onProgress(progressPct, `Creating part ${partIndex + 1} of ${totalParts} (${count.toLocaleString()} rows)...`);

            const chunkData = [headers, ...rows.slice(start, end)];
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(chunkData);
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

            const fileBytes = XLSX.write(workbook, { bookType, type: "array" });
            const blob = new Blob([fileBytes], { type: mimeType });
            const fileName = LargeFileManager.generatePartFileName(baseName, ext, partIndex + 1, totalParts);

            generatedFiles.push({ blob, fileName });
            totalWritten += count;

            validator.addCheckpoint({
                chunkIndex: partIndex,
                startRecord: start,
                endRecord: end,
                expectedRecords: count,
                processedRecords: count,
                writtenRecords: count
            });
        }

        const validation = validator.validate();
        if (!validation.isValid) {
            throw new Error(validation.error.reason);
        }

        onProgress(100, `Conversion completed (Multi-Part Fallback).`);
        return OutputManager.createMultiPartFallbackResult(
            generatedFiles,
            `Single-file output exceeded browser memory capacity. Exported as ${totalParts} validated part files.`,
            { totalRows, writtenRows: totalWritten, totalColumns }
        );
    }
}
