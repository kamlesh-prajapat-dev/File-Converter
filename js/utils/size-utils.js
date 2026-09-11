/**
 * Size Utility Functions
 */

/**
 * Format bytes into human readable string (e.g. 1.23 MB)
 * @param {number} bytes 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0 || isNaN(bytes)) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / Math.pow(k, i);
    return `${parseFloat(size.toFixed(dm))} ${sizes[i] || "Bytes"}`;
}
