/**
 * Multi-Signal File Detection Engine
 * Inspects filename extension, MIME type, magic byte signatures, and structure
 * to identify actual file format and flag extension mismatches.
 */
import { getFileExtension, readHeaderBytes } from "../utils/file-utils.js";

export class FileDetectionEngine {
    /**
     * Detect actual format and category from File object
     * @param {File} file 
     * @returns {Promise<{ format: string, category: string, confidence: string, extension: string, name: string, isExtensionMismatch: boolean, detectedBy: string }>}
     */
    static async detect(file) {
        if (!file) {
            throw new Error("No file provided for format detection.");
        }

        const ext = getFileExtension(file.name);
        const headerBytes = await readHeaderBytes(file, 256);
        const textSnippet = new TextDecoder("utf-8", { fatal: false }).decode(headerBytes);

        // 1. Check Magic Byte Signatures
        
        // Zip Signature (0x50 0x4B 0x03 0x04) -> XLSX, ODS, or ZIP
        if (headerBytes.length >= 4 && headerBytes[0] === 0x50 && headerBytes[1] === 0x4B && headerBytes[2] === 0x03 && headerBytes[3] === 0x04) {
            if (ext === "ods") {
                return this.createResult("ods", "spreadsheet", "high", ext, file.name, false, "magic_bytes");
            }
            if (ext === "zip") {
                return this.createResult("zip", "archive", "high", ext, file.name, false, "magic_bytes");
            }
            // Default Zip container spreadsheet to XLSX
            const isMismatch = ext !== "xlsx";
            return this.createResult("xlsx", "spreadsheet", "high", ext, file.name, isMismatch, "magic_bytes");
        }

        // Old OLE Compound File Signature (0xD0 0xCF 0x11 0xE0) -> XLS
        if (headerBytes.length >= 8 && headerBytes[0] === 0xD0 && headerBytes[1] === 0xCF && headerBytes[2] === 0x11 && headerBytes[3] === 0xE0) {
            const isMismatch = ext !== "xls";
            return this.createResult("xls", "spreadsheet", "high", ext, file.name, isMismatch, "magic_bytes");
        }

        // DBF Signature (0x02, 0x03, 0x04, 0x05, 0x30, 0x43, 0x7b, 0x83, 0x8b, 0x8e, 0xf5)
        const validDBFVersions = [0x02, 0x03, 0x04, 0x05, 0x30, 0x43, 0x7b, 0x83, 0x8b, 0x8e, 0xf5];
        if (headerBytes.length > 4 && validDBFVersions.includes(headerBytes[0])) {
            // Verify DBF header length byte
            const headerLen = headerBytes[8] | (headerBytes[9] << 8);
            if (headerLen > 32 && headerLen < file.size) {
                const isMismatch = ext !== "dbf";
                return this.createResult("dbf", "database", "high", ext, file.name, isMismatch, "magic_bytes");
            }
        }

        // PDF Signature (%PDF-)
        if (textSnippet.startsWith("%PDF-")) {
            const isMismatch = ext !== "pdf";
            return this.createResult("pdf", "document", "high", ext, file.name, isMismatch, "magic_bytes");
        }

        // 2. Check Text Structure & Markup Signatures
        const cleanSnippet = textSnippet.trim();

        // XML Signature
        if (cleanSnippet.startsWith("<?xml") || (cleanSnippet.startsWith("<") && cleanSnippet.includes(">") && !cleanSnippet.toLowerCase().includes("<html"))) {
            const isMismatch = ext !== "xml";
            return this.createResult("xml", "structured", "high", ext, file.name, isMismatch, "structure");
        }

        // HTML Signature
        if (cleanSnippet.toLowerCase().includes("<html") || cleanSnippet.toLowerCase().includes("<!doctype html") || cleanSnippet.toLowerCase().includes("<table")) {
            const isMismatch = ext !== "html" && ext !== "htm";
            return this.createResult("html", "markup", "high", ext, file.name, isMismatch, "structure");
        }

        // SQL Signature
        if (/^\s*(INSERT\s+INTO|CREATE\s+TABLE|DROP\s+TABLE|ALTER\s+TABLE)/i.test(cleanSnippet)) {
            const isMismatch = ext !== "sql";
            return this.createResult("sql", "structured", "high", ext, file.name, isMismatch, "structure");
        }

        // JSON Signature ([ or {)
        if (cleanSnippet.startsWith("[") || cleanSnippet.startsWith("{")) {
            try {
                // Peek JSON test
                if (ext === "json" || /^[\[{]\s*["{]/m.test(cleanSnippet)) {
                    const isMismatch = ext !== "json";
                    return this.createResult("json", "structured", "high", ext, file.name, isMismatch, "structure");
                }
            } catch {}
        }

        // TSV Signature (Tab-separated first line)
        const lines = cleanSnippet.split(/\r\n|\n|\r/);
        const firstLine = lines[0] || "";
        if (firstLine.includes("\t") && (firstLine.match(/\t/g) || []).length >= (firstLine.match(/,/g) || []).length) {
            if (ext === "tsv" || ext === "txt") {
                return this.createResult("tsv", "spreadsheet", "high", ext, file.name, false, "structure");
            }
        }

        // Markdown Table Signature (| Col | Col |)
        if (/^\s*\|.*\|.*\|\s*$/m.test(cleanSnippet)) {
            if (ext === "md" || ext === "markdown") {
                return this.createResult("md", "markup", "high", ext, file.name, false, "structure");
            }
        }

        // CSV Signature
        if (firstLine.includes(",") || firstLine.includes(";")) {
            if (ext === "csv" || ext === "txt") {
                return this.createResult("csv", "spreadsheet", "high", ext, file.name, false, "structure");
            }
        }

        // 3. Fallback to Extension Matching
        const knownExtensions = {
            dbf: { format: "dbf", category: "database" },
            csv: { format: "csv", category: "spreadsheet" },
            tsv: { format: "tsv", category: "spreadsheet" },
            json: { format: "json", category: "structured" },
            xlsx: { format: "xlsx", category: "spreadsheet" },
            xls: { format: "xls", category: "spreadsheet" },
            ods: { format: "ods", category: "spreadsheet" },
            xml: { format: "xml", category: "structured" },
            sql: { format: "sql", category: "structured" },
            yaml: { format: "yaml", category: "structured" },
            yml: { format: "yaml", category: "structured" },
            html: { format: "html", category: "markup" },
            htm: { format: "html", category: "markup" },
            md: { format: "md", category: "markup" },
            txt: { format: "txt", category: "text" },
            zip: { format: "zip", category: "archive" },
            pdf: { format: "pdf", category: "document" }
        };

        if (knownExtensions[ext]) {
            return this.createResult(knownExtensions[ext].format, knownExtensions[ext].category, "medium", ext, file.name, false, "extension");
        }

        return this.createResult("unknown", "unknown", "none", ext, file.name, false, "none");
    }

    static createResult(format, category, confidence, extension, name, isExtensionMismatch, detectedBy) {
        return {
            format,
            category,
            confidence,
            extension,
            name,
            isExtensionMismatch,
            detectedBy
        };
    }
}
