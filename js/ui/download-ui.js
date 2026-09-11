/**
 * Download UI Component
 * Renders final output download button, multi-part individual buttons, ZIP bundling button, and Data Integrity verification card.
 */
import { DownloadManager } from "../core/download-manager.js";
import { formatFileSize } from "../utils/size-utils.js";
import { escapeHTML } from "../utils/format-utils.js";

export class DownloadUI {
    constructor({ containerEl, summaryEl, fileListEl, integrityBadgeEl, resetBtnEl, onReset }) {
        this.containerEl = containerEl;
        this.summaryEl = summaryEl;
        this.fileListEl = fileListEl;
        this.integrityBadgeEl = integrityBadgeEl;
        this.resetBtnEl = resetBtnEl;
        this.onReset = onReset;

        this.currentFiles = [];
        this.originalFileName = "";

        if (this.resetBtnEl) {
            this.resetBtnEl.addEventListener("click", () => {
                if (typeof this.onReset === "function") this.onReset();
            });
        }
    }

    renderResults(conversionResult, originalFileName) {
        if (!conversionResult || !conversionResult.success || !this.containerEl) return;

        this.currentFiles = conversionResult.files || [];
        this.originalFileName = originalFileName || "converted";

        const { totalRows, writtenRows, totalParts, integrityPassed } = conversionResult.metadata || {};
        const isMultiPart = this.currentFiles.length > 1;

        // Data Integrity Verification Badge
        if (this.integrityBadgeEl) {
            const rowStr = totalRows ? totalRows.toLocaleString() : "0";
            const writtenStr = writtenRows ? writtenRows.toLocaleString() : rowStr;

            this.integrityBadgeEl.innerHTML = `
                <div class="integrity-card ${integrityPassed ? 'integrity-pass' : 'integrity-fail'}">
                    <div class="integrity-title">
                        <span>${integrityPassed ? '✓' : '⚠️'} Data Integrity Verification</span>
                        <strong class="status-pill">${integrityPassed ? 'PASSED' : 'FAILED'}</strong>
                    </div>
                    <div class="integrity-stats">
                        <span>Input Records: <strong>${rowStr}</strong></span>
                        <span>Processed: <strong>${rowStr}</strong></span>
                        <span>Written: <strong>${writtenStr}</strong></span>
                        <span>Export Files: <strong>${this.currentFiles.length}</strong></span>
                    </div>
                </div>
            `;
            this.integrityBadgeEl.classList.remove("hidden");
        }

        // Summary Text
        if (this.summaryEl) {
            let text = `Conversion completed. ${totalRows ? totalRows.toLocaleString() : "0"} records written safely.`;
            if (isMultiPart) {
                text += ` Split into ${this.currentFiles.length} safe Excel files (50,000 rows each) to prevent browser memory limitations.`;
            }
            this.summaryEl.textContent = text;
        }

        // Output File Download Cards & ZIP Button
        if (this.fileListEl) {
            this.fileListEl.innerHTML = "";

            // Download All (.zip) button if multi-part
            if (isMultiPart) {
                const zipCard = document.createElement("div");
                zipCard.style.marginBottom = "15px";
                zipCard.innerHTML = `
                    <button class="download-zip-button" type="button">
                        📦 Download All Parts (.zip)
                    </button>
                `;
                const zipBtn = zipCard.querySelector(".download-zip-button");
                zipBtn.addEventListener("click", () => {
                    DownloadManager.downloadAsZip(this.currentFiles, this.originalFileName);
                });
                this.fileListEl.appendChild(zipCard);
            }

            // Individual File Download Cards
            this.currentFiles.forEach((fileObj, idx) => {
                const card = document.createElement("div");
                card.className = "download-file-card";
                card.innerHTML = `
                    <div class="download-file-info">
                        <span class="file-icon">📄</span>
                        <div class="file-name-size">
                            <strong>${escapeHTML(fileObj.fileName)}</strong>
                            <span>${formatFileSize(fileObj.blob.size)}</span>
                        </div>
                    </div>
                    <button class="main-download-btn" type="button">
                        ⬇ Download ${isMultiPart ? `Part ${idx + 1}` : 'File'}
                    </button>
                `;

                const btn = card.querySelector(".main-download-btn");
                btn.addEventListener("click", () => {
                    DownloadManager.downloadSingleFile(fileObj.blob, fileObj.fileName);
                });

                this.fileListEl.appendChild(card);
            });
        }

        this.containerEl.classList.remove("hidden");
    }

    hide() {
        if (this.containerEl) this.containerEl.classList.add("hidden");
        if (this.integrityBadgeEl) this.integrityBadgeEl.classList.add("hidden");
        this.currentFiles = [];
    }

    show() {
        if (this.containerEl) this.containerEl.classList.remove("hidden");
    }
}
