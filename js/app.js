// Main application orchestrator
import { FILTERS_STORAGE_KEY } from './config.js';
import * as deals from './deals.js';
import * as ui from './ui.js';
import * as modal from './modal.js';

const DEALS_JSON_PATH = 'data/deals.json';

// --- DOM Elements ---
let currentYearSpan;
let scrollToTopBtn;
let dealsContainer; // For error messages during init

// --- PWA Service Worker Registration ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(registration => {
                console.log('[SW] Registered with scope:', registration.scope);
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('[SW] Update found. New worker installing.');
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            ui.showUpdateNotification();
                        }
                    });
                });
            })
            .catch(error => console.error('[SW] Registration failed:', error));
        navigator.serviceWorker.ready.then(reg => console.log('[SW] Ready'));
    }
}

// --- Filter Persistence (LocalStorage) ---
function saveFilterSettings() {
    try {
        const { searchTerm, category, sortBy } = ui.getFilterValues();
        const filters = { searchTerm, category, sortBy };
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
        console.warn("Could not save filters to localStorage:", e);
    }
}

function loadFilterSettings() {
    try {
        const savedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
        if (savedFilters) {
            const filters = JSON.parse(savedFilters);
            ui.setFilterValues(filters);
            ui.updateCategoryFilterVisuals(filters.category || 'all');
        }
    } catch (e) {
        console.warn("Could not load filters from localStorage:", e);
    }
}

// --- Core Application Logic ---
function applyAndSaveFilters() {
    ui.showSkeletonLoaders(); // Show skeletons before filtering and rendering
    const { searchTerm, category, sortBy } = ui.getFilterValues();

    // Using a small timeout to ensure skeleton loaders are visible before potential blocking operations
    setTimeout(() => {
        const filteredAndSortedDeals = deals.getFilteredAndSortedDeals(searchTerm, category, sortBy);
        ui.renderDeals(filteredAndSortedDeals, searchTerm, category);
        ui.updateCategoryFilterVisuals(category);
        saveFilterSettings();
    }, 50); // Adjust timeout as needed, or remove if not necessary
}

function clearAllFilters() {
    ui.setFilterValues({ searchTerm: '', category: 'all', sortBy: 'default' });
    applyAndSaveFilters();
}

function handleViewDeal(dealId) {
    modal.populateModalWithDeal(dealId); // modal.js now fetches the deal by ID
    modal.openModal();
}

// --- Scroll to Top Button Logic ---
function initializeScrollToTop() {
    scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) { clearTimeout(scrollTimeout); }
            scrollTimeout = setTimeout(() => {
                if (window.scrollY > 200) {
                    scrollToTopBtn.classList.add('show');
                } else {
                    scrollToTopBtn.classList.remove('show');
                }
            }, 150);
        }, { passive: true });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        console.log("Scroll-to-top initialized.");
    } else {
        console.warn("Scroll-to-top button #scrollToTopBtn not found.");
    }
}

// --- Initial Setup ---
async function initializeApp() {
    dealsContainer = document.getElementById('deals-container'); // For error messages
    currentYearSpan = document.getElementById('currentYear');

    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    registerServiceWorker();
    ui.showSkeletonLoaders(); // Show skeleton loaders early

    try {
        await deals.fetchDeals(DEALS_JSON_PATH);
    } catch (error) {
        console.error("Failed to fetch initial deal data:", error);
        if(dealsContainer) {
            dealsContainer.innerHTML = `<p class="error-message">Could not load deals. Please check your connection and try again later.</p>`;
        }
        // App can continue with empty data, or you can stop initialization here
        // For now, we let it continue so UI setup still happens.
    }

    // Initialize UI components and event listeners
    // Callbacks are passed: 1. for applying filters, 2. for clearing filters, 3. for viewing a deal
    ui.initUI(applyAndSaveFilters, clearAllFilters, handleViewDeal);

    // Initialize modal system, passing the function to get a deal by its ID
    modal.initModal(deals.getDealById);

    loadFilterSettings(); // Load filters from localStorage and apply them to UI
    applyAndSaveFilters(); // Perform initial filter and render

    initializeScrollToTop(); // Setup scroll-to-top button functionality

    console.log("Mzansi Fresh Finds Initialized (Modular)!");
}

// --- Run Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(error => {
        console.error("Critical error during app initialization:", error);
        if (dealsContainer) {
            dealsContainer.innerHTML = `<p class="error-message">Application failed to initialize due to a critical error. Please refresh the page or contact support.</p>`;
        } else {
            document.body.innerHTML = `<p class="error-message" style="text-align: center; padding: 20px;">Application failed to initialize. Please refresh the page.</p>`;
        }
    });
});
