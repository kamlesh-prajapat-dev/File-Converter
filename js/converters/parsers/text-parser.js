/**
 * Text / Markup Parser Module
 * Parses HTML <table> elements and Markdown tables into normalized headers and rows.
 */
export class TextParser {
    static parse(input, format = "html", onProgress) {
        let text = "";
        if (typeof input === "string") {
            text = input;
        } else if (input instanceof ArrayBuffer) {
            text = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(input));
        } else {
            throw new Error("Invalid markup input.");
        }

        if (format === "html") {
            return this.parseHTMLTable(text, onProgress);
        } else if (format === "md") {
            return this.parseMarkdownTable(text, onProgress);
        } else {
            throw new Error(`Unsupported text parser format: ${format}`);
        }
    }

    static parseHTMLTable(htmlText, onProgress) {
        if (onProgress) onProgress(15, "Parsing HTML <table> structure...");
        const doc = new DOMParser().parseFromString(htmlText, "text/html");
        const table = doc.querySelector("table");

        if (!table) {
            throw new Error("No HTML <table> element found in file.");
        }

        const rows = [];
        let headers = [];

        const thElements = table.querySelectorAll("th");
        if (thElements.length > 0) {
            headers = Array.from(thElements).map((th, i) => th.textContent.trim() || `Column_${i + 1}`);
        }

        const trElements = table.querySelectorAll("tr");
        trElements.forEach(tr => {
            const tdElements = tr.querySelectorAll("td");
            if (tdElements.length > 0) {
                const row = Array.from(tdElements).map(td => td.textContent.trim());
                rows.push(row);
            }
        });

        if (headers.length === 0 && rows.length > 0) {
            headers = rows[0].map((_, i) => `Column_${i + 1}`);
        }

        return {
            headers,
            rows,
            totalRows: rows.length,
            totalColumns: headers.length
        };
    }

    static parseMarkdownTable(mdText, onProgress) {
        if (onProgress) onProgress(15, "Parsing Markdown table structure...");
        const lines = mdText.split(/\r\n|\n|\r/).filter(l => l.includes("|"));
        if (lines.length < 2) {
            throw new Error("No valid Markdown table found in file.");
        }

        const headers = lines[0].split("|").map(s => s.trim()).filter((s, idx, arr) => idx > 0 && idx < arr.length - 1);
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes("---")) continue; // Skip separator line | --- | --- |
            const cells = line.split("|").map(s => s.trim()).filter((s, idx, arr) => idx > 0 && idx < arr.length - 1);
            if (cells.length > 0) {
                rows.push(cells);
            }
        }

        return {
            headers,
            rows,
            totalRows: rows.length,
            totalColumns: headers.length
        };
    }
}
