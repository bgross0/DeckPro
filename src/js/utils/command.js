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
    if (this.history.length === 0) return null;
    
    const command = this.history.pop();
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
}