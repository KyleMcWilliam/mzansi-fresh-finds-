// Global variables
let allProducts = [];
let allDeals = []; // To store fetched deals

// Import functions from deals.js and ui.js
import { fetchDeals, getFilteredAndSortedDeals, getDealById } from './deals.js';
import { initUI, renderDeals, showSkeletonLoaders, getFilterValues, setFilterValues, showNoDealsMessage, updateCategoryFilterVisuals } from './ui.js';

// DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the products page by looking for the product-listing element
    if (document.getElementById('product-listing')) {
        initProductsPage();
    } else if (document.getElementById('deals-container')) { // Check for deals page
        initDealsPage();
    }
    // Other page initializations can go here if needed in the future
    // e.g., if (document.getElementById('home-specific-element')) initHomePage();
});

/**
 * Initializes functionality specific to the products page.
 */
function initProductsPage() {
    fetchProductsAndRender().then(() => { // Ensure products are loaded before setting up listeners
        const categoryFilter = document.getElementById('category-filter');
        const farmerFilter = document.getElementById('farmer-filter');
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        const sortDropdown = document.getElementById('sort-dropdown');

        if (categoryFilter && farmerFilter && applyFiltersBtn && sortDropdown) {
            applyFiltersBtn.addEventListener('click', applyFiltersAndSort);
            categoryFilter.addEventListener('change', applyFiltersAndSort);
            farmerFilter.addEventListener('input', applyFiltersAndSort);
            sortDropdown.addEventListener('change', applyFiltersAndSort);
        } else {
            console.error('Filter or sort elements not found on products.html');
        }
    }).catch(error => {
        // If fetchProductsAndRender fails, log it, product interactions won't work.
        console.error("Failed to initialize products page due to fetch error:", error);
    });
}

/**
 * Initializes functionality specific to the deals page.
 */
async function initDealsPage() {
    console.log("Initializing deals page...");
    initUI(filterAndRenderDeals, clearAllFiltersAndRender, handleViewDeal);

    // Initial load of deals
    await filterAndRenderDeals();
}

/**
 * Fetches, filters, sorts, and renders deals based on current UI selections.
 */
async function filterAndRenderDeals() {
    console.log("filterAndRenderDeals called");
    showSkeletonLoaders(); // Show placeholders while loading

    const { searchTerm, category, sortBy } = getFilterValues();
    updateCategoryFilterVisuals(category); // Update visual cue for category filter

    try {
        // Fetch all deals if not already fetched or if a refresh is needed.
        // For now, let's assume deals.js handles caching or always fetches.
        // If allDeals is empty, it implies it's the first fetch or a cache miss.
        if (allDeals.length === 0) {
            allDeals = await fetchDeals('data/deals.json'); // Path to your deals data
        }

        const dealsToDisplay = getFilteredAndSortedDeals(searchTerm, category, sortBy);
        renderDeals(dealsToDisplay, searchTerm, category);

        if (dealsToDisplay.length === 0) {
            showNoDealsMessage(searchTerm, category);
        }
    } catch (error) {
        console.error("Error fetching or rendering deals:", error);
        // Optionally, display a more user-friendly error message in the UI
        const dealsContainer = document.getElementById('deals-container');
        if (dealsContainer) {
            dealsContainer.innerHTML = '<p class="error-message">Could not load deals. Please try again later.</p>';
        }
    }
}

/**
 * Clears all filter inputs and re-renders the deals.
 */
async function clearAllFiltersAndRender() {
    console.log("clearAllFiltersAndRender called");
    // Reset UI filter elements using setFilterValues from ui.js
    setFilterValues({ searchTerm: '', category: 'all', sortBy: 'default' });

    // Potentially clear any stored preferences if implemented
    // localStorage.removeItem('dealFilters');

    updateCategoryFilterVisuals('all'); // Reset category filter visual cue

    await filterAndRenderDeals(); // Re-fetch and render with cleared filters
}

/**
 * Handles the action when a user wants to view details of a specific deal.
 * @param {string} dealId - The ID of the deal to view.
 */
async function handleViewDeal(dealId) {
    console.log(`handleViewDeal called for deal ID: ${dealId}`);
    try {
        // Ensure deals are loaded before trying to get one by ID
        if (allDeals.length === 0) {
           allDeals = await fetchDeals('data/deals.json');
        }
        const deal = getDealById(dealId); // Assumes getDealById is synchronous after deals are fetched
        if (deal) {
            console.log("Deal details:", deal);
            // TODO: Implement modal display logic here
            // For now, just logging. Example:
            alert(`Deal Details:\nName: ${deal.itemName}\nBusiness: ${deal.businessName}\nPrice: R${deal.discountedPrice}`);
        } else {
            console.warn(`Deal with ID ${dealId} not found.`);
            alert("Sorry, this deal could not be found.");
        }
    } catch (error) {
        console.error("Error handling view deal:", error);
        alert("An error occurred while trying to view the deal details.");
    }
}

/**
 * Applies current filter and sort values to the product list and re-renders it.
 */
