import { FileWriter } from './filewriter.js';
import { FileReader } from './filereader.js';
import { cloudManager } from '../core/cloud.js';
import { HistoryManager } from '../core/history.js';

class FileManager {
	constructor(board) {
		this.board = board;

		const urlParams = new URLSearchParams(window.location.search);
		this.fileId = urlParams.get('fileId');

		this.fileReader = new FileReader(board, this);
		this.fileWriter = new FileWriter(board, this);
		this.historyManager = new HistoryManager();

		this.updateFileTitle();
	}

	async updateFileTitle() {
		const fileTitleElement = document.getElementById('file-title');
		if (!fileTitleElement) return;

		const currentPath = window.location.pathname;
		const urlParams = new URLSearchParams(window.location.search);
		const fileIdFromUrl = urlParams.get('fileId');

		let fileNotLoaded = !this.fileId || (currentPath.endsWith('/app.html') && !fileIdFromUrl);
		if (fileNotLoaded) {
			fileTitleElement.textContent = 'Untitled';
			fileTitleElement.style.display = '';
			if (window.saveButton) window.saveButton.onFileStateChange(null);

			return;
		}

		const result = await cloudManager.updateFileTitle(this.fileId);
		if (window.saveButton) window.saveButton.onFileStateChange(this.fileId);
	}

	async saveState() {
		if (!this.historyManager.isRestoring) {
			this.historyManager.push(this.fileWriter.serializeState());
		}
		return await this.fileWriter.saveState();
	}

	initHistory() {
		this.historyManager.initialize(this.fileWriter.serializeState());
	}

	undo() {
		const stateStr = this.historyManager.undo();
		if (!stateStr) return;
		this.historyManager.isRestoring = true;
		this.fileReader.importData(stateStr, false);
		this.historyManager.isRestoring = false;
	}

	redo() {
		const stateStr = this.historyManager.redo();
		if (!stateStr) return;
		this.historyManager.isRestoring = true;
		this.fileReader.importData(stateStr, false);
		this.historyManager.isRestoring = false;
	}

	async loadState() {
		await this.fileReader.loadState();
		this.initHistory();
	}

	exportData() {
		return this.fileWriter.exportData();
	}

	importData(jsonData, shouldSave = true) {
		return this.fileReader.importData(jsonData, shouldSave);
	}

	async validateFileName(fileId, newName, userId) {
		const result = await cloudManager.validateFileName(fileId, newName);

		if (!result.success) {
			throw new Error(result.error);
		}

		return result.name;
	}

	async renameFile(fileId, newName) {
		const result = await cloudManager.renameFile(fileId, newName);

		if (!result.success) {
			throw new Error(result.error);
		}

		console.log(`File ${fileId} renamed to ${result.newName}`);

		if (this.fileId === fileId) {
			await this.updateFileTitle();
		}
	}

	async deleteFile(fileId) {
		if (!fileId) {
			throw new Error("File ID is required for deletion.");
		}

		const result = await cloudManager.deleteFileRecord(fileId);

		if (!result.success) {
			throw new Error(result.error);
		}

		console.log(`Successfully deleted file record for ID: ${fileId}`);
		if (!result.storageDeleted) {
			console.warn(`Storage deletion had issues but database deletion succeeded`);
		}

		if (this.fileId === fileId) {
			this.fileId = null;
			await this.updateFileTitle();
		}
	}
}

export { FileManager };
