/**
 * Format Selector UI Component
 * Dynamically updates available target formats based on capability registry.
 */
import { ConversionCapabilityEngine } from "../core/conversion-capability-engine.js";
import { ConversionRegistry } from "../core/conversion-registry.js";
import { escapeHTML } from "../utils/format-utils.js";

export class FormatSelectorUI {
    constructor({ containerEl, selectEl, convertBtnEl, lossyNoticeEl, onFormatChanged }) {
        this.containerEl = containerEl;
        this.selectEl = selectEl;
        this.convertBtnEl = convertBtnEl;
        this.lossyNoticeEl = lossyNoticeEl;
        this.onFormatChanged = onFormatChanged;
        this.currentSourceFormat = null;
        this.targetsMap = {};

        if (this.selectEl) {
            this.selectEl.addEventListener("change", () => {
                const selectedVal = this.selectEl.value;
                this.updateLossyNotice(selectedVal);
                if (typeof this.onFormatChanged === "function") {
                    this.onFormatChanged(selectedVal);
                }
            });
        }
    }

    populateTargets(sourceFormat, structureAnalysis = {}) {
        if (!this.selectEl) return;

        this.currentSourceFormat = sourceFormat;
        const supported = ConversionCapabilityEngine.getCapabilities(sourceFormat, structureAnalysis);
        this.selectEl.innerHTML = "";
        this.targetsMap = {};

        if (supported.length === 0) {
            this.selectEl.innerHTML = `<option value="">No supported conversion options available for this file</option>`;
            this.selectEl.disabled = true;
            if (this.convertBtnEl) this.convertBtnEl.disabled = true;
            if (this.lossyNoticeEl) this.lossyNoticeEl.classList.add("hidden");
            return;
        }

        supported.forEach((target, index) => {
            const opt = document.createElement("option");
            opt.value = target.key;
            opt.textContent = `${target.name}${target.status === "LOSSY" ? " ⚠️ (Lossy)" : ""}`;
            if (index === 0) opt.selected = true;
            this.selectEl.appendChild(opt);
            this.targetsMap[target.key] = target;
        });

        this.selectEl.disabled = false;
        if (this.convertBtnEl) this.convertBtnEl.disabled = false;
        if (this.containerEl) this.containerEl.classList.remove("hidden");

        const firstKey = supported[0].key;
        this.updateLossyNotice(firstKey);

        if (typeof this.onFormatChanged === "function" && supported.length > 0) {
            this.onFormatChanged(firstKey);
        }
    }

    updateLossyNotice(targetKey) {
        if (!this.lossyNoticeEl) return;

        const target = this.targetsMap[targetKey];
        if (target && target.status === "LOSSY" && target.dataLoss && target.dataLoss.notes) {
            this.lossyNoticeEl.innerHTML = `
                ⚠️ <strong>Conversion Notice:</strong> ${escapeHTML(target.dataLoss.notes.join(" "))}
            `;
            this.lossyNoticeEl.classList.remove("hidden");
        } else {
            this.lossyNoticeEl.classList.add("hidden");
        }
    }

    getSelectedTarget() {
        return this.selectEl ? this.selectEl.value : "";
    }

    hide() {
        if (this.containerEl) this.containerEl.classList.add("hidden");
        if (this.lossyNoticeEl) this.lossyNoticeEl.classList.add("hidden");
    }

    show() {
        if (this.containerEl) this.containerEl.classList.remove("hidden");
    }
}
