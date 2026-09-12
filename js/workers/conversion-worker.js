/**
 * Web Worker for File Conversion
 * Runs CPU-heavy parsing and file generation off the main thread.
 */

import { getXLSX } from "../core/xlsx-provider.js";
import { UniversalConverter } from "../converters/universal-converter.js";

let isCancelled = false;

self.onmessage = async function (e) {
    const { action, payload } = e.data || {};

    if (action === "CANCEL") {
        isCancelled = true;
        self.postMessage({ type: "CANCELLED" });
        return;
    }

    if (action === "START_CONVERSION") {
        isCancelled = false;
        const { sourceFormat, targetFormat, arrayBuffer, fileName, options } = payload;

        try {
            // Warm up XLSX provider inside worker context if needed
            if (targetFormat === "xlsx" || targetFormat === "ods" || sourceFormat === "xlsx" || sourceFormat === "xls" || sourceFormat === "ods") {
                await getXLSX();
            }

            const onProgress = (percentage, message) => {
                if (isCancelled) throw new Error("CANCELLED");
                self.postMessage({ type: "PROGRESS", percentage, message });
            };

            const result = await UniversalConverter.convert(arrayBuffer, sourceFormat, targetFormat, { ...options, fileName }, onProgress);

            if (isCancelled) {
                self.postMessage({ type: "CANCELLED" });
                return;
            }

            self.postMessage({
                type: "COMPLETE",
                result
            });
        } catch (err) {
            if (err.message === "CANCELLED" || isCancelled) {
                self.postMessage({ type: "CANCELLED" });
            } else {
                self.postMessage({
                    type: "ERROR",
                    error: {
                        code: "CONVERSION_ERROR",
                        message: err.message || "Worker conversion error",
                        stack: err.stack
                    }
                });
            }
        }
    }
};
