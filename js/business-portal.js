// js/business-portal.js

// --- Helper: Check current page ---
function isPage(pageName) {
    return document.body.id === pageName || window.location.pathname.endsWith(pageName);
}

// --- Global Listings Array ---
// Exported for testing purposes, in a real app, this might be managed by a more robust state solution.
export let currentListings = [];

// --- DOM Element References (initialized in initBusinessPortal) ---
let addNewListingBtn, listingModal, listingForm, closeModalElements, listingsContainer, noListingsMessage, loginForm, signupForm;

// --- Main Initialization Function ---
export function initBusinessPortal() {
    console.log("Business Portal script initializing...");

    if (isPage('business-login.html')) {
        console.log("Initializing login/signup forms for business-login.html");
        loginForm = document.getElementById('login-form');
        signupForm = document.getElementById('signup-form');

        if (loginForm) {
            loginForm.addEventListener('submit', handleLoginFormSubmit);
        } else {
            console.warn("Login form not found on business-login.html");
        }

        if (signupForm) {
            signupForm.addEventListener('submit', handleSignupFormSubmit);
        } else {
            console.warn("Signup form not found on business-login.html");
        }
    }

    // Dashboard specific initializations
    if (isPage('business-dashboard.html') || document.getElementById('business-listings-container')) { // Check for a key dashboard element
        console.log("Initializing dashboard elements for business-dashboard.html");
        // --- Initialize DOM Element References ---
        addNewListingBtn = document.getElementById('addNewListingBtn');
        listingModal = document.getElementById('listingModal');
        listingForm = document.getElementById('listingForm');
        // Ensure modal exists before querying its children
        if (listingModal) {
            closeModalElements = listingModal.querySelectorAll('[data-close-modal]');
        } else {
            closeModalElements = []; // Avoid errors if modal is not in DOM (e.g. during some tests)
        }
        listingsContainer = document.getElementById('business-listings-container');
        noListingsMessage = document.getElementById('no-listings-message');

        // --- Attach Event Listeners ---
        if (addNewListingBtn) {
            addNewListingBtn.addEventListener('click', openModal);
        }

        closeModalElements.forEach(elem => {
            elem.addEventListener('click', () => {
                closeModal();
            });
        });

        if (listingModal) {
            listingModal.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    closeModal();
                }
            });
        }

        if (listingForm) {
            listingForm.addEventListener('submit', handleFormSubmit);
        }

        // --- Initial Data Load ---
        // Remove static HTML placeholders before the first render if JS is enabled
        const staticPlaceholders = listingsContainer?.querySelectorAll('.listing-item.static-placeholder');
        staticPlaceholders?.forEach(ph => ph.remove());

        loadInitialListings(); // Load and render data from JSON
    }
}

