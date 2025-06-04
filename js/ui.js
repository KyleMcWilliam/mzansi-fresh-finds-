// UI rendering and interaction
import { formatDate, getPlaceholderImage } from './utils.js';

// --- DOM Elements ---
// These are now mostly set within initUI or passed as arguments to rendering functions
// let dealsContainer, searchInput, categoryFilter, sortDealsSelect, clearFiltersBtn;

// Callback for handling "View Deal" clicks, to be set by initUI
let viewDealHandler; // Remains for deals.html modal
let filterAndRenderCallbackGlobal; // Remains for deals.html category links in no deals message

// --- UI Rendering Functions ---
function createSkeletonCard() {
    const skeletonCard = document.createElement('div');
    skeletonCard.classList.add('skeleton-card');
    skeletonCard.innerHTML = `
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
            <div class="skeleton-line long"></div>
            <div class="skeleton-line medium"></div>
            <div class="skeleton-line price" style="margin-top: var(--space-lg);"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-line button"></div>
        </div>
    `;
    return skeletonCard;
}

export function showSkeletonLoaders(containerElement, count = 6) { // Added containerElement
    if (!containerElement) {
        console.warn("showSkeletonLoaders: Container element not provided.");
        return;
    }
    containerElement.innerHTML = ''; // Clear previous content
    for (let i = 0; i < count; i++) {
        containerElement.appendChild(createSkeletonCard());
    }
}

export function showNoDealsMessage(containerElement, currentSearchTerm = '', currentSelectedCategory = 'all') { // Added containerElement
    if (!containerElement) {
        console.warn("showNoDealsMessage: Container element not provided.");
        return;
    }
    let message = `<p>No fresh finds match your current criteria.</p>`;
    if (currentSearchTerm || currentSelectedCategory !== 'all') {
        message += `<p class="suggestions">Try broadening your search, checking <a href="#" data-category-link="all">all categories</a>, or explore popular ones like <a href="#" data-category-link="bakery">Bakery</a> or <a href="#" data-category-link="fruitveg">Fruit & Veg</a>.</p>`;
    } else {
        message += `<p class="suggestions">Check back soon for new deals or <a href="#business-signup-placeholder">invite local businesses</a> to join!</p>`;
    }
    containerElement.innerHTML = `
        <div class="no-deals-message">
            <i class="fas fa-shopping-basket"></i>
            ${message}
        </div>
    `;
    // Add event listeners to suggestion links (relevant for deals.html context)
    containerElement.querySelectorAll('[data-category-link]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const categoryFilterEl = document.getElementById('categoryFilter'); // Assume it exists on deals.html
            if (categoryFilterEl) {
                categoryFilterEl.value = e.target.dataset.categoryLink;
                if (typeof filterAndRenderCallbackGlobal === 'function') {
                    filterAndRenderCallbackGlobal();
                }
            }
        });
    });
}

