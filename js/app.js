// Global variables
let allProducts = [];

// DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the products page by looking for the product-listing element
    if (document.getElementById('product-listing')) {
        initProductsPage();
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
        const card = document.createElement('article');
        card.classList.add('product-card');

        const image = document.createElement('img');
        image.src = product.imageUrl || 'images/placeholders/default.svg'; // Fallback image
        image.alt = product.name;
        image.classList.add('product-image');

        const nameHeading = document.createElement('h3');
        nameHeading.classList.add('product-name');
        nameHeading.textContent = product.name;

        const pricePara = document.createElement('p');
        pricePara.classList.add('product-price');
        pricePara.textContent = `$${parseFloat(product.price).toFixed(2)}`;

        const categoryPara = document.createElement('p');
        categoryPara.classList.add('product-category');
        categoryPara.innerHTML = `Category: <span>${product.category}</span>`;

        const farmerPara = document.createElement('p');
        farmerPara.classList.add('product-farmer');
        farmerPara.innerHTML = `Sold by: <span>${product.farmer}</span>`;

        const descriptionPara = document.createElement('p');
        descriptionPara.classList.add('product-description');
        descriptionPara.textContent = product.description;

        card.appendChild(image);
        card.appendChild(nameHeading);
        card.appendChild(pricePara);
        card.appendChild(categoryPara);
        card.appendChild(farmerPara);
        card.appendChild(descriptionPara);

        containerElement.appendChild(card);
    });
}
