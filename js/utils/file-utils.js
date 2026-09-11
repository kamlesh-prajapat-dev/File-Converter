/**
 * File Utility Functions
 */

/**
 * Get extension from filename in lowercase without dot
 * @param {string} fileName 
 * @returns {string}
 */
export function getFileExtension(fileName) {
    if (!fileName || typeof fileName !== "string") return "";
    const parts = fileName.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase().trim() : "";
}

/**
 * Get base name without extension
 * @param {string} fileName 
 * @returns {string}
 */
export function getBaseFileName(fileName) {
    if (!fileName || typeof fileName !== "string") return "output";
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) return fileName;
    return fileName.substring(0, lastDotIndex);
}

/**
 * Sanitize filename to prevent security issues or broken download links
 * @param {string} fileName 
 * @returns {string}
 */
export function sanitizeFileName(fileName) {
    if (!fileName) return "file";
    return fileName.replace(/[/\\?%*:|"<>]/g, "_").trim();
}

/**
 * Read the first N bytes of a file as a Uint8Array
 * @param {File} file 
 * @param {number} bytesToRead 
 * @returns {Promise<Uint8Array>}
 */
export async function readHeaderBytes(file, bytesToRead = 64) {
    const slice = file.slice(0, Math.min(bytesToRead, file.size));
    const buffer = await slice.arrayBuffer();
    return new Uint8Array(buffer);
}
