/**
 * YAML Writer Module
 * Generates YAML record documents in memory-safe chunks.
 */
import { MemoryManager } from "../../core/memory-manager.js";
import { IntegrityValidator } from "../../core/integrity-validator.js";
import { OutputManager } from "../../core/output-manager.js";
import { CONFIG } from "../../config/config.js";

export class YAMLWriter {
    static async write(data, targetFormat, baseName, onProgress) {
        const { headers, rows, totalRows, totalColumns } = data;

        const validator = new IntegrityValidator();
        validator.setInputRecords(totalRows);

        const chunkSize = MemoryManager.getAdaptiveChunkSize(totalRows * 50);
        const yamlParts = [`# YAML Dataset: ${baseName}\n\n`];
        let totalWritten = 0;

        for (let i = 0; i < totalRows; i += chunkSize) {
            const end = Math.min(i + chunkSize, totalRows);
            const chunkLines = [];

            for (let r = i; r < end; r++) {
                const row = rows[r];
                chunkLines.push(`- ${headers[0]}: "${this.escapeYaml(row[0])}"\n`);
                for (let c = 1; c < headers.length; c++) {
                    chunkLines.push(`  ${headers[c]}: "${this.escapeYaml(row[c])}"\n`);
                }
            }

            yamlParts.push(chunkLines.join(""));
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

            chunkLines.length = 0;
            const progressPct = 30 + Math.round((end / totalRows) * 60);
            onProgress(progressPct, `Building YAML records (${end.toLocaleString()} / ${totalRows.toLocaleString()})...`);
        }

        const validation = validator.validate();
        if (!validation.isValid) {
            throw new Error(validation.error.reason);
        }

        onProgress(95, "Creating final YAML Blob...");
        const blob = new Blob(yamlParts, { type: CONFIG.MIME_TYPES.yaml });
        yamlParts.length = 0;

        onProgress(100, "Conversion to YAML completed successfully.");
        return OutputManager.createSingleFileResult(blob, `${baseName}.yaml`, {
            totalRows,
            writtenRows: totalWritten,
            totalColumns
        });
    }

    static escapeYaml(val) {
        if (val === null || val === undefined) return "";
        return String(val).replace(/"/g, '\\"').replace(/\n/g, "\\n");
    }
}
