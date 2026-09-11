/**
 * Browser Capability and Environment Checks
 */

/**
 * Check if Web Workers are supported
 * @returns {boolean}
 */
export function isWorkerSupported() {
    return typeof window !== "undefined" && typeof window.Worker !== "undefined";
}

/**
 * Check if File API & Blob URLs are supported
 * @returns {boolean}
 */
export function isFileApiSupported() {
    return (
        typeof window !== "undefined" &&
        typeof window.File !== "undefined" &&
        typeof window.FileReader !== "undefined" &&
        typeof window.Blob !== "undefined" &&
        typeof URL !== "undefined" &&
        typeof URL.createObjectURL === "function"
    );
}

/**
 * Estimate available JS memory limit (if performance.memory is available)
 * @returns {{ jsHeapSizeLimit: number | null, usedJSHeapSize: number | null }}
 */
export function getMemoryInfo() {
    if (typeof performance !== "undefined" && performance.memory) {
        return {
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            usedJSHeapSize: performance.memory.usedJSHeapSize
        };
    }
    return { jsHeapSizeLimit: null, usedJSHeapSize: null };
}
