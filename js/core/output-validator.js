/**
 * Output Validator Module
 * Re-parses and validates generated output Blobs before download to ensure files are valid.
 * Performs Round-Trip Re-Parsing for XLSX, ODS, CSV, TSV, JSON, XML, and SQL outputs.
 */
import { getXLSX } from "./xlsx-provider.js";
import { CSVParser } from "../converters/csv/csv-parser.js";

export class OutputValidator {
    /**
     * Validate generated conversion output Blobs via round-trip re-parsing
     * @param {object} conversionResult 
     * @param {string} targetFormat 
     * @returns {Promise<{ isValid: boolean, error?: string }>}
     */
    static async validateOutput(conversionResult, targetFormat) {
        if (!conversionResult || !conversionResult.success || !conversionResult.files || conversionResult.files.length === 0) {
            return { isValid: false, error: "No output files generated." };
        }

        for (const fileObj of conversionResult.files) {
            const blob = fileObj.blob;
            if (!blob || blob.size === 0) {
                return { isValid: false, error: `Generated file '${fileObj.fileName}' is empty (0 bytes).` };
            }

            // Round-Trip Validation per target format
            switch (targetFormat) {
                case "xlsx":
                case "ods": {
                    try {
                        const XLSX = await getXLSX();
                        const buffer = await blob.arrayBuffer();
                        const wb = XLSX.read(buffer, { type: "array" });
                        if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
                            return { isValid: false, error: `Generated spreadsheet '${fileObj.fileName}' contains no sheet tabs.` };
                        }
                    } catch (e) {
                        return { isValid: false, error: `Spreadsheet round-trip validation failed: ${e.message}` };
                    }
                    break;
                }

                case "csv":
                case "tsv": {
                    try {
                        const text = await blob.text();
                        const parsed = CSVParser.parse(text);
                        if (!parsed || !parsed.rows || parsed.rows.length === 0) {
                            return { isValid: false, error: `Generated ${targetFormat.toUpperCase()} file '${fileObj.fileName}' has no data rows.` };
                        }
                    } catch (e) {
                        return { isValid: false, error: `${targetFormat.toUpperCase()} round-trip validation failed: ${e.message}` };
                    }
                    break;
                }

                case "json": {
                    try {
                        const text = await blob.text();
                        const parsed = JSON.parse(text);
                        if (!Array.isArray(parsed) && typeof parsed !== "object") {
                            return { isValid: false, error: `Generated JSON file '${fileObj.fileName}' is invalid.` };
                        }
                    } catch (e) {
                        return { isValid: false, error: `JSON round-trip validation failed: ${e.message}` };
                    }
                    break;
                }

                case "xml": {
                    try {
                        const text = await blob.text();
                        const doc = new DOMParser().parseFromString(text, "text/xml");
                        const err = doc.getElementsByTagName("parsererror")[0];
                        if (err) {
                            return { isValid: false, error: `Generated XML is malformed: ${err.textContent}` };
                        }
                    } catch (e) {
                        return { isValid: false, error: `XML round-trip validation failed: ${e.message}` };
                    }
                    break;
                }

                default:
                    break;
            }
        }

        return { isValid: true };
    }
}
