// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const dealsContainer = document.getElementById('deals-container');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortDealsSelect = document.getElementById('sortDeals');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const currentYearSpan = document.getElementById('currentYear');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');

    // Modal Elements
    const dealModal = document.getElementById('dealModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalBusiness = document.getElementById('modalBusiness');
    const modalPrice = document.getElementById('modalPrice');
    const modalOriginalPrice = document.getElementById('modalOriginalPrice');
    const modalBestBefore = document.getElementById('modalBestBefore');
    const modalDescription = document.getElementById('modalDescription');
    const modalContact = document.getElementById('modalContact');
    const closeModalButtons = dealModal.querySelectorAll('[data-micromodal-close]');

    // --- State & Constants ---
    const FILTERS_STORAGE_KEY = 'mzansiFreshFinds_filters_v1'; // Added versioning
    let currentDealsData = []; // To store the raw deals for sorting/filtering
    let previouslyFocusedElement; // For modal accessibility

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(registration => {
                console.log('[SW] Registered with scope:', registration.scope);
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('[SW] Update found. New worker installing.');
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          console.log('[SW] New content available. Refresh recommended.');
                        }
                    });
                });
            })
            .catch(error => console.error('[SW] Registration failed:', error));
        
        navigator.serviceWorker.ready.then(reg => console.log('[SW] Ready'));
    }


    // --- Utility Functions ---
    function formatDate(dateString) {
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

    function getPlaceholderImage(category) {
        const basePath = 'images/';
        switch (category?.toLowerCase()) { // Added safety check for category
            case 'bakery': return `${basePath}placeholder-bakery.png`;
            case 'fruitveg': return `${basePath}placeholder-fruitveg.png`;
            case 'dairy': return `${basePath}placeholder-dairy.png`;
            case 'meat': return `${basePath}placeholder-meat.png`;
            case 'prepared': return `${basePath}placeholder-prepared.png`;
            case 'pantry': return `${basePath}placeholder-pantry.png`;
            default: return `${basePath}placeholder-food.png`;
        }
    }

    // --- Sample Data ---
    // In a real app, this would be fetched via API
    const sampleDeals = [
        { id: 1, itemName: "Artisan Sourdough Loaf (Slightly Imperfect)", businessName: "The Daily Rise Bakery", originalPrice: 65.00, discountedPrice: 30.00, bestBefore: "2024-08-05", location: "Melville, JHB", description: "Still incredibly fresh and delicious! Perfect for toast, sandwiches, or with soup. Just a bit misshapen but full of flavour.", imageUrl: null, category: "bakery", contact: "Call us: 011-123-4567 or visit us at 12 Main Rd, Melville." },
        { id: 2, itemName: "Organic Avocado Box (3 Ripe)", businessName: "Green Earth Organics", originalPrice: 70.00, discountedPrice: 40.00, bestBefore: "2024-08-03", location: "Braamfontein, JHB", description: "Creamy and ready to eat! Ideal for guacamole, salads, or on toast. Slight blemishes on skin, but perfect inside. Limited stock!", imageUrl: null, category: "fruitveg", contact: "Email: orders@greenearth.co.za | Pickup only." },
        { id: 3, itemName: "Free-Range Chicken Portions (Mixed)", businessName: "Honest Harvest Meats", originalPrice: 120.00, discountedPrice: 75.00, bestBefore: "2024-08-04", location: "Sandton City Farmers Market (Sat only)", description: "Excellent quality free-range chicken pieces, including thighs and drumsticks. Perfect for a quick roast or braai. Selling fast today!", imageUrl: null, category: "meat", contact: "Find us at Stall 12, Sandton Market, Saturday 9am-2pm." },
        { id: 4, itemName: "Gourmet Yoghurt Selection (4-Pack)", businessName: "The Creamery Co.", originalPrice: 80.00, discountedPrice: 45.00, bestBefore: "2024-08-07", location: "Parkhurst, JHB", description: "Assorted artisanal yoghurt flavours: Strawberry Bliss, Vanilla Bean, Mango Tango, and Berry Burst. A real treat for breakfast or dessert.", imageUrl: null, category: "dairy", contact: "WhatsApp your order to: 082-111-2222 for collection." },
        { id: 5, itemName: "Pasta Night Kit (Sauce & Fresh Pasta)", businessName: "Nonna's Pantry", originalPrice: 95.00, discountedPrice: 50.00, bestBefore: "2024-08-06", location: "Norwood, JHB", description: "Authentic Italian arrabbiata sauce (spicy!) and 500g fresh egg tagliatelle. Enough for 2-3 people. Dinner sorted!", imageUrl: null, category: "prepared", contact: "Nonna's Pantry, 45 Grant Ave. Open till 6 PM." },
        { id: 6, itemName: "Bulk Wholewheat Flour (5kg)", businessName: "The Millstone Collective", originalPrice: 150.00, discountedPrice: 90.00, bestBefore: "2024-08-15", location: "Online / Randburg Depot", description: "Stoneground wholewheat flour, nearing its best before but still perfect for baking. Great value for bulk buyers. Collect from our Randburg depot.", imageUrl: null, category: "pantry", contact: "Order online: millstone.co.za/clearance | Collection by appointment." },
         { id: 7, itemName: "Cheddar Cheese Block (1kg)", businessName: "Dairy Direct", originalPrice: 130.00, discountedPrice: 85.00, bestBefore: "2024-08-10", location: "Fourways Crossing", description: "Mature cheddar block, great flavour. Perfect for slicing, grating, or cooking. Approaching best before.", imageUrl: null, category: "dairy", contact: "Visit our store at Fourways Crossing, Shop 15." }
    ];
    currentDealsData = sampleDeals; // Load initial data


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

    function showSkeletonLoaders(count = 6) {
        dealsContainer.innerHTML = ''; 
        for (let i = 0; i < count; i++) {
            dealsContainer.appendChild(createSkeletonCard());
        }
    }
    
    function showNoDealsMessage(searchTerm, selectedCategory) {
        let message = `<p>No fresh finds match your current criteria.</p>`;
        if (searchTerm || selectedCategory !== 'all') {
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
                categoryFilter.value = e.target.dataset.categoryLink;
                applyAndSaveFilters(); 
            });
        });
    }

    function renderDeals(dealsToRender) {
        dealsContainer.innerHTML = ''; 
        if (!dealsToRender || dealsToRender.length === 0) {
            showNoDealsMessage(searchInput.value, categoryFilter.value);
            return;
        }

        dealsToRender.forEach((deal, index) => {
            const dealCard = document.createElement('div');
            dealCard.classList.add('deal-card');
            dealCard.style.animationDelay = `${index * 0.05}s`; 

            const imageUrl = deal.imageUrl || getPlaceholderImage(deal.category);
            const imageAlt = deal.itemName || 'Deal product image';
            const imageErrorScript = `this.onerror=null; this.src='${getPlaceholderImage(null)}'; this.alt='Placeholder image';`;

            dealCard.innerHTML = `
                <div class="deal-card-image-container">
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
            `; // REMOVED the stray comment from the end of the business-name paragraph line above
            dealsContainer.appendChild(dealCard);
        });

        // Re-attach event listeners after rendering
        attachViewDealListeners();
    }

    function attachViewDealListeners() {
         dealsContainer.querySelectorAll('.view-deal-btn').forEach(button => {
            button.removeEventListener('click', handleViewDealClick); 
            button.addEventListener('click', handleViewDealClick);
        });
    }

    // --- Sorting Logic ---
    function sortDeals(deals, sortBy) {
        switch (sortBy) {
            case 'price-asc':
                return [...deals].sort((a, b) => a.discountedPrice - b.discountedPrice);
            case 'price-desc':
                return [...deals].sort((a, b) => b.discountedPrice - a.discountedPrice);
            case 'ending-soon':
                return [...deals].sort((a, b) => {
                    const dateA = a.bestBefore ? new Date(a.bestBefore + 'T00:00:00') : new Date('9999-12-31'); // Add time to avoid timezone issues
                    const dateB = b.bestBefore ? new Date(b.bestBefore + 'T00:00:00') : new Date('9999-12-31');
                    const timeA = !isNaN(dateA.getTime()) ? dateA.getTime() : Infinity;
                    const timeB = !isNaN(dateB.getTime()) ? dateB.getTime() : Infinity;
                    return timeA - timeB;
                });
            default:
                return deals; 
        }
    }

    // --- Filtering & Rendering Orchestration ---
    function applyFiltersAndRender() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedCategory = categoryFilter.value;
        const sortBy = sortDealsSelect.value;

        showSkeletonLoaders(6); 

        setTimeout(() => { 
            // 1. Filter
            let filteredDeals = currentDealsData.filter(deal => {
                const matchesSearch = !searchTerm || (
                    (deal.itemName && deal.itemName.toLowerCase().includes(searchTerm)) ||
                    (deal.businessName && deal.businessName.toLowerCase().includes(searchTerm)) ||
                    (deal.description && deal.description.toLowerCase().includes(searchTerm))
                );
                const matchesCategory = selectedCategory === 'all' || deal.category?.toLowerCase() === selectedCategory;
                return matchesSearch && matchesCategory;
            });

            // 2. Sort
            const sortedDeals = sortDeals(filteredDeals, sortBy);

            // 3. Render
            renderDeals(sortedDeals);

            // 4. Update visual feedback for category filter
            updateCategoryFilterVisuals(selectedCategory);

        }, 300); 
    }

    // --- Visual Feedback for Filters ---
    function updateCategoryFilterVisuals(selectedCategory) {
        if (selectedCategory !== 'all') {
            categoryFilter.classList.add('has-filter');
        } else {
            categoryFilter.classList.remove('has-filter');
        }
    }

    // --- Modal Logic ---
    function handleViewDealClick(event) {
        const dealId = parseInt(event.currentTarget.dataset.dealId);
        const deal = currentDealsData.find(d => d.id === dealId); 
        if (deal) {
            populateModal(deal);
            openModal();
        } else {
            console.error("Deal not found for ID:", dealId);
        }
    }

    function populateModal(deal) {
        modalImage.src = deal.imageUrl || getPlaceholderImage(deal.category);
        modalImage.alt = deal.itemName || 'Deal product image';
        modalTitle.textContent = deal.itemName;
        modalBusiness.innerHTML = `<i class="fas fa-store-alt" aria-hidden="true"></i> ${deal.businessName} - ${deal.location}`;
        modalPrice.textContent = `R${deal.discountedPrice.toFixed(2)}`;
        modalOriginalPrice.textContent = deal.originalPrice ? `R${deal.originalPrice.toFixed(2)}` : '';
        modalOriginalPrice.style.display = deal.originalPrice ? 'inline' : 'none';
        modalBestBefore.innerHTML = `<i class="far fa-calendar-alt" aria-hidden="true"></i> Best Before: ${formatDate(deal.bestBefore)}`;
        modalDescription.textContent = deal.description;
        modalContact.textContent = deal.contact;
    }

    let modalOpen = false; // Track modal state

    function openModal() {
        if (modalOpen) return; // Prevent double opening
        modalOpen = true;
        previouslyFocusedElement = document.activeElement;
        dealModal.removeAttribute('hidden');
        
        // Force repaint/reflow before adding class for transition
        void dealModal.offsetWidth; 

        dealModal.classList.add('is-open');
        document.body.style.overflow = 'hidden'; 
        dealModal.querySelector('.modal-close').focus(); 
        dealModal.addEventListener('keydown', trapFocusInModal);
    }

    function closeModal() {
        if (!modalOpen) return; // Prevent double closing
        modalOpen = false;
        dealModal.classList.remove('is-open');
        
        const handleTransitionEnd = () => {
            dealModal.setAttribute('hidden', 'true');
            document.body.style.overflow = '';
            if (previouslyFocusedElement) {
                previouslyFocusedElement.focus();
            }
             dealModal.removeEventListener('transitionend', handleTransitionEnd); // Clean up listener
        };
        
        dealModal.addEventListener('transitionend', handleTransitionEnd);
        dealModal.removeEventListener('keydown', trapFocusInModal);
    }

    function trapFocusInModal(e) {
        const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableContent = Array.from(dealModal.querySelectorAll(focusableElements));
        const visibleFocusableContent = focusableContent.filter(el => el.offsetParent !== null); // Only visible ones
        
        if (visibleFocusableContent.length === 0) return;

        const firstFocusableElement = visibleFocusableContent[0];
        const lastFocusableElement = visibleFocusableContent[visibleFocusableContent.length - 1];

        if (e.key === 'Escape') {
            closeModal(); return;
        }
        if (e.key === 'Tab') {
            if (e.shiftKey) { 
                if (document.activeElement === firstFocusableElement) {
                    lastFocusableElement.focus(); e.preventDefault();
                }
            } else { 
                if (document.activeElement === lastFocusableElement) {
                    firstFocusableElement.focus(); e.preventDefault();
                }
            }
        }
    }

    // --- Filter Persistence (LocalStorage) ---
    function saveFilters() {
        try {
            const filters = {
                searchTerm: searchInput.value,
                category: categoryFilter.value,
                sortBy: sortDealsSelect.value
            };
            localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
        } catch (e) {
            console.warn("Could not save filters to localStorage:", e);
        }
    }

    function loadFilters() {
         try {
            const savedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
            if (savedFilters) {
                const filters = JSON.parse(savedFilters);
                searchInput.value = filters.searchTerm || '';
                categoryFilter.value = filters.category || 'all';
                sortDealsSelect.value = filters.sortBy || 'default';
                updateCategoryFilterVisuals(categoryFilter.value); 
            }
        } catch (e) {
            console.warn("Could not load filters from localStorage:", e);
        }
    }

    function clearFilters() {
        searchInput.value = '';
        categoryFilter.value = 'all';
        sortDealsSelect.value = 'default';
        applyAndSaveFilters(); 
    }

    // Combined function for filter changes
    function applyAndSaveFilters() {
        saveFilters();
        applyFiltersAndRender();
    }

    // --- Scroll to Top Button Logic ---
    if(scrollToTopBtn) {
        let scrollTimeout;
        window.addEventListener('scroll', () => { // Use addEventListener
            if (scrollTimeout) { clearTimeout(scrollTimeout); }
            scrollTimeout = setTimeout(() => {
                 if (window.scrollY > 200) { // Use window.scrollY
                    scrollToTopBtn.classList.add('show');
                } else {
                    scrollToTopBtn.classList.remove('show');
                }
            }, 150); // Adjust debounce timing if needed
        }, { passive: true }); // Improve scroll performance

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Initial Setup ---
    function initializeApp() {
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
        loadFilters();
        applyFiltersAndRender(); // Initial render

        // Attach Event Listeners only once
        searchInput.addEventListener('input', applyAndSaveFilters);
        categoryFilter.addEventListener('change', applyAndSaveFilters);
        sortDealsSelect.addEventListener('change', applyAndSaveFilters);
        clearFiltersBtn.addEventListener('click', clearFilters);

        closeModalButtons.forEach(button => button.addEventListener('click', closeModal));
        dealModal.addEventListener('click', (event) => {
            if (event.target === dealModal.querySelector('.modal-overlay') || event.target === dealModal) {
                closeModal();
            }
        });
        
        console.log("Mzansi Fresh Finds Initialized!");
    }

    // --- Run Initialization ---
    initializeApp();

}); // End DOMContentLoaded