/**
 * Universal Converter Engine
 * Orchestrates parsing, data normalization, output writing, integrity assertions,
 * and output validation across any source-to-target combination.
 */
import { BaseConverter } from "./base-converter.js";
import { DBFParser } from "./dbf/dbf-parser.js";
import { CSVParser } from "./csv/csv-parser.js";
import { JSONParser } from "./json/json-parser.js";
import { XLSXParser } from "./parsers/xlsx-parser.js";
import { XMLParser } from "./parsers/xml-parser.js";
import { SQLParser } from "./parsers/sql-parser.js";
import { YAMLParser } from "./parsers/yaml-parser.js";
import { TextParser } from "./parsers/text-parser.js";

import { SpreadsheetWriter } from "./writers/spreadsheet-writer.js";
import { CSVWriter } from "./writers/csv-writer.js";
import { JSONWriter } from "./writers/json-writer.js";
import { XMLWriter } from "./writers/xml-writer.js";
import { SQLWriter } from "./writers/sql-writer.js";
import { HTMLWriter } from "./writers/html-writer.js";
import { MarkdownWriter } from "./writers/markdown-writer.js";
import { YAMLWriter } from "./writers/yaml-writer.js";

import { OutputValidator } from "../core/output-validator.js";
import { getBaseFileName } from "../utils/file-utils.js";

export class UniversalConverter extends BaseConverter {
    /**
     * Execute conversion from sourceFormat to targetFormat
     * @param {ArrayBuffer|string} inputData 
     * @param {string} sourceFormat 
     * @param {string} targetFormat 
     * @param {object} options 
     * @param {function(number, string): void} onProgress 
     * @returns {Promise<object>}
     */
    static async convert(inputData, sourceFormat, targetFormat, options = {}, onProgress = () => {}) {
        const baseName = getBaseFileName(options.fileName || `converted.${sourceFormat}`);

        // 1. Step 1: Parse Source Data into Normalized Table Representation
        onProgress(10, `Parsing ${sourceFormat.toUpperCase()} file contents...`);
        const parsedData = await this.parseData(inputData, sourceFormat, onProgress);

        if (!parsedData || !parsedData.rows || parsedData.rows.length === 0) {
            throw new Error(`Parsed ${sourceFormat.toUpperCase()} contains no data records.`);
        }

        // 2. Step 2: Write Normalized Table into Target Format
        onProgress(30, `Converting into ${targetFormat.toUpperCase()} format...`);
        const result = await this.writeData(parsedData, targetFormat, baseName, onProgress);

        // 3. Step 3: Validate Output Blobs
        onProgress(95, "Running post-conversion output validation...");
        const validation = await OutputValidator.validateOutput(result, targetFormat);

        if (!validation.isValid) {
            throw new Error(`Output validation failed: ${validation.error}`);
        }

        onProgress(100, `Conversion completed successfully.`);
        return result;
    }

    /**
     * Parse source input using appropriate parser
     */
    static async parseData(inputData, sourceFormat, onProgress) {
        switch (sourceFormat) {
            case "dbf":
                return DBFParser.parse(inputData, onProgress);

            case "csv":
                return CSVParser.parse(inputData, onProgress);

            case "tsv":
                return CSVParser.parse(inputData, onProgress);

            case "json":
                return JSONParser.parse(inputData, onProgress);

            case "xlsx":
            case "xls":
            case "ods":
                return await XLSXParser.parse(inputData, onProgress);

            case "xml":
                return XMLParser.parse(inputData, onProgress);

            case "sql":
                return SQLParser.parse(inputData, onProgress);

            case "yaml":
                return YAMLParser.parse(inputData, onProgress);

            case "html":
                return TextParser.parse(inputData, "html", onProgress);

            case "md":
                return TextParser.parse(inputData, "md", onProgress);

            default:
                throw new Error(`No parser registered for format '${sourceFormat}'`);
        }
    }

    /**
     * Write normalized data using appropriate writer
     */
    static async writeData(parsedData, targetFormat, baseName, onProgress) {
        switch (targetFormat) {
            case "xlsx":
            case "ods":
                return await SpreadsheetWriter.write(parsedData, targetFormat, baseName, onProgress);

            case "csv":
            case "tsv":
                return await CSVWriter.write(parsedData, targetFormat, baseName, onProgress);

            case "json":
                return await JSONWriter.write(parsedData, targetFormat, baseName, onProgress);

            case "xml":
                return await XMLWriter.write(parsedData, targetFormat, baseName, onProgress);

            case "sql":
                return await SQLWriter.write(parsedData, targetFormat, baseName, onProgress);

            case "html":
                return await HTMLWriter.write(parsedData, targetFormat, baseName, onProgress);

            case "md":
                return await MarkdownWriter.write(parsedData, targetFormat, baseName, onProgress);

            case "yaml":
                return await YAMLWriter.write(parsedData, targetFormat, baseName, onProgress);

            default:
                throw new Error(`No writer registered for format '${targetFormat}'`);
        }
    }
}
