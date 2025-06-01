// tests/test-helpers.js
// Very simple test helpers

let testsRun = 0;
let testsPassed = 0;
const testResults = [];

function assertEquals(actual, expected, message) {
    testsRun++;
    if (actual === expected) {
        testsPassed++;
        testResults.push({ name: message, pass: true });
        console.log(`%cPASS: ${message}`, 'color: green;');
    } else {
        testResults.push({ name: message, pass: false, expected: expected, actual: actual });
        console.error(`FAIL: ${message}`);
        console.error(`  Expected: ${expected}`);
        console.error(`  Actual:   ${actual}`);
    }
}

function assert(condition, message) {
    testsRun++;
    if (condition) {
        testsPassed++;
        testResults.push({ name: message, pass: true });
        console.log(`%cPASS: ${message}`, 'color: green;');
    } else {
        testResults.push({ name: message, pass: false, expected: true, actual: condition });
        console.error(`FAIL: ${message}`);
        console.error(`  Expected condition to be true, but got false.`);
    }
}

function summarizeTests() {
    console.log("\n--- Test Summary ---");
    testResults.forEach(result => {
        if (result.pass) {
            console.log(`%c✔ ${result.name}`, 'color: green;');
        } else {
            console.log(`%c✘ ${result.name} (Expected: ${result.expected}, Got: ${result.actual})`, 'color: red;');
        }
    });
    console.log(`
${testsPassed} of ${testsRun} tests passed.`);

    // Optional: Display summary on the page if an element with id "testSummary" exists
    const summaryElement = document.getElementById('testSummary');
    if (summaryElement) {
        summaryElement.innerHTML = `<h3>Test Results:</h3>`;
        const list = document.createElement('ul');
        testResults.forEach(result => {
            const item = document.createElement('li');
            item.textContent = `${result.pass ? '✔' : '✘'} ${result.name}`;
            item.style.color = result.pass ? 'green' : 'red';
            if (!result.pass) {
                item.textContent += ` (Expected: ${result.expected}, Got: ${result.actual})`;
            }
            list.appendChild(item);
        });
        summaryElement.appendChild(list);
        const overall = document.createElement('p');
        overall.textContent = `${testsPassed} of ${testsRun} tests passed.`;
        summaryElement.appendChild(overall);
        if (testsPassed === testsRun) {
            summaryElement.style.border = '2px solid green';
        } else {
            summaryElement.style.border = '2px solid red';
        }
        summaryElement.style.padding = '10px';
        summaryElement.style.backgroundColor = '#f9f9f9';
    }

    if (testsPassed !== testsRun) {
        console.error(`${testsRun - testsPassed} tests failed.`);
    } else {
        console.log("%cAll tests passed!", "color: green; font-weight: bold;");
    }
}

// Automatically summarize when the window loads, if this script is the last one.
// Or, test files can call summarizeTests() explicitly.
// window.addEventListener('load', summarizeTests); // Better to call explicitly from test runner
