/**
 * Progress UI Component
 * Progress bar, percentage text, current status message, and Cancel button.
 */
export class ProgressUI {
    constructor({ containerEl, fillEl, percentEl, textEl, cancelBtnEl, onCancel }) {
        this.containerEl = containerEl;
        this.fillEl = fillEl;
        this.percentEl = percentEl;
        this.textEl = textEl;
        this.cancelBtnEl = cancelBtnEl;
        this.onCancel = onCancel;

        if (this.cancelBtnEl) {
            this.cancelBtnEl.addEventListener("click", () => {
                if (typeof this.onCancel === "function") this.onCancel();
            });
        }
    }

    update(percentage, message) {
        const value = Math.max(0, Math.min(100, Math.round(percentage)));

        if (this.fillEl) this.fillEl.style.width = `${value}%`;
        if (this.percentEl) this.percentEl.textContent = `${value}%`;
        if (this.textEl) this.textEl.textContent = message || "Processing...";

        if (this.containerEl) this.containerEl.classList.remove("hidden");
    }

    hide() {
        if (this.containerEl) this.containerEl.classList.add("hidden");
    }

    show() {
        if (this.containerEl) this.containerEl.classList.remove("hidden");
    }
}
