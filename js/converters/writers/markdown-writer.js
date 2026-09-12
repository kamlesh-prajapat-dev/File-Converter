/**
 * Markdown Writer Module
 * Generates Markdown table documents (| Col | Col |) in memory-safe chunks.
 */
import { MemoryManager } from "../../core/memory-manager.js";
import { IntegrityValidator } from "../../core/integrity-validator.js";
import { OutputManager } from "../../core/output-manager.js";
import { CONFIG } from "../../config/config.js";

export class MarkdownWriter {
    static async write(data, targetFormat, baseName, onProgress) {
        const { headers, rows, totalRows, totalColumns } = data;

        const validator = new IntegrityValidator();
        validator.setInputRecords(totalRows);

        const chunkSize = MemoryManager.getAdaptiveChunkSize(totalRows * 50);
        const mdParts = [
            `# ${baseName}\n\n`,
            "| " + headers.map(h => this.escapeMdCell(h)).join(" | ") + " |\n",
            "| " + headers.map(() => "---").join(" | ") + " |\n"
        ];

        let totalWritten = 0;

        for (let i = 0; i < totalRows; i += chunkSize) {
            const end = Math.min(i + chunkSize, totalRows);
            const chunkLines = [];

            for (let r = i; r < end; r++) {
                const row = rows[r];
                chunkLines.push("| " + row.map(v => this.escapeMdCell(v)).join(" | ") + " |\n");
            }

            mdParts.push(chunkLines.join(""));
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
            onProgress(progressPct, `Building Markdown table (${end.toLocaleString()} / ${totalRows.toLocaleString()})...`);
        }

        const validation = validator.validate();
        if (!validation.isValid) {
            throw new Error(validation.error.reason);
        }

        onProgress(95, "Creating final Markdown Blob...");
        const blob = new Blob(mdParts, { type: CONFIG.MIME_TYPES.md });
        mdParts.length = 0;

        onProgress(100, "Conversion to Markdown completed successfully.");
        return OutputManager.createSingleFileResult(blob, `${baseName}.md`, {
            totalRows,
            writtenRows: totalWritten,
            totalColumns
        });
    }

    static escapeMdCell(val) {
        if (val === null || val === undefined) return "";
        return String(val).replace(/\|/g, "\\|").replace(/\n/g, " ");
    }
}
