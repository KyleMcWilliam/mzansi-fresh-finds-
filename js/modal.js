// Modal handling
import { formatDate, getPlaceholderImage } from './utils.js';

// --- DOM Elements ---
let dealModal, modalImage, modalTitle, modalBusiness, modalPrice, modalOriginalPrice, modalBestBefore, modalDescription, modalContact, closeModalButtons;
// New elements for added details
let modalStoreAddress, modalQuantityAvailable, modalPickupInstructions, modalMapViewLink;

// --- State ---
let previouslyFocusedElement;
let modalOpen = false;
// let currentGetDealById; // No longer needed here as deal object is passed directly

function populateModal(deal) {
    if (!deal) {
        console.error("Deal data is undefined, cannot populate modal.");
        modalTitle.textContent = "Error";
        modalDescription.textContent = "Could not load deal details.";
        modalImage.src = getPlaceholderImage(null);
        modalImage.alt = 'Error loading image';
        if (modalBusiness) modalBusiness.innerHTML = `<i class="fas fa-store-alt"></i> Unknown Store`;
        if (modalStoreAddress) modalStoreAddress.innerHTML = `<i class="fas fa-map-marker-alt"></i> Address not available`;
        if (modalPrice) modalPrice.textContent = 'N/A';
        if (modalOriginalPrice) modalOriginalPrice.textContent = '';
        if (modalBestBefore) modalBestBefore.innerHTML = `<i class="far fa-calendar-alt"></i> Date not available`;
        if (modalQuantityAvailable) modalQuantityAvailable.innerHTML = `<i class="fas fa-cubes"></i> Quantity: Not specified`;
        if (modalPickupInstructions) modalPickupInstructions.textContent = 'Pickup details not available.';
        if (modalContact) modalContact.textContent = 'Contact details not available.';
        if (modalMapViewLink) modalMapViewLink.style.display = 'none';
        return;
    }

    // Existing fields
    modalImage.src = deal.imageURL || (deal.store && deal.store.logoURL) || getPlaceholderImage(deal.category);
    modalImage.alt = deal.itemName || 'Deal product image';
    modalTitle.textContent = deal.itemName || 'Deal Title Not Available';

    if (deal.store && deal.store.storeName) {
        modalBusiness.innerHTML = `<i class="fas fa-store-alt"></i> ${deal.store.storeName}`;
    } else {
        modalBusiness.innerHTML = `<i class="fas fa-store-alt"></i> Unknown Store`;
    }

    modalPrice.textContent = deal.discountedPrice ? `R${deal.discountedPrice.toFixed(2)}` : 'Price not available';
    if (deal.originalPrice) {
        modalOriginalPrice.textContent = `R${deal.originalPrice.toFixed(2)}`;
        modalOriginalPrice.style.display = 'inline';
    } else {
        modalOriginalPrice.textContent = '';
        modalOriginalPrice.style.display = 'none';
    }
    modalBestBefore.innerHTML = `<i class="far fa-calendar-alt"></i> Best Before: ${deal.bestBeforeDate ? formatDate(deal.bestBeforeDate) : 'Date not available'}`;
    modalDescription.textContent = deal.description || 'No description provided.';

    // Populate new fields
    if (deal.store && deal.store.address) {
        modalStoreAddress.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${deal.store.address}`;
    } else {
        modalStoreAddress.innerHTML = `<i class="fas fa-map-marker-alt"></i> Address not available`;
    }

    if (deal.quantityAvailable !== undefined && deal.quantityAvailable !== null) {
        modalQuantityAvailable.innerHTML = `<i class="fas fa-cubes"></i> Quantity: ${deal.quantityAvailable}`;
    } else {
        modalQuantityAvailable.innerHTML = `<i class="fas fa-cubes"></i> Quantity: Not specified`;
    }

    if (deal.pickupInstructions) {
        modalPickupInstructions.textContent = deal.pickupInstructions;
    } else {
        modalPickupInstructions.textContent = 'Check with store for pickup details.';
    }

    // Configure "View on Map" link
    let mapUrl = '';
    if (deal.store) {
        if (deal.store.latitude && deal.store.longitude) {
            mapUrl = `https://www.google.com/maps?q=${deal.store.latitude},${deal.store.longitude}`;
        } else if (deal.store.address) {
            mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(deal.store.address)}`;
        }
    }

    if (mapUrl && modalMapViewLink) {
        modalMapViewLink.href = mapUrl;
        modalMapViewLink.style.display = 'block'; // Or 'inline-block' based on your CSS for .button-style
    } else if (modalMapViewLink) {
        modalMapViewLink.style.display = 'none';
    }

    // Optional: Contact details - Assuming deal.contact refers to a generic contact string
    // If deal.store.contactNumber or similar exists, you might prefer that.
    if (deal.contact) { // This field was in the original modal, assuming it's still relevant
        modalContact.textContent = deal.contact;
    } else if (deal.store && deal.store.contactNumber) { // Example if contact is on store object
        modalContact.textContent = `Tel: ${deal.store.contactNumber}`;
    }
    else {
        modalContact.textContent = 'Contact details not provided.';
    }
}

// Changed to accept deal object directly, as app.js passes the full object
export function populateModalWithDeal(deal) {
    if (deal) {
        populateModal(deal);
    } else {
        console.error("Deal object is null or undefined in populateModalWithDeal.");
        populateModal(null); // Pass null to show generic error in modal
    }
}

export function openModal() {
    if (modalOpen || !dealModal) return;
    modalOpen = true;
    previouslyFocusedElement = document.activeElement;
    dealModal.removeAttribute('hidden');
    void dealModal.offsetWidth; // Force repaint/reflow
    dealModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    const closeButton = dealModal.querySelector('.modal-close');
    if (closeButton) {
        closeButton.focus();
    }
    dealModal.addEventListener('keydown', trapFocusInModal);
}

export function closeModal() {
    if (!modalOpen || !dealModal) return;
    modalOpen = false;
    dealModal.classList.remove('is-open');

    const handleTransitionEnd = () => {
        dealModal.setAttribute('hidden', 'true');
        document.body.style.overflow = '';
        if (previouslyFocusedElement) {
            previouslyFocusedElement.focus();
        }
        dealModal.removeEventListener('transitionend', handleTransitionEnd);
    };

    dealModal.addEventListener('transitionend', handleTransitionEnd);
    dealModal.removeEventListener('keydown', trapFocusInModal);
}

function trapFocusInModal(e) {
    if (!dealModal) return;
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableContent = Array.from(dealModal.querySelectorAll(focusableElements));
    const visibleFocusableContent = focusableContent.filter(el => el.offsetParent !== null);

    if (visibleFocusableContent.length === 0) return;

    const firstFocusableElement = visibleFocusableContent[0];
    const lastFocusableElement = visibleFocusableContent[visibleFocusableContent.length - 1];

    if (e.key === 'Escape') {
        closeModal();
        return;
    }
    if (e.key === 'Tab') {
        if (e.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
                lastFocusableElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastFocusableElement) {
                firstFocusableElement.focus();
                e.preventDefault();
            }
        }
    }
}

export function initModal() { // Removed getDealByIdFunction as it's no longer used here
    dealModal = document.getElementById('dealModal');
    if (!dealModal) {
        console.warn("Modal element #dealModal not found. Modal functionality will be disabled.");
        return;
    }
    // Existing elements
    modalImage = document.getElementById('modalImage');
    modalTitle = document.getElementById('modalTitle');
    modalBusiness = document.getElementById('modalBusiness');
    modalPrice = document.getElementById('modalPrice');
    modalOriginalPrice = document.getElementById('modalOriginalPrice');
    modalBestBefore = document.getElementById('modalBestBefore');
    modalDescription = document.getElementById('modalDescription');
    modalContact = document.getElementById('modalContact'); // Assuming this is for general contact info

    // New elements
    modalStoreAddress = document.getElementById('modalStoreAddress');
    modalQuantityAvailable = document.getElementById('modalQuantityAvailable');
    modalPickupInstructions = document.getElementById('modalPickupInstructions');
    modalMapViewLink = document.getElementById('modalMapViewLink');

    closeModalButtons = dealModal.querySelectorAll('[data-micromodal-close]');

    // currentGetDealById = getDealByIdFunction; // Removed

    if (!modalImage || !modalTitle || !modalBusiness || !modalPrice || !modalOriginalPrice || !modalBestBefore || !modalDescription || !modalContact || !modalStoreAddress || !modalQuantityAvailable || !modalPickupInstructions || !modalMapViewLink) {
        console.error("One or more modal elements could not be found. Check IDs in initModal and index.html.");
        // You might want to prevent modal opening if essential elements are missing
        // For now, it will try to work with what it has.
    }


    closeModalButtons.forEach(button => button.addEventListener('click', closeModal));
    dealModal.addEventListener('click', (event) => {
        // Check if the click is on the overlay itself (modal-overlay) or the modal container (dealModal if it's the direct parent)
        // This ensures clicking inside modal content doesn't close it.
        if (event.target === dealModal.querySelector('.modal-overlay') || event.target === dealModal) {
            closeModal();
        }
    });
    console.log("Modal system initialized.");
}

// Make openDealModal available for app.js if needed, though direct call to populate and open is better
// export function openDealModal(dealId) {
//     populateModalWithDeal(dealId);
//     openModal();
// }
// No specific export needed for openDealModal as app.js will call populateModalWithDeal and openModal directly.
