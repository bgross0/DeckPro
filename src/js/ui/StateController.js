// State Management Controller
window.StateController = class StateController {
  constructor(store, commandStack, uiUpdateCallback) {
    this.store = store;
    this.commandStack = commandStack;
    this.uiUpdateCallback = uiUpdateCallback;
  }

  executeCommand(type, data) {
    logger.log('Executing command:', type, data);
    const command = this.createCommand(type, data);
    this.commandStack.execute(command);
    if (this.uiUpdateCallback) {
      this.uiUpdateCallback();
    } else {
      this.updateUIFromState();
    }
  }
  
  createCommand(type, data) {
    const store = this.store;
    
    switch (type) {
      case 'setWidth':
        return {
          tag: 'setWidth',
          apply: () => {
            const oldState = store.getState();
            const oldWidth = oldState.footprint?.width_ft || 0;
            
            store.setState({
              footprint: oldState.footprint ? { ...oldState.footprint, width_ft: data.width_ft } : { width_ft: data.width_ft },
              context: { ...oldState.context, width_ft: data.width_ft }
            });
            
            return {
              tag: 'setWidth',
              apply: () => {
                const state = store.getState();
                store.setState({
                  footprint: { ...state.footprint, width_ft: oldWidth },
                  context: { ...state.context, width_ft: oldWidth }
                });
                return {
                  tag: 'setWidth',
                  apply: () => {
                    const newState = store.getState();
                    store.setState({
                      footprint: { ...newState.footprint, width_ft: data.width_ft },
                      context: { ...newState.context, width_ft: data.width_ft }
                    });
                  }
                };
              }
            };
          }
        };
        
      case 'setLength':
        return {
          tag: 'setLength',
          apply: () => {
            const oldState = store.getState();
            const oldLength = oldState.footprint.length_ft;
            
            store.setState({
              footprint: { ...oldState.footprint, length_ft: data.length_ft },
              context: { ...oldState.context, length_ft: data.length_ft }
            });
            
            return {
              tag: 'setLength',
              apply: () => {
                const state = store.getState();
                store.setState({
                  footprint: { ...state.footprint, length_ft: oldLength },
                  context: { ...state.context, length_ft: oldLength }
                });
                return {
                  tag: 'setLength',
                  apply: () => {
                    const newState = store.getState();
                    store.setState({
                      footprint: { ...newState.footprint, length_ft: data.length_ft },
                      context: { ...newState.context, length_ft: data.length_ft }
                    });
                  }
                };
              }
            };
          }
        };
        
      case 'setHeight':
        return {
          tag: 'setHeight',
          apply: () => {
            const oldState = store.getState();
            const oldHeight = oldState.context.height_ft;
            
            store.setState({
              context: { ...oldState.context, height_ft: data.height_ft }
            });
            
            return {
              tag: 'setHeight',
              apply: () => {
                const state = store.getState();
                store.setState({
                  context: { ...state.context, height_ft: oldHeight }
                });
                return {
                  tag: 'setHeight',
                  apply: () => {
                    const newState = store.getState();
                    store.setState({
                      context: { ...newState.context, height_ft: data.height_ft }
                    });
                  }
                };
              }
            };
          }
        };
        
      case 'setContext':
        return {
          tag: 'setContext',
          apply: () => {
            const oldState = store.getState();
            const oldContext = { ...oldState.context };
            
            store.setState({
              context: { ...oldState.context, ...data }
            });
            
            return {
              tag: 'setContext',
              apply: () => {
                const state = store.getState();
                store.setState({
                  context: oldContext
                });
                return {
                  tag: 'setContext',
                  apply: () => {
                    const newState = store.getState();
                    store.setState({
                      context: { ...newState.context, ...data }
                    });
                  }
                };
              }
            };
          }
        };

      case 'setFootprint':
        return {
          tag: 'setFootprint',
          apply: () => {
            const oldState = store.getState();
            const oldFootprint = oldState.footprint;
            
            store.setState({
              footprint: data.footprint
            });
            
            return {
              tag: 'setFootprint',
              apply: () => {
                const state = store.getState();
                store.setState({
                  footprint: oldFootprint
                });
                return {
                  tag: 'setFootprint',
                  apply: () => {
                    const newState = store.getState();
                    store.setState({
                      footprint: data.footprint
                    });
                  }
                };
              }
            };
          }
        };
        
      case 'setGridConfig':
        return {
          tag: 'setGridConfig',
          apply: () => {
            const oldState = store.getState();
            const oldValue = oldState.gridCfg[data.key];
            
            store.setState({
              gridCfg: { ...oldState.gridCfg, [data.key]: data.value }
            });
            
            return {
              tag: 'setGridConfig',
              apply: () => {
                const state = store.getState();
                store.setState({
                  gridCfg: { ...state.gridCfg, [data.key]: oldValue }
                });
                return {
                  tag: 'setGridConfig',
                  apply: () => {
                    const newState = store.getState();
                    store.setState({
                      gridCfg: { ...newState.gridCfg, [data.key]: data.value }
                    });
                  }
                };
              }
            };
          }
        };
        
      case 'clearFootprint':
        return {
          tag: 'clearFootprint',
          apply: () => {
            const oldState = store.getState();
            
            store.setState({
              footprint: null,
              engineOut: null
            });
            
            return {
              tag: 'clearFootprint',
              apply: () => {
                store.setState({
                  footprint: oldState.footprint,
                  engineOut: oldState.engineOut
                });
                return {
                  tag: 'clearFootprint',
                  apply: () => {
                    store.setState({
                      footprint: oldState.footprint,
                      engineOut: oldState.engineOut
                    });
                  }
                };
              }
            };
          }
        };
        
      default:
        throw new Error(`Unknown command type: ${type}`);
    }
  }
  
  updateUIFromState() {
    logger.log('Updating UI from state');
    const state = this.store.getState();
    
    // Update footprint inputs
    const widthInput = document.getElementById('width-ft');
    const lengthInput = document.getElementById('length-ft');
    
    if (widthInput && lengthInput) {
      if (state.footprint) {
        widthInput.value = state.footprint.width_ft || '';
        lengthInput.value = state.footprint.length_ft || '';
      } else {
        widthInput.value = '';
        lengthInput.value = '';
      }
    }
    
    // Update context inputs
    const heightInput = document.getElementById('height-ft');
    if (heightInput) {
      heightInput.value = state.context.height_ft;
    }
    
    // Update all context fields if elements exist
    const contextElements = {
      'attachment': state.context.attachment,
      'beam-style-outer': state.context.beam_style_outer || '',
      'beam-style-inner': state.context.beam_style_inner || '',
      'footing-type': state.context.footing_type,
      'species-grade': state.context.species_grade,
      'joist-spacing': state.context.forced_joist_spacing_in || '',
      'decking-type': state.context.decking_type,
      'optimization-goal': state.context.optimization_goal
    };
    
    Object.entries(contextElements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.value = value;
      }
    });
    
    // Update grid controls
    const gridVisible = document.getElementById('grid-visible');
    const gridSnap = document.getElementById('grid-snap');
    const gridSpacing = document.getElementById('grid-spacing');
    
    if (gridVisible) gridVisible.checked = state.gridCfg.visible;
    if (gridSnap) gridSnap.checked = state.gridCfg.snap;
    if (gridSpacing) gridSpacing.value = state.gridCfg.spacing_in;
    
    // Update generate button
    const generateBtn = document.getElementById('generate-btn');
    const generateHelpText = document.querySelector('#generate-btn + .help-text');
    if (generateBtn) {
      if (state.footprint && state.footprint.width_ft > 0 && state.footprint.length_ft > 0) {
        generateBtn.disabled = false;
        if (generateHelpText) {
          generateHelpText.textContent = 'Click to generate code-compliant structure';
        }
      } else {
        generateBtn.disabled = true;
        if (generateHelpText) {
          generateHelpText.textContent = 'Draw a footprint first to enable generation';
        }
      }
    }
  }

  // Helper method to create default footprint
  createDefaultFootprint(width_ft, length_ft) {
    // Set default dimensions if not provided
    width_ft = width_ft || 12;
    length_ft = length_ft || 12;
    
    // Get the canvas to calculate a good default position
    const canvas = document.getElementById('deck-canvas');
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Convert to world coordinates (requires drawingSurface reference)
    // This method may need drawingSurface passed in or accessed globally
    if (window.drawingSurface) {
      const worldPos = window.drawingSurface.toWorldCoords(centerX, centerY);
      const surface = window.drawingSurface;
      
      // Calculate origin to center the footprint
      const origin = {
        x: surface.pixelsToFeet(worldPos.x) - (width_ft / 2),
        y: surface.pixelsToFeet(worldPos.y) - (length_ft / 2)
      };
      
      return {
        origin: origin,
        width_ft: width_ft,
        length_ft: length_ft
      };
    }
    
    // Fallback if no drawing surface available
    return {
      origin: { x: 0, y: 0 },
      width_ft: width_ft,
      length_ft: length_ft
    };
  }
};