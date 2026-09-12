import { FileDetectionEngine } from "./file-detection-engine.js";

export class FileDetector {
    /**
     * Detect file type from File object
     * @param {File} file 
     * @returns {Promise<{ format: string, category: string, extension: string, name: string, confidence: string, isExtensionMismatch: boolean }>}
     */
    static async detectFormat(file) {
        return await FileDetectionEngine.detect(file);
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