// --- Function to Fetch Initial Listings (Dashboard Specific) ---
async function loadInitialListings() {
    // Ensure this only runs if listingsContainer is present
    if (!listingsContainer) {
        console.log("Listings container not found, skipping initial listings load.");
        return;
    }
    try {
        const response = await fetch('data/business-listings.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const listings = await response.json();
            // currentListings = listings; // Populate the global array - Modified for testability
            setCurrentListings(listings); // Use setter for testability
            renderListings(currentListings);
        } catch (error) {
            console.error("Could not load initial listings:", error);
            if (listingsContainer) { // Check again, as it might be null if called on wrong page
                listingsContainer.innerHTML = `<p class="error-message">Sorry, we couldn't load the listings at the moment. Please try again later.</p>`;
            }
            if (noListingsMessage) noListingsMessage.style.display = 'block'; // Check again
        }
    }

// --- Login Form Handling ---
export function handleLoginFormSubmit(event) {
    event.preventDefault();
    console.log("Login form submitted");
    const email = loginForm.querySelector('#login-email').value;
    const password = loginForm.querySelector('#login-password').value;

    if (email && password) {
        // Placeholder: Simulate successful login
        alert("Login successful (placeholder)!");
        window.location.href = 'business-dashboard.html';
    } else {
        alert("Please enter email and password.");
    }
}

// --- Signup Form Handling ---
export function handleSignupFormSubmit(event) {
    event.preventDefault();
    console.log("Signup form submitted");
    const businessName = signupForm.querySelector('#signup-business-name').value;
    const email = signupForm.querySelector('#signup-email').value;
    const password = signupForm.querySelector('#signup-password').value;
    const confirmPassword = signupForm.querySelector('#signup-confirm-password').value;

    if (!businessName || !email || !password || !confirmPassword) {
        alert("Please fill all fields.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    // Placeholder: Simulate successful signup
    alert("Signup successful (placeholder)! Redirecting to dashboard.");
    window.location.href = 'business-dashboard.html';
}


// --- Modal Interaction Functions (Dashboard Specific) ---
// Exported for testing if needed, or test via UI interaction
export function openModal() {
    if (listingModal) { // Check if element exists
        listingModal.classList.add('is-open');
        listingModal.setAttribute('aria-hidden', 'false');
        if (listingForm) { // Ensure listingForm is available
             listingForm.querySelector('input, select, textarea')?.focus();
        }
    } else {
        console.warn("listingModal not found. Cannot open modal.");
    }
}

export function closeModal() {
    if (listingModal) { // Check if element exists
        listingModal.classList.remove('is-open');
        listingModal.setAttribute('aria-hidden', 'true');
        if (listingForm) { // Ensure listingForm is available
            listingForm.reset(); // Clear form on close
        }
    } else {
        console.warn("listingModal not found. Cannot close modal.");
    }
}

// --- Listings Display Function (Dashboard Specific) ---
// Exported for testing
export function renderListings(listingsArray) {
    if (!listingsContainer) { // Check if element exists
        console.warn("listingsContainer not found. Cannot render listings.");
        return;
    }

    listingsContainer.innerHTML = ''; // Clear existing listings

    if (listingsArray.length === 0) {
        if (noListingsMessage) noListingsMessage.style.display = 'block';
            // Remove static placeholders if they exist and array is empty
        const staticPlaceholders = listingsContainer.querySelectorAll('.listing-item.static-placeholder');
        staticPlaceholders.forEach(ph => ph.remove());
    } else {
        if (noListingsMessage) noListingsMessage.style.display = 'none';
    }

    listingsArray.forEach(listing => {
        const listingElement = document.createElement('div');
        listingElement.classList.add('listing-item');
        listingElement.dataset.id = listing.id; // Useful for future interactions

        // Constructing the inner HTML for the listing item
        // Ensure these class names match your CSS for .listing-item and its children
        // Using 'itemName' from JSON, ensure all fields match
        const priceToShow = listing.originalPrice ? listing.price : (listing.price || 0); // If originalPrice exists, then 'price' is the discounted one.
        const originalPriceToShow = listing.originalPrice ? listing.originalPrice : null;

        listingElement.innerHTML = `
            <div class="listing-item-content">
                <h3 class="listing-item-name">${listing.itemName}</h3>
                <p class="listing-item-details"><strong>Price:</strong> R${parseFloat(priceToShow).toFixed(2)}</p>
                ${originalPriceToShow ? `<p class="listing-item-details original-price-display"><s>Original: R${parseFloat(originalPriceToShow).toFixed(2)}</s></p>` : ''}
                <p class="listing-item-details"><strong>Quantity:</strong> ${listing.quantity}</p>
                <p class="listing-item-details"><strong>Expiry Date:</strong> ${listing.expiryDate}</p>
                <p class="listing-item-details" data-field="description"><strong>Description:</strong> ${listing.description || 'N/A'}</p>
                <p class="listing-item-details"><strong>Category:</strong> ${listing.category || 'N/A'}</p>
                <p class="listing-item-details"><strong>Pickup:</strong> ${listing.pickupLocation || 'N/A'}</p>
            </div>
            <div class="listing-item-actions">
                <button type="button" class="button-style button-edit" data-id="${listing.id}">Edit</button>
                <button type="button" class="button-style button-delete" data-id="${listing.id}">Delete</button>
            </div>
        `;
        listingsContainer.appendChild(listingElement);
    });
}

// --- Form Submission Handling (Dashboard Specific - Add/Edit Listing) ---
// Exported for testing or can be tested via UI interaction
export function handleFormSubmit(event) {
    event.preventDefault(); // Prevent default page reload

    if (!listingForm) { // Check if element exists
        console.error("listingForm not found. Cannot handle form submission.");
        return;
    }
    const formData = new FormData(listingForm);
    const newListing = {};
    formData.forEach((value, key) => {
        newListing[key] = value;
    });

    if (newListing.itemDiscountedPrice && parseFloat(newListing.itemDiscountedPrice) > 0) {
        newListing.originalPrice = parseFloat(newListing.itemPrice);
        newListing.price = parseFloat(newListing.itemDiscountedPrice);
    } else {
        newListing.price = parseFloat(newListing.itemPrice);
    }
    delete newListing.itemPrice;
    delete newListing.itemDiscountedPrice;

    newListing.id = 'new' + Date.now().toString();
    console.log('New Listing Data:', newListing);

    currentListings.push(newListing); // Add to the global array
    renderListings(currentListings); // Re-render
    closeModal(); // Close modal
}

// Setter for currentListings for testing purposes
export function setCurrentListings(listings) {
    currentListings = listings;
}

// --- Auto-initialize on DOMContentLoaded for browser environment ---
// For testing, initBusinessPortal will be called manually.
if (typeof window !== 'undefined') { // Check if running in a browser
    document.addEventListener('DOMContentLoaded', initBusinessPortal);
}
