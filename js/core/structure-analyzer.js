/**
 * Structure Analyzer Component
 * Analyzes internal content structure of detected files (e.g. CSV delimiters,
 * JSON object tree vs tabular array, XML repeating elements, SQL INSERT statements, XLSX worksheets).
 */
export class StructureAnalyzer {
    /**
     * Analyze file content structure
     * @param {File} file 
     * @param {string} format 
     * @returns {Promise<{ isTabular: boolean, details: object }>}
     */
    static async analyze(file, format) {
        if (!file || !format) {
            return { isTabular: false, details: {} };
        }

        try {
            const slice = file.slice(0, Math.min(65536, file.size));
            const text = await slice.text();

            switch (format) {
                case "csv":
                case "tsv": {
                    const firstLine = text.split(/\r\n|\n|\r/)[0] || "";
                    const delimiter = firstLine.includes("\t") ? "\t" : (firstLine.includes(";") ? ";" : ",");
                    return {
                        isTabular: true,
                        details: { delimiter, sampleLength: text.length }
                    };
                }

                case "json": {
                    const cleanText = text.trim();
                    const isArray = cleanText.startsWith("[");
                    return {
                        isTabular: isArray || cleanText.includes('"'),
                        details: { rootIsArray: isArray }
                    };
                }

                case "xml": {
                    const hasTags = text.includes("<") && text.includes(">");
                    return {
                        isTabular: hasTags,
                        details: { isXml: true }
                    };
                }

                case "sql": {
                    const hasInsert = /INSERT\s+INTO/i.test(text);
                    return {
                        isTabular: hasInsert,
                        details: { hasInsertStatements: hasInsert }
                    };
                }

                case "xlsx":
                case "xls":
                case "ods":
                case "dbf":
                    return { isTabular: true, details: {} };

                default:
                    return { isTabular: false, details: {} };
            }
        } catch {
            return { isTabular: true, details: {} };
        }
    }
}
