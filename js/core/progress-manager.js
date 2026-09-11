/**
 * Progress Manager
 * Event listener pattern for tracking progress during file conversion.
 * Features progress throttling to prevent UI thread stutter.
 */
import { CONFIG } from "../config/config.js";

export class ProgressManager {
    constructor() {
        this.listeners = [];
        this.currentPercentage = 0;
        this.currentMessage = "";
        this.lastUpdateTimestamp = 0;
        this.throttleMs = CONFIG.PROGRESS_THROTTLE_MS || 100;
    }

    onProgress(callback) {
        if (typeof callback === "function") {
            this.listeners.push(callback);
        }
    }

    /**
     * Update progress state (throttled)
     * @param {number} percentage (0 to 100)
     * @param {string} message 
     * @param {boolean} [forceImmediate] Force instant notification for 0% and 100%
     */
    update(percentage, message, forceImmediate = false) {
        this.currentPercentage = Math.max(0, Math.min(100, Math.round(percentage)));
        this.currentMessage = message || "";

        const now = Date.now();
        if (forceImmediate || this.currentPercentage === 0 || this.currentPercentage === 100 || (now - this.lastUpdateTimestamp >= this.throttleMs)) {
            this.lastUpdateTimestamp = now;
            this.listeners.forEach(fn => fn(this.currentPercentage, this.currentMessage));
        }
    }

    reset() {
        this.currentPercentage = 0;
        this.currentMessage = "";
        this.lastUpdateTimestamp = 0;
    }
}
