// tests/deals.test.js
import { getFilteredAndSortedDeals, fetchDeals, getDealById } from '../js/deals.js';
// Test helpers (assertEquals, assert, summarizeTests) are globally available from test-runner.html

console.log("--- Running deals.test.js ---");

// Mock rawDeals directly to avoid actual fetch and test logic synchronously
// This is a simplified version of the actual deals structure
const sampleRawDeals = [
    { id: 1, itemName: "Old Bread", businessName: "Bakery A", originalPrice: 20, discountedPrice: 10, bestBefore: "2024-01-01", category: "bakery", description: "Slightly old bread" },
    { id: 2, itemName: "Ripe Bananas", businessName: "Fruit Shop B", originalPrice: 30, discountedPrice: 15, bestBefore: "2024-01-03", category: "fruitveg", description: "Very ripe bananas" },
    { id: 3, itemName: "Fresh Milk", businessName: "Dairy C", originalPrice: 25, discountedPrice: 20, bestBefore: "2024-01-05", category: "dairy", description: "Fresh whole milk" },
    { id: 4, itemName: "Aged Cheese", businessName: "Dairy C", originalPrice: 100, discountedPrice: 50, bestBefore: "2024-01-02", category: "dairy", description: "Fine aged cheese" },
    { id: 5, itemName: "Day-Old Croissants", businessName: "Bakery A", originalPrice: 40, discountedPrice: 10, bestBefore: "2024-01-04", category: "bakery", description: "Yesterday's croissants" }
];

// Override the internal rawDeals used by the imported functions.
// This is a common technique for testing modules with internal state or dependencies.
// We need a way to set this internal state.
// The deals.js module doesn't export a setter for rawDeals.
// For this basic test setup, we'll have to rely on the fact that getFilteredAndSortedDeals
// uses the 'rawDeals' variable from its own module scope.
// A more robust solution would be to refactor deals.js to allow injection of deals for testing,
// or to export a function that allows setting them.
// For now, we'll assume that if we could "prime" it, this is how we'd test.
// The subtask cannot modify deals.js to add a setter.
// So, this test will *conceptually* test the logic assuming rawDeals is primed.
// The actual execution in test-runner.html won't work perfectly for getFilteredAndSortedDeals
// unless we simulate the fetchDeals behavior or modify deals.js.

// Let's create a wrapper or a way to test the pure logic part if possible.
// The current structure of deals.js makes getFilteredAndSortedDeals hard to test without fetching.
// We will focus on testing it by first "fetching" our sample data.

// Mock fetchDeals to use sampleRawDeals
let originalFetchDeals = globalThis.fetch; // Store original fetch if needed, though we're replacing module's fetch
globalThis.fetch = async (path) => {
    if (path === 'data/deals.json' || path === undefined) { // Path might be undefined if called from app.js init
        return {
            ok: true,
            json: async () => JSON.parse(JSON.stringify(sampleRawDeals)) // Return a deep copy
        };
    }
    return originalFetchDeals ? originalFetchDeals(path) : new Response('Not found', { status: 404 });
};


