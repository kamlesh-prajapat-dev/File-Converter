/**
 * Status UI Component
 * Displays user-friendly error banners and success messages (Reason + Solution).
 */
import { escapeHTML } from "../utils/format-utils.js";

export class StatusUI {
    constructor({ containerEl }) {
        this.containerEl = containerEl;
    }

    showError(errorObj) {
        if (!this.containerEl) return;

        const title = escapeHTML(errorObj.title || "Conversion Failed");
        const reason = escapeHTML(errorObj.reason || "An unknown error occurred.");
        const solution = escapeHTML(errorObj.solution || "Please check your file and try again.");
        const techDetails = errorObj.technicalDetails ? escapeHTML(errorObj.technicalDetails) : "";

        this.containerEl.className = "status-banner status-error";
        this.containerEl.innerHTML = `
            <div class="status-header-row">
                <span class="status-icon">⚠️</span>
                <strong>${title}</strong>
            </div>
            <div class="status-body">
                <p><strong>Reason:</strong> ${reason}</p>
                <p><strong>Solution:</strong> ${solution}</p>
                ${techDetails ? `
                    <details class="tech-details">
                        <summary>Technical Details</summary>
                        <code>${techDetails}</code>
                    </details>
                ` : ""}
            </div>
        `;
        this.containerEl.classList.remove("hidden");
    }

    showSuccess(message) {
        if (!this.containerEl) return;
        this.containerEl.className = "status-banner status-success";
        this.containerEl.innerHTML = `
            <div class="status-header-row">
                <span class="status-icon">✓</span>
                <strong>${escapeHTML(message)}</strong>
            </div>
        `;
        this.containerEl.classList.remove("hidden");
    }

    showInfo(message) {
        if (!this.containerEl) return;
        this.containerEl.className = "status-banner status-info";
        this.containerEl.innerHTML = `
            <div class="status-header-row">
                <span class="status-icon">ℹ️</span>
                <span>${escapeHTML(message)}</span>
            </div>
        `;
        this.containerEl.classList.remove("hidden");
    }

    hide() {
        if (this.containerEl) {
            this.containerEl.classList.add("hidden");
            this.containerEl.innerHTML = "";
        }
    }
}
