/**
 * Upload UI Component
 * Handles drag-and-drop file upload zone and file input element.
 */
export class UploadUI {
    constructor({ dropAreaEl, fileInputEl, onFileSelected }) {
        this.dropAreaEl = dropAreaEl;
        this.fileInputEl = fileInputEl;
        this.onFileSelected = onFileSelected;

        this.init();
    }

    init() {
        if (!this.dropAreaEl || !this.fileInputEl) return;

        // Browse button file selection
        this.fileInputEl.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file && typeof this.onFileSelected === "function") {
                this.onFileSelected(file);
            }
        });

        // Drag and drop events
        ["dragenter", "dragover"].forEach(eventName => {
            this.dropAreaEl.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.dropAreaEl.classList.add("drag-over");
            }, false);
        });

        ["dragleave", "drop"].forEach(eventName => {
            this.dropAreaEl.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.dropAreaEl.classList.remove("drag-over");
            }, false);
        });

        this.dropAreaEl.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            if (file && typeof this.onFileSelected === "function") {
                this.onFileSelected(file);
            }
        });
    }

    reset() {
        if (this.fileInputEl) {
            this.fileInputEl.value = "";
        }
        if (this.dropAreaEl) {
            this.dropAreaEl.classList.remove("hidden");
        }
    }

    hide() {
        if (this.dropAreaEl) {
            this.dropAreaEl.classList.add("hidden");
        }
    }

    show() {
        if (this.dropAreaEl) {
            this.dropAreaEl.classList.remove("hidden");
        }
    }
}
