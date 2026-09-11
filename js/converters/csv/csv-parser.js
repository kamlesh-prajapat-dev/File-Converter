/**
 * CSV Parser Module
 * Parses CSV text or ArrayBuffer into headers and rows.
 */

export class CSVParser {
    /**
     * Parse CSV text or buffer into { headers, rows }
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
            throw new Error("Invalid CSV input.");
        }

        // Remove BOM if present
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }

        if (!text.trim()) {
            throw new Error("CSV file is empty.");
        }

        // Auto-detect delimiter
        const firstLine = text.split(/\r\n|\n|\r/)[0] || "";
        const delimiter = this.detectDelimiter(firstLine);

        // Parse token by token
        const allRows = [];
        let currentRow = [];
        let currentField = "";
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (inQuotes) {
                if (char === '"' && nextChar === '"') { // Escaped quote ""
                    currentField += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = false;
                } else {
                    currentField += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === delimiter) {
                    currentRow.push(currentField.trim());
                    currentField = "";
                } else if (char === "\r" || char === "\n") {
                    if (char === "\r" && nextChar === "\n") {
                        i++;
                    }
                    currentRow.push(currentField.trim());
                    if (currentRow.some(cell => cell.length > 0)) {
                        allRows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = "";
                } else {
                    currentField += char;
                }
            }
        }

        if (currentField.length > 0 || currentRow.length > 0) {
            currentRow.push(currentField.trim());
            if (currentRow.some(cell => cell.length > 0)) {
                allRows.push(currentRow);
            }
        }

        if (allRows.length === 0) {
            throw new Error("No readable rows found in CSV file.");
        }

        const headers = allRows[0].map((h, idx) => h || `Column_${idx + 1}`);
        const dataRows = allRows.slice(1);

        return {
            headers,
            rows: dataRows,
            totalRows: dataRows.length,
            totalColumns: headers.length
        };
    }

    static detectDelimiter(line) {
        const commaCount = (line.match(/,/g) || []).length;
        const semiCount = (line.match(/;/g) || []).length;
        const tabCount = (line.match(/\t/g) || []).length;

        if (semiCount > commaCount && semiCount > tabCount) return ";";
        if (tabCount > commaCount && tabCount > semiCount) return "\t";
        return ",";
    }
}
