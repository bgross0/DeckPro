# DeckPro Troubleshooting Guide

## Common Issues and Solutions

### Engine/Calculation Issues

#### Issue: "No valid structural solution found"

**Symptoms**: Structure generation fails, returns "FAIL" status

**Common Causes**:
1. **Deck too large for species/grade**: Span exceeds IRC limits
2. **Invalid input parameters**: Check required fields
3. **Conflicting constraints**: Cantilever requirements impossible to meet

**Solutions**:
```javascript
// Check input validation
const errors = validatePayload(inputData);
if (errors.length > 0) {
  console.log('Input errors:', errors);
}

// Try different species/grade
inputData.species_grade = 'DF #1'; // Higher grade
const result = computeStructure(inputData);

// Reduce deck size if span limits exceeded
inputData.width_ft = Math.min(inputData.width_ft, 20);
inputData.length_ft = Math.min(inputData.length_ft, 24);
```

**Prevention**:
- Validate inputs before calculation
- Use appropriate species/grade for deck size
- Check IRC span table limits

#### Issue: Posts not positioned under beams

**Symptoms**: Posts appear floating or offset from beam lines

**Root Cause**: This was a known bug that has been fixed in v1.0.0-beta.3

**Verification**:
```javascript
// Check post positions relative to beams
const result = computeStructure(deckConfig);
result.posts.forEach((post, i) => {
  console.log(`Post ${i+1}: x=${post.x}', y=${post.y}'`);
});

// For ledger deck, posts should be at y = deckWidth - cantilever
const expectedY = deckConfig.width_ft - result.joists.cantilever_ft;
console.log(`Expected beam position: y=${expectedY}'`);
```

**Solution**: Ensure you're using the latest version with post positioning fixes

#### Issue: Cantilever calculations seem incorrect

**Symptoms**: Cantilever distances violate IRC rules or seem excessive

**Verification**:
```javascript
const result = computeStructure(deckConfig);
const backSpan = result.joists.span_ft;
const cantilever = result.joists.cantilever_ft;
const ratio = cantilever / backSpan;

console.log(`Back-span: ${backSpan}', Cantilever: ${cantilever}'`);
console.log(`Ratio: ${ratio.toFixed(3)} (must be ≤ 0.25 per IRC)`);

if (ratio > 0.25) {
  console.error('IRC cantilever rule violated!');
}
```

**Solution**: The cantilever optimizer enforces IRC constraints. If seeing violations, check for calculation bugs or input validation issues.

#### Issue: Material takeoff missing items

**Symptoms**: Bill of materials incomplete or has zero quantities

**Common Causes**:
1. **Structure generation failed**: Check `result.status`
2. **Material database corrupted**: Verify materials.js loaded correctly
3. **Hardware calculation errors**: Check detailed takeoff generation

**Debugging**:
```javascript
const result = computeStructure(deckConfig);

console.log('Status:', result.status);
console.log('Material count:', result.material_takeoff.length);

// Check for missing categories
const categories = [...new Set(result.material_takeoff.map(item => item.category))];
console.log('Categories present:', categories);
// Should include: lumber, hardware, fasteners, footings

// Verify material database
console.log('Materials loaded:', typeof materials !== 'undefined');
console.log('Hardware items:', Object.keys(materials.hardware).length);
```

### UI/Interface Issues

#### Issue: Application won't load

**Symptoms**: Blank page, JavaScript errors in console

**Common Causes**:
1. **Script loading order**: Dependencies loaded incorrectly
2. **File path errors**: Missing or incorrect file references
3. **Syntax errors**: JavaScript parsing failures

**Debugging Steps**:
1. **Check Console**: Open browser dev tools (F12) and check console for errors
2. **Verify File Paths**: Ensure all script tags reference existing files
3. **Test Script Loading**: Use network tab to see if all files load successfully

**Script Loading Verification**:
```javascript
// In browser console, check if core objects exist
console.log('Engine loaded:', typeof computeStructure !== 'undefined');
console.log('Materials loaded:', typeof materials !== 'undefined');
console.log('Span tables loaded:', typeof spanTables !== 'undefined');
console.log('UI loaded:', typeof UIControls !== 'undefined');
```

#### Issue: Canvas not rendering

**Symptoms**: Drawing area appears blank

**Common Causes**:
1. **Canvas context issues**: HTML5 Canvas not supported
2. **Drawing surface initialization**: Failed to create drawing layers
3. **Canvas size problems**: Incorrect dimensions or styling

**Solutions**:
```javascript
// Check canvas support
const canvas = document.getElementById('deck-canvas');
const ctx = canvas.getContext('2d');
if (!ctx) {
  console.error('Canvas not supported');
}

