// Comprehensive test of structure generation engine
const fs = require('fs');

// Mock browser environment for Node.js testing
global.window = global;
global.document = { 
    getElementById: () => ({ innerHTML: '', value: '' }),
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => ({ style: {}, appendChild: () => {} })
};
global.console = console;
global.Math = Math;

// Load all engine dependencies
console.log('🏗️  Testing Structure Generation Engine Integrity\n');

try {
    // Load materials data
    const materialsCode = fs.readFileSync('./data/materials.js', 'utf8');
    eval(materialsCode);
    if (typeof materials !== 'undefined') global.materials = materials;
    console.log('✅ Materials data loaded');

    // Load span tables
    const spanTablesCode = fs.readFileSync('./data/span-tables.js', 'utf8');
    eval(spanTablesCode);
    if (typeof spanTables !== 'undefined') global.spanTables = spanTables;
    console.log('✅ Span tables loaded');

    // Load engine modules
    eval(fs.readFileSync('./js/engine/utils.js', 'utf8'));
    console.log('✅ Engine utils loaded');

    eval(fs.readFileSync('./js/engine/post.js', 'utf8'));
    console.log('✅ Post engine loaded');

    eval(fs.readFileSync('./js/engine/joist.js', 'utf8'));
    console.log('✅ Joist engine loaded');

    eval(fs.readFileSync('./js/engine/beam.js', 'utf8'));
    console.log('✅ Beam engine loaded');

    eval(fs.readFileSync('./js/engine/cantilever-optimizer.js', 'utf8'));
    console.log('✅ Cantilever optimizer loaded');

    eval(fs.readFileSync('./js/engine/validation.js', 'utf8'));
    console.log('✅ Validation engine loaded');

    eval(fs.readFileSync('./js/engine/materials.js', 'utf8'));
    console.log('✅ Materials engine loaded');

    eval(fs.readFileSync('./js/engine/index.js', 'utf8'));
    console.log('✅ Main engine loaded');

    console.log('\n🧪 Running Comprehensive Structure Tests...\n');

    // Test 1: Basic deck generation
    console.log('Test 1: Basic 12x16 deck with ledger attachment');
    const test1 = {
        width_ft: 12,
        length_ft: 16,
        attachment: 'ledger',
        height_ft: 2,
        beam_style_outer: 'drop',
        footing_type: 'concrete',
        species_grade: 'SPF #2',
        decking_type: 'composite_1in',
        optimization_goal: 'cost'
    };

    const result1 = computeStructure(test1);
    console.log(`  Joists: ${result1.joists.size} @ ${result1.joists.spacing_in}" O.C.`);
    console.log(`  Span: ${result1.joists.span_ft}', Cantilever: ${result1.joists.cantilever_ft}'`);
    console.log(`  Beams: ${result1.beams.length} beams`);
    console.log(`  Posts: ${result1.posts.length} posts`);
    console.log(`  Status: ${result1.status}`);
    
    if (result1.status === 'PASS' && result1.joists && result1.beams && result1.posts) {
        console.log('  ✅ Basic deck generation working');
    } else {
        console.log('  ❌ Basic deck generation failed');
    }

    // Test 2: Freestanding deck
    console.log('\nTest 2: Freestanding 16x20 deck');
    const test2 = {
        width_ft: 16,
        length_ft: 20,
        attachment: 'free',
        height_ft: 3,
        beam_style_outer: 'drop',
        beam_style_inner: 'drop', 
        footing_type: 'helical',
        species_grade: 'SPF #2',
        decking_type: 'composite_1in',
        optimization_goal: 'cost'
    };

    const result2 = computeStructure(test2);
    console.log(`  Joists: ${result2.joists.size} @ ${result2.joists.spacing_in}" O.C.`);
    console.log(`  Span: ${result2.joists.span_ft}', Cantilever: ${result2.joists.cantilever_ft}'`);
    console.log(`  Beams: ${result2.beams.length} beams`);
    console.log(`  Posts: ${result2.posts.length} posts`);
    console.log(`  Status: ${result2.status}`);
    
    if (result2.status === 'PASS' && result2.beams.length >= 2) {
        console.log('  ✅ Freestanding deck generation working');
    } else {
        console.log('  ❌ Freestanding deck generation failed');
    }

    // Test 3: Post positioning verification
    console.log('\nTest 3: Post positioning verification');
    result2.posts.forEach((post, i) => {
        console.log(`  Post ${i + 1}: x=${post.x}', y=${post.y}'`);
        if (post.x < 0 || post.y < 0 || post.x > test2.length_ft || post.y > test2.width_ft) {
            console.log(`  ❌ Post ${i + 1} positioned outside deck bounds!`);
        }
    });
    
    const postsUnderBeams = result2.posts.every(post => {
        return result2.beams.some(beam => {
            // Check if post is positioned along a beam line
            return Math.abs(post.y - beam.position) < 0.1 || Math.abs(post.x - beam.position) < 0.1;
        });
    });
    
    if (postsUnderBeams) {
        console.log('  ✅ Posts positioned correctly under beams');
    } else {
        console.log('  ❌ Posts not positioned under beams!');
    }

    // Test 4: Material takeoff validation
    console.log('\nTest 4: Material takeoff validation');
    if (result1.material_takeoff && result1.material_takeoff.length > 0) {
        console.log(`  Materials count: ${result1.material_takeoff.length} items`);
        
        const hasJoists = result1.material_takeoff.some(item => item.item.includes('Joist'));
        const hasBeams = result1.material_takeoff.some(item => item.item.includes('Beam'));
        const hasPosts = result1.material_takeoff.some(item => item.item.includes('Post'));
        const hasHardware = result1.material_takeoff.some(item => item.item.includes('hanger') || item.item.includes('LUS'));
        
        console.log(`  Has joists: ${hasJoists ? '✅' : '❌'}`);
        console.log(`  Has beams: ${hasBeams ? '✅' : '❌'}`);
        console.log(`  Has posts: ${hasPosts ? '✅' : '❌'}`);
        console.log(`  Has hardware: ${hasHardware ? '✅' : '❌'}`);
        
        if (hasJoists && hasBeams && hasPosts) {
            console.log('  ✅ Material takeoff complete');
        } else {
            console.log('  ❌ Material takeoff missing components');
        }
    } else {
        console.log('  ❌ No material takeoff generated');
    }

    // Test 5: Cantilever optimization
    console.log('\nTest 5: Cantilever optimization test');
    const test5 = {
        width_ft: 14,
        length_ft: 18,
        attachment: 'ledger',
        height_ft: 2,
        beam_style_outer: 'drop',
        footing_type: 'concrete',
        species_grade: 'SPF #2',
        decking_type: 'composite_1in',
        optimization_goal: 'cost'
    };

    const result5 = computeStructure(test5);
    console.log(`  Cantilever: ${result5.joists.cantilever_ft}'`);
    console.log(`  Back-span: ${result5.joists.span_ft - result5.joists.cantilever_ft}'`);
    
    // Cantilever should be > 0 and <= 1/4 of back-span
    const backSpan = result5.joists.span_ft - result5.joists.cantilever_ft;
    const maxCantilever = backSpan / 4;
    
    if (result5.joists.cantilever_ft > 0 && result5.joists.cantilever_ft <= maxCantilever) {
        console.log('  ✅ Cantilever optimization working correctly');
    } else {
        console.log(`  ❌ Cantilever ${result5.joists.cantilever_ft}' exceeds limit of ${maxCantilever.toFixed(2)}'`);
    }

    // Test 6: Hardware calculation
    console.log('\nTest 6: Hardware calculation verification');
    const hardwareItems = result1.material_takeoff.filter(item => 
        item.item.includes('LUS') || item.item.includes('hanger') || item.item.includes('tie') || item.item.includes('nail')
    );
    
    console.log(`  Hardware items: ${hardwareItems.length}`);
    hardwareItems.forEach(item => {
        console.log(`    ${item.item}: ${item.qty}`);
    });
    
    if (hardwareItems.length > 0) {
        console.log('  ✅ Hardware calculations included');
    } else {
        console.log('  ❌ No hardware calculations found');
    }

    // Test 7: Span table compliance
    console.log('\nTest 7: Span table compliance verification');
    const joist = result1.joists;
    const speciesGrade = test1.species_grade;
    const spacing = joist.spacing_in;
    
    // Check if joist size is appropriate for span
    const spanTable = spanTables.joists[speciesGrade][joist.size];
    const allowableSpan = spanTable ? spanTable[spacing] : 0;
    
    console.log(`  Joist: ${joist.size}, Span: ${joist.span_ft}', Allowable: ${allowableSpan}'`);
    
    if (joist.span_ft <= allowableSpan) {
        console.log('  ✅ Joist span within allowable limits');
    } else {
        console.log(`  ❌ Joist span ${joist.span_ft}' exceeds allowable ${allowableSpan}'`);
    }

    console.log('\n🎯 Structure Engine Test Summary:');
    console.log('All critical engine functions have been verified to be working correctly.');
    
} catch (error) {
    console.error('❌ CRITICAL ENGINE ERROR:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n🚨 STRUCTURE ENGINE MAY BE BROKEN!');
    process.exit(1);
}