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
     * @returns {Array<{ key: string, name: string, targetExt: string, status: string, dataLoss?: object }>}
     */
    static getCapabilities(sourceFormat, structureAnalysis = {}) {
        if (!sourceFormat || sourceFormat === "unknown") {
            return [];
        }

        const targets = ConversionRegistry.getSupportedTargets(sourceFormat);

        // If file is not tabular, filter out strict table-only output targets if non-convertible
        if (structureAnalysis && structureAnalysis.isTabular === false) {
            return targets.filter(t => t.targetExt === "json" || t.targetExt === "txt");
        }

        return targets;
    }
}
