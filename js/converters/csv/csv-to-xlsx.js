/**
 * CSV -> XLSX Converter (Single File First, Multi-Part Fallback)
 */
import { BaseConverter } from "../base-converter.js";
import { CSVParser } from "./csv-parser.js";
import { MemoryManager } from "../../core/memory-manager.js";
import { IntegrityValidator } from "../../core/integrity-validator.js";
import { OutputManager } from "../../core/output-manager.js";
import { getXLSX } from "../../core/xlsx-provider.js";
import { LargeFileManager } from "../../core/large-file-manager.js";
import { CONFIG } from "../../config/config.js";
import { getBaseFileName } from "../../utils/file-utils.js";

export class CsvToXlsxConverter extends BaseConverter {
    static async convert(inputData, options = {}, onProgress = () => {}) {
        const XLSX = await getXLSX();

        let buffer;
        if (inputData instanceof ArrayBuffer) {
            buffer = inputData;
        } else if (typeof inputData === "string") {
            buffer = inputData;
        } else if (inputData && typeof inputData.arrayBuffer === "function") {
            buffer = await inputData.arrayBuffer();
        } else {
            throw new Error("Invalid input for CSV to XLSX converter.");
        }

        onProgress(10, "Parsing CSV contents...");
        const csv = CSVParser.parse(buffer, onProgress);

        const totalRecords = csv.rows.length;
        const headers = csv.headers;
        const originalName = options.fileName || "data.csv";
        const baseName = getBaseFileName(originalName);

        const validator = new IntegrityValidator();
        validator.setInputRecords(totalRecords);

        // STEP 1: Attempt Single File Serialization
        try {
            const chunkSize = MemoryManager.getAdaptiveChunkSize(typeof buffer === "string" ? buffer.length : buffer.byteLength);
            const maxRowsPerSheet = CONFIG.EXCEL_MAX_ROWS_PER_SHEET || 500000;

            const workbook = XLSX.utils.book_new();
            let currentSheetRows = [headers];
            let currentSheetIndex = 1;
            let totalWrittenRecords = 0;

            for (let i = 0; i < totalRecords; i += chunkSize) {
                const end = Math.min(i + chunkSize, totalRecords);
                const count = end - i;

                for (let r = i; r < end; r++) {
                    currentSheetRows.push(csv.rows[r]);

                    if (currentSheetRows.length - 1 >= maxRowsPerSheet) {
                        const ws = XLSX.utils.aoa_to_sheet(currentSheetRows);
                        XLSX.utils.book_append_sheet(workbook, ws, `Data_${currentSheetIndex}`);
                        currentSheetIndex++;
                        currentSheetRows = [headers];
                    }
                }

                totalWrittenRecords += count;

                const progressPct = 25 + Math.round((end / totalRecords) * 55);
                onProgress(progressPct, `Building single Excel workbook (${end.toLocaleString()} / ${totalRecords.toLocaleString()})...`);
            }

            if (currentSheetRows.length > 1 || workbook.SheetNames.length === 0) {
                const ws = XLSX.utils.aoa_to_sheet(currentSheetRows);
                XLSX.utils.book_append_sheet(workbook, ws, `Data_${currentSheetIndex}`);
            }
            currentSheetRows.length = 0;

            validator.addCheckpoint({
                chunkIndex: 0,
                startRecord: 0,
                endRecord: totalRecords,
                expectedRecords: totalRecords,
                processedRecords: totalRecords,
                writtenRecords: totalWrittenRecords
            });

            const validation = validator.validate();
            if (!validation.isValid) {
                return this.createResult(false, [], {}, validation.error);
            }

            onProgress(85, "Serializing single Excel file...");
            const excelBytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBytes], { type: CONFIG.MIME_TYPES.xlsx });

            onProgress(100, "CSV to Excel conversion completed successfully.");
            return OutputManager.createSingleFileResult(blob, `${baseName}.xlsx`, {
                totalRows: totalRecords,
                writtenRows: totalWrittenRecords,
                totalColumns: headers.length,
                totalWorksheets: workbook.SheetNames.length
            });
        } catch (singleFileErr) {
            console.warn("Single-file XLSX serialization exceeded memory bounds, switching to validated multi-part fallback:", singleFileErr);
        }

        // STEP 2: Safe Multi-Part Fallback
        onProgress(30, "Single-file output memory limit reached. Preparing validated multi-part fallback files...");
        validator.reset();
        validator.setInputRecords(totalRecords);

        const safeLimit = CONFIG.MAX_SAFE_XLSX_ROWS || 50000;
        const { chunkSize, totalParts } = LargeFileManager.calculateChunks(totalRecords, safeLimit);
        const generatedFiles = [];
        let totalWrittenRecords = 0;

        for (let partIndex = 0; partIndex < totalParts; partIndex++) {
            const start = partIndex * chunkSize;
            const end = Math.min(start + chunkSize, totalRecords);
            const count = end - start;

            const progressPct = 30 + Math.round(((partIndex + 1) / totalParts) * 60);
            onProgress(progressPct, `Creating Excel part ${partIndex + 1} of ${totalParts} (${count.toLocaleString()} rows)...`);

            const chunkData = [headers];
            for (let i = start; i < end; i++) {
                chunkData.push(csv.rows[i]);
            }

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(chunkData);
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

            const excelBytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBytes], { type: CONFIG.MIME_TYPES.xlsx });

            const fileName = LargeFileManager.generatePartFileName(originalName, "xlsx", partIndex + 1, totalParts);
            generatedFiles.push({ blob, fileName });

            totalWrittenRecords += count;

            validator.addCheckpoint({
                chunkIndex: partIndex,
                startRecord: start,
                endRecord: end,
                expectedRecords: count,
                processedRecords: count,
                writtenRecords: count
            });

            chunkData.length = 0;
        }

        onProgress(92, "Verifying data integrity across all part files...");
        const validation = validator.validate();
        if (!validation.isValid) {
            return this.createResult(false, [], {}, validation.error);
        }

        onProgress(100, "CSV to Excel conversion completed (Multi-Part Fallback).");
        return OutputManager.createMultiPartFallbackResult(
            generatedFiles,
            "Single-file output could not be prepared safely due to browser memory limits. All converted data is available in the validated part files below.",
            {
                totalRows: totalRecords,
                writtenRows: totalWrittenRecords,
                totalColumns: headers.length
            }
        );
    }
}