// Adapting renderDeals to renderConsumerDeals for products.html context.
// It now accepts containerElement as an argument.
// The parameters currentSearchTerm, currentSelectedCategory are for showNoDealsMessage.
export function renderDeals(dealsToRender, containerElement, currentSearchTerm = '', currentSelectedCategory = 'all') {
    if (!containerElement) {
        console.warn("renderDeals: Container element not provided.");
        return;
    }
    containerElement.innerHTML = ''; // Clear previous content
    if (!dealsToRender || dealsToRender.length === 0) {
        showNoDealsMessage(containerElement, currentSearchTerm, currentSelectedCategory);
        return;
    }

    const ENDING_SOON_THRESHOLD_DAYS = 2;

    dealsToRender.forEach((deal, index) => {
        const dealCard = document.createElement('div');
        dealCard.classList.add('deal-card'); // General deal card styling
        // dealCard.classList.add('consumer-deal-card'); // Optional: more specific class for products page styling
        dealCard.style.animationDelay = `${index * 0.05}s`;

        // Image: deal.imageURL > deal.store.logoURL > placeholder
        const imageUrl = deal.imageURL || (deal.store && deal.store.logoURL) || getPlaceholderImage(deal.category);
        const imageAlt = deal.itemName || 'Deal product image';
        const placeholderOnError = getPlaceholderImage(null); // Generic placeholder
        const imageErrorScript = `this.onerror=null; this.src='${placeholderOnError}'; this.alt='Placeholder image';`;

        let endingSoonIndicatorHTML = '';
        if (deal.bestBeforeDate) { // API uses bestBeforeDate
            try {
                const bestBeforeDate = new Date(deal.bestBeforeDate.includes('T') ? deal.bestBeforeDate : deal.bestBeforeDate + 'T00:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const timeDiff = bestBeforeDate.getTime() - today.getTime();
                const daysDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));

                if (daysDifference >= 0 && daysDifference < ENDING_SOON_THRESHOLD_DAYS) {
                    let expiryMessage = 'Expires Soon!';
                    if (daysDifference === 0) expiryMessage = 'Expires Today!';
                    else if (daysDifference === 1) expiryMessage = 'Expires Tomorrow!';
                    endingSoonIndicatorHTML = `<span class="ending-soon-indicator">${expiryMessage}</span>`;
                }
            } catch (e) {
                console.warn('Error parsing bestBeforeDate for deal:', deal._id, deal.bestBeforeDate, e);
            }
        }

        let discountBadgeHTML = '';
        if (deal.discountPercentage && deal.discountPercentage > 0) {
            discountBadgeHTML = `<span class="discount-badge">Save ${deal.discountPercentage.toFixed(0)}%</span>`;
        }

        let distanceHTML = '';
        if (typeof deal.distanceInKm === 'number' && deal.distanceInKm !== null) {
            distanceHTML = `<p class="distance"><i class="fas fa-map-marker-alt"></i> ${deal.distanceInKm.toFixed(1)} km away</p>`;
        }

        // Store name from deal.store.storeName (populated by backend)
        const storeName = (deal.store && deal.store.storeName) ? deal.store.storeName : 'Unknown Store';

        // Store Location
        const storeAddress = (deal.store && deal.store.address) ? deal.store.address : 'Address not available';
        const storeLocationHTML = `<p class="store-location" title="Store Address: ${storeAddress}"><i class="fas fa-map-marker-alt"></i> ${storeAddress}</p>`;

        // Quantity Available
        let quantityAvailableHTML = '';
        if (deal.quantityAvailable !== undefined && deal.quantityAvailable !== null) {
            quantityAvailableHTML = `<p class="quantity-available"><i class="fas fa-cubes"></i> Quantity: ${deal.quantityAvailable}</p>`;
        } else {
            quantityAvailableHTML = `<p class="quantity-available"><i class="fas fa-cubes"></i> Quantity: Not specified</p>`;
        }

        dealCard.innerHTML = `
            <div class="deal-card-image-container">
                ${endingSoonIndicatorHTML}
                ${discountBadgeHTML}
                <img src="${imageUrl}" alt="${imageAlt}" loading="lazy" onerror="${imageErrorScript}">
            </div>
            <div class="deal-card-content">
                <h3>${deal.itemName}</h3>
                <p class="business-name" title="Store: ${storeName}">
                    <i class="fas fa-store-alt" aria-hidden="true"></i> ${storeName}
                </p>
                ${storeLocationHTML}
                ${distanceHTML}
                <div class="price-container">
                    <span class="price">R${deal.discountedPrice.toFixed(2)}</span>
                    ${deal.originalPrice ? `<span class="original-price strikethrough">R${deal.originalPrice.toFixed(2)}</span>` : ''}
                </div>
                <p class="best-before" title="Best Before Date">
                    <i class="far fa-calendar-alt" aria-hidden="true"></i> ${formatDate(deal.bestBeforeDate)}
                </p>
                <p class="description">${deal.description || ''}</p>
                ${quantityAvailableHTML}
                <button class="view-deal-btn" data-deal-id="${deal._id}" aria-label="View details for ${deal.itemName}">
                    <i class="fas fa-eye" aria-hidden="true"></i> View Deal
                </button>
            </div>
        `;
        containerElement.appendChild(dealCard);
    });

    // Attach listeners for view deal buttons, using the container to scope the query
    // This assumes that viewDealHandler is relevant for these cards as well (e.g., opens a modal)
    // If not, this part can be omitted for products.html or use a different handler.
    if (viewDealHandler) { // Check if viewDealHandler is set (it's set by initUI for deals.html)
        attachViewDealListeners(containerElement); // Pass containerElement
    }
}

function attachViewDealListeners(containerElement) {
    if (!containerElement || !viewDealHandler) return;
    containerElement.querySelectorAll('.view-deal-btn').forEach(button => {
        // To prevent multiple listeners if this function is called multiple times on the same container
        button.removeEventListener('click', handleViewDealButtonClick);
        button.addEventListener('click', handleViewDealButtonClick);
    });
}

function handleViewDealButtonClick(event) {
    event.preventDefault();
    const dealId = event.currentTarget.dataset.dealId;
    if (dealId && viewDealHandler) {
        // Pass the button itself if needed by the handler (e.g., for modal positioning)
        viewDealHandler(dealId, event.currentTarget);
    }
}


