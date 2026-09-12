/**
 * HTML Writer Module
 * Generates styled HTML <table> documents in memory-safe chunks.
 */
import { MemoryManager } from "../../core/memory-manager.js";
import { IntegrityValidator } from "../../core/integrity-validator.js";
import { OutputManager } from "../../core/output-manager.js";
import { CONFIG } from "../../config/config.js";
import { escapeHTML } from "../../utils/format-utils.js";

export class HTMLWriter {
    static async write(data, targetFormat, baseName, onProgress) {
        const { headers, rows, totalRows, totalColumns } = data;

        const validator = new IntegrityValidator();
        validator.setInputRecords(totalRows);

        const chunkSize = MemoryManager.getAdaptiveChunkSize(totalRows * 50);
        const htmlParts = [
            `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>${escapeHTML(baseName)}</title>\n`,
            `<style>\n table { border-collapse: collapse; width: 100%; font-family: sans-serif; }\n th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }\n th { background-color: #f2f2f2; }\n tr:nth-child(even) { background-color: #f9f9f9; }\n</style>\n`,
            `</head>\n<body>\n<h2>${escapeHTML(baseName)}</h2>\n<table>\n<thead>\n<tr>`,
            headers.map(h => `<th>${escapeHTML(h)}</th>`).join(''),
            `</tr>\n</thead>\n<tbody>\n`
        ];

        let totalWritten = 0;

        for (let i = 0; i < totalRows; i += chunkSize) {
            const end = Math.min(i + chunkSize, totalRows);
            const chunkLines = [];

            for (let r = i; r < end; r++) {
                const row = rows[r];
                chunkLines.push('<tr>' + row.map(v => `<td>${escapeHTML(v)}</td>`).join('') + '</tr>\n');
            }

            htmlParts.push(chunkLines.join(''));
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
            onProgress(progressPct, `Building HTML table (${end.toLocaleString()} / ${totalRows.toLocaleString()})...`);
        }

        htmlParts.push('</tbody>\n</table>\n</body>\n</html>');

        const validation = validator.validate();
        if (!validation.isValid) {
            throw new Error(validation.error.reason);
        }

        onProgress(95, "Creating final HTML Blob...");
        const blob = new Blob(htmlParts, { type: CONFIG.MIME_TYPES.html });
        htmlParts.length = 0;

        onProgress(100, "Conversion to HTML completed successfully.");
        return OutputManager.createSingleFileResult(blob, `${baseName}.html`, {
            totalRows,
            writtenRows: totalWritten,
            totalColumns
        });
    }
}
