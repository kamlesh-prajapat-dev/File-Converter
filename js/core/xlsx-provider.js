/**
 * Centralized XLSX Library Provider
 * Resolves and guarantees availability of the local SheetJS (XLSX) library
 * across main thread, ES module workers, and classic workers.
 */
let cachedXLSX = null;

export async function getXLSX() {
    if (cachedXLSX) return cachedXLSX;

    const targetScope = typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : window);

    // 1. Check global scope (window, self, globalThis)
    if (targetScope.XLSX) {
        cachedXLSX = targetScope.XLSX;
        return cachedXLSX;
    }

    // 2. Try static ES import of local library
    try {
        await import("../../libraries/xlsx.full.min.js");
        if (targetScope.XLSX) {
            cachedXLSX = targetScope.XLSX;
            return cachedXLSX;
        }
    } catch (e) {
        console.warn("Static import of xlsx.full.min.js did not bind global XLSX:", e);
    }

    // 3. Scope-Bound Loader for ES Module Workers:
    // Fetch local libraries/xlsx.full.min.js and execute with `this`, `window`, `global`, `self` explicitly bound to targetScope
    if (typeof fetch === "function") {
        try {
            const libraryUrl = new URL("../../libraries/xlsx.full.min.js", import.meta.url);
            const response = await fetch(libraryUrl);
            if (response.ok) {
                const code = await response.text();
                
                // Scope wrapper forcing UMD check to attach XLSX to targetScope
                const wrapperCode = `
                    var window = self;
                    var global = self;
                    ${code};
                    return self.XLSX || this.XLSX || window.XLSX || globalThis.XLSX;
                `;

                const evaluator = new Function("self", "globalThis", wrapperCode);
                const loadedXLSX = evaluator.call(targetScope, targetScope, targetScope);

                if (loadedXLSX) {
                    targetScope.XLSX = loadedXLSX;
                    cachedXLSX = loadedXLSX;
                    return cachedXLSX;
                }
            }
        } catch (fetchErr) {
            console.error("Failed to load local XLSX library via fetch fallback:", fetchErr);
        }
    }

    if (targetScope.XLSX) {
        cachedXLSX = targetScope.XLSX;
        return cachedXLSX;
    }

    throw new Error("Excel processing library (XLSX) could not be loaded. Please ensure libraries/xlsx.full.min.js exists at the root libraries/ directory.");
}
