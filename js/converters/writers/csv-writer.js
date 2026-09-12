/**
 * CSV / TSV Writer Module
 * Generates CSV or TSV text files in memory-safe chunks.
 */
import { BaseConverter } from "../base-converter.js";
import { MemoryManager } from "../../core/memory-manager.js";
import { IntegrityValidator } from "../../core/integrity-validator.js";
import { OutputManager } from "../../core/output-manager.js";
import { CONFIG } from "../../config/config.js";

export class CSVWriter extends BaseConverter {
    /**
     * Write normalized data to CSV or TSV
     * @param {{ headers: Array<string>, rows: Array<Array<any>>, totalRows: number, totalColumns: number }} data 
     * @param {string} targetFormat ('csv' or 'tsv')
     * @param {string} baseName 
     * @param {function(number, string): void} onProgress 
     * @returns {Promise<object>}
     */
    static async write(data, targetFormat, baseName, onProgress) {
        const { headers, rows, totalRows, totalColumns } = data;

        const validator = new IntegrityValidator();
        validator.setInputRecords(totalRows);

        const delimiter = targetFormat === "tsv" ? "\t" : ",";
        const ext = targetFormat === "tsv" ? "tsv" : "csv";
        const mimeType = targetFormat === "tsv" ? CONFIG.MIME_TYPES.tsv : CONFIG.MIME_TYPES.csv;

        const chunkSize = MemoryManager.getAdaptiveChunkSize(totalRows * 50);
        const textParts = [];
        let totalWritten = 0;

        // UTF-8 BOM + Header line
        textParts.push("\uFEFF" + headers.map(h => this.escapeField(h, delimiter)).join(delimiter) + "\n");

        for (let i = 0; i < totalRows; i += chunkSize) {
            const end = Math.min(i + chunkSize, totalRows);
            const lines = [];

            for (let r = i; r < end; r++) {
                const row = rows[r];
                lines.push(row.map(val => this.escapeField(val, delimiter)).join(delimiter));
            }

            textParts.push(lines.join("\n") + "\n");
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
            const progressPct = 30 + Math.round((end / totalRows) * 60);
            onProgress(progressPct, `Building ${targetFormat.toUpperCase()} stream (${end.toLocaleString()} / ${totalRows.toLocaleString()})...`);
        }

        const validation = validator.validate();
        if (!validation.isValid) {
            throw new Error(validation.error.reason);
        }

        onProgress(95, `Creating final ${targetFormat.toUpperCase()} Blob...`);
        const blob = new Blob(textParts, { type: mimeType });
        textParts.length = 0;

        onProgress(100, `Conversion to ${targetFormat.toUpperCase()} completed successfully.`);
        return OutputManager.createSingleFileResult(blob, `${baseName}.${ext}`, {
            totalRows,
            writtenRows: totalWritten,
            totalColumns
        });
    }

    static escapeField(val, delimiter) {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        if (str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }
}
