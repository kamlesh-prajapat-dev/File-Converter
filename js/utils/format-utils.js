/**
 * Text and Formatting Utilities
 */

/**
 * Escape HTML to prevent XSS in UI rendering
 * @param {string} str 
 * @returns {string}
 */
export function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Format numbers with thousand separators
 * @param {number} num 
 * @returns {string}
 */
export function formatNumber(num) {
    if (typeof num !== "number" || isNaN(num)) return "0";
    return num.toLocaleString();
}
