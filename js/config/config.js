/**
 * Centralized Application Configuration Constants
 */
export const CONFIG = {
    // Memory-Aware Adaptive Chunk & Safe Export Sizes
    MAX_SAFE_XLSX_ROWS: 50000,            // Safe row limit per XLSX file to prevent RangeError
    SMALL_FILE_CHUNK_SIZE: 50000,         // For files < 10 MB
    MEDIUM_FILE_CHUNK_SIZE: 50000,        // For files 10-50 MB
    LARGE_FILE_CHUNK_SIZE: 25000,         // For files > 50 MB

    // File Thresholds
    LARGE_FILE_THRESHOLD_BYTES: 15 * 1024 * 1024, // 15 MB threshold for warning

    // Progress throttling
    PROGRESS_THROTTLE_MS: 100,            // Min interval between UI progress updates

    // Supported formats list
    FORMAT_LABELS: {
        dbf: "dBase Database (.dbf)",
        csv: "Comma Separated Values (.csv)",
        json: "JSON Array (.json)",
        xlsx: "Excel Spreadsheet (.xlsx)"
    },

    // MIME types for output downloads
    MIME_TYPES: {
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        csv: "text/csv;charset=utf-8;",
        json: "application/json;charset=utf-8;",
        zip: "application/zip"
    },

    // Target File Extensions
    TARGET_EXTENSIONS: {
        xlsx: ".xlsx",
        csv: ".csv",
        json: ".json"
    }
};
