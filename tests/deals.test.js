// tests/deals.test.js
import { fetchDeals } from '../js/deals.js';
// Test helpers (assertEquals, assert, summarizeTests) are globally available from test-runner.html

console.log("--- Running deals.test.js (New API-focused tests) ---");

// --- Mocking globalThis.fetch ---
let originalGlobalFetch = globalThis.fetch;
let mockFetchCallArgs;
let mockFetchResponse;
let mockFetchShouldReject = false;
let mockFetchRejectionError;

globalThis.fetch = async (url, options) => {
    mockFetchCallArgs = { url: url.toString(), options }; // url might be a URL object
    console.log(`Mock fetch called with URL: ${mockFetchCallArgs.url}`);

    if (mockFetchShouldReject) {
        return Promise.reject(mockFetchRejectionError || new Error("Simulated Network Error"));
    }
    return Promise.resolve(mockFetchResponse);
};

function setFetchMock(response, shouldReject = false, rejectionError = null) {
    mockFetchResponse = response;
    mockFetchShouldReject = shouldReject;
    mockFetchRejectionError = rejectionError;
}

function resetFetchMock() {
    mockFetchCallArgs = null;
    mockFetchResponse = null;
    mockFetchShouldReject = false;
    mockFetchRejectionError = null;
}
// --- End Mocking ---

(async () => {
    // --- Test Case 1: Basic call with no parameters ---
    console.log("\n--- Testing fetchDeals with no parameters ---");
    resetFetchMock();
    setFetchMock({
        ok: true,
        json: async () => ({ success: true, count: 1, data: [{ _id: '1', itemName: 'Test Deal 1' }] })
    });

    try {
        const deals = await fetchDeals({});
        assertEquals(mockFetchCallArgs.url, `${window.location.origin}/api/deals`, "Test Case 1: Fetch URL is correct (no params)");
        assert(Array.isArray(deals), "Test Case 1: Returned data is an array");
        assertEquals(deals.length, 1, "Test Case 1: Returned one deal");
        assertEquals(deals[0].itemName, "Test Deal 1", "Test Case 1: Deal content is correct");
    } catch (e) {
        assert(false, `Test Case 1 Failed: ${e.message}`);
    }

    // --- Test Case 2: Call with various query parameters ---
    console.log("\n--- Testing fetchDeals with query parameters ---");
    resetFetchMock();
    const queryParams = {
        category: 'bakery',
        sortBy: 'expiry',
        latitude: '10.123',
        longitude: '-20.456',
        radius: '5',
        someEmptyParam: '' // Should be ignored
    };
    const expectedApiUrl = new URL(`${window.location.origin}/api/deals`);
    expectedApiUrl.searchParams.append('category', queryParams.category);
    expectedApiUrl.searchParams.append('sortBy', queryParams.sortBy);
    expectedApiUrl.searchParams.append('latitude', queryParams.latitude);
    expectedApiUrl.searchParams.append('longitude', queryParams.longitude);
    expectedApiUrl.searchParams.append('radius', queryParams.radius);
    // someEmptyParam should not be added

    setFetchMock({
        ok: true,
        json: async () => ({ success: true, count: 2, data: [{ _id: '2', itemName: 'Bakery Deal' }, { _id: '3', itemName: 'Another Bakery Deal' }] })
    });

    try {
        const deals = await fetchDeals(queryParams);
        assertEquals(mockFetchCallArgs.url, expectedApiUrl.toString(), "Test Case 2: Fetch URL with query params is correct");
        assert(Array.isArray(deals), "Test Case 2: Returned data is an array");
        assertEquals(deals.length, 2, "Test Case 2: Returned two deals");
        assertEquals(deals[0].itemName, "Bakery Deal", "Test Case 2: First deal content is correct");
    } catch (e) {
        assert(false, `Test Case 2 Failed: ${e.message}`);
    }

    // --- Test Case 3: API returns an error (ok: false) ---
    console.log("\n--- Testing fetchDeals with API error ---");
    resetFetchMock();
    setFetchMock({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({ success: false, error: "Simulated Server Error" }), // some APIs send error in json
        text: async () => "Simulated Server Error Text Body" // if json fails or not called
    });

    try {
        await fetchDeals({});
        assert(false, "Test Case 3: fetchDeals should have thrown an error for API error response");
    } catch (e) {
        assert(e.message.includes("HTTP error! status: 500"), "Test Case 3: Error message contains status code");
        assert(e.message.includes("Simulated Server Error Text Body"), "Test Case 3: Error message contains text body");
        console.log("Test Case 3: Correctly threw error:", e.message);
    }

    // --- Test Case 4: API returns success:false in JSON ---
    console.log("\n--- Testing fetchDeals with API success:false ---");
    resetFetchMock();
    setFetchMock({
        ok: true, // HTTP request itself was fine
        json: async () => ({ success: false, error: "API processed but indicated failure" })
    });

    try {
        await fetchDeals({});
        assert(false, "Test Case 4: fetchDeals should have thrown an error for success:false");
    } catch (e) {
        assert(e.message.includes("Invalid API response structure. Expected { success: true, data: [...] }") || e.message.includes("API processed but indicated failure"), "Test Case 4: Correct error for success:false");
        console.log("Test Case 4: Correctly threw error:", e.message);
    }


    // --- Test Case 5: Network error (fetch rejects) ---
    console.log("\n--- Testing fetchDeals with network error ---");
    resetFetchMock();
    const networkError = new TypeError("Failed to fetch (simulated network error)"); // TypeError is common for network issues
    setFetchMock(null, true, networkError);

    try {
        await fetchDeals({});
        assert(false, "Test Case 5: fetchDeals should have thrown for network error");
    } catch (e) {
        assertEquals(e.message, networkError.message, "Test Case 5: Correctly threw network error");
        console.log("Test Case 5: Correctly threw error:", e.message);
    }


    console.log("\n--- Finished deals.test.js (New API-focused tests) ---");
    // Ensure to call summarizeTests from test-runner.html or after all test files have run.
    if (typeof summarizeTests === 'function' && window.location.pathname.includes('test-runner.html')) {
        // This is here for potential standalone testing, but test-runner.html should manage the final call.
    }

    // Restore original fetch if it was stored, good practice though not strictly needed if page reloads for each test run
    // globalThis.fetch = originalGlobalFetch;
})();
