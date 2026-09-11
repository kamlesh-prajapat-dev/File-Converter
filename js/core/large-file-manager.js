/**
 * Large File Manager
 * Handles calculations for chunk size, total parts, and multi-file metadata.
 */
import { CONFIG } from "../config/config.js";
import { getBaseFileName } from "../utils/file-utils.js";

export class LargeFileManager {
    /**
     * Calculate chunk boundaries for record arrays
     * @param {number} totalRecords 
     * @param {number} [customChunkSize] 
     * @returns {{ chunkSize: number, totalParts: number, isMultiFile: boolean }}
     */
    static calculateChunks(totalRecords, customChunkSize = CONFIG.MAX_CHUNK_ROWS) {
        const chunkSize = customChunkSize || CONFIG.MAX_CHUNK_ROWS;
        const totalParts = Math.max(1, Math.ceil(totalRecords / chunkSize));
        return {
            chunkSize,
            totalParts,
            isMultiFile: totalParts > 1
        };
    }

    /**
     * Format filename for a given part index
     * @param {string} originalFileName 
     * @param {string} targetExt 
     * @param {number} partIndex (1-based)
     * @param {number} totalParts 
     * @returns {string}
     */
    static generatePartFileName(originalFileName, targetExt, partIndex, totalParts) {
        const baseName = getBaseFileName(originalFileName);
        const ext = targetExt.startsWith(".") ? targetExt : `.${targetExt}`;

        if (totalParts <= 1) {
            return `${baseName}${ext}`;
        }
        return `${baseName}_part_${partIndex}${ext}`;
    }
}
