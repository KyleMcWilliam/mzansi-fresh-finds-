// Modal handling
import { formatDate, getPlaceholderImage } from './utils.js';

// --- DOM Elements ---
let dealModal, modalImage, modalTitle, modalBusiness, modalPrice, modalOriginalPrice, modalBestBefore, modalDescription, modalContact, closeModalButtons;

// --- State ---
let previouslyFocusedElement;
let modalOpen = false;
let currentGetDealById; // To store the function that gets deal data

function populateModal(deal) {
    if (!deal) {
        console.error("Deal data is undefined, cannot populate modal.");
        // Optionally, display an error in the modal itself
        modalTitle.textContent = "Error";
        modalDescription.textContent = "Could not load deal details.";
        modalImage.src = getPlaceholderImage(null);
        modalImage.alt = 'Error loading image';
        modalBusiness.textContent = '';
        modalPrice.textContent = '';
        modalOriginalPrice.textContent = '';
        modalBestBefore.textContent = '';
        modalContact.textContent = '';
        return;
    }
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

export function populateModalWithDeal(dealId) {
    if (!currentGetDealById) {
        console.error("getDealById function not initialized in modal module.");
        return;
    }
    const deal = currentGetDealById(dealId);
    if (deal) {
        populateModal(deal);
    } else {
        console.error("Deal not found for ID:", dealId);
        // Optionally, populate modal with an error message
        populateModal(null); // Pass null to show generic error
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

export function initModal(getDealByIdFunction) {
    dealModal = document.getElementById('dealModal');
    if (!dealModal) {
        console.warn("Modal element #dealModal not found. Modal functionality will be disabled.");
        return;
    }
    modalImage = document.getElementById('modalImage');
    modalTitle = document.getElementById('modalTitle');
    modalBusiness = document.getElementById('modalBusiness');
    modalPrice = document.getElementById('modalPrice');
    modalOriginalPrice = document.getElementById('modalOriginalPrice');
    modalBestBefore = document.getElementById('modalBestBefore');
    modalDescription = document.getElementById('modalDescription');
    modalContact = document.getElementById('modalContact');
    closeModalButtons = dealModal.querySelectorAll('[data-micromodal-close]');

    currentGetDealById = getDealByIdFunction;

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
