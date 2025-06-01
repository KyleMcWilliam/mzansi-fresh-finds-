// Utility functions

export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        // Check if the dateString is already in a simple YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
             // Add time component to prevent timezone issues on parsing
            dateString += 'T00:00:00';
        }
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-ZA', options);
    } catch (e) {
        console.warn(`Invalid date format: ${dateString}`);
        return dateString; // Return original string if invalid
    }
}

export function getPlaceholderImage(category) {
    const basePath = 'images/placeholders/';
    switch (category?.toLowerCase()) {
        case 'bakery': return `${basePath}bakery.svg`;
        case 'fruitveg': return `${basePath}fruitveg.svg`;
        case 'dairy': return `${basePath}dairy.svg`;
        case 'meat': return `${basePath}meat.svg`;
        case 'prepared': return `${basePath}prepared.svg`;
        case 'pantry': return `${basePath}pantry.svg`;
        default: return `${basePath}default.svg`;
    }
}
