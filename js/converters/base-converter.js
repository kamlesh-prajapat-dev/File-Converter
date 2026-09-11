/**
 * Base Converter Contract Interface
 */
export class BaseConverter {
    /**
     * Standardized result builder
     * @param {boolean} success 
     * @param {Array<{ blob: Blob, fileName: string }>} files 
     * @param {object} metadata 
     * @param {object} [error] 
     * @returns {object}
     */
    static createResult(success, files = [], metadata = {}, error = null) {
        return {
            success: Boolean(success),
            files: files || [],
            metadata: {
                totalRows: metadata.totalRows || 0,
                writtenRows: metadata.writtenRows || 0,
                totalColumns: metadata.totalColumns || 0,
                totalWorksheets: metadata.totalWorksheets || 1,
                integrityPassed: metadata.integrityPassed !== undefined ? metadata.integrityPassed : true,
                ...metadata
            },
            error: error || null
        };
    }
}
