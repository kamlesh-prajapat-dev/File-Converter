/**
 * Conversion Compatibility Registry
 * Central lookup table for supported source and target format conversions.
 */
import { CONFIG } from "../config/config.js";

export class ConversionRegistry {
    /**
     * Map of supported source formats to target formats and their details
     */
    static registry = {
        dbf: {
            xlsx: { id: "dbf-to-xlsx", name: "Excel (.xlsx)", targetExt: "xlsx", chunkable: true },
            csv:  { id: "dbf-to-csv",  name: "CSV (.csv)",     targetExt: "csv",  chunkable: true },
            json: { id: "dbf-to-json", name: "JSON (.json)",   targetExt: "json", chunkable: true }
        },
        csv: {
            xlsx: { id: "csv-to-xlsx", name: "Excel (.xlsx)", targetExt: "xlsx", chunkable: true },
            json: { id: "csv-to-json", name: "JSON (.json)",   targetExt: "json", chunkable: true }
        },
        json: {
            csv:  { id: "json-to-csv",  name: "CSV (.csv)",     targetExt: "csv",  chunkable: true },
            xlsx: { id: "json-to-xlsx", name: "Excel (.xlsx)", targetExt: "xlsx", chunkable: true }
        }
    };

    /**
     * Get list of supported target formats for a detected source format
     * @param {string} sourceFormat 
     * @returns {Array<{ key: string, name: string, targetExt: string, chunkable: boolean }>}
     */
    static getSupportedTargets(sourceFormat) {
        if (!sourceFormat || !this.registry[sourceFormat]) {
            return [];
        }
        const targetsMap = this.registry[sourceFormat];
        return Object.keys(targetsMap).map(key => ({
            key,
            ...targetsMap[key]
        }));
    }

    /**
     * Check if a specific conversion path is supported
     * @param {string} sourceFormat 
     * @param {string} targetFormat 
     * @returns {boolean}
     */
    static isSupported(sourceFormat, targetFormat) {
        if (!sourceFormat || !targetFormat) return false;
        return Boolean(this.registry[sourceFormat] && this.registry[sourceFormat][targetFormat]);
    }

    /**
     * Get conversion metadata
     * @param {string} sourceFormat 
     * @param {string} targetFormat 
     * @returns {object|null}
     */
    static getConversionConfig(sourceFormat, targetFormat) {
        if (this.isSupported(sourceFormat, targetFormat)) {
            return this.registry[sourceFormat][targetFormat];
        }
        return null;
    }
}
