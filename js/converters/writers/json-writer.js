/**
 * JSON Writer Module
 * Generates JSON array files in memory-safe chunks.
 */
import { BaseConverter } from "../base-converter.js";
import { MemoryManager } from "../../core/memory-manager.js";
import { IntegrityValidator } from "../../core/integrity-validator.js";
import { OutputManager } from "../../core/output-manager.js";
import { CONFIG } from "../../config/config.js";

export class JSONWriter extends BaseConverter {
    static async write(data, targetFormat, baseName, onProgress) {
        const { headers, rows, totalRows, totalColumns } = data;

        const validator = new IntegrityValidator();
        validator.setInputRecords(totalRows);

        const chunkSize = MemoryManager.getAdaptiveChunkSize(totalRows * 50);
        const jsonParts = ["[\n"];
        let totalWritten = 0;

        for (let i = 0; i < totalRows; i += chunkSize) {
            const end = Math.min(i + chunkSize, totalRows);
            const chunkObjects = [];

            for (let r = i; r < end; r++) {
                const row = rows[r];
                const obj = {};
                for (let c = 0; c < headers.length; c++) {
                    obj[headers[c]] = row[c] !== undefined ? row[c] : "";
                }
                const isLastRecord = r === totalRows - 1;
                chunkObjects.push(JSON.stringify(obj, null, 2) + (isLastRecord ? "" : ",\n"));
            }

            jsonParts.push(chunkObjects.join(""));
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

            chunkObjects.length = 0;
            const progressPct = 30 + Math.round((end / totalRows) * 60);
            onProgress(progressPct, `Building JSON data (${end.toLocaleString()} / ${totalRows.toLocaleString()})...`);
        }

        jsonParts.push("\n]");

        const validation = validator.validate();
        if (!validation.isValid) {
            throw new Error(validation.error.reason);
        }

        onProgress(95, "Creating final JSON Blob...");
        const blob = new Blob(jsonParts, { type: CONFIG.MIME_TYPES.json });
        jsonParts.length = 0;

        onProgress(100, "Conversion to JSON completed successfully.");
        return OutputManager.createSingleFileResult(blob, `${baseName}.json`, {
            totalRows,
            writtenRows: totalWritten,
            totalColumns
        });
    }
}