// Verify canvas dimensions
console.log('Canvas size:', canvas.width, 'x', canvas.height);
console.log('Canvas style:', canvas.style.width, 'x', canvas.style.height);

// Test basic drawing
ctx.fillStyle = 'red';
ctx.fillRect(10, 10, 50, 50); // Should draw red square
```

#### Issue: UI controls not responding

**Symptoms**: Buttons don't work, input fields unresponsive

**Common Causes**:
1. **Event listeners not attached**: Controls setup failed
2. **DOM element IDs incorrect**: Mismatched element references
3. **JavaScript errors**: Preventing event handler execution

**Debugging**:
```javascript
// Check if UIControls initialized
console.log('UI Controls:', window.uiControls);

// Verify DOM elements exist
const button = document.getElementById('generate-btn');
console.log('Generate button:', button);

// Check event listeners
console.log('Event listeners count:', window.uiControls?.listeners?.length);
```

#### Issue: Tab switching not working

**Symptoms**: Clicking tabs doesn't switch panels

**Verification**:
```javascript
// Check if TabSwitchingUtils loaded
console.log('Tab utils loaded:', typeof TabSwitchingUtils !== 'undefined');

// Verify tab elements exist
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');
console.log('Tab buttons:', tabButtons.length);
console.log('Tab panels:', tabPanels.length);

// Check data attributes
tabButtons.forEach(btn => {
  console.log('Tab button:', btn.dataset.tab);
});
```

#### Issue: Modal dialogs not opening

**Symptoms**: Clicking modal triggers does nothing

**Solutions**:
```javascript
// Check modal utilities loaded
console.log('Modal utils loaded:', typeof ModalUtils !== 'undefined');

// Verify modal setup
ModalUtils.setupModal('test-modal', 'test-open-btn', 'test-close-btn');

// Check modal elements
const modal = document.getElementById('pricing-modal');
const openBtn = document.getElementById('pricing-settings-btn');
console.log('Modal exists:', !!modal);
console.log('Open button exists:', !!openBtn);
```

### Testing and Verification Issues

#### Issue: Verification scripts fail

**Symptoms**: Test scripts return errors or fail to run

**Common Solutions**:

**For Node.js environment issues**:
```bash
# Ensure you're in the src directory
cd src

# Check Node.js version
node --version  # Should be v14+ for modern JavaScript

# Run individual tests
node verify-engine-functionality.js
```

**For module loading issues in tests**:
```javascript
// Check if running in correct directory
console.log('Current directory:', process.cwd());
console.log('Expected file exists:', require('fs').existsSync('./js/engine/index.js'));
```

#### Issue: Engine integrity tests fail

**Symptoms**: Engine verification reports file corruption or missing methods

**Investigation**:
```bash
# Check file sizes
ls -la js/engine/
ls -la data/

# Verify key files exist and have reasonable sizes
wc -l js/ui/controls.js  # Should be ~800 lines
wc -l js/engine/index.js # Should be ~200+ lines
```

### Performance Issues

#### Issue: Slow calculation performance

**Symptoms**: Structure generation takes too long

**Common Causes**:
1. **Inefficient optimization**: Too many cantilever iterations
2. **Large deck sizes**: Complex calculations for big decks
3. **Debug logging**: Excessive console output

**Solutions**:
```javascript
// Disable debug logging for production
const urlParams = new URLSearchParams(window.location.search);
if (!urlParams.has('debug')) {
  console.log = () => {}; // Disable logging
}

// Use specific joist spacing to avoid optimization
inputData.forced_joist_spacing_in = 16;

// Simplify optimization goal
inputData.optimization_goal = 'cost'; // Faster than 'strength'
```

#### Issue: Canvas rendering slow

**Symptoms**: Drawing updates lag or stutter

**Solutions**:
```javascript
// Optimize canvas operations
const ctx = canvas.getContext('2d');

// Use requestAnimationFrame for smooth updates
function updateCanvas() {
  // Clear and redraw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStructure();
  
  // Schedule next frame if needed
  if (needsUpdate) {
    requestAnimationFrame(updateCanvas);
  }
}

