// Deals data management, filtering, and sorting

// let rawDeals = []; // Stores the original fetched deals - This global variable is no longer managed by this module.

export async function fetchDeals(queryParams = {}) {
    const baseUrl = '/api/deals';
    // Construct URL relative to the current window origin
    const url = new URL(baseUrl, window.location.origin);

    // Append query params if they have values
    for (const key in queryParams) {
        if (queryParams[key] !== undefined && queryParams[key] !== null && queryParams[key] !== '') {
            url.searchParams.append(key, queryParams[key]);
        }
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            let errorBody = 'Could not retrieve error body.';
            try {
                errorBody = await response.text();
            } catch (textError) {
                // Ignore if cannot parse error body
            }
            throw new Error(`HTTP error! status: ${response.status} while fetching ${url}. Body: ${errorBody}`);
        }
        const responseData = await response.json();
        if (responseData && responseData.success && Array.isArray(responseData.data)) {
            console.log(`Deals fetched successfully from ${url}. Count: ${responseData.count}`);
            return responseData.data; // Assuming API returns { success: true, count: ..., data: [...] }
        } else {
            console.error("Invalid API response structure:", responseData);
            throw new Error("Invalid API response structure. Expected { success: true, data: [...] }");
        }
    } catch (error) {
        console.error(`Error fetching deals from API (${url}):`, error);
        // In a real app, you might want to throw the error or handle it by returning a specific error object
        throw error; // Re-throw to allow app.js to handle it (e.g. display message)
    }
}

// Client-side getDealById is removed as data is fetched on demand from backend.
// A similar function might exist in app.js to search through 'allDeals' array if needed,
// or a dedicated API call /api/deals/:id would be used for a detail view.
// export function getDealById(id) { ... }


// Client-side sorting is removed as the backend will handle sorting.
// function sortDeals(deals, sortBy) { ... }


// Client-side filtering and sorting is removed as the backend will handle this.
// export function getFilteredAndSortedDeals(searchTerm, selectedCategory, sortBy) { ... }
