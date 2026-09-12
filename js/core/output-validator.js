/**
 * Output Validator Module
 * Re-parses and validates generated output Blobs before download to ensure files are valid.
 */
export class OutputValidator {
    /**
     * Validate generated conversion output Blobs
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

            // Spot-check text/json syntax validity
            if (targetFormat === "json") {
                try {
                    const text = await blob.text();
                    // Peeking start and end
                    if (!text.trim().startsWith("[") && !text.trim().startsWith("{")) {
                        return { isValid: false, error: `Generated JSON file '${fileObj.fileName}' does not start with array or object.` };
                    }
                } catch (e) {
                    return { isValid: false, error: `JSON output validation failed: ${e.message}` };
                }
            } else if (targetFormat === "xml") {
                try {
                    const text = await blob.text();
                    if (!text.includes("<?xml") && !text.includes("<data>")) {
                        return { isValid: false, error: `Generated XML file '${fileObj.fileName}' missing root tag.` };
                    }
                } catch (e) {
                    return { isValid: false, error: `XML output validation failed: ${e.message}` };
                }
            }
        }

        return { isValid: true };
    }
}
