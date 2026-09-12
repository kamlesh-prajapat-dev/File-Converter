/**
 * Conversion Manager
 * Orchestrates conversion execution via Web Worker with fallback to main thread.
 * Handles progress callbacks, safe ArrayBuffer ownership, and cancellation.
 */
import { ConversionValidator } from "./conversion-validator.js";
import { ErrorManager, ERROR_CODES } from "./error-manager.js";
import { isWorkerSupported } from "../utils/browser-utils.js";
import { UniversalConverter } from "../converters/universal-converter.js";

// Direct imports for main thread fallback execution
import { DBFToXlsxConverter } from "../converters/dbf/dbf-to-xlsx.js";
import { DBFToCsvConverter } from "../converters/dbf/dbf-to-csv.js";
import { DBFToJsonConverter } from "../converters/dbf/dbf-to-json.js";
import { CsvToXlsxConverter } from "../converters/csv/csv-to-xlsx.js";
import { CsvToJsonConverter } from "../converters/csv/csv-to-json.js";
import { JsonToCsvConverter } from "../converters/json/json-to-csv.js";
import { JsonToXlsxConverter } from "../converters/json/json-to-xlsx.js";

const directConverters = {
    "dbf-to-xlsx": DBFToXlsxConverter,
    "dbf-to-csv": DBFToCsvConverter,
    "dbf-to-json": DBFToJsonConverter,
    "csv-to-xlsx": CsvToXlsxConverter,
    "csv-to-json": CsvToJsonConverter,
    "json-to-csv": JsonToCsvConverter,
    "json-to-xlsx": JsonToXlsxConverter
};

export class ConversionManager {
    constructor(progressManager) {
        this.progressManager = progressManager;
        this.activeWorker = null;
        this.isProcessing = false;
        this.isCancelled = false;
    }

    /**
     * Start conversion process
     * @param {File} file 
     * @param {string} sourceFormat 
     * @param {string} targetFormat 
     * @param {object} [options] 
     * @returns {Promise<object>}
     */
    async convert(file, sourceFormat, targetFormat, options = {}) {
        // 1. Pre-conversion validation
        const validation = ConversionValidator.validate(file, sourceFormat, targetFormat);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error
            };
        }

        this.isProcessing = true;
        this.isCancelled = false;
        this.progressManager.reset();
        this.progressManager.update(5, "Reading source file buffer...", true);

        try {
            if (this.isCancelled) {
                return { success: false, error: ErrorManager.createError(ERROR_CODES.CANCELLED) };
            }

            // Attempt Web Worker execution if supported
            if (isWorkerSupported() && !options.disableWorker) {
                try {
                    // Create a fresh ArrayBuffer from File for worker transfer
                    const workerBuffer = await file.arrayBuffer();
                    return await this.runWorkerConversion(file.name, sourceFormat, targetFormat, workerBuffer, options);
                } catch (workerErr) {
                    console.warn("Web Worker execution failed, falling back to main thread:", workerErr);
                }
            }

            // Fallback: Read a fresh ArrayBuffer from immutable File object for main thread execution
            const directBuffer = await file.arrayBuffer();
            return await this.runDirectConversion(file.name, sourceFormat, targetFormat, directBuffer, options);
        } catch (err) {
            if (this.isCancelled) {
                return { success: false, error: ErrorManager.createError(ERROR_CODES.CANCELLED) };
            }
            return {
                success: false,
                error: ErrorManager.createError(ERROR_CODES.CONVERSION_ERROR, err.message, err)
            };
        } finally {
            this.isProcessing = false;
            this.activeWorker = null;
        }
    }

    /**
     * Execute conversion inside Web Worker
     */
    runWorkerConversion(fileName, sourceFormat, targetFormat, arrayBuffer, options) {
        return new Promise((resolve, reject) => {
            try {
                this.activeWorker = new Worker(new URL("../workers/conversion-worker.js", import.meta.url), { type: "module" });

                this.activeWorker.onmessage = (e) => {
                    const { type, percentage, message, result, error } = e.data || {};

                    if (type === "PROGRESS") {
                        this.progressManager.update(percentage, message);
                    } else if (type === "COMPLETE") {
                        this.terminateWorker();
                        resolve(result);
                    } else if (type === "CANCELLED") {
                        this.terminateWorker();
                        resolve({ success: false, error: ErrorManager.createError(ERROR_CODES.CANCELLED) });
                    } else if (type === "ERROR") {
                        this.terminateWorker();
                        resolve({
                            success: false,
                            error: ErrorManager.createError(error.code || ERROR_CODES.CONVERSION_ERROR, error.message)
                        });
                    }
                };

                this.activeWorker.onerror = (err) => {
                    this.terminateWorker();
                    reject(err);
                };

                // Send conversion payload to worker with transferable arrayBuffer
                this.activeWorker.postMessage({
                    action: "START_CONVERSION",
                    payload: {
                        sourceFormat,
                        targetFormat,
                        arrayBuffer,
                        fileName,
                        options
                    }
                }, [arrayBuffer]);
            } catch (err) {
                this.terminateWorker();
                reject(err);
            }
        });
    }

    /**
     * Fallback execution directly on main thread
     */
    async runDirectConversion(fileName, sourceFormat, targetFormat, arrayBuffer, options) {
        const onProgress = (percentage, message) => {
            if (this.isCancelled) throw new Error("CANCELLED");
            this.progressManager.update(percentage, message);
        };

        try {
            return await UniversalConverter.convert(arrayBuffer, sourceFormat, targetFormat, { ...options, fileName }, onProgress);
        } catch (err) {
            if (err.message === "CANCELLED" || this.isCancelled) {
                return { success: false, error: ErrorManager.createError(ERROR_CODES.CANCELLED) };
            }
            throw err;
        }
    }

    /**
     * Cancel ongoing conversion
     */
    cancel() {
        this.isCancelled = true;
        if (this.activeWorker) {
            try {
                this.activeWorker.postMessage({ action: "CANCEL" });
            } catch {}
            this.terminateWorker();
        }
        this.isProcessing = false;
        this.progressManager.update(0, "Conversion cancelled.", true);
    }

    terminateWorker() {
        if (this.activeWorker) {
            this.activeWorker.terminate();
            this.activeWorker = null;
        }
    }
}
