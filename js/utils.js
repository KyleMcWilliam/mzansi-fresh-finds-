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
    // const basePath = 'images/'; // Removed basePath
    const imageSize = '300x200'; // Define a common size for placeholders
    switch (category?.toLowerCase()) {
        case 'bakery': return `https://via.placeholder.com/${imageSize}.png?text=Bakery`;
        case 'fruitveg': return `https://via.placeholder.com/${imageSize}.png?text=Fruit%26Veg`;
        case 'dairy': return `https://via.placeholder.com/${imageSize}.png?text=Dairy`;
        case 'meat': return `https://via.placeholder.com/${imageSize}.png?text=Meat`;
        case 'prepared': return `https://via.placeholder.com/${imageSize}.png?text=Prepared`;
        case 'pantry': return `https://via.placeholder.com/${imageSize}.png?text=Pantry`;
        default: return `https://via.placeholder.com/${imageSize}.png?text=Food+Deal`; // Default placeholder
    }
}
