// Global variables
// let allProducts = []; // Removed, products.html now uses deals
let allDeals = []; // To store fetched deals for the current page context (products or deals page)
let currentLatitude = null; // For products.html location features
let currentLongitude = null; // For products.html location features
let leafletMap; // For Leaflet map on products.html
let markerGroup; // For Leaflet markers

// Map Constants
const DEFAULT_LAT = -26.2041; // Johannesburg as a default
const DEFAULT_LON = 28.0473;
const DEFAULT_ZOOM = 10;


// Import functions from deals.js and ui.js
import { fetchDeals } from './deals.js'; // getFilteredAndSortedDeals, getDealById removed from imports
import { initUI, renderDeals, showSkeletonLoaders, getFilterValues, setFilterValues, showNoDealsMessage, updateCategoryFilterVisuals, showToast, setButtonLoadingState } from './ui.js';
import { populateModalWithDeal, openModal, initModal } from './modal.js'; // Modal might still be used on products.html
import { initMobileNavigation } from './navigation.js';

// DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('product-listing')) {
        initProductsPage();
    } else if (document.getElementById('deals-container')) {
        initDealsPage();
    }
    // Initialize modal for both pages if a common modal structure is used
    initModal(); // Parameter removed as it's no longer used in modal.js
    initMobileNavigation(); // Initialize hamburger menu functionality

    // Update copyright year
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});

/**
 * Initializes functionality specific to the products page (consumer-facing deals).
 */
async function initProductsPage() {
    console.log("Initializing products page (consumer deals)...");

    // Initialize Leaflet Map
    if (document.getElementById('map-view')) {
        try {
            leafletMap = L.map('map-view').setView([DEFAULT_LAT, DEFAULT_LON], DEFAULT_ZOOM);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(leafletMap);
            markerGroup = L.layerGroup().addTo(leafletMap);
            console.log("Leaflet map initialized.");
        } catch (e) {
            console.error("Leaflet map initialization failed:", e);
            const mapViewDiv = document.getElementById('map-view');
            if (mapViewDiv) {
                mapViewDiv.innerHTML = '<p class="error-message">Sorry, the map could not be loaded.</p>';
            }
        }
    }


    const categoryFilter = document.getElementById('category-filter');
    const sortDropdown = document.getElementById('sort-dropdown');
    const postcodeSearchInput = document.getElementById('postcode-search');
    const postcodeSearchBtn = document.getElementById('postcode-search-btn');
    const dealsNearMeBtn = document.getElementById('deals-near-me-btn');
    // productListingContainer is passed to renderDeals directly

    if (categoryFilter) categoryFilter.addEventListener('change', handleFilterOrSortChange);
    if (sortDropdown) sortDropdown.addEventListener('change', handleFilterOrSortChange);
    if (dealsNearMeBtn) dealsNearMeBtn.addEventListener('click', handleDealsNearMe);
    if (postcodeSearchBtn) postcodeSearchBtn.addEventListener('click', handlePostcodeSearch);

    // Initial fetch of deals
    await handleFilterOrSortChange(); // This will also call updateMapMarkers

    // Attach listeners for view deal buttons on product cards, if modal is used here
    const productListingContainer = document.getElementById('product-listing');
    if (productListingContainer) {
        productListingContainer.addEventListener('click', event => {
            const button = event.target.closest('.view-deal-btn');
            if (button && button.dataset.dealId) {
                event.preventDefault();
                const dealId = button.dataset.dealId;
                const deal = allDeals.find(d => d._id === dealId);
                if (deal) {
                    populateModalWithDeal(deal); // Pass the whole deal object
                    openModal();
                } else {
                    showToast('Could not find deal details.', 'error');
                }
            }
        });
    }
}


/**
 * Updates the Leaflet map with markers for the given deals.
 * @param {Array<Object>} deals - An array of deal objects, each expected to have a .store property.
 */
