/**
 * Conversion Validator
 * Validates conversion eligibility before triggering conversion workers.
 */
import { ConversionRegistry } from "./conversion-registry.js";
import { ErrorManager, ERROR_CODES } from "./error-manager.js";
import { isFileApiSupported } from "../utils/browser-utils.js";

export class ConversionValidator {
    /**
     * Validate full conversion request
     * @param {File} file 
     * @param {string} sourceFormat 
     * @param {string} targetFormat 
     * @returns {{ valid: boolean, error?: object }}
     */
    static validate(file, sourceFormat, targetFormat) {
        // 1. Browser capability check
        if (!isFileApiSupported()) {
            return {
                valid: false,
                error: ErrorManager.createError(ERROR_CODES.BROWSER_NOT_SUPPORTED)
            };
        }

        // 2. File presence check
        if (!file) {
            return {
                valid: false,
                error: ErrorManager.createError(ERROR_CODES.INVALID_FILE, "No file selected.")
            };
        }

        // 3. File size check (empty file)
        if (file.size === 0) {
            return {
                valid: false,
                error: ErrorManager.createError(ERROR_CODES.EMPTY_FILE)
            };
        }

        // 4. Source format check
        if (!sourceFormat || sourceFormat === "unknown") {
            return {
                valid: false,
                error: ErrorManager.createError(
                    ERROR_CODES.UNSUPPORTED_FORMAT,
                    `The format of '${file.name}' could not be identified or is unsupported.`
                )
            };
        }

        // 5. Target format check
        if (!targetFormat) {
            return {
                valid: false,
                error: ErrorManager.createError(
                    ERROR_CODES.UNSUPPORTED_CONVERSION,
                    "Please select an output target format."
                )
            };
        }

        // 6. Registry conversion support check
        if (!ConversionRegistry.isSupported(sourceFormat, targetFormat)) {
            return {
                valid: false,
                error: ErrorManager.createError(
                    ERROR_CODES.UNSUPPORTED_CONVERSION,
                    `Converting from '${sourceFormat.toUpperCase()}' to '${targetFormat.toUpperCase()}' is currently not supported.`
                )
            };
        }

        return { valid: true };
    }
}
