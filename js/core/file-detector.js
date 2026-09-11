/**
 * File Format Detector
 * Detects format by extension and inspects binary headers for confirmation.
 */
import { getFileExtension, readHeaderBytes } from "../utils/file-utils.js";

export class FileDetector {
    /**
     * Detect file type from File object
     * @param {File} file 
     * @returns {Promise<{ format: string, extension: string, name: string, confidence: string }>}
     */
    static async detectFormat(file) {
        if (!file) {
            throw new Error("No file provided for detection.");
        }

        const ext = getFileExtension(file.name);

        // Read first 64 bytes for magic header verification
        try {
            const headerBytes = await readHeaderBytes(file, 64);

            // Check DBF signature byte (0x03 = FoxBase/dBase III without memo, 0x83 = with dBASE III memo, 0x30 = Visual FoxPro, etc.)
            if (ext === "dbf" || this.isDBFHeader(headerBytes)) {
                return {
                    format: "dbf",
                    extension: ext || "dbf",
                    name: file.name,
                    confidence: "high"
                };
            }

            // Check JSON format
            if (ext === "json" || this.isJSONHeader(headerBytes)) {
                return {
                    format: "json",
                    extension: ext || "json",
                    name: file.name,
                    confidence: "high"
                };
            }

            // Check CSV format
            if (ext === "csv" || ext === "txt" || this.isCSVHeader(headerBytes)) {
                return {
                    format: "csv",
                    extension: ext || "csv",
                    name: file.name,
                    confidence: "high"
                };
            }
        } catch (e) {
            console.warn("Header detection fallback to extension:", e);
        }

        // Fallback by extension matching
        if (ext === "dbf") return { format: "dbf", extension: "dbf", name: file.name, confidence: "medium" };
        if (ext === "csv" || ext === "txt") return { format: "csv", extension: ext, name: file.name, confidence: "medium" };
        if (ext === "json") return { format: "json", extension: "json", name: file.name, confidence: "medium" };

        return {
            format: "unknown",
            extension: ext,
            name: file.name,
            confidence: "none"
        };
    }

    /**
     * Test DBF magic byte signature
     */
    static isDBFHeader(bytes) {
        if (!bytes || bytes.length < 4) return false;
        const validVersions = [0x02, 0x03, 0x04, 0x05, 0x30, 0x43, 0x7b, 0x83, 0x8b, 0x8e, 0xf5];
        return validVersions.includes(bytes[0]);
    }

    /**
     * Test JSON array header ([ or {)
     */
    static isJSONHeader(bytes) {
        if (!bytes || bytes.length === 0) return false;
        // Skip BOM if present
        let offset = 0;
        if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) offset = 3;
        while (offset < bytes.length && (bytes[offset] === 32 || bytes[offset] === 9 || bytes[offset] === 10 || bytes[offset] === 13)) {
            offset++;
        }
        const char = String.fromCharCode(bytes[offset]);
        return char === "[" || char === "{";
    }

    /**
     * Test CSV line structure
     */
    static isCSVHeader(bytes) {
        if (!bytes || bytes.length === 0) return false;
        const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 64));
        return text.includes(",") || text.includes(";") || text.includes("\t");
    }
}
