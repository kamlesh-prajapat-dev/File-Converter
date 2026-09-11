/**
 * Centralized Error Manager
 * Converts technical errors & codes into user-friendly error objects with Reason + Solution breakdown.
 */

export const ERROR_CODES = {
    INVALID_FILE: "INVALID_FILE",
    UNSUPPORTED_FORMAT: "UNSUPPORTED_FORMAT",
    UNSUPPORTED_CONVERSION: "UNSUPPORTED_CONVERSION",
    CORRUPTED_FILE: "CORRUPTED_FILE",
    EMPTY_FILE: "EMPTY_FILE",
    FILE_TOO_LARGE: "FILE_TOO_LARGE",
    MEMORY_LIMIT: "MEMORY_LIMIT",
    PARSER_ERROR: "PARSER_ERROR",
    CONVERSION_ERROR: "CONVERSION_ERROR",
    EXPORT_ERROR: "EXPORT_ERROR",
    BROWSER_NOT_SUPPORTED: "BROWSER_NOT_SUPPORTED",
    CANCELLED: "CANCELLED",
    INTEGRITY_CHECK_FAILED: "INTEGRITY_CHECK_FAILED",
    UNKNOWN_ERROR: "UNKNOWN_ERROR"
};

export class ErrorManager {
    static createError(code, customMessage = "", originalError = null) {
        if (originalError) {
            console.error(`[Converter Error - ${code}]:`, originalError);
        }

        const techMsg = originalError ? originalError.message || String(originalError) : customMessage;

        switch (code) {
            case ERROR_CODES.INTEGRITY_CHECK_FAILED:
                return {
                    code,
                    title: "Data Integrity Verification Failed",
                    reason: customMessage || "The converted record count did not match the original input record count.",
                    solution: "The application stopped output generation to prevent corrupted or missing records. Try converting with another target format or retry.",
                    technicalDetails: techMsg
                };

            case ERROR_CODES.INVALID_FILE:
                return {
                    code,
                    title: "Invalid File Selected",
                    reason: customMessage || "The selected file could not be read or appears invalid.",
                    solution: "Please make sure the file is accessible, not locked, and retry.",
                    technicalDetails: techMsg
                };

            case ERROR_CODES.UNSUPPORTED_FORMAT:
                return {
                    code,
                    title: "Unsupported File Format",
                    reason: customMessage || "This file format is not recognized or supported by the converter.",
                    solution: "Please upload a supported file format such as .dbf, .csv, or .json.",
                    technicalDetails: techMsg
                };

            case ERROR_CODES.UNSUPPORTED_CONVERSION:
                return {
                    code,
                    title: "Conversion Not Supported",
                    reason: customMessage || "The requested source-to-target conversion is not supported.",
                    solution: "Please choose a valid target format from the dropdown menu.",
                    technicalDetails: techMsg
                };

            case ERROR_CODES.CORRUPTED_FILE:
                return {
                    code,
                    title: "Corrupted or Invalid File Content",
                    reason: customMessage || "The file structure is corrupted or does not conform to specification.",
                    solution: "Check if the file opens in its native application or re-export the source file.",
                    technicalDetails: techMsg
                };

            case ERROR_CODES.EMPTY_FILE:
                return {
                    code,
                    title: "File is Empty",
                    reason: "The uploaded file contains 0 bytes or has no readable records.",
                    solution: "Select a file that contains actual data.",
                    technicalDetails: techMsg
                };

            case ERROR_CODES.FILE_TOO_LARGE:
            case ERROR_CODES.MEMORY_LIMIT:
                return {
                    code,
                    title: "Browser Memory Limit Exceeded",
                    reason: customMessage || "The file size exceeded browser memory capacity.",
                    solution: "The application processes data in memory-safe chunks. Try selecting CSV format or processing a smaller subset.",
                    technicalDetails: techMsg
                };

            case ERROR_CODES.CANCELLED:
                return {
                    code,
                    title: "Conversion Cancelled",
                    reason: "The file conversion was cancelled by the user.",
                    solution: "You can select a new file or start a new conversion anytime.",
                    technicalDetails: techMsg
                };

            case ERROR_CODES.BROWSER_NOT_SUPPORTED:
                return {
                    code,
                    title: "Browser Feature Missing",
                    reason: "Your browser lacks modern capabilities required for local file conversion.",
                    solution: "Please update to the latest version of Chrome, Edge, Firefox, or Safari.",
                    technicalDetails: techMsg
                };

            default:
                return {
                    code: ERROR_CODES.UNKNOWN_ERROR,
                    title: "Conversion Error",
                    reason: customMessage || "An unexpected error occurred during processing.",
                    solution: "Please refresh the page and try again. Technical details have been logged in the browser console.",
                    technicalDetails: techMsg
                };
        }
    }
}
