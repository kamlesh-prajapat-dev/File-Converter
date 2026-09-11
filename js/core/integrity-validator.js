/**
 * Data Integrity Validator
 * Enforces strict verification: inputRecords === processedRecords === writtenRecords
 * Prevents silent data loss.
 */
import { ErrorManager, ERROR_CODES } from "./error-manager.js";

export class IntegrityValidator {
    constructor() {
        this.reset();
    }

    reset() {
        this.inputRecords = 0;
        this.processedRecords = 0;
        this.writtenRecords = 0;
        this.checkpoints = [];
    }

    setInputRecords(count) {
        this.inputRecords = count || 0;
    }

    addCheckpoint(checkpoint) {
        // checkpoint: { chunkIndex, startRecord, endRecord, expectedRecords, processedRecords, writtenRecords }
        this.checkpoints.push(checkpoint);
        this.processedRecords += (checkpoint.processedRecords || 0);
        this.writtenRecords += (checkpoint.writtenRecords || 0);
    }

    validate() {
        const inputMatchesProcessed = this.inputRecords === this.processedRecords;
        const processedMatchesWritten = this.processedRecords === this.writtenRecords;
        const isValid = inputMatchesProcessed && processedMatchesWritten;

        const result = {
            isValid,
            stats: {
                inputRecords: this.inputRecords,
                processedRecords: this.processedRecords,
                writtenRecords: this.writtenRecords,
                checkpointsCount: this.checkpoints.length
            }
        };

        if (!isValid) {
            result.error = ErrorManager.createError(
                ERROR_CODES.INTEGRITY_CHECK_FAILED,
                `Data integrity check failed! Expected ${this.inputRecords.toLocaleString()} records, but processed ${this.processedRecords.toLocaleString()} and wrote ${this.writtenRecords.toLocaleString()}.`
            );
        }

        return result;
    }
}
