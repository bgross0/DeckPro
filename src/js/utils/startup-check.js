// Startup verification to catch common issues early
function performStartupCheck() {
  const requiredClasses = [
    'Layer', 'DrawingSurface', 'GridLayer', 'FootprintLayer', 
    'JoistLayer', 'BeamLayer', 'DimensionLayer',
    'UIControls', 'HeaderControls', 'ToolControls', 'FormControls', 'ViewControls',
    'StructureRenderer', 'AutoSave', 'ToastManager'
  ];
  
  const requiredFunctions = [
    'computeStructure', 'logger', 'eventBus', 'createStore'
  ];
  
  const missingClasses = [];
  const missingFunctions = [];
  
  // Check classes
  requiredClasses.forEach(className => {
    if (typeof window[className] === 'undefined') {
      missingClasses.push(className);
    }
  });
  
  // Check functions
  requiredFunctions.forEach(funcName => {
    if (typeof window[funcName] === 'undefined') {
      missingFunctions.push(funcName);
    }
  });
  
  // Report issues
  if (missingClasses.length > 0) {
    console.error('Missing classes:', missingClasses.join(', '));
  }
  
  if (missingFunctions.length > 0) {
    console.error('Missing functions:', missingFunctions.join(', '));
  }
  
  // Check DOM elements
  const criticalElements = [
    'deck-canvas', 'generate-btn', 'rectangle-tool-btn', 'width-ft', 'length-ft'
  ];
  
  const missingElements = criticalElements.filter(id => !document.getElementById(id));
  
  if (missingElements.length > 0) {
    console.error('Missing DOM elements:', missingElements);
  }
  
  // Overall status
  const hasIssues = missingClasses.length > 0 || missingFunctions.length > 0 || missingElements.length > 0;
  
  if (hasIssues) {
    console.error('❌ Startup check failed - see errors above');
    return false;
  } else {
    console.log('✅ Startup check passed - all dependencies available');
    return true;
  }
}

// Run check when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', performStartupCheck);
} else {
  performStartupCheck();
}