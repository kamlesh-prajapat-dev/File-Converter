/**
 * JSON -> CSV Converter (Single Output Stream)
 */
import { BaseConverter } from "../base-converter.js";
import { JSONParser } from "./json-parser.js";
import { MemoryManager } from "../../core/memory-manager.js";
import { IntegrityValidator } from "../../core/integrity-validator.js";
import { CONFIG } from "../../config/config.js";
import { getBaseFileName } from "../../utils/file-utils.js";

export class JsonToCsvConverter extends BaseConverter {
    static async convert(inputData, options = {}, onProgress = () => {}) {
        let buffer;
        if (inputData instanceof ArrayBuffer) {
            buffer = inputData;
        } else if (typeof inputData === "string") {
            buffer = inputData;
        } else if (inputData && typeof inputData.arrayBuffer === "function") {
            buffer = await inputData.arrayBuffer();
        } else {
            throw new Error("Invalid input for JSON to CSV converter.");
        }

        onProgress(10, "Parsing JSON data...");
        const json = JSONParser.parse(buffer, onProgress);

        const totalRecords = json.rows.length;
        const headers = json.headers;

        const validator = new IntegrityValidator();
        validator.setInputRecords(totalRecords);

        const chunkSize = MemoryManager.getAdaptiveChunkSize(typeof buffer === "string" ? buffer.length : buffer.byteLength);
        const csvParts = [];
        let totalWritten = 0;

        csvParts.push("\uFEFF" + headers.map(h => this.escapeCSVField(h)).join(",") + "\n");

        for (let i = 0; i < totalRecords; i += chunkSize) {
            const end = Math.min(i + chunkSize, totalRecords);
            const lines = [];

            for (let r = i; r < end; r++) {
                const row = json.rows[r];
                lines.push(row.map(val => this.escapeCSVField(val)).join(","));
            }

            csvParts.push(lines.join("\n") + "\n");
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

        const baseName = getBaseFileName(options.fileName || "data.json");
        const finalFileName = `${baseName}.csv`;

        onProgress(100, "JSON to CSV conversion completed successfully.");
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
