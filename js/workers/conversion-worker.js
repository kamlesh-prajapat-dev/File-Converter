/**
 * Web Worker for File Conversion
 * Runs CPU-heavy parsing and file generation off the main thread.
 */

import { getXLSX } from "../core/xlsx-provider.js";
import { DBFToXlsxConverter } from "../converters/dbf/dbf-to-xlsx.js";
import { DBFToCsvConverter } from "../converters/dbf/dbf-to-csv.js";
import { DBFToJsonConverter } from "../converters/dbf/dbf-to-json.js";
import { CsvToXlsxConverter } from "../converters/csv/csv-to-xlsx.js";
import { CsvToJsonConverter } from "../converters/csv/csv-to-json.js";
import { JsonToCsvConverter } from "../converters/json/json-to-csv.js";
import { JsonToXlsxConverter } from "../converters/json/json-to-xlsx.js";

const converterMap = {
    "dbf-to-xlsx": DBFToXlsxConverter,
    "dbf-to-csv": DBFToCsvConverter,
    "dbf-to-json": DBFToJsonConverter,
    "csv-to-xlsx": CsvToXlsxConverter,
    "csv-to-json": CsvToJsonConverter,
    "json-to-csv": JsonToCsvConverter,
    "json-to-xlsx": JsonToXlsxConverter
};

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
        const key = `${sourceFormat}-to-${targetFormat}`;

        const ConverterClass = converterMap[key];
        if (!ConverterClass) {
            self.postMessage({
                type: "ERROR",
                error: { code: "UNSUPPORTED_CONVERSION", message: `No worker converter found for ${key}` }
            });
            return;
        }

        try {
            // Warm up XLSX provider inside worker context
            if (targetFormat === "xlsx") {
                await getXLSX();
            }

            const onProgress = (percentage, message) => {
                if (isCancelled) throw new Error("CANCELLED");
                self.postMessage({ type: "PROGRESS", percentage, message });
            };

            const result = await ConverterClass.convert(arrayBuffer, { ...options, fileName }, onProgress);

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