(async () => {
    // Prime the deals module with our sample data by calling the actual fetchDeals
    // which is now mocked to return our sample data.
    try {
        await fetchDeals('data/deals.json'); // This will now use the mocked fetch and populate internal rawDeals
        console.log("Mocked fetchDeals completed and rawDeals should be populated internally in deals.js");
    } catch (e) {
        console.error("Error during mocked fetchDeals:", e);
    }

    // --- Tests for getDealById (relies on fetchDeals having run) ---
    console.log("\n--- Testing getDealById ---");
    let deal = getDealById(3);
    assert(deal !== null && deal.id === 3 && deal.itemName === "Fresh Milk", "getDealById: Find existing deal (ID 3)");
    deal = getDealById(99);
    assertEquals(deal, undefined, "getDealById: Find non-existing deal (ID 99)");


    // --- Tests for Sorting (via getFilteredAndSortedDeals) ---
    console.log("\n--- Testing Sorting ---");
    let sortedDeals;

    // Price Ascending
    sortedDeals = getFilteredAndSortedDeals("", "all", "price-asc");
    assertEquals(sortedDeals.length, 5, "Sort Price Asc: Correct number of deals");
    if (sortedDeals.length === 5) {
        assertEquals(sortedDeals[0].id, 1, "Sort Price Asc: First deal ID is 1 (Price 10)");
        assertEquals(sortedDeals[1].id, 5, "Sort Price Asc: Second deal ID is 5 (Price 10)");
        assertEquals(sortedDeals[2].id, 2, "Sort Price Asc: Third deal ID is 2 (Price 15)");
        // Add more checks if needed
    }

    // Price Descending
    sortedDeals = getFilteredAndSortedDeals("", "all", "price-desc");
    assertEquals(sortedDeals.length, 5, "Sort Price Desc: Correct number of deals");
    if (sortedDeals.length === 5) {
        assertEquals(sortedDeals[0].id, 4, "Sort Price Desc: First deal ID is 4 (Price 50)");
        // Add more checks
    }

    // Ending Soon (by bestBefore date)
    // Dates: 1: 2024-01-01, 4: 2024-01-02, 2: 2024-01-03, 5: 2024-01-04, 3: 2024-01-05
    sortedDeals = getFilteredAndSortedDeals("", "all", "ending-soon");
    assertEquals(sortedDeals.length, 5, "Sort Ending Soon: Correct number of deals");
    if (sortedDeals.length === 5) {
        assertEquals(sortedDeals[0].id, 1, "Sort Ending Soon: First deal (2024-01-01)");
        assertEquals(sortedDeals[1].id, 4, "Sort Ending Soon: Second deal (2024-01-02)");
        assertEquals(sortedDeals[2].id, 2, "Sort Ending Soon: Third deal (2024-01-03)");
        assertEquals(sortedDeals[3].id, 5, "Sort Ending Soon: Fourth deal (2024-01-04)");
        assertEquals(sortedDeals[4].id, 3, "Sort Ending Soon: Fifth deal (2024-01-05)");
    }

    // Default Sort (should be original order or by ID if no other criteria)
    // Our sample deals are by ID, so this should hold.
    sortedDeals = getFilteredAndSortedDeals("", "all", "default");
    assertEquals(sortedDeals.length, 5, "Sort Default: Correct number of deals");
    if (sortedDeals.length > 0) {
         // Default sort in deals.js just returns a copy, so order isn't guaranteed unless it's ID based.
         // For this test, we'll assume it's stable based on the sample.
        assert(sortedDeals[0].id === 1 && sortedDeals[1].id === 2, "Sort Default: Check first few items by ID");
    }

    // --- Tests for Filtering ---
    console.log("\n--- Testing Filtering ---");
    let filteredDeals;

    // By Search Term
    filteredDeals = getFilteredAndSortedDeals("Bread", "all", "default");
    assertEquals(filteredDeals.length, 1, "Filter Search: 'Bread' - 1 match");
    if (filteredDeals.length === 1) assertEquals(filteredDeals[0].id, 1, "Filter Search: 'Bread' - correct item");

    filteredDeals = getFilteredAndSortedDeals("milk", "all", "default"); // Case-insensitive
    assertEquals(filteredDeals.length, 1, "Filter Search: 'milk' (lowercase) - 1 match");
    if (filteredDeals.length === 1) assertEquals(filteredDeals[0].id, 3, "Filter Search: 'milk' - correct item");

    filteredDeals = getFilteredAndSortedDeals("ripe", "all", "default"); // Matches description
    assertEquals(filteredDeals.length, 1, "Filter Search: 'ripe' (description) - 1 match");
    if (filteredDeals.length === 1) assertEquals(filteredDeals[0].id, 2, "Filter Search: 'ripe' - correct item (Bananas)");

    filteredDeals = getFilteredAndSortedDeals("Bakery A", "all", "default"); // Matches businessName
    assertEquals(filteredDeals.length, 2, "Filter Search: 'Bakery A' (business) - 2 matches");


    // By Category
    filteredDeals = getFilteredAndSortedDeals("", "bakery", "default");
    assertEquals(filteredDeals.length, 2, "Filter Category: 'bakery' - 2 matches");
    assert(filteredDeals.every(d => d.category === 'bakery'), "Filter Category: 'bakery' - all items are bakery");

    filteredDeals = getFilteredAndSortedDeals("", "dairy", "default");
    assertEquals(filteredDeals.length, 2, "Filter Category: 'dairy' - 2 matches");

    // Combined Filter and Sort
    console.log("\n--- Testing Combined Filter & Sort ---");
    filteredDeals = getFilteredAndSortedDeals("croissants", "bakery", "price-asc"); // Day-Old Croissants, price 10
    assertEquals(filteredDeals.length, 1, "Filter & Sort: 'croissants' in 'bakery', price asc - 1 match");
    if (filteredDeals.length === 1) {
        assertEquals(filteredDeals[0].id, 5, "Filter & Sort: Correct item (Croissants)");
    }

    filteredDeals = getFilteredAndSortedDeals("", "dairy", "price-desc"); // Milk (20), Cheese (50)
    assertEquals(filteredDeals.length, 2, "Filter & Sort: 'dairy', price desc - 2 matches");
    if (filteredDeals.length === 2) {
        assertEquals(filteredDeals[0].id, 4, "Filter & Sort: Dairy, price desc - First is Cheese (ID 4)");
        assertEquals(filteredDeals[1].id, 3, "Filter & Sort: Dairy, price desc - Second is Milk (ID 3)");
    }

    // No results
    filteredDeals = getFilteredAndSortedDeals("NonExistent", "all", "default");
    assertEquals(filteredDeals.length, 0, "Filter Search: No results - 0 matches");

    console.log("--- Finished deals.test.js ---");

    // Call summarizeTests from test-runner.html after all test files
    // If this is the last test file, you could call it here too.
    // For now, let test-runner.html handle the final summary.
    if (typeof summarizeTests === 'function' && window.location.pathname.includes('test-runner.html')) {
        // This is a bit of a hack to ensure it's called last if this is the only other test file.
        // The test-runner.html's load event is more reliable.
    }
})();

EOL
