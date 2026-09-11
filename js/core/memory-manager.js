/**
 * Memory Manager
 * Adaptive chunk sizing and memory management strategies.
 */
import { CONFIG } from "../config/config.js";

export class MemoryManager {
    /**
     * Get adaptive chunk size based on input file size
     * @param {number} fileSizeBytes 
     * @returns {number}
     */
    static getAdaptiveChunkSize(fileSizeBytes) {
        if (!fileSizeBytes || fileSizeBytes < 10 * 1024 * 1024) { // < 10 MB
            return CONFIG.SMALL_FILE_CHUNK_SIZE || 100000;
        } else if (fileSizeBytes < 50 * 1024 * 1024) { // 10 MB - 50 MB
            return CONFIG.MEDIUM_FILE_CHUNK_SIZE || 50000;
        } else { // > 50 MB
            return CONFIG.LARGE_FILE_CHUNK_SIZE || 25000;
        }
    }

    /**
     * Clear array contents in-place to allow fast garbage collection
     * @param {Array} arr 
     */
    static releaseArray(arr) {
        if (Array.isArray(arr)) {
            arr.length = 0;
        }
    }
}
