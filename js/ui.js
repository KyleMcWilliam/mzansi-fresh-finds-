// UI rendering and interaction
import { formatDate, getPlaceholderImage } from './utils.js';

// --- DOM Elements ---
let dealsContainer, searchInput, categoryFilter, sortDealsSelect, clearFiltersBtn;

// Callback for handling "View Deal" clicks, to be set by initUI
let viewDealHandler;

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

export function showSkeletonLoaders(count = 6) {
    if (!dealsContainer) return;
    dealsContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        dealsContainer.appendChild(createSkeletonCard());
    }
}

export function showNoDealsMessage(currentSearchTerm, currentSelectedCategory) {
    if (!dealsContainer) return;
    let message = `<p>No fresh finds match your current criteria.</p>`;
    if (currentSearchTerm || currentSelectedCategory !== 'all') {
        message += `<p class="suggestions">Try broadening your search, checking <a href="#" data-category-link="all">all categories</a>, or explore popular ones like <a href="#" data-category-link="bakery">Bakery</a> or <a href="#" data-category-link="fruitveg">Fruit & Veg</a>.</p>`;
    } else {
        message += `<p class="suggestions">Check back soon for new deals or <a href="#business-signup-placeholder">invite local businesses</a> to join!</p>`;
    }
    dealsContainer.innerHTML = `
        <div class="no-deals-message">
            <i class="fas fa-shopping-basket"></i>
            ${message}
        </div>
    `;
    // Add event listeners to suggestion links
    dealsContainer.querySelectorAll('[data-category-link]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (categoryFilter) {
                categoryFilter.value = e.target.dataset.categoryLink;
                // Assuming filterAndRenderCallback is available or handled by the main app logic
                // This might need to call a callback provided in initUI if direct filtering is needed here
                if (typeof filterAndRenderCallbackGlobal !== 'undefined') { // Temporary check
                    filterAndRenderCallbackGlobal();
                }
            }
        });
    });
}
// Store the global callback from initUI for showNoDealsMessage, this is a bit of a hack.
// A better way would be for showNoDealsMessage to also accept the callback.
let filterAndRenderCallbackGlobal;

export function renderDeals(dealsToRender, currentSearchTerm, currentSelectedCategory) {
    if (!dealsContainer) {
        console.warn("Deals container not found. Cannot render deals.");
        return;
    }
    dealsContainer.innerHTML = '';
    if (!dealsToRender || dealsToRender.length === 0) {
        showNoDealsMessage(currentSearchTerm, currentSelectedCategory);
        return;
    }

    const ENDING_SOON_THRESHOLD_DAYS = 2; // Expires within next 2 days (today or tomorrow)

    dealsToRender.forEach((deal, index) => {
        const dealCard = document.createElement('div');
        dealCard.classList.add('deal-card');
        dealCard.style.animationDelay = `${index * 0.05}s`;

        const imageUrl = deal.imageUrl || getPlaceholderImage(deal.category);
        const imageAlt = deal.itemName || 'Deal product image';
        const placeholderOnError = getPlaceholderImage(null);
        const imageErrorScript = `this.onerror=null; this.src='${placeholderOnError}'; this.alt='Placeholder image';`;

        let endingSoonIndicatorHTML = '';
        if (deal.bestBefore) {
            try {
                // Ensure date is parsed as local by adding time component if not present
                const bestBeforeDate = new Date(deal.bestBefore.includes('T') ? deal.bestBefore : deal.bestBefore + 'T00:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Set to midnight for fair comparison

                const timeDiff = bestBeforeDate.getTime() - today.getTime();
                const daysDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));

                if (daysDifference >= 0 && daysDifference < ENDING_SOON_THRESHOLD_DAYS) {
                    let expiryMessage = 'Expires Soon!';
                    if (daysDifference === 0) {
                        expiryMessage = 'Expires Today!';
                    } else if (daysDifference === 1) {
                        expiryMessage = 'Expires Tomorrow!';
                    }
                    endingSoonIndicatorHTML = `<span class="ending-soon-indicator">${expiryMessage}</span>`;
                }
            } catch (e) {
                console.warn('Error parsing bestBefore date for deal:', deal.id, deal.bestBefore, e);
            }
        }

        dealCard.innerHTML = `
            <div class="deal-card-image-container">
                ${endingSoonIndicatorHTML}
                <img src="${imageUrl}" alt="${imageAlt}" loading="lazy" onerror="${imageErrorScript}">
            </div>
            <div class="deal-card-content">
                <h3>${deal.itemName}</h3>
                <p class="business-name" title="${deal.businessName} - ${deal.location}">
                    <i class="fas fa-store-alt" aria-hidden="true"></i> ${deal.businessName} - ${deal.location}
                </p>
                <div class="price-container">
                    <span class="price">R${deal.discountedPrice.toFixed(2)}</span>
                    ${deal.originalPrice ? `<span class="original-price">R${deal.originalPrice.toFixed(2)}</span>` : ''}
                </div>
                <p class="best-before" title="Best Before Date">
                    <i class="far fa-calendar-alt" aria-hidden="true"></i> ${formatDate(deal.bestBefore)}
                </p>
                <p class="description">${deal.description}</p>
                <button class="view-deal-btn" data-deal-id="${deal.id}" aria-label="View details for ${deal.itemName}">
                    <i class="fas fa-eye" aria-hidden="true"></i> View Deal
                </button>
            </div>
        `;
        dealsContainer.appendChild(dealCard);
    });

    attachViewDealListeners();
}

