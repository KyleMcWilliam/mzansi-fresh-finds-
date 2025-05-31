// Deals data management, filtering, and sorting

let rawDeals = []; // Stores the original fetched deals

export async function fetchDeals(jsonPath) {
    try {
        const response = await fetch(jsonPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} while fetching ${jsonPath}`);
        }
        rawDeals = await response.json();
        console.log("Deals fetched successfully.");
        return rawDeals;
    } catch (error) {
        console.error("Error fetching deals:", error);
        // In a real app, you might want to throw the error or handle it by returning a specific error object
        rawDeals = []; // Ensure rawDeals is empty on error
        throw error; // Re-throw to allow app.js to handle it (e.g. display message)
    }
}

export function getDealById(id) {
    if (!rawDeals) return null;
    return rawDeals.find(deal => deal.id === parseInt(id));
}

function sortDeals(deals, sortBy) {
    // Create a new array to avoid mutating the original
    const dealsToSort = [...deals];
    switch (sortBy) {
        case 'price-asc':
            return dealsToSort.sort((a, b) => a.discountedPrice - b.discountedPrice);
        case 'price-desc':
            return dealsToSort.sort((a, b) => b.discountedPrice - a.discountedPrice);
        case 'ending-soon':
            return dealsToSort.sort((a, b) => {
                // Ensure dates are valid, provide a far future date for items without a bestBefore
                const dateA = a.bestBefore ? new Date(a.bestBefore + 'T00:00:00') : new Date('9999-12-31T00:00:00Z');
                const dateB = b.bestBefore ? new Date(b.bestBefore + 'T00:00:00') : new Date('9999-12-31T00:00:00Z');
                const timeA = !isNaN(dateA.getTime()) ? dateA.getTime() : Infinity;
                const timeB = !isNaN(dateB.getTime()) ? dateB.getTime() : Infinity;
                return timeA - timeB;
            });
        default: // 'default' or any other value
            return dealsToSort; // Return a copy, unsorted or in its original fetched order
    }
}

export function getFilteredAndSortedDeals(searchTerm, selectedCategory, sortBy) {
    if (!rawDeals) return [];

    const lowerSearchTerm = searchTerm.toLowerCase().trim();

    const filteredDeals = rawDeals.filter(deal => {
        const matchesSearch = !lowerSearchTerm || (
            (deal.itemName && deal.itemName.toLowerCase().includes(lowerSearchTerm)) ||
            (deal.businessName && deal.businessName.toLowerCase().includes(lowerSearchTerm)) ||
            (deal.description && deal.description.toLowerCase().includes(lowerSearchTerm))
        );
        const matchesCategory = selectedCategory === 'all' || deal.category?.toLowerCase() === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return sortDeals(filteredDeals, sortBy);
}
