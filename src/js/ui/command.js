class CommandStack {
  constructor(maxDepth = 20) {
    this.history = [];
    this.future = [];
    this.maxDepth = maxDepth;
  }
  
  execute(command) {
    const invertedCommand = command.apply();
    this.history.push(invertedCommand);
    this.future = [];
    
    if (this.history.length > this.maxDepth) {
      this.history.shift();
    }
  }
  
  undo() {
    logger.log('CommandStack.undo called. History length:', this.history.length);
    if (this.history.length === 0) return null;
    
    const command = this.history.pop();
    logger.log('Undoing command:', command.tag);
    const invertedCommand = command.apply();
    this.future.push(invertedCommand);
    return command;
  }
  
  redo() {
    if (this.future.length === 0) return null;
    
    const command = this.future.pop();
    const invertedCommand = command.apply();
    this.history.push(invertedCommand);
    return command;
  }
  
  clear() {
    this.history = [];
    this.future = [];
  }
  
  canUndo() {
    return this.history.length > 0;
  }
  
  canRedo() {
    return this.future.length > 0;
  }
}