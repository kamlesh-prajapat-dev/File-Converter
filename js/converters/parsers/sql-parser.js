/**
 * SQL Parser Module
 * Parses SQL dump files containing INSERT INTO statements into normalized headers and rows.
 */
export class SQLParser {
    /**
     * Parse SQL text or ArrayBuffer into { headers, rows, totalRows, totalColumns }
     * @param {string|ArrayBuffer} input 
     * @param {function(number, string): void} [onProgress]
     * @returns {{ headers: Array<string>, rows: Array<Array<any>>, totalRows: number, totalColumns: number }}
     */
    static parse(input, onProgress) {
        let sqlText = "";
        if (typeof input === "string") {
            sqlText = input;
        } else if (input instanceof ArrayBuffer) {
            sqlText = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(input));
        } else {
            throw new Error("Invalid SQL input.");
        }

        if (onProgress) onProgress(15, "Analyzing SQL INSERT statements...");

        // Match INSERT INTO table (col1, col2) VALUES (...), (...);
        const insertRegex = /INSERT\s+INTO\s+[`"']?\w+[`"']?\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+?);/gi;
        let match;
        let headers = [];
        const rows = [];

        while ((match = insertRegex.exec(sqlText)) !== null) {
            const rawCols = match[1];
            const rawValuesBlock = match[2];

            if (headers.length === 0) {
                headers = rawCols.split(",").map(c => c.replace(/[`"'\s]/g, "").trim());
            }

            // Extract tuple values (...)
            const tupleRegex = /\(([^)]+)\)/g;
            let tupleMatch;
            while ((tupleMatch = tupleRegex.exec(rawValuesBlock)) !== null) {
                const valStr = tupleMatch[1];
                const vals = this.parseSqlRowValues(valStr);
                rows.push(vals);
            }
        }

        if (rows.length === 0 || headers.length === 0) {
            throw new Error("No valid SQL INSERT INTO statements found in file.");
        }

        return {
            headers,
            rows,
            totalRows: rows.length,
            totalColumns: headers.length
        };
    }

    static parseSqlRowValues(valStr) {
        const result = [];
        let current = "";
        let inString = false;
        let quoteChar = "";

        for (let i = 0; i < valStr.length; i++) {
            const char = valStr[i];
            if (inString) {
                if (char === quoteChar && valStr[i - 1] !== "\\") {
                    inString = false;
                } else {
                    current += char;
                }
            } else {
                if (char === "'" || char === '"') {
                    inString = true;
                    quoteChar = char;
                } else if (char === ",") {
                    result.push(current.trim().replace(/^['"]|['"]$/g, ""));
                    current = "";
                } else {
                    current += char;
                }
            }
        }
        result.push(current.trim().replace(/^['"]|['"]$/g, ""));
        return result;
    }
}
