/**
 * DBF -> CSV Converter (Single Output Stream)
 */
import { BaseConverter } from "../base-converter.js";
import { DBFParser } from "./dbf-parser.js";
import { MemoryManager } from "../../core/memory-manager.js";
import { IntegrityValidator } from "../../core/integrity-validator.js";
import { CONFIG } from "../../config/config.js";
import { getBaseFileName } from "../../utils/file-utils.js";

export class DBFToCsvConverter extends BaseConverter {
    static async convert(inputData, options = {}, onProgress = () => {}) {
        let buffer;
        if (inputData instanceof ArrayBuffer) {
            buffer = inputData;
        } else if (inputData && typeof inputData.arrayBuffer === "function") {
            buffer = await inputData.arrayBuffer();
        } else {
            throw new Error("Invalid input data for DBF converter.");
        }

        onProgress(10, "Parsing DBF binary structure...");
        const dbf = DBFParser.parse(buffer, (pct, msg) => onProgress(Math.round(10 + pct * 0.15), msg));

        const totalRecords = dbf.records.length;
        const headers = dbf.fields.map(f => f.name);

        const validator = new IntegrityValidator();
        validator.setInputRecords(totalRecords);

        const chunkSize = MemoryManager.getAdaptiveChunkSize(buffer.byteLength);
        const csvParts = [];
        let totalWritten = 0;

        // Header line
        csvParts.push("\uFEFF" + headers.map(h => this.escapeCSVField(h)).join(",") + "\n");

        for (let i = 0; i < totalRecords; i += chunkSize) {
            const end = Math.min(i + chunkSize, totalRecords);
            const lines = [];

            for (let r = i; r < end; r++) {
                const row = dbf.records[r];
                lines.push(row.map(val => this.escapeCSVField(val)).join(","));
            }

            const chunkText = lines.join("\n") + "\n";
            csvParts.push(chunkText);
            const count = end - i;
            totalWritten += count;

            validator.addCheckpoint({
                chunkIndex: Math.floor(i / chunkSize),
                startRecord: i,
                endRecord: end,
                expectedRecords: count,
                processedRecords: count,
                writtenRecords: count
            });

            lines.length = 0;
            const progressPct = 25 + Math.round((end / totalRecords) * 65);
            onProgress(progressPct, `Building CSV text (${end.toLocaleString()} / ${totalRecords.toLocaleString()})...`);
        }

        onProgress(90, "Verifying data integrity...");
        const validation = validator.validate();
        if (!validation.isValid) {
            return this.createResult(false, [], {}, validation.error);
        }

        onProgress(95, "Creating final CSV file Blob...");
        const blob = new Blob(csvParts, { type: CONFIG.MIME_TYPES.csv });
        csvParts.length = 0;

        const baseName = getBaseFileName(options.fileName || "data.dbf");
        const finalFileName = `${baseName}.csv`;

        onProgress(100, "DBF to CSV conversion completed successfully.");
        return this.createResult(true, [{ blob, fileName: finalFileName }], {
            totalRows: totalRecords,
            writtenRows: totalWritten,
            totalColumns: headers.length,
            integrityPassed: true
        });
    }

    static escapeCSVField(val) {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }
}
