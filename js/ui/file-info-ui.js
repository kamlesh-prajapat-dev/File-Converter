/**
 * File Info UI Component
 * Renders selected file details, format tag, size badge, and large file warnings.
 */
import { formatFileSize } from "../utils/size-utils.js";
import { escapeHTML } from "../utils/format-utils.js";
import { CONFIG } from "../config/config.js";

export class FileInfoUI {
    constructor({ containerEl, fileNameEl, fileSizeEl, formatBadgeEl, removeBtnEl, warningBannerEl, onRemove }) {
        this.containerEl = containerEl;
        this.fileNameEl = fileNameEl;
        this.fileSizeEl = fileSizeEl;
        this.formatBadgeEl = formatBadgeEl;
        this.removeBtnEl = removeBtnEl;
        this.warningBannerEl = warningBannerEl;
        this.onRemove = onRemove;

        if (this.removeBtnEl) {
            this.removeBtnEl.addEventListener("click", () => {
                if (typeof this.onRemove === "function") this.onRemove();
            });
        }
    }

    displayFile(file, detection) {
        if (!file || !this.containerEl) return;

        if (this.fileNameEl) this.fileNameEl.textContent = file.name;
        if (this.fileSizeEl) this.fileSizeEl.textContent = formatFileSize(file.size);

        if (this.formatBadgeEl) {
            const formatStr = (detection.format || "unknown").toUpperCase();
            this.formatBadgeEl.textContent = formatStr;
            this.formatBadgeEl.className = `format-badge badge-${formatStr.toLowerCase()}`;
        }

        // Show large file notice if file size exceeds threshold
        if (this.warningBannerEl) {
            if (file.size > CONFIG.LARGE_FILE_THRESHOLD_BYTES) {
                this.warningBannerEl.innerHTML = `
                    <div class="large-file-notice">
                        ⚡ <strong>Large File Detected (${formatFileSize(file.size)})</strong>: 
                        Output will automatically be split into multiple parts (50,000 rows each) to prevent browser memory issues.
                    </div>
                `;
                this.warningBannerEl.classList.remove("hidden");
            } else {
                this.warningBannerEl.classList.add("hidden");
            }
        }

        this.containerEl.classList.remove("hidden");
    }

    hide() {
        if (this.containerEl) this.containerEl.classList.add("hidden");
        if (this.warningBannerEl) this.warningBannerEl.classList.add("hidden");
    }
}
