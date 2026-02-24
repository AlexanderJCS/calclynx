class HistoryManager {
	constructor() {
		this.states = [];
		this.currentIndex = -1;
		this.maxStates = 50;
		this.isRestoring = false;
	}

	initialize(stateStr) {
		this.states = [stateStr];
		this.currentIndex = 0;
	}

	push(stateStr) {
		if (this.currentIndex < this.states.length - 1) {
			this.states = this.states.slice(0, this.currentIndex + 1);
		}
		this.states.push(stateStr);
		if (this.states.length > this.maxStates) {
			this.states.shift();
		} else {
			this.currentIndex++;
		}
	}

	undo() {
		if (!this.canUndo()) return null;
		this.currentIndex--;
		return this.states[this.currentIndex];
	}

	redo() {
		if (!this.canRedo()) return null;
		this.currentIndex++;
		return this.states[this.currentIndex];
	}

	canUndo() {
		return this.currentIndex > 0;
	}

	canRedo() {
		return this.currentIndex < this.states.length - 1;
	}
}

export { HistoryManager };
