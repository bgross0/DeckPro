# DeckPro Test Suite

## Test Organization

### Verification Tests (`/verification/`)
**Purpose**: Production verification and system integrity checks

- `verify-engine-functionality.js` - Engine file integrity and structure validation
- `verify-ui-functionality.js` - UI component and module loading verification  
- `test-app-load.js` - Application loading and integration testing

**Usage**:
```bash
cd tests/verification
node verify-engine-functionality.js
node verify-ui-functionality.js
node test-app-load.js
```

### Development Tests (`/development/`)
**Purpose**: Development-time testing and debugging

- `test-*-extraction.js` - Individual utility module testing
- `test-post-cantilever-fixes.js` - Structural calculation verification
- `test-browser-integration.js` - Browser environment simulation

**Usage**:
```bash
cd tests/development
node test-modal-extraction.js
node test-tabswitching-extraction.js
# etc.
```

### Browser Tests (`/browser/`)
**Purpose**: In-browser testing and visualization

- `test-engine-browser.html` - Browser-based engine testing
- `test-extractions.html` - UI component extraction verification
- `test-structure-engine.js` - Comprehensive engine testing

**Usage**: Open HTML files in browser or run JS files in browser console

### Legacy Tests (`/engine/`, `/ui/`)
**Purpose**: Original test suite (maintained for compatibility)

- `engine/beam-simple.test.js` - Basic beam selection logic tests
- `engine/joist-simple.test.js` - Basic joist selection logic tests
- `engine/span-tables.test.js` - Tests for feet-inches conversion
- `engine/validation-simple.test.js` - Input validation tests

## Running Tests

### Quick Verification (Recommended)
```bash
# From project root
cd tests/verification
node verify-engine-functionality.js && echo "✅ Engine OK"
node verify-ui-functionality.js && echo "✅ UI OK"  
node test-app-load.js && echo "✅ Integration OK"
```

### Legacy Test Suite
```bash
cd src
npm test           # Run all legacy tests
npm test -- beam   # Run specific test file
```

### Manual Browser Testing
1. Start local server: `cd src && python -m http.server 8080`
2. Open test files in browser: `http://localhost:8080/../tests/browser/test-engine-browser.html`
3. Or use: `tests/run-basic-test.html` for simple checks

## Test Coverage

### Engine Coverage
- ✅ Structural calculations (joists, beams, posts)
- ✅ IRC compliance and span table lookups
- ✅ Cantilever optimization and constraints
- ✅ Material takeoff generation
- ✅ Input validation and error handling

### UI Coverage  
- ✅ Module loading and integration
- ✅ Utility function extraction verification
- ✅ Event handling and DOM manipulation
- ✅ State management and updates

### Integration Coverage
- ✅ End-to-end application workflow
- ✅ File integrity and dependency loading
- ✅ Cross-browser compatibility
- ✅ Performance and memory usage

## Key Testing Notes

### Span Table Issues Fixed
- Span tables use feet-inches notation (e.g., 11.10 = 11'-10" = 11.833 ft)
- Tests use simple mocks instead of complex browser module loading
- Focus on testing logic, not implementation details

### Post Placement Verification
- Posts must be positioned under beams at `deckWidth - cantilever`
- Cantilever constraints enforced: `cantilever ≤ 1/4 × backSpan`
- Beam calculations use back-span, not full deck width

## Test Development Guidelines

### Creating New Tests
1. **Verification Tests**: For production readiness checks
2. **Development Tests**: For feature development and debugging  
3. **Browser Tests**: For visual/interactive testing

### Test Naming Convention
- `verify-*.js` - Production verification
- `test-*.js` - Development testing
- `*-test.html` - Browser-based tests

### Best Practices
- Keep tests focused and independent
- Use descriptive names and clear output
- Include both positive and negative test cases
- Document expected behavior and edge cases
- Test structural accuracy, not just code correctness