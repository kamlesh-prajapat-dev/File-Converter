/**
 * YAML Parser Module
 * Parses simple YAML documents into normalized headers and rows.
 */
export class YAMLParser {
    static parse(input, onProgress) {
        let text = "";
        if (typeof input === "string") {
            text = input;
        } else if (input instanceof ArrayBuffer) {
            text = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(input));
        } else {
            throw new Error("Invalid YAML input.");
        }

        if (onProgress) onProgress(15, "Parsing YAML structure...");
        const lines = text.split(/\r\n|\n|\r/);
        const records = [];
        let currentRecord = null;
        const headerSet = new Set();

        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;

            if (trimmed.startsWith("- ")) {
                if (currentRecord && Object.keys(currentRecord).length > 0) {
                    records.push(currentRecord);
                }
                currentRecord = {};
                const itemContent = trimmed.substring(2).trim();
                const colonIdx = itemContent.indexOf(":");
                if (colonIdx !== -1) {
                    const key = itemContent.substring(0, colonIdx).trim();
                    const val = itemContent.substring(colonIdx + 1).trim().replace(/^['"]|['"]$/g, "");
                    headerSet.add(key);
                    currentRecord[key] = val;
                }
            } else if (currentRecord && trimmed.includes(":")) {
                const colonIdx = trimmed.indexOf(":");
                const key = trimmed.substring(0, colonIdx).trim();
                const val = trimmed.substring(colonIdx + 1).trim().replace(/^['"]|['"]$/g, "");
                headerSet.add(key);
                currentRecord[key] = val;
            }
        }

        if (currentRecord && Object.keys(currentRecord).length > 0) {
            records.push(currentRecord);
        }

        if (records.length === 0) {
            throw new Error("No readable record list found in YAML.");
        }

        const headers = Array.from(headerSet);
        const rows = records.map(rec => headers.map(h => rec[h] !== undefined ? rec[h] : ""));

        return {
            headers,
            rows,
            totalRows: rows.length,
            totalColumns: headers.length
        };
    }
}
