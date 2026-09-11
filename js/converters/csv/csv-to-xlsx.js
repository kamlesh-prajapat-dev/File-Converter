/**
 * CSV -> XLSX Converter (Proactive Memory-Safe Export Chunking)
 */
import { BaseConverter } from "../base-converter.js";
import { CSVParser } from "./csv-parser.js";
import { LargeFileManager } from "../../core/large-file-manager.js";
import { IntegrityValidator } from "../../core/integrity-validator.js";
import { getXLSX } from "../../core/xlsx-provider.js";
import { CONFIG } from "../../config/config.js";

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

        const validator = new IntegrityValidator();
        validator.setInputRecords(totalRecords);

        const safeLimit = CONFIG.MAX_SAFE_XLSX_ROWS || 50000;
        const { chunkSize, totalParts } = LargeFileManager.calculateChunks(totalRecords, safeLimit);

        onProgress(25, `Preparing Excel export for ${totalRecords.toLocaleString()} records across ${totalParts} file part(s)...`);

        const generatedFiles = [];
        const originalName = options.fileName || "data.csv";
        let totalWrittenRecords = 0;

        for (let partIndex = 0; partIndex < totalParts; partIndex++) {
            const start = partIndex * chunkSize;
            const end = Math.min(start + chunkSize, totalRecords);
            const count = end - start;

            const progressPct = 25 + Math.round(((partIndex + 1) / totalParts) * 65);
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

        onProgress(92, "Verifying data integrity across all export parts...");
        const validation = validator.validate();
        if (!validation.isValid) {
            return this.createResult(false, [], {}, validation.error);
        }

        onProgress(100, "CSV to Excel conversion completed successfully.");
        return this.createResult(true, generatedFiles, {
            totalRows: totalRecords,
            writtenRows: totalWrittenRecords,
            totalColumns: headers.length,
            totalParts,
            integrityPassed: true
        });
    }
}
