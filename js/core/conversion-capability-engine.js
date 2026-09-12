/**
 * Conversion Capability Engine
 * Computes dynamically valid target formats based on source format, category,
 * structure analysis, and ConversionRegistry capabilities.
 */
import { ConversionRegistry } from "./conversion-registry.js";

export class ConversionCapabilityEngine {
    /**
     * Compute available target formats for a detected source file
     * @param {string} sourceFormat 
     * @param {object} [structureAnalysis] 
     * @returns {Array<{ key: string, name: string, targetExt: string, status: string, dataLoss?: object, disabledReason?: string }>}
     */
    static getCapabilities(sourceFormat, structureAnalysis = {}) {
        if (!sourceFormat || sourceFormat === "unknown") {
            return [];
        }

        const details = structureAnalysis.details || {};
        const targets = ConversionRegistry.getSupportedTargets(sourceFormat);

        // Check format-specific structural blockers
        if (sourceFormat === "html" && details.hasTableTag === false) {
            return []; // No <table> elements found in HTML
        }

        if (sourceFormat === "md" && details.hasMdTable === false) {
            return []; // No Markdown table syntax found
        }

        if (sourceFormat === "txt" && details.hasDelimiters === false) {
            return []; // Plain text is not delimited
        }

        return targets.map(target => {
            const copy = { ...target };

            // SQL Multi-table Handling
            if (sourceFormat === "sql" && details.tableCount > 1) {
                if (copy.targetExt === "xlsx" || copy.targetExt === "ods") {
                    copy.status = "SUPPORTED";
                    copy.dataLoss = { possible: false, notes: [`Contains ${details.tableCount} SQL tables. Generated spreadsheet will create a dedicated sheet tab for each table.`] };
                } else if (copy.targetExt === "csv" || copy.targetExt === "tsv") {
                    copy.status = "LOSSY";
                    copy.dataLoss = { possible: true, notes: [`Contains ${details.tableCount} SQL tables. CSV export will write the primary table ('${details.tableNames[0]}').`] };
                }
            }

            // JSON / XML Nesting Handling
            if ((sourceFormat === "json" && details.isNestedObj) || (sourceFormat === "xml" && details.hasRepeatingTags === false)) {
                if (copy.targetExt === "csv" || copy.targetExt === "tsv" || copy.targetExt === "xlsx") {
                    copy.status = "LOSSY";
                    copy.dataLoss = { possible: true, notes: ["Hierarchical data tree will be flattened into key-value record attributes."] };
                }
            }

            return copy;
        });
    }
}
