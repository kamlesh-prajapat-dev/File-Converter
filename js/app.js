/**
 * Personal File Converter - Main Application Entry Point
 */
import { FileManager } from "./core/file-manager.js";
import { ProgressManager } from "./core/progress-manager.js";
import { ConversionManager } from "./core/conversion-manager.js";
import { UploadUI } from "./ui/upload-ui.js";
import { FileInfoUI } from "./ui/file-info-ui.js";
import { FormatSelectorUI } from "./ui/format-selector-ui.js";
import { ProgressUI } from "./ui/progress-ui.js";
import { StatusUI } from "./ui/status-ui.js";
import { DownloadUI } from "./ui/download-ui.js";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Core Services
    const fileManager = new FileManager();
    const progressManager = new ProgressManager();
    const conversionManager = new ConversionManager(progressManager);

    // 2. DOM Element References
    const dropAreaEl = document.getElementById("dropArea");
    const fileInputEl = document.getElementById("fileInput");
    const fileSectionEl = document.getElementById("fileSection");
    const fileNameEl = document.getElementById("fileName");
    const fileSizeEl = document.getElementById("fileSize");
    const formatBadgeEl = document.getElementById("formatBadge");
    const removeBtnEl = document.getElementById("removeButton");
    const warningBannerEl = document.getElementById("largeFileWarning");

    const formatSelectorSectionEl = document.getElementById("formatSelectorSection");
    const targetFormatSelectEl = document.getElementById("targetFormatSelect");

    const progressSectionEl = document.getElementById("progressSection");
    const progressFillEl = document.getElementById("progressFill");
    const progressPercentEl = document.getElementById("progressPercent");
    const progressTextEl = document.getElementById("progressText");
    const cancelBtnEl = document.getElementById("cancelButton");

    const statusEl = document.getElementById("status");
    const convertBtnEl = document.getElementById("convertButton");

    const downloadSectionEl = document.getElementById("downloadSection");
    const integrityBadgeEl = document.getElementById("integrityBadge");
    const downloadSummaryEl = document.getElementById("downloadSummary");
    const fileListEl = document.getElementById("downloadFileList");
    const resetBtnEl = document.getElementById("resetButton");

    // 3. UI Controllers
    const statusUI = new StatusUI({ containerEl: statusEl });

    const progressUI = new ProgressUI({
        containerEl: progressSectionEl,
        fillEl: progressFillEl,
        percentEl: progressPercentEl,
        textEl: progressTextEl,
        cancelBtnEl: cancelBtnEl,
        onCancel: () => {
            conversionManager.cancel();
            convertBtnEl.disabled = false;
            progressUI.hide();
        }
    });

    const formatSelectorUI = new FormatSelectorUI({
        containerEl: formatSelectorSectionEl,
        selectEl: targetFormatSelectEl,
        convertBtnEl: convertBtnEl,
        onFormatChanged: () => {
            statusUI.hide();
        }
    });

    const fileInfoUI = new FileInfoUI({
        containerEl: fileSectionEl,
        fileNameEl,
        fileSizeEl,
        formatBadgeEl,
        removeBtnEl,
        warningBannerEl,
        onRemove: resetApplicationState
    });

    const downloadUI = new DownloadUI({
        containerEl: downloadSectionEl,
        integrityBadgeEl,
        summaryEl: downloadSummaryEl,
        fileListEl,
        resetBtnEl,
        onReset: resetApplicationState
    });

    const uploadUI = new UploadUI({
        dropAreaEl,
        fileInputEl,
        onFileSelected: handleFileSelected
    });

    // Subscribe progress updates to progress UI
    progressManager.onProgress((percentage, message) => {
        progressUI.update(percentage, message);
    });

    // 4. File Selection Handler
    async function handleFileSelected(file) {
        statusUI.hide();
        downloadUI.hide();
        progressUI.hide();

        try {
            const detection = await fileManager.setFile(file);

            if (detection.format === "unknown") {
                statusUI.showError({
                    title: "Format Not Recognized",
                    reason: `Could not identify format of file '${file.name}'.`,
                    solution: "Please select a valid .dbf, .csv, or .json file."
                });
                return;
            }

            // Display file info and badge
            fileInfoUI.displayFile(file, detection);
            uploadUI.hide();

            // Populate valid target formats
            formatSelectorUI.populateTargets(detection.format);

        } catch (err) {
            statusUI.showError({
                title: "File Reading Error",
                reason: err.message,
                solution: "Make sure the file is readable and try again."
            });
        }
    }

    // 5. Convert Button Click Handler
    convertBtnEl.addEventListener("click", async () => {
        const file = fileManager.getFile();
        const sourceFormat = fileManager.getSourceFormat();
        const targetFormatKey = formatSelectorUI.getSelectedTarget();

        if (!file || !sourceFormat || !targetFormatKey) return;

        const targetFormat = targetFormatKey.split("-to-")[1] || targetFormatKey;

        // UI State for Conversion
        convertBtnEl.disabled = true;
        statusUI.hide();
        downloadUI.hide();
        progressUI.show();

        const result = await conversionManager.convert(file, sourceFormat, targetFormat);

        progressUI.hide();
        convertBtnEl.disabled = false;

        if (result.success) {
            statusUI.showSuccess("Conversion completed successfully!");
            downloadUI.renderResults(result, file.name);
            formatSelectorUI.hide();
            fileInfoUI.hide();
        } else if (result.error) {
            if (result.error.code === "CANCELLED") {
                statusUI.showInfo("Conversion was cancelled.");
            } else {
                statusUI.showError(result.error);
            }
        }
    });

    // 6. Reset Application State ("Convert Another File")
    function resetApplicationState() {
        fileManager.reset();
        progressManager.reset();
        uploadUI.reset();
        fileInfoUI.hide();
        formatSelectorUI.hide();
        progressUI.hide();
        statusUI.hide();
        downloadUI.hide();
        convertBtnEl.disabled = true;
    }
});
