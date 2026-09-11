/**
 * File Manager
 * Holds reference to current file, format detection metadata, and active state.
 */
import { FileDetector } from "./file-detector.js";

export class FileManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentFile = null;
        this.sourceFormat = null;
        this.extension = null;
        this.detectionConfidence = "none";
        this.dataMetadata = null; // { rowCount, columnCount, fieldNames }
    }

    /**
     * Set active file and run format detection
     * @param {File} file 
     * @returns {Promise<{ format: string, extension: string, name: string, confidence: string }>}
     */
    async setFile(file) {
        this.reset();
        this.currentFile = file;

        const detection = await FileDetector.detectFormat(file);
        this.sourceFormat = detection.format;
        this.extension = detection.extension;
        this.detectionConfidence = detection.confidence;

        return detection;
    }

    getFile() {
        return this.currentFile;
    }

    getSourceFormat() {
        return this.sourceFormat;
    }

    setMetadata(metadata) {
        this.dataMetadata = metadata;
    }

    getMetadata() {
        return this.dataMetadata;
    }
}
