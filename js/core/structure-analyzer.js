/**
 * Structure Analyzer Component
 * Analyzes internal content structure of detected files (e.g. CSV delimiters,
 * JSON object tree vs tabular array, XML repeating elements, SQL multi-table INSERT statements, XLSX worksheets).
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
            return { isTabular: false, details: { hasTables: false } };
        }

        try {
            const slice = file.slice(0, Math.min(131072, file.size));
            const text = await slice.text();

            switch (format) {
                case "csv":
                case "tsv": {
                    const firstLine = text.split(/\r\n|\n|\r/)[0] || "";
                    const delimiter = firstLine.includes("\t") ? "\t" : (firstLine.includes(";") ? ";" : ",");
                    const hasDelimiters = firstLine.includes(",") || firstLine.includes(";") || firstLine.includes("\t");
                    return {
                        isTabular: hasDelimiters,
                        details: { delimiter, hasDelimiters }
                    };
                }

                case "json": {
                    const cleanText = text.trim();
                    const isArray = cleanText.startsWith("[");
                    let isNestedObj = false;
                    try {
                        const parsed = JSON.parse(text);
                        if (!Array.isArray(parsed) && typeof parsed === "object") {
                            isNestedObj = Object.values(parsed).some(v => typeof v === "object" && v !== null);
                        }
                    } catch {}
                    return {
                        isTabular: true,
                        details: { rootIsArray: isArray, isNestedObj }
                    };
                }

                case "xml": {
                    const hasTags = text.includes("<") && text.includes(">");
                    const hasRepeatingTags = /<(\w+)[\s>][\s\S]*?<\/\1>/i.test(text);
                    return {
                        isTabular: hasRepeatingTags,
                        details: { isXml: true, hasRepeatingTags }
                    };
                }

                case "sql": {
                    const insertMatches = text.match(/INSERT\s+INTO\s+[`"']?(\w+)[`"']?/gi) || [];
                    const tableNames = Array.from(new Set(insertMatches.map(m => m.replace(/INSERT\s+INTO\s+[`"']?/i, "").replace(/[`"']$/, ""))));
                    return {
                        isTabular: tableNames.length > 0,
                        details: { hasInsertStatements: tableNames.length > 0, tableCount: tableNames.length, tableNames }
                    };
                }

                case "html": {
                    const hasTableTag = /<table[\s>]/i.test(text);
                    return {
                        isTabular: hasTableTag,
                        details: { hasTableTag }
                    };
                }

                case "md": {
                    const hasMdTable = /^\s*\|.*\|.*\|\s*$/m.test(text);
                    return {
                        isTabular: hasMdTable,
                        details: { hasMdTable }
                    };
                }

                case "txt": {
                    const firstLine = text.split(/\r\n|\n|\r/)[0] || "";
                    const hasDelimiters = firstLine.includes(",") || firstLine.includes(";") || firstLine.includes("\t");
                    return {
                        isTabular: hasDelimiters,
                        details: { hasDelimiters }
                    };
                }

                case "xlsx":
                case "xls":
                case "ods":
                case "dbf":
                    return { isTabular: true, details: { hasTables: true } };

                default:
                    return { isTabular: false, details: { hasTables: false } };
            }
        } catch {
            return { isTabular: true, details: { hasTables: true } };
        }
    }
}
