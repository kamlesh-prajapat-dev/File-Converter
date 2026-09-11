/**
 * Format Selector UI Component
 * Dynamically updates available target formats based on capability registry.
 */
import { ConversionRegistry } from "../core/conversion-registry.js";
import { escapeHTML } from "../utils/format-utils.js";

export class FormatSelectorUI {
    constructor({ containerEl, selectEl, convertBtnEl, onFormatChanged }) {
        this.containerEl = containerEl;
        this.selectEl = selectEl;
        this.convertBtnEl = convertBtnEl;
        this.onFormatChanged = onFormatChanged;

        if (this.selectEl) {
            this.selectEl.addEventListener("change", () => {
                const selectedVal = this.selectEl.value;
                if (typeof this.onFormatChanged === "function") {
                    this.onFormatChanged(selectedVal);
                }
            });
        }
    }

    populateTargets(sourceFormat) {
        if (!this.selectEl) return;

        const supported = ConversionRegistry.getSupportedTargets(sourceFormat);
        this.selectEl.innerHTML = "";

        if (supported.length === 0) {
            this.selectEl.innerHTML = `<option value="">No supported conversion targets</option>`;
            this.selectEl.disabled = true;
            if (this.convertBtnEl) this.convertBtnEl.disabled = true;
            return;
        }

        supported.forEach((target, index) => {
            const opt = document.createElement("option");
            opt.value = target.key;
            opt.textContent = target.name;
            if (index === 0) opt.selected = true;
            this.selectEl.appendChild(opt);
        });

        this.selectEl.disabled = false;
        if (this.convertBtnEl) this.convertBtnEl.disabled = false;
        if (this.containerEl) this.containerEl.classList.remove("hidden");

        // Notify initial selected format
        if (typeof this.onFormatChanged === "function" && supported.length > 0) {
            this.onFormatChanged(supported[0].key);
        }
    }

    getSelectedTarget() {
        return this.selectEl ? this.selectEl.value : "";
    }

    hide() {
        if (this.containerEl) this.containerEl.classList.add("hidden");
    }

    show() {
        if (this.containerEl) this.containerEl.classList.remove("hidden");
    }
}
