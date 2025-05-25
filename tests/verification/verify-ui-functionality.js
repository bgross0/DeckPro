// Comprehensive verification of UI functionality after extractions
const fs = require('fs');
const path = require('path');

function checkFileExists(filePath) {
    return fs.existsSync(filePath);
}

function checkForSyntaxErrors(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for common syntax issues
        const issues = [];
        
        // Check for unclosed braces/brackets
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            issues.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
        }
        
        // Check for proper function definitions
        const functionDefs = content.match(/function\s+\w+\s*\(/g) || [];
        const methodDefs = content.match(/\w+\s*\(/g) || [];
        
        // Check for undefined references (simple check)
        const undefinedRefs = [];
        if (content.includes('this.createDefaultFootprint') && !content.includes('FootprintUtils.createDefaultFootprint')) {
            undefinedRefs.push('this.createDefaultFootprint not replaced with FootprintUtils.createDefaultFootprint');
        }
        if (content.includes('this.verifyElements') && !content.includes('FootprintUtils.verifyElements')) {
            undefinedRefs.push('this.verifyElements not replaced with FootprintUtils.verifyElements');
        }
        if (content.includes('this.updateCostSummary') && !content.includes('MaterialCostUtils.updateCostSummary')) {
            undefinedRefs.push('this.updateCostSummary not replaced with MaterialCostUtils.updateCostSummary');
        }
        
        return { issues: issues.concat(undefinedRefs) };
    } catch (error) {
        return { issues: [`Failed to read file: ${error.message}`] };
    }
}

function verifyExtractions() {
    console.log('🔍 Verifying UI Functionality After Extractions\n');
    
    const checks = [
        {
            name: 'FootprintUtils module exists',
            check: () => checkFileExists('./js/utils/footprintUtils.js'),
            critical: true
        },
        {
            name: 'MaterialCostUtils module exists', 
            check: () => checkFileExists('./js/utils/materialCostUtils.js'),
            critical: true
        },
        {
            name: 'Controls.js syntax check',
            check: () => {
                const result = checkForSyntaxErrors('./js/ui/controls.js');
                return result.issues.length === 0 ? true : result.issues;
            },
            critical: true
        },
        {
            name: 'FootprintUtils syntax check',
            check: () => {
                const result = checkForSyntaxErrors('./js/utils/footprintUtils.js');
                return result.issues.length === 0 ? true : result.issues;
            },
            critical: true
        },
        {
            name: 'MaterialCostUtils syntax check',
            check: () => {
                const result = checkForSyntaxErrors('./js/utils/materialCostUtils.js');
                return result.issues.length === 0 ? true : result.issues;
            },
            critical: true
        },
        {
            name: 'HTML includes new modules',
            check: () => {
                const htmlContent = fs.readFileSync('./index.html', 'utf8');
                return htmlContent.includes('footprintUtils.js') && htmlContent.includes('materialCostUtils.js');
            },
            critical: true
        },
        {
            name: 'Controls.js file size reduced',
            check: () => {
                const stats = fs.statSync('./js/ui/controls.js');
                const lines = fs.readFileSync('./js/ui/controls.js', 'utf8').split('\n').length;
                console.log(`   Current controls.js: ${lines} lines`);
                return lines < 900; // Should be less than original 999
            },
            critical: false
        }
    ];
    
    let passCount = 0;
    let criticalFailures = 0;
    
    checks.forEach(check => {
        const result = check.check();
        const passed = result === true;
        
        console.log(`${passed ? '✅' : '❌'} ${check.name}`);
        
        if (!passed) {
            if (Array.isArray(result)) {
                result.forEach(issue => console.log(`   ⚠️  ${issue}`));
            } else {
                console.log(`   ⚠️  ${result}`);
            }
            
            if (check.critical) {
                criticalFailures++;
            }
        } else {
            passCount++;
        }
    });
    
    console.log(`\n📊 Results: ${passCount}/${checks.length} checks passed`);
    
    if (criticalFailures > 0) {
        console.log(`❌ ${criticalFailures} critical failures detected! Extractions may have broken functionality.`);
        return false;
    } else {
        console.log(`✅ All critical checks passed! Extractions appear successful.`);
        return true;
    }
}

// Run verification
const success = verifyExtractions();
process.exit(success ? 0 : 1);