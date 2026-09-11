/**
 * JSON Parser Module
 * Parses JSON array of objects or single JSON object into tabular headers and rows.
 */

export class JSONParser {
    /**
     * Parse JSON string or buffer into { headers, rows }
     * @param {string|ArrayBuffer} input 
     * @param {function(number, string): void} [onProgress]
     * @returns {{ headers: Array<string>, rows: Array<Array<any>> }}
     */
    static parse(input, onProgress) {
        let text = "";
        if (typeof input === "string") {
            text = input;
        } else if (input instanceof ArrayBuffer) {
            text = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(input));
        } else {
            throw new Error("Invalid JSON input.");
        }

        if (!text.trim()) {
            throw new Error("JSON file is empty.");
        }

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            throw new Error(`JSON syntax error: ${e.message}`);
        }

        let list = [];
        if (Array.isArray(parsed)) {
            list = parsed;
        } else if (typeof parsed === "object" && parsed !== null) {
            // Find first array property inside JSON object if root is an object
            const arrayProp = Object.values(parsed).find(val => Array.isArray(val));
            if (arrayProp) {
                list = arrayProp;
            } else {
                list = [parsed];
            }
        }

        if (list.length === 0) {
            throw new Error("No data records found in JSON.");
        }

        // Collect all unique keys across records to form header set
        const headerSet = new Set();
        list.forEach(item => {
            if (item && typeof item === "object" && !Array.isArray(item)) {
                Object.keys(item).forEach(key => headerSet.add(key));
            }
        });

        const headers = Array.from(headerSet);
        if (headers.length === 0) {
            headers.push("Value");
        }

        // Build data rows
        const rows = list.map(item => {
            if (item && typeof item === "object" && !Array.isArray(item)) {
                return headers.map(key => {
                    const val = item[key];
                    if (val === null || val === undefined) return "";
                    if (typeof val === "object") return JSON.stringify(val);
                    return val;
                });
            } else {
                return [String(item)];
            }
        });

        return {
            headers,
            rows,
            totalRows: rows.length,
            totalColumns: headers.length
        };
    }
}
