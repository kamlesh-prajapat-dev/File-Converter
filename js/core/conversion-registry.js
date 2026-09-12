/**
 * Conversion Compatibility Registry
 * Central lookup table for supported source and target format conversions.
 */
import { CONFIG } from "../config/config.js";

export class ConversionRegistry {
    /**
     * Map of supported source formats to target formats and their details
     */
    static registry = {
        dbf: {
            xlsx: { id: "dbf-to-xlsx", name: "Excel Spreadsheet (.xlsx)", targetExt: "xlsx", chunkable: true, status: "SUPPORTED" },
            ods:  { id: "dbf-to-ods",  name: "OpenDocument Spreadsheet (.ods)", targetExt: "ods", chunkable: true, status: "SUPPORTED" },
            csv:  { id: "dbf-to-csv",  name: "Comma Separated Values (.csv)", targetExt: "csv",  chunkable: true, status: "SUPPORTED" },
            tsv:  { id: "dbf-to-tsv",  name: "Tab Separated Values (.tsv)", targetExt: "tsv",  chunkable: true, status: "SUPPORTED" },
            json: { id: "dbf-to-json", name: "JSON Array (.json)", targetExt: "json", chunkable: true, status: "SUPPORTED" },
            xml:  { id: "dbf-to-xml",  name: "XML Document (.xml)", targetExt: "xml",  chunkable: true, status: "SUPPORTED" },
            sql:  { id: "dbf-to-sql",  name: "SQL Insert Dump (.sql)", targetExt: "sql",  chunkable: true, status: "SUPPORTED" },
            yaml: { id: "dbf-to-yaml", name: "YAML Document (.yaml)", targetExt: "yaml", chunkable: true, status: "SUPPORTED" },
            html: { id: "dbf-to-html", name: "HTML Table (.html)", targetExt: "html", chunkable: true, status: "SUPPORTED" },
            md:   { id: "dbf-to-md",   name: "Markdown Table (.md)", targetExt: "md",   chunkable: true, status: "SUPPORTED" }
        },
        csv: {
            xlsx: { id: "csv-to-xlsx", name: "Excel Spreadsheet (.xlsx)", targetExt: "xlsx", chunkable: true, status: "SUPPORTED" },
            ods:  { id: "csv-to-ods",  name: "OpenDocument Spreadsheet (.ods)", targetExt: "ods", chunkable: true, status: "SUPPORTED" },
            tsv:  { id: "csv-to-tsv",  name: "Tab Separated Values (.tsv)", targetExt: "tsv",  chunkable: true, status: "SUPPORTED" },
            json: { id: "csv-to-json", name: "JSON Array (.json)", targetExt: "json", chunkable: true, status: "SUPPORTED" },
            xml:  { id: "csv-to-xml",  name: "XML Document (.xml)", targetExt: "xml",  chunkable: true, status: "SUPPORTED" },
            sql:  { id: "csv-to-sql",  name: "SQL Insert Dump (.sql)", targetExt: "sql",  chunkable: true, status: "SUPPORTED" },
            yaml: { id: "csv-to-yaml", name: "YAML Document (.yaml)", targetExt: "yaml", chunkable: true, status: "SUPPORTED" },
            html: { id: "csv-to-html", name: "HTML Table (.html)", targetExt: "html", chunkable: true, status: "SUPPORTED" },
            md:   { id: "csv-to-md",   name: "Markdown Table (.md)", targetExt: "md",   chunkable: true, status: "SUPPORTED" }
        },
        tsv: {
            xlsx: { id: "tsv-to-xlsx", name: "Excel Spreadsheet (.xlsx)", targetExt: "xlsx", chunkable: true, status: "SUPPORTED" },
            ods:  { id: "tsv-to-ods",  name: "OpenDocument Spreadsheet (.ods)", targetExt: "ods", chunkable: true, status: "SUPPORTED" },
            csv:  { id: "tsv-to-csv",  name: "Comma Separated Values (.csv)", targetExt: "csv",  chunkable: true, status: "SUPPORTED" },
            json: { id: "tsv-to-json", name: "JSON Array (.json)", targetExt: "json", chunkable: true, status: "SUPPORTED" },
            xml:  { id: "tsv-to-xml",  name: "XML Document (.xml)", targetExt: "xml",  chunkable: true, status: "SUPPORTED" },
            sql:  { id: "tsv-to-sql",  name: "SQL Insert Dump (.sql)", targetExt: "sql",  chunkable: true, status: "SUPPORTED" },
            yaml: { id: "tsv-to-yaml", name: "YAML Document (.yaml)", targetExt: "yaml", chunkable: true, status: "SUPPORTED" },
            html: { id: "tsv-to-html", name: "HTML Table (.html)", targetExt: "html", chunkable: true, status: "SUPPORTED" },
            md:   { id: "tsv-to-md",   name: "Markdown Table (.md)", targetExt: "md",   chunkable: true, status: "SUPPORTED" }
        },
        json: {
            xlsx: { id: "json-to-xlsx", name: "Excel Spreadsheet (.xlsx)", targetExt: "xlsx", chunkable: true, status: "SUPPORTED" },
            ods:  { id: "json-to-ods",  name: "OpenDocument Spreadsheet (.ods)", targetExt: "ods", chunkable: true, status: "SUPPORTED" },
            csv:  { id: "json-to-csv",  name: "Comma Separated Values (.csv)", targetExt: "csv",  chunkable: true, status: "SUPPORTED" },
            tsv:  { id: "json-to-tsv",  name: "Tab Separated Values (.tsv)", targetExt: "tsv",  chunkable: true, status: "SUPPORTED" },
            xml:  { id: "json-to-xml",  name: "XML Document (.xml)", targetExt: "xml",  chunkable: true, status: "SUPPORTED" },
            sql:  { id: "json-to-sql",  name: "SQL Insert Dump (.sql)", targetExt: "sql",  chunkable: true, status: "SUPPORTED" },
            yaml: { id: "json-to-yaml", name: "YAML Document (.yaml)", targetExt: "yaml", chunkable: true, status: "SUPPORTED" },
            html: { id: "json-to-html", name: "HTML Table (.html)", targetExt: "html", chunkable: true, status: "SUPPORTED" },
            md:   { id: "json-to-md",   name: "Markdown Table (.md)", targetExt: "md",   chunkable: true, status: "SUPPORTED" }
        },
        xlsx: {
            csv:  { id: "xlsx-to-csv",  name: "Comma Separated Values (.csv)", targetExt: "csv",  chunkable: true, status: "LOSSY", dataLoss: { possible: true, notes: ["Cell formatting, formulas, and worksheets beyond the active sheet are omitted."] } },
            tsv:  { id: "xlsx-to-tsv",  name: "Tab Separated Values (.tsv)", targetExt: "tsv",  chunkable: true, status: "LOSSY", dataLoss: { possible: true, notes: ["Cell formatting, formulas, and worksheets beyond the active sheet are omitted."] } },
            json: { id: "xlsx-to-json", name: "JSON Array (.json)", targetExt: "json", chunkable: true, status: "LOSSY", dataLoss: { possible: true, notes: ["Cell formatting, charts, and formulas are omitted."] } },
            ods:  { id: "xlsx-to-ods",  name: "OpenDocument Spreadsheet (.ods)", targetExt: "ods", chunkable: true, status: "SUPPORTED" },
            xml:  { id: "xlsx-to-xml",  name: "XML Document (.xml)", targetExt: "xml",  chunkable: true, status: "LOSSY", dataLoss: { possible: true, notes: ["Spreadsheet styling and charts are omitted."] } },
            sql:  { id: "xlsx-to-sql",  name: "SQL Insert Dump (.sql)", targetExt: "sql",  chunkable: true, status: "LOSSY", dataLoss: { possible: true, notes: ["Spreadsheet styling and formulas are omitted."] } },
            yaml: { id: "xlsx-to-yaml", name: "YAML Document (.yaml)", targetExt: "yaml", chunkable: true, status: "LOSSY", dataLoss: { possible: true, notes: ["Spreadsheet styling is omitted."] } },
            html: { id: "xlsx-to-html", name: "HTML Table (.html)", targetExt: "html", chunkable: true, status: "SUPPORTED" },
            md:   { id: "xlsx-to-md",   name: "Markdown Table (.md)", targetExt: "md",   chunkable: true, status: "SUPPORTED" }
        },
        xls: {
            xlsx: { id: "xls-to-xlsx", name: "Excel Spreadsheet (.xlsx)", targetExt: "xlsx", chunkable: true, status: "SUPPORTED" },
            csv:  { id: "xls-to-csv",  name: "Comma Separated Values (.csv)", targetExt: "csv",  chunkable: true, status: "LOSSY", dataLoss: { possible: true, notes: ["Formatting and formulas are omitted."] } },
            json: { id: "xls-to-json", name: "JSON Array (.json)", targetExt: "json", chunkable: true, status: "LOSSY", dataLoss: { possible: true, notes: ["Formatting is omitted."] } },
            ods:  { id: "xls-to-ods",  name: "OpenDocument Spreadsheet (.ods)", targetExt: "ods", chunkable: true, status: "SUPPORTED" },
            html: { id: "xls-to-html", name: "HTML Table (.html)", targetExt: "html", chunkable: true, status: "SUPPORTED" }
        },
        ods: {
            xlsx: { id: "ods-to-xlsx", name: "Excel Spreadsheet (.xlsx)", targetExt: "xlsx", chunkable: true, status: "SUPPORTED" },
            csv:  { id: "ods-to-csv",  name: "Comma Separated Values (.csv)", targetExt: "csv",  chunkable: true, status: "LOSSY", dataLoss: { possible: true, notes: ["Formatting and formulas are omitted."] } },
            json: { id: "ods-to-json", name: "JSON Array (.json)", targetExt: "json", chunkable: true, status: "LOSSY", dataLoss: { possible: true, notes: ["Formatting is omitted."] } },
            html: { id: "ods-to-html", name: "HTML Table (.html)", targetExt: "html", chunkable: true, status: "SUPPORTED" }
        },
        xml: {
            xlsx: { id: "xml-to-xlsx", name: "Excel Spreadsheet (.xlsx)", targetExt: "xlsx", chunkable: true, status: "SUPPORTED" },
            csv:  { id: "xml-to-csv",  name: "Comma Separated Values (.csv)", targetExt: "csv",  chunkable: true, status: "SUPPORTED" },
            json: { id: "xml-to-json", name: "JSON Array (.json)", targetExt: "json", chunkable: true, status: "SUPPORTED" },
            sql:  { id: "xml-to-sql",  name: "SQL Insert Dump (.sql)", targetExt: "sql",  chunkable: true, status: "SUPPORTED" },
            yaml: { id: "xml-to-yaml", name: "YAML Document (.yaml)", targetExt: "yaml", chunkable: true, status: "SUPPORTED" }
        },
        sql: {
            xlsx: { id: "sql-to-xlsx", name: "Excel Spreadsheet (.xlsx)", targetExt: "xlsx", chunkable: true, status: "SUPPORTED" },
            csv:  { id: "sql-to-csv",  name: "Comma Separated Values (.csv)", targetExt: "csv",  chunkable: true, status: "SUPPORTED" },
            json: { id: "sql-to-json", name: "JSON Array (.json)", targetExt: "json", chunkable: true, status: "SUPPORTED" },
            xml:  { id: "sql-to-xml",  name: "XML Document (.xml)", targetExt: "xml",  chunkable: true, status: "SUPPORTED" }
        },
        yaml: {
            json: { id: "yaml-to-json", name: "JSON Array (.json)", targetExt: "json", chunkable: true, status: "SUPPORTED" },
            csv:  { id: "yaml-to-csv",  name: "Comma Separated Values (.csv)", targetExt: "csv",  chunkable: true, status: "SUPPORTED" },
            xlsx: { id: "yaml-to-xlsx", name: "Excel Spreadsheet (.xlsx)", targetExt: "xlsx", chunkable: true, status: "SUPPORTED" }
        },
        html: {
            xlsx: { id: "html-to-xlsx", name: "Excel Spreadsheet (.xlsx)", targetExt: "xlsx", chunkable: true, status: "SUPPORTED" },
            csv:  { id: "html-to-csv",  name: "Comma Separated Values (.csv)", targetExt: "csv",  chunkable: true, status: "SUPPORTED" },
            json: { id: "html-to-json", name: "JSON Array (.json)", targetExt: "json", chunkable: true, status: "SUPPORTED" }
        },
        md: {
            xlsx: { id: "md-to-xlsx", name: "Excel Spreadsheet (.xlsx)", targetExt: "xlsx", chunkable: true, status: "SUPPORTED" },
            csv:  { id: "md-to-csv",  name: "Comma Separated Values (.csv)", targetExt: "csv",  chunkable: true, status: "SUPPORTED" },
            json: { id: "md-to-json", name: "JSON Array (.json)", targetExt: "json", chunkable: true, status: "SUPPORTED" }
        }
    };

    /**
     * Get list of supported target formats for a detected source format
     * @param {string} sourceFormat 
     * @returns {Array<{ key: string, name: string, targetExt: string, chunkable: boolean }>}
     */
    static getSupportedTargets(sourceFormat) {
        if (!sourceFormat || !this.registry[sourceFormat]) {
            return [];
        }
        const targetsMap = this.registry[sourceFormat];
        return Object.keys(targetsMap).map(key => ({
            key,
            ...targetsMap[key]
        }));
    }

    /**
     * Check if a specific conversion path is supported
     * @param {string} sourceFormat 
     * @param {string} targetFormat 
     * @returns {boolean}
     */
    static isSupported(sourceFormat, targetFormat) {
        if (!sourceFormat || !targetFormat) return false;
        return Boolean(this.registry[sourceFormat] && this.registry[sourceFormat][targetFormat]);
    }

    /**
     * Get conversion metadata
     * @param {string} sourceFormat 
     * @param {string} targetFormat 
     * @returns {object|null}
     */
    static getConversionConfig(sourceFormat, targetFormat) {
        if (this.isSupported(sourceFormat, targetFormat)) {
            return this.registry[sourceFormat][targetFormat];
        }
        return null;
    }
}