// Reduce unnecessary redraws
let redrawScheduled = false;
function scheduleRedraw() {
  if (!redrawScheduled) {
    redrawScheduled = true;
    requestAnimationFrame(() => {
      updateCanvas();
      redrawScheduled = false;
    });
  }
}
```

### Data and Configuration Issues

#### Issue: Material costs seem incorrect

**Symptoms**: Unrealistic total costs or missing cost data

**Verification**:
```javascript
// Check materials database
console.log('Lumber costs:', materials.lumber);
console.log('Hardware costs:', Object.keys(materials.hardware).length);

// Verify cost calculations
const result = computeStructure(deckConfig);
const totalCost = result.material_takeoff.reduce((sum, item) => sum + (item.totalCost || 0), 0);
console.log('Total cost:', totalCost);

// Check individual item costs
result.material_takeoff.forEach(item => {
  if (item.totalCost === 0 || isNaN(item.totalCost)) {
    console.warn('Zero cost item:', item);
  }
});
```

#### Issue: Span table lookups failing

**Symptoms**: "Species unknown" errors or impossible spans

**Debugging**:
```javascript
// Check span tables loaded
console.log('Span tables loaded:', typeof spanTables !== 'undefined');
console.log('Available species:', Object.keys(spanTables.joists));

// Verify species format
const validSpecies = ['SPF #2', 'DF #1', 'HF #2', 'SP #2'];
console.log('Valid species:', validSpecies);

// Test span lookup
const species = 'SPF #2';
const size = '2x8';
const spacing = 16;
const allowableSpan = spanTables.joists[species][size][spacing];
console.log(`${species} ${size} @ ${spacing}": ${allowableSpan}' allowable`);
```

### Browser Compatibility Issues

#### Issue: Application not working in older browsers

**Symptoms**: JavaScript errors, missing features

**Requirements Check**:
```javascript
// Check for required features
const features = {
  canvas: !!document.createElement('canvas').getContext,
  es6: (() => { try { eval('const x = 1'); return true; } catch(e) { return false; } })(),
  fetch: typeof fetch !== 'undefined',
  arrow: (() => { try { eval('() => {}'); return true; } catch(e) { return false; } })()
};

console.log('Browser feature support:', features);
```

**Minimum Requirements**:
- Chrome 60+, Firefox 55+, Safari 10+, Edge 79+
- HTML5 Canvas support
- ES6 JavaScript (const, arrow functions, template literals)

### Deployment Issues

#### Issue: Application not working when hosted

**Symptoms**: Works locally but fails on web server

**Common Causes**:
1. **File path issues**: Relative paths broken
2. **CORS restrictions**: Local file access blocked
3. **MIME type issues**: JavaScript files not served correctly

**Solutions**:
```html
<!-- Ensure proper MIME types -->
<script type="text/javascript" src="js/engine/index.js"></script>

<!-- Use relative paths consistently -->
<script src="./js/engine/index.js"></script> <!-- with ./ -->
<!-- OR -->
<script src="js/engine/index.js"></script>    <!-- without ./ -->
```

**Server Configuration**:
- Ensure `.js` files served with `text/javascript` MIME type
- Enable CORS if needed for external resources
- Test with `python -m http.server` for local development

### Getting Help

#### Debug Information to Collect

When reporting issues, include:

1. **Browser Information**:
   ```javascript
   console.log('User Agent:', navigator.userAgent);
   console.log('Canvas support:', !!document.createElement('canvas').getContext);
   ```

2. **Application State**:
   ```javascript
   console.log('Engine loaded:', typeof computeStructure !== 'undefined');
   console.log('Current deck config:', store.getState());
   console.log('Last calculation result:', lastResult);
   ```

3. **Console Errors**: Copy any error messages from browser console

4. **Steps to Reproduce**: Exact sequence of actions that cause the issue

#### Verification Script Output

Run and include output from:
```bash
cd src
node verify-engine-functionality.js
node test-app-load.js
node verify-ui-functionality.js
```

#### Testing in Clean Environment

1. **Fresh Browser Session**: Clear cache and cookies
2. **Incognito/Private Mode**: Test without extensions
3. **Different Browser**: Verify cross-browser compatibility
4. **Local Server**: Test with `python -m http.server`

---

This troubleshooting guide covers the most common issues encountered with DeckPro. For additional support, refer to the development documentation or create detailed issue reports with the debugging information provided above.