function updateMapMarkers(deals) {
    if (!leafletMap || !markerGroup) {
        console.log("Map not initialized or no marker group, skipping marker update.");
        return;
    }

    markerGroup.clearLayers();
    const uniqueStores = new Map();

    if (!deals || deals.length === 0) {
        console.log("No deals to display on map.");
        // Optionally reset map view if no deals
        // leafletMap.setView([DEFAULT_LAT, DEFAULT_LON], DEFAULT_ZOOM);
        return;
    }

    deals.forEach(deal => {
        if (deal.store && deal.store._id && deal.store.location &&
            deal.store.location.coordinates && deal.store.location.coordinates.length === 2) {
            if (!uniqueStores.has(deal.store._id)) {
                uniqueStores.set(deal.store._id, {
                    _id: deal.store._id,
                    storeName: deal.store.storeName || 'Unknown Store',
                    address: deal.store.address || 'Address not available',
                    coordinates: deal.store.location.coordinates // [longitude, latitude]
                });
            }
        }
    });

    if (uniqueStores.size === 0) {
        console.log("No stores with valid locations found in deals.");
        return;
    }

    uniqueStores.forEach(store => {
        const [lon, lat] = store.coordinates; // Backend provides [lon, lat]
        if (typeof lat === 'number' && typeof lon === 'number') {
            const marker = L.marker([lat, lon]); // Leaflet expects [lat, lon]
            marker.bindPopup(`<b>${store.storeName}</b><br>${store.address}`);
            markerGroup.addLayer(marker);
        } else {
            console.warn("Invalid coordinates for store:", store.storeName, store.coordinates);
        }
    });

    if (markerGroup.getLayers().length > 0) {
        try {
            leafletMap.fitBounds(markerGroup.getBounds().pad(0.1));
        } catch (e) {
            console.error("Error fitting map bounds:", e, markerGroup.getBounds());
             // Fallback if fitBounds fails (e.g., single marker or invalid bounds)
            if (markerGroup.getLayers().length === 1) {
                const singleMarkerCoords = markerGroup.getLayers()[0].getLatLng();
                leafletMap.setView(singleMarkerCoords, DEFAULT_ZOOM + 2); // Zoom in a bit more for single marker
            } else {
                // leafletMap.setView([DEFAULT_LAT, DEFAULT_LON], DEFAULT_ZOOM); // Reset to default
            }
        }
    } else {
        // Optional: if no markers ended up being added, reset view
        // leafletMap.setView([DEFAULT_LAT, DEFAULT_LON], DEFAULT_ZOOM);
    }
}

/**
 * Handles fetching and rendering deals based on current filters and sort criteria for products.html.
 */
async function handleFilterOrSortChange() {
    const productListingContainer = document.getElementById('product-listing');
    if (!productListingContainer) {
        console.error("Product listing container not found for handleFilterOrSortChange.");
        return;
    }
    showSkeletonLoaders(productListingContainer);

    const categoryFilter = document.getElementById('category-filter');
    const sortDropdown = document.getElementById('sort-dropdown');

    const queryParams = {};
    if (categoryFilter && categoryFilter.value !== 'all') {
        queryParams.category = categoryFilter.value;
    }
    if (sortDropdown) {
        queryParams.sortBy = sortDropdown.value;
    }

    if (currentLatitude && currentLongitude) {
        queryParams.latitude = currentLatitude;
        queryParams.longitude = currentLongitude;
        queryParams.radius = 10; // Default radius in km, could be made configurable
    }

    try {
        console.log("Fetching deals with params:", queryParams);
        const deals = await fetchDeals(queryParams);
        allDeals = deals; // Store fetched deals globally for this page context
        renderDeals(allDeals, productListingContainer); // Pass container
        updateMapMarkers(allDeals); // Update map after rendering deals
        if (deals.length === 0) {
            // showNoDealsMessage handled by renderDeals if list is empty
        }
    } catch (error) {
        console.error("Error in handleFilterOrSortChange:", error);
        updateMapMarkers([]); // Clear map on error or show default state
        showToast(error.message || 'Could not fetch deals. Please try again.', 'error');
        if (productListingContainer) { // Ensure container exists
             productListingContainer.innerHTML = `<p class="error-message">Could not load deals. ${error.message}</p>`;
        }
    }
}

