import {
    loadCart,
    addItemToCart,
    removeItemFromCart,
    updateItemQuantity,
    getCart,
    clearCart,
    calculateCartTotal
} from './cart.js';

// --- Test Suite ---
console.log("--- Starting Cart Logic Test Suite ---");

let assertionsPassed = 0;
let assertionsFailed = 0;

// Helper for assertions
function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
        assertionsPassed++;
    } else {
        console.error(`❌ FAIL: ${message}`);
        assertionsFailed++;
    }
}

function assertDeepEqual(actual, expected, message) {
    const actualJSON = JSON.stringify(actual);
    const expectedJSON = JSON.stringify(expected);
    if (actualJSON === expectedJSON) {
        console.log(`✅ PASS: ${message} (Actual: ${actualJSON})`);
        assertionsPassed++;
    } else {
        console.error(`❌ FAIL: ${message} (Expected: ${expectedJSON}, Actual: ${actualJSON})`);
        assertionsFailed++;
    }
}

function printTestSection(name) {
    console.log(`\n--- Test Section: ${name} ---`);
}

// --- Test Scenarios ---

// Before starting, ensure a clean slate for localStorage for this test run.
// In a real test environment, this might be done in a setup/beforeEach block.
localStorage.removeItem('shoppingCart'); // Ensure clean state for tests

printTestSection("A. Initial State");
loadCart(); // Critical to initialize the cart system from a potentially empty localStorage
assertDeepEqual(getCart(), [], "Initial cart should be empty after loadCart.");
assert(calculateCartTotal() === 0, "Initial cart total should be 0.");

printTestSection("B. Adding Items");
const product1 = { id: 'deal1', name: 'Apples', price: 10.00 };
const product2 = { id: 'deal2', name: 'Bread', price: 20.50 };

addItemToCart(product1, 2);
assertDeepEqual(getCart(), [{ productId: 'deal1', name: 'Apples', price: 10.00, quantity: 2 }], "Cart should contain product1 (qty 2).");
assert(calculateCartTotal() === 20.00, "Cart total should be 20.00 after adding product1.");

addItemToCart(product2, 1);
const cartAfterAddingP2 = getCart();
assert(cartAfterAddingP2.length === 2, "Cart should contain two items after adding product2.");
// Check product1 specifically
const p1InCart = cartAfterAddingP2.find(item => item.productId === 'deal1');
assertDeepEqual(p1InCart, { productId: 'deal1', name: 'Apples', price: 10.00, quantity: 2 }, "Product1 details should be correct.");
// Check product2 specifically
const p2InCart = cartAfterAddingP2.find(item => item.productId === 'deal2');
assertDeepEqual(p2InCart, { productId: 'deal2', name: 'Bread', price: 20.50, quantity: 1 }, "Product2 details should be correct.");
assert(calculateCartTotal() === 40.50, "Cart total should be 40.50 after adding product2.");

addItemToCart(product1, 3); // Add more of product1
const cartAfterAddingMoreP1 = getCart();
const p1UpdatedInCart = cartAfterAddingMoreP1.find(item => item.productId === 'deal1');
assert(p1UpdatedInCart.quantity === 5, "Product1 quantity should be 5 after adding more.");
const p2StillInCart = cartAfterAddingMoreP1.find(item => item.productId === 'deal2');
assert(p2StillInCart.quantity === 1, "Product2 quantity should still be 1.");
assert(calculateCartTotal() === 70.50, "Cart total should be 70.50 after adding more product1 (5*10 + 1*20.50).");

printTestSection("C. Updating Quantity");
updateItemQuantity('deal1', 1);
const cartAfterUpdateP1Qty = getCart();
const p1QtyUpdated = cartAfterUpdateP1Qty.find(item => item.productId === 'deal1');
assert(p1QtyUpdated.quantity === 1, "Product1 quantity should be updated to 1.");
assert(calculateCartTotal() === 30.50, "Cart total should be 30.50 after updating product1 quantity (1*10 + 1*20.50).");

updateItemQuantity('deal2', 0); // Should remove product2
const cartAfterP2QtyZero = getCart();
assert(cartAfterP2QtyZero.length === 1, "Cart should contain only one item after setting product2 quantity to 0.");
assert(cartAfterP2QtyZero.find(item => item.productId === 'deal2') === undefined, "Product2 should be removed from cart.");
assert(calculateCartTotal() === 10.00, "Cart total should be 10.00 (only product1 qty 1).");

// Save state before testing non-existent update
const cartStateBeforeNonExistentUpdate = JSON.parse(JSON.stringify(getCart())); // Deep copy
const totalBeforeNonExistentUpdate = calculateCartTotal();
updateItemQuantity('nonexistent-id', 5);
assertDeepEqual(getCart(), cartStateBeforeNonExistentUpdate, "Cart should not change after trying to update non-existent item.");
assert(calculateCartTotal() === totalBeforeNonExistentUpdate, "Cart total should not change after trying to update non-existent item.");


