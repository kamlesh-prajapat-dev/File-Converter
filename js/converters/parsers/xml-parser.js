/**
 * XML Parser Module
 * Parses XML documents using browser-native DOMParser into normalized tabular headers and rows.
 */
export class XMLParser {
    /**
     * Parse XML text or ArrayBuffer into { headers, rows, totalRows, totalColumns }
     * @param {string|ArrayBuffer} input 
     * @param {function(number, string): void} [onProgress]
     * @returns {{ headers: Array<string>, rows: Array<Array<any>>, totalRows: number, totalColumns: number }}
     */
    static parse(input, onProgress) {
        let xmlText = "";
        if (typeof input === "string") {
            xmlText = input;
        } else if (input instanceof ArrayBuffer) {
            xmlText = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(input));
        } else {
            throw new Error("Invalid XML input.");
        }

        if (onProgress) onProgress(15, "Parsing XML structure...");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        const parseError = xmlDoc.getElementsByTagName("parsererror")[0];
        if (parseError) {
            throw new Error(`XML parsing error: ${parseError.textContent}`);
        }

        const root = xmlDoc.documentElement;
        if (!root) {
            throw new Error("XML file has no root element.");
        }

        // Find child elements of root
        const children = Array.from(root.children);
        if (children.length === 0) {
            throw new Error("XML document contains no record elements.");
        }

        const headerSet = new Set();
        const records = [];

        children.forEach(child => {
            const recordObj = {};
            if (child.children.length > 0) {
                Array.from(child.children).forEach(col => {
                    headerSet.add(col.tagName);
                    recordObj[col.tagName] = col.textContent.trim();
                });
            } else if (child.attributes.length > 0) {
                Array.from(child.attributes).forEach(attr => {
                    headerSet.add(attr.name);
                    recordObj[attr.name] = attr.value;
                });
            } else {
                headerSet.add("Value");
                recordObj["Value"] = child.textContent.trim();
            }
            records.push(recordObj);
        });

        const headers = Array.from(headerSet);
        if (headers.length === 0) {
            headers.push("Content");
        }

        const rows = records.map(rec => {
            return headers.map(h => rec[h] !== undefined ? rec[h] : "");
        });

        return {
            headers,
            rows,
            totalRows: rows.length,
            totalColumns: headers.length
        };
    }
}