/**
 * Handles the "Use My Current Location" button click.
 */
async function handleDealsNearMe() {
    const dealsNearMeBtn = document.getElementById('deals-near-me-btn');
    if (!dealsNearMeBtn) return;

    setButtonLoadingState(dealsNearMeBtn, true);

    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser.', 'error');
        setButtonLoadingState(dealsNearMeBtn, false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            currentLatitude = position.coords.latitude;
            currentLongitude = position.coords.longitude;
            console.log(`Location obtained: Lat ${currentLatitude}, Lon ${currentLongitude}`);
            showToast('Location obtained! Fetching nearest deals...', 'success');
            document.getElementById('postcode-search').value = ''; // Clear postcode input
            await handleFilterOrSortChange();
            setButtonLoadingState(dealsNearMeBtn, false);
        },
        (error) => {
            console.error("Error getting location:", error);
            let message = 'Could not get location. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message += "Please enable location services.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    message += "Location information is unavailable.";
                    break;
                case error.TIMEOUT:
                    message += "The request to get user location timed out.";
                    break;
                default:
                    message += "An unknown error occurred.";
                    break;
            }
            showToast(message, 'error');
            currentLatitude = null; // Clear any old lat/lon
            currentLongitude = null;
            // Optionally, trigger a re-fetch without location if desired
            // await handleFilterOrSortChange();
            setButtonLoadingState(dealsNearMeBtn, false);
        }
    );
}

/**
 * Handles the postcode search button click.
 */
async function handlePostcodeSearch() {
    const postcodeSearchInput = document.getElementById('postcode-search');
    const postcodeSearchBtn = document.getElementById('postcode-search-btn');
    if (!postcodeSearchInput || !postcodeSearchBtn) return;

    setButtonLoadingState(postcodeSearchBtn, true);
    const postcode = postcodeSearchInput.value.trim();

    if (!postcode) {
        showToast('Please enter a postcode or "latitude,longitude".', 'error');
        setButtonLoadingState(postcodeSearchBtn, false);
        return;
    }

    // Simple regex to check for "lat,lon" format
    const latLonRegex = /^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)$/;
    if (latLonRegex.test(postcode)) {
        const [latStr, lonStr] = postcode.split(',');
        currentLatitude = parseFloat(latStr);
        currentLongitude = parseFloat(lonStr);

        if (isNaN(currentLatitude) || isNaN(currentLongitude) || currentLatitude < -90 || currentLatitude > 90 || currentLongitude < -180 || currentLongitude > 180) {
            showToast('Invalid latitude/longitude values. Latitude must be -90 to 90, Longitude -180 to 180.', 'error');
            currentLatitude = null;
            currentLongitude = null;
            setButtonLoadingState(postcodeSearchBtn, false);
            return;
        }

        console.log(`Using "lat,lon": Lat ${currentLatitude}, Lon ${currentLongitude}`);
        showToast('Location set from input. Fetching deals...', 'success');
        await handleFilterOrSortChange();
    } else {
        // Placeholder for actual geocoding API call
        console.log("Geocoding for postcode not implemented. Input 'lat,lon' for testing.");
        showToast("Postcode search is a demo. Please enter as 'latitude,longitude' (e.g., '51.50,-0.12').", 'info', 6000);
        // currentLatitude = null; // Clear any old lat/lon to avoid using stale data if postcode search is "clearing" location
        // currentLongitude = null;
        // For now, don't clear lat/lon if postcode fails, let user explicitly use "near me" or valid "lat,lon"
        // await handleFilterOrSortChange(); // Decide if a failed postcode search should refresh results without location
    }
    setButtonLoadingState(postcodeSearchBtn, false);
}


// --- DEALSPAGE SPECIFIC LOGIC (Kept from original for deals.html) ---
/**
 * Initializes functionality specific to the deals page (business-facing).
 */