printTestSection("D. Removing Items");
// Re-add product2 to have multiple items for removal test
addItemToCart(product2, 3); // Cart: p1 (qty 1 @ 10), p2 (qty 3 @ 20.50)
// Expected total: 10 + (3 * 20.50) = 10 + 61.50 = 71.50
assert(calculateCartTotal() === 71.50, "Cart total should be 71.50 before removal test.");


removeItemFromCart('deal1');
const cartAfterRemovingP1 = getCart();
assert(cartAfterRemovingP1.length === 1, "Cart should contain one item after removing product1.");
assert(cartAfterRemovingP1.find(item => item.productId === 'deal1') === undefined, "Product1 should be removed.");
assert(cartAfterRemovingP1[0].productId === 'deal2' && cartAfterRemovingP1[0].quantity === 3, "Product2 (qty 3) should remain.");
assert(calculateCartTotal() === 61.50, "Cart total should be 61.50 (3 * 20.50) after removing product1.");

// Save state before testing non-existent removal
const cartStateBeforeNonExistentRemove = JSON.parse(JSON.stringify(getCart())); // Deep copy
const totalBeforeNonExistentRemove = calculateCartTotal();
removeItemFromCart('nonexistent-id');
assertDeepEqual(getCart(), cartStateBeforeNonExistentRemove, "Cart should not change after trying to remove non-existent item.");
assert(calculateCartTotal() === totalBeforeNonExistentRemove, "Cart total should not change after trying to remove non-existent item.");

printTestSection("E. Clearing Cart");
clearCart();
assertDeepEqual(getCart(), [], "Cart should be empty after clearCart().");
assert(calculateCartTotal() === 0, "Cart total should be 0 after clearCart().");

printTestSection("F. Persistence (Simulated)");
addItemToCart(product1, 1); // Cart: p1 (qty 1)
assert(getCart().length === 1, "Cart has 1 item before simulated reload.");

loadCart(); // Simulate page reload - cart reloads from localStorage
const cartAfterReload = getCart();
assert(cartAfterReload.length === 1, "Cart should still contain one item after loadCart() (persistence).");
assert(cartAfterReload[0].productId === 'deal1' && cartAfterReload[0].quantity === 1, "The item should be product1 with quantity 1.");
assert(calculateCartTotal() === 10.00, "Cart total should be 10.00 after persistence test.");

// Clean up at the end
clearCart();
console.log("\n--- Cart Logic Test Suite Finished ---");
console.log(`--- Summary: ${assertionsPassed} Passed, ${assertionsFailed} Failed ---`);

if (assertionsFailed > 0) {
    console.error("THERE WERE TEST FAILURES!");
} else {
    console.log("All cart logic tests passed successfully!");
}

// To make this runnable in a Node.js environment with a localStorage mock:
// 1. npm install localstorage-polyfill (or other mock)
// 2. At the top of this file, add:
//    if (typeof localStorage === 'undefined' || localStorage === null) {
//      require('localstorage-polyfill');
//      global.localStorage = localStorage; // Or window.localStorage = localStorage if testing browser-like env
//    }
// 3. You might need to adjust the import path for './cart.js' if running from a different directory structure.
//    For example, if cart.js is in the same directory and you run `node test-cart-logic.js` from there.
//    Ensure cart.js uses ES module exports (export { ... }) and this file uses ES module imports.
//    Node.js supports ES modules natively (usually files ending in .mjs or with "type": "module" in package.json).
//    Alternatively, transpile to CommonJS for Node if not using ESM.

// For browser:
// 1. Ensure cart.js and test-cart-logic.js are served by a web server (or use file:/// with browser flags).
// 2. In an HTML file, include them as modules:
//    <script type="module" src="cart.js"></script>
//    <script type="module" src="test-cart-logic.js"></script>
// 3. Open the browser's developer console to see the output.
// Note: The CustomEvent dispatch in cart.js is a browser-specific feature and would error in Node without a mock.
// However, these logical tests focus on cart data manipulation and calculations, not eventing.
// If testing eventing, a more browser-like environment (e.g. Jest with JSDOM) is needed.
// For this subtask, the core logic is what's being tested. The `dispatchCartUpdateEvent` in cart.js will simply
// be ignored (or potentially error if `document` is not defined) if run directly in Node without DOM mocks,
// but it won't affect the pass/fail status of these specific data-oriented assertions.
// For the purpose of this subtask, we assume cart.js is loaded and its functions are available.
// The `localStorage.removeItem('shoppingCart')` at the beginning is crucial for test isolation.
// The `loadCart()` call at the beginning of "Initial State" ensures the cart internal variable is initialized from this cleared state.
// The `loadCart()` in "Persistence" tests that data written by `addItemToCart` (which calls `saveCart`) is correctly reloaded.
