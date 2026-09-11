/**
 * Output Manager
 * Standardizes output structures for Single File mode and Multi-Part Fallback mode.
 */
export class OutputManager {
    /**
     * Create single output file result
     * @param {Blob} blob 
     * @param {string} fileName 
     * @param {object} metadata 
     * @returns {object}
     */
    static createSingleFileResult(blob, fileName, metadata = {}) {
        return {
            success: true,
            mode: "SINGLE_FILE",
            files: [{ blob, fileName }],
            fallbackReason: null,
            metadata: {
                totalRows: metadata.totalRows || 0,
                writtenRows: metadata.writtenRows || metadata.totalRows || 0,
                totalColumns: metadata.totalColumns || 0,
                totalWorksheets: metadata.totalWorksheets || 1,
                integrityPassed: true,
                ...metadata
            }
        };
    }

    /**
     * Create safe multi-part fallback result when single file serialization hits memory bounds
     * @param {Array<{ blob: Blob, fileName: string }>} files 
     * @param {string} fallbackReason 
     * @param {object} metadata 
     * @returns {object}
     */
    static createMultiPartFallbackResult(files, fallbackReason, metadata = {}) {
        return {
            success: true,
            mode: "MULTI_PART_FALLBACK",
            files: files || [],
            fallbackReason: fallbackReason || "Single-file output exceeded browser memory bounds.",
            metadata: {
                totalRows: metadata.totalRows || 0,
                writtenRows: metadata.writtenRows || metadata.totalRows || 0,
                totalColumns: metadata.totalColumns || 0,
                totalParts: files ? files.length : 0,
                integrityPassed: true,
                ...metadata
            }
        };
    }
}