async function initDealsPage() {
    console.log("Initializing deals page (business-facing)...");
    // Pass the main container for deals.html
    const dealsContainer = document.getElementById('deals-container');
    initUI(
        () => filterAndRenderDeals(dealsContainer),
        () => clearAllFiltersAndRender(dealsContainer),
        (dealId, buttonElement) => handleViewDeal(dealId, buttonElement, dealsContainer)
    );
    // initModal is called from DOMContentLoaded now, more general
    // initModal(id => allDeals.find(deal => deal._id === id));

    await filterAndRenderDeals(dealsContainer);
}

async function filterAndRenderDeals(dealsContainer) { // Added dealsContainer param
    console.log("filterAndRenderDeals (deals.html) called");
    if (!dealsContainer) {
        console.error("Deals container not found for filterAndRenderDeals (deals.html)");
        return;
    }
    showSkeletonLoaders(dealsContainer);

    const { searchTerm, category, sortBy } = getFilterValues(); // These use specific IDs from deals.html via ui.js
    updateCategoryFilterVisuals(category);

    try {
        // For deals.html, we might still use a static JSON or a different API endpoint.
        // For consistency with products.html, let's assume it also uses /api/deals
        // but with different default parameters or context if needed.
        // For now, let's use a simple query or fetch all if no specific params.
        const queryParams = { searchTerm, category, sortBy };
        // If deals.html should show ALL deals by default without specific filters from its UI, adjust queryParams.
        // For example, remove searchTerm if it's not part of deals.html UI for fetching.
        // The current getFilterValues in ui.js assumes searchInput, categoryFilter, sortDealsSelect exist.
        console.log("[filterAndRenderDeals - index.html context] Query Params for API:", queryParams); // DIAGNOSTIC

        const deals = await fetchDeals(queryParams); // Using the new fetchDeals
        console.log("[filterAndRenderDeals - index.html context] Deals received from API:", deals); // DIAGNOSTIC
        allDeals = deals; // Store for this page context

        // renderDeals now takes container, searchTerm, category for its noDealsMessage
        renderDeals(allDeals, dealsContainer, searchTerm, category);

        if (allDeals.length === 0) {
            // showNoDealsMessage is handled by renderDeals
        }
    } catch (error) {
        console.error("Error fetching or rendering deals (deals.html):", error);
        showToast('Could not load deals. Please try again later.', 'error');
        if (dealsContainer) {
            dealsContainer.innerHTML = '<p class="error-message">Could not load deals. Please try refreshing the page.</p>';
        }
    }
}

async function clearAllFiltersAndRender(dealsContainer) { // Added dealsContainer param
    console.log("clearAllFiltersAndRender (deals.html) called");
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) setButtonLoadingState(clearBtn, true);

    setFilterValues({ searchTerm: '', category: 'all', sortBy: 'default' });
    updateCategoryFilterVisuals('all');

    try {
        await filterAndRenderDeals(dealsContainer);
    } finally {
        if (clearBtn) setTimeout(() => setButtonLoadingState(clearBtn, false), 200);
    }
}

async function handleViewDeal(dealId, buttonElement, dealsContainer) { // Added dealsContainer param
    console.log(`handleViewDeal (deals.html) called for deal ID: ${dealId}`);
    if (buttonElement) setButtonLoadingState(buttonElement, true);

    try {
        // No need to re-fetch allDeals if it's populated by filterAndRenderDeals
        const deal = allDeals.find(d => d._id === dealId);
        if (deal) {
            populateModalWithDeal(deal); // Pass the whole deal object
            openModal();
        } else {
            console.warn(`Deal with ID ${dealId} not found in current list (deals.html).`);
            showToast(`Deal details not found. It might have been updated.`, 'error');
            // Optional: refresh list if deal not found
            // await filterAndRenderDeals(dealsContainer);
        }
    } catch (error) {
        console.error("Error handling view deal (deals.html):", error);
        showToast("An error occurred while trying to view the deal details.", 'error');
    } finally {
        if (buttonElement) setButtonLoadingState(buttonElement, false);
    }
}

// Old product-specific functions are removed as products.html now uses the deal discovery flow.
// function fetchProductsAndRender() { ... }
// function applyFiltersAndSort() { ... }
// function applySort(productsToSort) { ... }
// function renderProducts(productsToRender, containerElement) { ... }
