/**
 * Download Manager
 * Triggers single file downloads, individual multi-part downloads, or JSZip archive generation.
 */
import { CONFIG } from "../config/config.js";
import { getBaseFileName, sanitizeFileName } from "../utils/file-utils.js";

export class DownloadManager {
    /**
     * Trigger browser download for a single Blob
     * @param {Blob} blob 
     * @param {string} fileName 
     */
    static downloadSingleFile(blob, fileName) {
        const safeName = sanitizeFileName(fileName);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = safeName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    /**
     * Trigger downloads for all files in result set sequentially
     * @param {Array<{ blob: Blob, fileName: string }>} files 
     */
    static downloadAllIndividual(files) {
        if (!files || !Array.isArray(files)) return;
        files.forEach((fileObj, index) => {
            setTimeout(() => {
                this.downloadSingleFile(fileObj.blob, fileObj.fileName);
            }, index * 300);
        });
    }

    /**
     * Create a ZIP file of all generated parts using JSZip
     * @param {Array<{ blob: Blob, fileName: string }>} files 
     * @param {string} originalFileName 
     * @param {function(number): void} [onProgress]
     * @returns {Promise<void>}
     */
    static async downloadAsZip(files, originalFileName, onProgress) {
        if (!files || files.length === 0) return;

        if (typeof window.JSZip === "undefined") {
            // Fallback if JSZip fails to load: download individually
            this.downloadAllIndividual(files);
            return;
        }

        const zip = new window.JSZip();
        files.forEach(f => {
            zip.file(f.fileName, f.blob);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
            if (onProgress && typeof onProgress === "function") {
                onProgress(metadata.percent);
            }
        });

        const zipName = `${getBaseFileName(originalFileName)}_converted_parts.zip`;
        this.downloadSingleFile(zipBlob, zipName);
    }
}
