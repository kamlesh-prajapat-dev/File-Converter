/**
 * DBF -> JSON Converter (Single Output Stream)
 */
import { BaseConverter } from "../base-converter.js";
import { DBFParser } from "./dbf-parser.js";
import { MemoryManager } from "../../core/memory-manager.js";
import { IntegrityValidator } from "../../core/integrity-validator.js";
import { CONFIG } from "../../config/config.js";
import { getBaseFileName } from "../../utils/file-utils.js";

export class DBFToJsonConverter extends BaseConverter {
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
        const jsonParts = [];
        let totalWritten = 0;

        jsonParts.push("[\n");

        for (let i = 0; i < totalRecords; i += chunkSize) {
            const end = Math.min(i + chunkSize, totalRecords);
            const chunkObjects = [];

            for (let r = i; r < end; r++) {
                const row = dbf.records[r];
                const obj = {};
                for (let c = 0; c < headers.length; c++) {
                    obj[headers[c]] = row[c];
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

        onProgress(95, "Creating final JSON file Blob...");
        const blob = new Blob(jsonParts, { type: CONFIG.MIME_TYPES.json });
        jsonParts.length = 0;

        const baseName = getBaseFileName(options.fileName || "data.dbf");
        const finalFileName = `${baseName}.json`;

        onProgress(100, "DBF to JSON conversion completed successfully.");
        return this.createResult(true, [{ blob, fileName: finalFileName }], {
            totalRows: totalRecords,
            writtenRows: totalWritten,
            totalColumns: headers.length,
            integrityPassed: true
        });
    }
}
