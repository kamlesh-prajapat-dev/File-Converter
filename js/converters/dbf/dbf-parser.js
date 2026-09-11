/**
 * DBF Parser Module
 * Reads binary dBase (DBF) files from ArrayBuffer.
 */

export class DBFParser {
    /**
     * Parse complete DBF structure from ArrayBuffer
     * @param {ArrayBuffer} arrayBuffer 
     * @param {function(number, string): void} [progressCallback]
     * @returns {{ fields: Array, records: Array }}
     */
    static parse(arrayBuffer, progressCallback) {
        const bytes = new Uint8Array(arrayBuffer);

        if (bytes.length < 32) {
            throw new Error("File is too small to be a valid DBF file.");
        }

        // DBF Header details
        const headerLength = bytes[8] | (bytes[9] << 8);
        const recordLength = bytes[10] | (bytes[11] << 8);
        const numberOfRecords = (bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24)) >>> 0;

        if (headerLength <= 32 || recordLength <= 0) {
            throw new Error("Invalid DBF header structure.");
        }

        // Field Descriptors
        const fields = [];
        let fieldOffset = 32;

        while (fieldOffset + 32 <= headerLength) {
            if (bytes[fieldOffset] === 0x0D) { // End of field descriptors
                break;
            }

            const nameBytes = bytes.slice(fieldOffset, fieldOffset + 11);
            let fieldName = "";
            for (let b of nameBytes) {
                if (b === 0) break;
                fieldName += String.fromCharCode(b);
            }
            fieldName = fieldName.trim();

            const fieldType = String.fromCharCode(bytes[fieldOffset + 11]);
            const fieldLength = bytes[fieldOffset + 16];
            const decimalCount = bytes[fieldOffset + 17];

            fields.push({
                name: fieldName || `Field_${fields.length + 1}`,
                type: fieldType,
                length: fieldLength,
                decimals: decimalCount
            });

            fieldOffset += 32;
        }

        if (fields.length === 0) {
            throw new Error("No DBF fields found in file header.");
        }

        // Extract Data Records
        const records = [];
        let recordOffset = headerLength;
        const textDecoder = new TextDecoder("utf-8", { fatal: false });

        for (let r = 0; r < numberOfRecords; r++) {
            if (recordOffset + recordLength > bytes.length) {
                break;
            }

            // Check Deletion Flag (0x2A = deleted '*')
            const deletionFlag = bytes[recordOffset];
            if (deletionFlag === 0x2A) {
                recordOffset += recordLength;
                continue;
            }

            const row = [];
            let fieldPos = recordOffset + 1;

            for (const field of fields) {
                const rawBytes = bytes.slice(fieldPos, fieldPos + field.length);
                const value = this.decodeValue(rawBytes, field, textDecoder);
                row.push(value);
                fieldPos += field.length;
            }

            records.push(row);
            recordOffset += recordLength;

            if (progressCallback && r % 10000 === 0) {
                const percent = Math.round(10 + (r / numberOfRecords) * 20);
                progressCallback(percent, `Reading DBF records (${r.toLocaleString()} / ${numberOfRecords.toLocaleString()})...`);
            }
        }

        return {
            fields,
            records,
            totalRows: records.length,
            totalColumns: fields.length
        };
    }

    /**
     * Decode field byte array based on field type
     */
    static decodeValue(bytes, field, decoder) {
        let rawStr;
        try {
            rawStr = decoder.decode(bytes);
        } catch {
            rawStr = String.fromCharCode(...bytes);
        }

        const value = rawStr.replace(/\0/g, "").trim();
        if (value === "") return "";

        switch (field.type.toUpperCase()) {
            case "C": // Character
                return value;

            case "N": // Numeric
            case "F": // Float
            case "I": // Integer
            case "O": { // Double
                const num = Number(value);
                return Number.isNaN(num) ? value : num;
            }

            case "L": { // Logical / Boolean
                const char = value.toUpperCase().charAt(0);
                if (char === "Y" || char === "T" || char === "1") return true;
                if (char === "N" || char === "F" || char === "0") return false;
                return value;
            }

            case "D": { // Date YYYYMMDD
                if (/^\d{8}$/.test(value)) {
                    return `${value.substring(0, 4)}-${value.substring(4, 6)}-${value.substring(6, 8)}`;
                }
                return value;
            }

            default:
                return value;
        }
    }
}
