/**
 * SQL Parser Module
 * Parses SQL dump files containing INSERT INTO statements into multi-table structures and normalized rows.
 */
export class SQLParser {
    /**
     * Parse SQL text or ArrayBuffer into { tablesMap, headers, rows, totalRows, totalColumns }
     * @param {string|ArrayBuffer} input 
     * @param {function(number, string): void} [onProgress]
     * @returns {{ tablesMap: object, headers: Array<string>, rows: Array<Array<any>>, totalRows: number, totalColumns: number }}
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

        // Match INSERT INTO table_name (col1, col2) VALUES (...), (...);
        const insertRegex = /INSERT\s+INTO\s+[`"']?(\w+)[`"']?\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+?);/gi;
        let match;
        const tablesMap = {};
        let primaryTableName = null;

        while ((match = insertRegex.exec(sqlText)) !== null) {
            const rawTableName = match[1].trim();
            const rawCols = match[2];
            const rawValuesBlock = match[3];

            if (!primaryTableName) primaryTableName = rawTableName;

            if (!tablesMap[rawTableName]) {
                const cols = rawCols.split(",").map(c => c.replace(/[`"'\s]/g, "").trim());
                tablesMap[rawTableName] = {
                    tableName: rawTableName,
                    headers: cols,
                    rows: []
                };
            }

            const targetTable = tablesMap[rawTableName];
            const tupleRegex = /\(([^)]+)\)/g;
            let tupleMatch;
            while ((tupleMatch = tupleRegex.exec(rawValuesBlock)) !== null) {
                const valStr = tupleMatch[1];
                const vals = this.parseSqlRowValues(valStr);
                targetTable.rows.push(vals);
            }
        }

        const tableKeys = Object.keys(tablesMap);
        if (tableKeys.length === 0) {
            throw new Error("No valid SQL INSERT INTO statements found in file.");
        }

        const primaryTable = tablesMap[primaryTableName || tableKeys[0]];
        const totalRows = Object.values(tablesMap).reduce((sum, tbl) => sum + tbl.rows.length, 0);

        return {
            tablesMap,
            headers: primaryTable.headers,
            rows: primaryTable.rows,
            totalRows: primaryTable.rows.length,
            totalOverallRows: totalRows,
            totalColumns: primaryTable.headers.length
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
