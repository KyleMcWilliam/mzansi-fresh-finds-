const fs = require('fs');
const path = require('path');

describe('Product Page Specific Adjustments', () => {
    let productsHtmlContent = '';
    let productsCssContent = '';

    beforeAll(() => {
        // Resolve paths relative to the project root
        // Assuming the script is run from the project root or tests/ directory
        // Adjust path if necessary based on actual execution context of tests
        const productsHtmlPath = path.resolve(__dirname, '../products.html');
        const productsCssPath = path.resolve(__dirname, '../css/products.css');

        try {
            productsHtmlContent = fs.readFileSync(productsHtmlPath, 'utf8');
        } catch (err) {
            console.error('Error reading products.html for tests:', err);
            // productsHtmlContent will remain empty, causing relevant test to fail
        }

        try {
            productsCssContent = fs.readFileSync(productsCssPath, 'utf8');
        } catch (err) {
            console.error('Error reading css/products.css for tests:', err);
            // productsCssContent will remain empty, causing relevant test to fail
        }
    });

    test('products.html should include Google Fonts link', () => {
        if (!productsHtmlContent) {
            throw new Error('products.html content is not available for testing.');
        }
        expect(productsHtmlContent).toContain('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&family=Poppins:wght@400;600;700&display=swap');
    });

    test('css/products.css should include .site-header padding override', () => {
        if (!productsCssContent) {
            throw new Error('css/products.css content is not available for testing.');
        }
        // Normalize whitespace and check for the rule.
        // This makes the test less brittle to exact spacing.
        const expectedCssRule = `
   .site-header {
       padding-top: var(--space-lg);
       padding-bottom: var(--space-lg);
   }
        `.replace(/\s+/g, ' ').trim();
        const actualCssContentNormalized = productsCssContent.replace(/\s+/g, ' ').trim();
        expect(actualCssContentNormalized).toContain(expectedCssRule.substring(0, expectedCssRule.indexOf('{')).trim()); // Check for selector
        expect(actualCssContentNormalized).toContain('padding-top: var(--space-lg);');
        expect(actualCssContentNormalized).toContain('padding-bottom: var(--space-lg);');
    });
});
