/**
 * XML Writer Module
 * Generates XML documents in memory-safe chunks.
 */
import { MemoryManager } from "../../core/memory-manager.js";
import { IntegrityValidator } from "../../core/integrity-validator.js";
import { OutputManager } from "../../core/output-manager.js";
import { CONFIG } from "../../config/config.js";

export class XMLWriter {
    static async write(data, targetFormat, baseName, onProgress) {
        const { headers, rows, totalRows, totalColumns } = data;

        const validator = new IntegrityValidator();
        validator.setInputRecords(totalRows);

        const chunkSize = MemoryManager.getAdaptiveChunkSize(totalRows * 50);
        const xmlParts = ['<?xml version="1.0" encoding="UTF-8"?>\n<data>\n'];
        let totalWritten = 0;

        for (let i = 0; i < totalRows; i += chunkSize) {
            const end = Math.min(i + chunkSize, totalRows);
            const chunkLines = [];

            for (let r = i; r < end; r++) {
                const row = rows[r];
                chunkLines.push('  <row>\n');
                for (let c = 0; c < headers.length; c++) {
                    const tag = this.sanitizeXmlTag(headers[c]);
                    const val = this.escapeXmlValue(row[c]);
                    chunkLines.push(`    <${tag}>${val}</${tag}>\n`);
                }
                chunkLines.push('  </row>\n');
            }

            xmlParts.push(chunkLines.join(''));
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
            onProgress(progressPct, `Building XML records (${end.toLocaleString()} / ${totalRows.toLocaleString()})...`);
        }

        xmlParts.push('</data>');

        const validation = validator.validate();
        if (!validation.isValid) {
            throw new Error(validation.error.reason);
        }

        onProgress(95, "Creating final XML Blob...");
        const blob = new Blob(xmlParts, { type: CONFIG.MIME_TYPES.xml });
        xmlParts.length = 0;

        onProgress(100, "Conversion to XML completed successfully.");
        return OutputManager.createSingleFileResult(blob, `${baseName}.xml`, {
            totalRows,
            writtenRows: totalWritten,
            totalColumns
        });
    }

    static sanitizeXmlTag(name) {
        if (!name) return "field";
        let clean = String(name).replace(/[^a-zA-Z0-9_.-]/g, "_");
        if (/^[0-9.-]/.test(clean)) clean = "field_" + clean;
        return clean;
    }

    static escapeXmlValue(val) {
        if (val === null || val === undefined) return "";
        return String(val)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    }
}
