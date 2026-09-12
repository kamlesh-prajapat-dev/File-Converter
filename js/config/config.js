/**
 * Centralized Application Configuration Constants
 */
export const CONFIG = {
    // Memory-Aware Adaptive Chunk & Safe Export Sizes
    MAX_SAFE_XLSX_ROWS: 50000,            // Safe row limit per XLSX file to prevent RangeError
    MAX_CHUNK_ROWS: 50000,                // Default chunk boundary for record calculation
    EXCEL_MAX_ROWS_PER_SHEET: 500000,     // Max rows per Excel sheet before creating new worksheet
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
        tsv: "Tab Separated Values (.tsv)",
        json: "JSON Data (.json)",
        xlsx: "Excel Spreadsheet (.xlsx)",
        xls: "Legacy Excel (.xls)",
        ods: "OpenDocument Spreadsheet (.ods)",
        xml: "XML Document (.xml)",
        sql: "SQL Insert Script (.sql)",
        yaml: "YAML Document (.yaml)",
        html: "HTML Table (.html)",
        md: "Markdown Table (.md)",
        txt: "Text Document (.txt)"
    },

    // MIME types for output downloads
    MIME_TYPES: {
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        xls: "application/vnd.ms-excel",
        ods: "application/vnd.oasis.opendocument.spreadsheet",
        csv: "text/csv;charset=utf-8;",
        tsv: "text/tab-separated-values;charset=utf-8;",
        json: "application/json;charset=utf-8;",
        xml: "application/xml;charset=utf-8;",
        sql: "application/sql;charset=utf-8;",
        yaml: "text/yaml;charset=utf-8;",
        html: "text/html;charset=utf-8;",
        md: "text/markdown;charset=utf-8;",
        txt: "text/plain;charset=utf-8;",
        zip: "application/zip"
    },

    // Target File Extensions
    TARGET_EXTENSIONS: {
        xlsx: ".xlsx",
        ods: ".ods",
        csv: ".csv",
        tsv: ".tsv",
        json: ".json",
        xml: ".xml",
        sql: ".sql",
        yaml: ".yaml",
        html: ".html",
        md: ".md",
        txt: ".txt"
    }
};