function applyFiltersAndSort() {
    const categoryValue = document.getElementById('category-filter').value;
    const farmerValue = document.getElementById('farmer-filter').value.trim().toLowerCase();
    const productListingContainer = document.getElementById('product-listing');

    if (!productListingContainer) {
        console.error("Product listing container not found for filtering/sorting.");
        return;
    }

    let filteredProducts = [...allProducts];

    // Apply filters
    if (categoryValue !== "all") {
        filteredProducts = filteredProducts.filter(product => product.category === categoryValue);
    }
    if (farmerValue) {
        filteredProducts = filteredProducts.filter(product =>
            product.farmer.toLowerCase().includes(farmerValue)
        );
    }

    // Apply sort
    const sortedAndFilteredProducts = applySort(filteredProducts);

    renderProducts(sortedAndFilteredProducts, productListingContainer);
}

/**
 * Sorts an array of product objects based on the selected sort criteria.
 * @param {Array<Object>} productsToSort - The array of products to sort.
 * @returns {Array<Object>} A new array with the sorted products.
 */
function applySort(productsToSort) {
    const sortValue = document.getElementById('sort-dropdown').value;
    let sortedProducts = [...productsToSort]; // Work on a copy

    switch (sortValue) {
        case 'name-asc':
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price-asc':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
    }
    return sortedProducts;
}


/**
 * Fetches product data from JSON and renders them on the page.
 * @returns {Promise} A promise that resolves when products are fetched and rendered, or rejects on error.
 */
async function fetchProductsAndRender() {
    const productListingContainer = document.getElementById('product-listing');

    if (!productListingContainer) {
        console.error("Product listing container not found on this page.");
        return Promise.reject("Product listing container not found");
    }

    try {
        const response = await fetch('data/products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();
        allProducts = products; // Store globally for filtering/sorting
        // Initial render with default sort (order from JSON)
        // Or, if a default sort is desired on load, call applyFiltersAndSort() here instead of just renderProducts
        renderProducts(allProducts, productListingContainer);
        return Promise.resolve(); // Resolve the promise upon success
    } catch (error) {
        console.error("Error fetching or parsing products:", error);
        productListingContainer.innerHTML = '<p>Error loading products. Please try again later.</p>';
        return Promise.reject(error); // Reject the promise on error
    }
}

/**
 * Renders an array of product objects into the given container element.
 * @param {Array<Object>} productsToRender - The array of product objects to render.
 * @param {HTMLElement} containerElement - The HTML element to render the products into.
 */
function renderProducts(productsToRender, containerElement) {
    containerElement.innerHTML = ''; // Clear existing content

    if (!productsToRender || productsToRender.length === 0) {
        containerElement.innerHTML = '<p>No products found matching your criteria.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const card = document.createElement('div'); // Changed from article to div
        card.classList.add('deal-card'); // Changed class to 'deal-card' for consistency
        // card.classList.add('product-page-card'); // Optional: for product-specific tweaks via CSS later

        // Image container and image
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('deal-card-image-container');
        const image = document.createElement('img');
        image.src = product.imageUrl || 'images/placeholders/default.svg'; // Fallback image
        image.alt = product.name;
        // No specific class needed for img if deal-card-image-container styles cover it in style.css
        // image.classList.add('product-image');
        imageContainer.appendChild(image);

        // Content container
        const contentContainer = document.createElement('div');
        contentContainer.classList.add('deal-card-content');

        const nameHeading = document.createElement('h3');
        // No specific class needed if deal-card h3 style is sufficient
        // nameHeading.classList.add('product-name');
        nameHeading.textContent = product.name;

        // Price container and price (mimicking deal card structure)
        const priceContainer = document.createElement('div');
        priceContainer.classList.add('price-container');
        const priceSpan = document.createElement('span');
        priceSpan.classList.add('price'); // Use 'price' class like in deal-card
        priceSpan.textContent = `$${parseFloat(product.price).toFixed(2)}`;
        priceContainer.appendChild(priceSpan);
        // Products don't have originalPrice in the provided data structure, so we omit it

        const categoryPara = document.createElement('p');
        categoryPara.classList.add('product-meta-info'); // A generic class for meta items
        categoryPara.innerHTML = `Category: <span>${product.category}</span>`;

        const farmerPara = document.createElement('p');
        farmerPara.classList.add('product-meta-info'); // A generic class for meta items
        farmerPara.innerHTML = `Sold by: <span>${product.farmer}</span>`;

        const descriptionPara = document.createElement('p');
        descriptionPara.classList.add('description'); // Use 'description' class like in deal-card
        descriptionPara.textContent = product.description;

        // Assemble content
        contentContainer.appendChild(nameHeading);
        contentContainer.appendChild(priceContainer); // Add price container
        contentContainer.appendChild(categoryPara);
        contentContainer.appendChild(farmerPara);
        contentContainer.appendChild(descriptionPara);
        // No "View Deal" button for products as per original structure

        // Assemble card
        card.appendChild(imageContainer);
        card.appendChild(contentContainer);

        containerElement.appendChild(card);
    });
}
