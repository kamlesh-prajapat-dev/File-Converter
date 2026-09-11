/**
 * CSV -> JSON Converter (Single Output Stream)
 */
import { BaseConverter } from "../base-converter.js";
import { CSVParser } from "./csv-parser.js";
import { MemoryManager } from "../../core/memory-manager.js";
import { IntegrityValidator } from "../../core/integrity-validator.js";
import { CONFIG } from "../../config/config.js";
import { getBaseFileName } from "../../utils/file-utils.js";

export class CsvToJsonConverter extends BaseConverter {
    static async convert(inputData, options = {}, onProgress = () => {}) {
        let buffer;
        if (inputData instanceof ArrayBuffer) {
            buffer = inputData;
        } else if (typeof inputData === "string") {
            buffer = inputData;
        } else if (inputData && typeof inputData.arrayBuffer === "function") {
            buffer = await inputData.arrayBuffer();
        } else {
            throw new Error("Invalid input for CSV to JSON converter.");
        }

        onProgress(10, "Parsing CSV contents...");
        const csv = CSVParser.parse(buffer, onProgress);

        const totalRecords = csv.rows.length;
        const headers = csv.headers;

        const validator = new IntegrityValidator();
        validator.setInputRecords(totalRecords);

        const chunkSize = MemoryManager.getAdaptiveChunkSize(typeof buffer === "string" ? buffer.length : buffer.byteLength);
        const jsonParts = ["[\n"];
        let totalWritten = 0;

        for (let i = 0; i < totalRecords; i += chunkSize) {
            const end = Math.min(i + chunkSize, totalRecords);
            const chunkObjects = [];

            for (let r = i; r < end; r++) {
                const row = csv.rows[r];
                const obj = {};
                for (let c = 0; c < headers.length; c++) {
                    obj[headers[c]] = row[c] !== undefined ? row[c] : "";
                }
                const isLastRecord = r === totalRecords - 1;
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
            const progressPct = 25 + Math.round((end / totalRecords) * 65);
            onProgress(progressPct, `Building JSON data (${end.toLocaleString()} / ${totalRecords.toLocaleString()})...`);
        }

        jsonParts.push("\n]");

        onProgress(90, "Verifying data integrity...");
        const validation = validator.validate();
        if (!validation.isValid) {
            return this.createResult(false, [], {}, validation.error);
        }

        onProgress(95, "Creating final JSON Blob...");
        const blob = new Blob(jsonParts, { type: CONFIG.MIME_TYPES.json });
        jsonParts.length = 0;

        const baseName = getBaseFileName(options.fileName || "data.csv");
        const finalFileName = `${baseName}.json`;

        onProgress(100, "CSV to JSON conversion completed successfully.");
        return this.createResult(true, [{ blob, fileName: finalFileName }], {
            totalRows: totalRecords,
            writtenRows: totalWritten,
            totalColumns: headers.length,
            integrityPassed: true
        });
    }
}