export function updateCategoryFilterVisuals(selectedCategory) {
    const categoryFilterEl = document.getElementById('categoryFilter'); // Specific to deals.html
    if (!categoryFilterEl) return;
    if (selectedCategory !== 'all') {
        categoryFilterEl.classList.add('has-filter');
    } else {
        categoryFilterEl.classList.remove('has-filter');
    }
}

export function initUI(applyFiltersCallback, clearFiltersCallback, viewDealCallbackFromApp) {
    // These elements are specific to deals.html where initUI is called
    const dealsContainerEl = document.getElementById('deals-container');
    const searchInputEl = document.getElementById('searchInput');
    const categoryFilterEl = document.getElementById('categoryFilter');
    const sortDealsSelectEl = document.getElementById('sortDeals');
    const clearFiltersBtnEl = document.getElementById('clearFiltersBtn');

    // if (!dealsContainerEl) console.warn("Element #deals-container not found during initUI.");
    // if (!searchInputEl) console.warn("Element #searchInput not found during initUI.");
    // if (!categoryFilterEl) console.warn("Element #categoryFilter not found during initUI.");
    // if (!sortDealsSelectEl) console.warn("Element #sortDeals not found during initUI.");
    // if (!clearFiltersBtnEl) console.warn("Element #clearFiltersBtn not found during initUI.");

    viewDealHandler = viewDealCallbackFromApp;
    filterAndRenderCallbackGlobal = applyFiltersCallback;

    if (searchInputEl) searchInputEl.addEventListener('input', applyFiltersCallback);
    if (categoryFilterEl) categoryFilterEl.addEventListener('change', applyFiltersCallback);
    if (sortDealsSelectEl) sortDealsSelectEl.addEventListener('change', applyFiltersCallback);
    if (clearFiltersBtnEl) clearFiltersBtnEl.addEventListener('click', clearFiltersCallback);

    console.log("UI event listeners (for deals.html context) initialized via initUI.");
}

export function getFilterValues() {
    // Specific to deals.html elements
    const searchInputEl = document.getElementById('searchInput');
    const categoryFilterEl = document.getElementById('categoryFilter');
    const sortDealsSelectEl = document.getElementById('sortDeals');

    const searchTerm = searchInputEl ? searchInputEl.value : '';
    const category = categoryFilterEl ? categoryFilterEl.value : 'all';
    const sortBy = sortDealsSelectEl ? sortDealsSelectEl.value : 'default'; // 'default' might be 'newest' now
    return { searchTerm, category, sortBy };
}

export function setFilterValues(filters) {
    // Specific to deals.html elements
    const searchInputEl = document.getElementById('searchInput');
    const categoryFilterEl = document.getElementById('categoryFilter');
    const sortDealsSelectEl = document.getElementById('sortDeals');

    if (searchInputEl && typeof filters.searchTerm !== 'undefined') searchInputEl.value = filters.searchTerm;
    if (categoryFilterEl && typeof filters.category !== 'undefined') categoryFilterEl.value = filters.category;
    if (sortDealsSelectEl && typeof filters.sortBy !== 'undefined') sortDealsSelectEl.value = filters.sortBy;
}

// --- PWA Update Notification UI --- (Keep as is)
export function showUpdateNotification() {
    const notificationDiv = document.getElementById('updateNotification');
    const refreshButton = document.getElementById('refreshAppBtn');

    if (notificationDiv && refreshButton) {
        notificationDiv.style.display = 'flex';
        setTimeout(() => {
            notificationDiv.classList.add('show');
        }, 10);


        refreshButton.addEventListener('click', () => {
            window.location.reload();
        });
    } else {
        console.warn('PWA update notification elements not found.');
    }
}

export function showToast(message, type = 'success', duration = 3000) {
    let toastContainer = document.getElementById('toast-container');

    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;


    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);

    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close-btn';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.onclick = () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    };

    toast.appendChild(closeButton);
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        if (toast.parentElement && toast.classList.contains('show')) {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }, duration);
}

export function setButtonLoadingState(buttonElement, isLoading) {
    if (!buttonElement) return;

    if (isLoading) {
        if (!buttonElement.dataset.originalHtml) {
            buttonElement.dataset.originalHtml = buttonElement.innerHTML;
        }
        buttonElement.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> <span class="btn-loading-text">Loading...</span>`;
        buttonElement.disabled = true;
    } else {
        if (buttonElement.dataset.originalHtml) {
            buttonElement.innerHTML = buttonElement.dataset.originalHtml;
            delete buttonElement.dataset.originalHtml;
        }
        buttonElement.disabled = false;
    }
}