function attachViewDealListeners() {
    if (!dealsContainer || !viewDealHandler) return;
    dealsContainer.querySelectorAll('.view-deal-btn').forEach(button => {
        // Remove existing listener to prevent duplicates if re-rendered
        button.removeEventListener('click', handleViewDealButtonClick);
        button.addEventListener('click', handleViewDealButtonClick);
    });
}

function handleViewDealButtonClick(event) {
    const dealId = event.currentTarget.dataset.dealId;
    if (dealId && viewDealHandler) { // viewDealHandler is the callback from app.js
        viewDealHandler(dealId, event.currentTarget); // Pass the button element
    }
}


export function updateCategoryFilterVisuals(selectedCategory) {
    if (!categoryFilter) return;
    if (selectedCategory !== 'all') {
        categoryFilter.classList.add('has-filter');
    } else {
        categoryFilter.classList.remove('has-filter');
    }
}

export function initUI(applyFiltersCallback, clearFiltersCallback, viewDealCallbackFromApp) {
    dealsContainer = document.getElementById('deals-container');
    searchInput = document.getElementById('searchInput');
    categoryFilter = document.getElementById('categoryFilter');
    sortDealsSelect = document.getElementById('sortDeals');
    clearFiltersBtn = document.getElementById('clearFiltersBtn');

    if (!dealsContainer) console.warn("Element #deals-container not found.");
    if (!searchInput) console.warn("Element #searchInput not found.");
    if (!categoryFilter) console.warn("Element #categoryFilter not found.");
    if (!sortDealsSelect) console.warn("Element #sortDeals not found.");
    if (!clearFiltersBtn) console.warn("Element #clearFiltersBtn not found.");

    viewDealHandler = viewDealCallbackFromApp; // Store the callback for view deal buttons
    filterAndRenderCallbackGlobal = applyFiltersCallback; // Store for showNoDealsMessage links

    if (searchInput) searchInput.addEventListener('input', applyFiltersCallback);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFiltersCallback);
    if (sortDealsSelect) sortDealsSelect.addEventListener('change', applyFiltersCallback);
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearFiltersCallback);

    console.log("UI event listeners initialized.");
}

// Function to get current filter values from UI elements
export function getFilterValues() {
    const searchTerm = searchInput ? searchInput.value : '';
    const category = categoryFilter ? categoryFilter.value : 'all';
    const sortBy = sortDealsSelect ? sortDealsSelect.value : 'default';
    return { searchTerm, category, sortBy };
}

// Function to set filter values in UI elements (used by loadFilters)
export function setFilterValues(filters) {
    if (searchInput && typeof filters.searchTerm !== 'undefined') searchInput.value = filters.searchTerm;
    if (categoryFilter && typeof filters.category !== 'undefined') categoryFilter.value = filters.category;
    if (sortDealsSelect && typeof filters.sortBy !== 'undefined') sortDealsSelect.value = filters.sortBy;
}

// --- PWA Update Notification UI ---
export function showUpdateNotification() {
    const notificationDiv = document.getElementById('updateNotification');
    const refreshButton = document.getElementById('refreshAppBtn');

    if (notificationDiv && refreshButton) {
        notificationDiv.style.display = 'flex'; // Make it visible
        setTimeout(() => { // Allow display property to take effect before transition
            notificationDiv.classList.add('show');
        }, 10);


        refreshButton.addEventListener('click', () => {
            window.location.reload();
        });

        // Optional: Allow dismissing the notification (not in current plan, but good for UX)
        // const dismissButton = document.createElement('button');
        // ... setup dismiss button ...
        // notificationDiv.appendChild(dismissButton);
        // dismissButton.addEventListener('click', () => {
        // notificationDiv.classList.remove('show');
        // setTimeout(() => notificationDiv.style.display = 'none', 300); // Hide after transition
        // });
    } else {
        console.warn('PWA update notification elements not found.');
    }
}

/**
 * Displays a toast notification message.
 *
 * @param {string} message The message to display.
 * @param {'success' | 'error'} type The type of toast (success or error).
 * @param {number} duration The duration in milliseconds for the toast to be visible.
 */
export function showToast(message, type = 'success', duration = 3000) {
    let toastContainer = document.getElementById('toast-container');

    // Create container if it doesn't exist
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

/**
 * Sets the loading state for a button.
 *
 * @param {HTMLButtonElement} buttonElement The button element.
 * @param {boolean} isLoading Whether the button should be in a loading state.
 */
export function setButtonLoadingState(buttonElement, isLoading) {
    if (!buttonElement) return;

    if (isLoading) {
        // Store original HTML only if it hasn't been stored yet
        if (!buttonElement.dataset.originalHtml) {
            buttonElement.dataset.originalHtml = buttonElement.innerHTML;
        }
        buttonElement.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> <span class="btn-loading-text">Loading...</span>`;
        buttonElement.disabled = true;
    } else {
        // Restore original HTML if it was stored
        if (buttonElement.dataset.originalHtml) {
            buttonElement.innerHTML = buttonElement.dataset.originalHtml;
            // Clear the stored attribute after restoring
            delete buttonElement.dataset.originalHtml;
        }
        // Even if originalHTML wasn't set (e.g. if called with isLoading=false initially),
        // ensure disabled is false.
        buttonElement.disabled = false;
    }
}
