// js/business-portal.js
import { isValidEmail, isNotEmpty, isPasswordComplex, displayError, clearError, clearAllErrors } from './validation.js';
import { showToast, setButtonLoadingState } from '../ui.js';

// --- Helper: Check current page ---
function isPage(pageName) {
    return document.body.id === pageName || window.location.pathname.endsWith(pageName);
}

// --- Global Listings Array ---
// Exported for testing purposes, in a real app, this might be managed by a more robust state solution.
export let currentListings = [];
let currentAuthenticatedUser = null;
let currentUserStore = null;
let editingDealId = null;

// --- DOM Element References (initialized in initBusinessPortal) ---
let addNewListingBtn, listingModal, listingForm, closeModalElements, listingsContainer, noListingsMessage, loginForm, signupForm;
let storeProfileModal, storeProfileForm, storeProfileModalTitle, saveStoreProfileBtn, manageStoreProfileBtn;
let storeProfileModalCloseElements; // For overlay and close button of store profile modal


// --- Main Initialization Function ---
export async function initBusinessPortal() { // Made async
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
    if (isPage('business-dashboard.html')) { // More specific check for dashboard page security
        const token = getAuthToken();
        if (!token) {
            console.log("No auth token found, redirecting to login.");
            window.location.href = 'business-login.html';
            return; // Stop further execution for dashboard
        }

        try {
            const response = await fetch('/api/auth/user', {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                },
            });

            if (response.ok) {
                currentAuthenticatedUser = await response.json();
                console.log("Authenticated user:", currentAuthenticatedUser);

                // Fetch the user's store
                if (currentAuthenticatedUser && currentAuthenticatedUser._id) {
                    await fetchUserStore(currentAuthenticatedUser._id);
                } else {
                    console.error("User ID not available to fetch store.");
                    showToast("Could not identify user to fetch store details.", "error");
                    logoutUser(); // Or handle as appropriate
                    return;
                }

                // Proceed with dashboard initialization only if user is authenticated and store is (or isn't) found
                initializeDashboardElements(); // This now also initializes store profile modal elements

                if (!currentUserStore) {
                    if (addNewListingBtn) addNewListingBtn.disabled = true;
                    if (listingsContainer) {
                        listingsContainer.innerHTML = `
                            <p class="info-message">
                                Welcome! Please create your store profile to start managing your deals.
                                <button type="button" class="button-style" id="promptCreateStoreBtn">Create Store Profile</button>
                            </p>`;
                        const promptBtn = document.getElementById('promptCreateStoreBtn');
                        if(promptBtn) promptBtn.addEventListener('click', openStoreProfileModal);
                    }
                    if (noListingsMessage) noListingsMessage.style.display = 'none';
                     // Optionally auto-open modal: openStoreProfileModal();
                } else {
                    if (addNewListingBtn) addNewListingBtn.disabled = false;
                    loadUserDeals(); // Renamed from loadInitialListings
                }
            } else {
                // Handle 401 (invalid/expired token) or other errors
                const errorData = await response.json();
                console.error("Failed to fetch user data:", errorData.message || response.status);
                showToast(errorData.message || "Session expired. Please login again.", 'error');
                logoutUser(); // This will clear token and redirect to login
                return; // Stop further execution
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            showToast("An error occurred while verifying your session. Please login again.", 'error');
            logoutUser(); // Redirect to login
            return; // Stop further execution
        }

    } else if (document.getElementById('business-listings-container')) {
        // This condition might be for a shared component that doesn't require full dashboard auth
        // or if the dashboard check above failed and we fell through.
        // For now, let's assume if it's not business-dashboard.html specifically,
        // but has listings container, it might be a less secure view or part of another page.
        // If strict security is needed here too, this logic needs adjustment.
        console.log("Initializing dashboard-like elements (listings container found).");
        // Consider if auth is needed here too. For now, proceeding with element init.
        initializeDashboardElements(); // Initialize common dashboard elements
        loadUserDeals(); // Renamed from loadInitialListings
    }
}

// Helper function to initialize dashboard specific DOM elements and event listeners
function initializeDashboardElements() {
    console.log("Initializing dashboard DOM elements and event listeners...");
    // --- Initialize DOM Element References ---
    // Deal Modal
    addNewListingBtn = document.getElementById('addNewListingBtn');
    listingModal = document.getElementById('listingModal');
    listingForm = document.getElementById('listingForm');
    if (listingModal) {
        // Updated to use data-modal-id for more specific closing
        closeModalElements = listingModal.querySelectorAll('[data-modal-id="listingModal"]');
    } else {
        closeModalElements = [];
    }
    listingsContainer = document.getElementById('business-listings-container');
    noListingsMessage = document.getElementById('no-listings-message');

    // Store Profile Modal
    manageStoreProfileBtn = document.getElementById('manageStoreProfileBtn');
    storeProfileModal = document.getElementById('storeProfileModal');
    storeProfileForm = document.getElementById('storeProfileForm');
    storeProfileModalTitle = document.getElementById('storeProfileModalTitle');
    saveStoreProfileBtn = document.getElementById('saveStoreProfileBtn');
    if (storeProfileModal) {
        storeProfileModalCloseElements = storeProfileModal.querySelectorAll('[data-modal-id="storeProfileModal"]');
    } else {
        storeProfileModalCloseElements = [];
    }


    // --- Attach Event Listeners ---
    // Deal Modal Listeners
    if (addNewListingBtn) {
        addNewListingBtn.addEventListener('click', () => {
            // Reset for "Add New" mode before opening
            editingDealId = null;
            const modalTitle = document.getElementById('listingModalTitle');
            const saveBtn = listingForm?.querySelector('button[type="submit"]');
            if (modalTitle) modalTitle.textContent = 'Add New Listing';
            if (saveBtn) saveBtn.textContent = 'Save Listing';
            if (listingForm) listingForm.reset();
            openModal(listingModal); // Pass the specific modal to open
        });
    }

    closeModalElements.forEach(elem => {
        elem.addEventListener('click', () => closeModal(listingModal)); // Pass specific modal
    });

    if (listingModal) {
        listingModal.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeModal(listingModal); // Pass specific modal
        });
    }
    if (listingForm) {
        listingForm.addEventListener('submit', handleFormSubmit);
    }

    // Store Profile Modal Listeners
    if (manageStoreProfileBtn) {
        manageStoreProfileBtn.addEventListener('click', openStoreProfileModal);
    }
    storeProfileModalCloseElements.forEach(elem => {
        elem.addEventListener('click', () => closeModal(storeProfileModal)); // Pass specific modal
    });
    if (storeProfileModal) {
        storeProfileModal.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeModal(storeProfileModal); // Pass specific modal
        });
    }
    if (storeProfileForm) {
        storeProfileForm.addEventListener('submit', handleStoreProfileFormSubmit);
    }


    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }

    // Event delegation for edit/delete buttons in listingsContainer
    // This is the single, correct version of this listener. Duplicates below this were removed.
    if (listingsContainer) {
        listingsContainer.addEventListener('click', async (event) => {
            const targetButton = event.target.closest('button'); // Get the button element itself
            if (!targetButton) return; // Click was not on a button or its child

            const dealId = targetButton.dataset.id;

            if (targetButton.classList.contains('button-edit')) {
                if (dealId) {
                    await handleEditDealClick(dealId);
                } else {
                    console.error("Edit button clicked but no deal ID found.");
                    showToast("Could not identify the deal to edit.", "error");
                }
            } else if (targetButton.classList.contains('button-delete')) {
                if (dealId) {
                    await handleDeleteDealClick(dealId);
                } else {
                    console.error("Delete button clicked but no deal ID found.");
                    showToast("Could not identify the deal to delete.", "error");
                }
            }
        });
    }
    // Note: The duplicated keydown listener for listingModal and submit listener for listingForm
    // were implicitly removed by ensuring the structure above is the one that remains.
    // The earlier, correct listeners for listingModal keydown and listingForm submit are retained.

    // --- Initial Data Load (handled after auth check for dashboard) ---
    // Remove static HTML placeholders before the first render if JS is enabled
    const staticPlaceholders = listingsContainer?.querySelectorAll('.listing-item.static-placeholder');
    staticPlaceholders?.forEach(ph => ph.remove());
    // loadUserDeals(); // This is now called after successful auth in initBusinessPortal
}


// --- Store Profile Form Submission ---
async function handleStoreProfileFormSubmit(event) {
    event.preventDefault();
    const token = getAuthToken();

    if (!token) {
        showToast("Authentication required. Please login.", "error");
        logoutUser();
        return;
    }

    const storeData = {
        name: storeProfileForm.elements.storeName.value,
        address: storeProfileForm.elements.address.value,
        contactInfo: storeProfileForm.elements.contactInfo.value,
        openingHours: storeProfileForm.elements.openingHours.value,
        logoURL: storeProfileForm.elements.logoURL.value,
    };

    let method;
    let endpoint;
    let successMessage;
    let initialButtonText;

    if (currentUserStore && currentUserStore._id) {
        method = 'PUT';
        endpoint = `/api/stores/${currentUserStore._id}`;
        successMessage = "Store profile updated successfully!";
        initialButtonText = "Save Changes";
    } else {
        method = 'POST';
        endpoint = '/api/stores';
        successMessage = "Store profile created successfully!";
        initialButtonText = "Create Store";
    }

    if (saveStoreProfileBtn) setButtonLoadingState(saveStoreProfileBtn, true, "Saving...");

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify(storeData),
        });

        const responseData = await response.json();

        if (response.ok && responseData.success) {
            currentUserStore = responseData.data; // Update global store variable
            showToast(successMessage, 'success');
            closeModal(storeProfileModal);

            // Re-evaluate UI state
            if (addNewListingBtn) addNewListingBtn.disabled = false;
            // If there was a prompt in listingsContainer, clear it and load deals
            // This check ensures we don't unnecessarily reload if it was just an update with deals already showing.
            if (listingsContainer.querySelector('#promptCreateStoreBtn')) {
                 loadUserDeals();
            } else if (method === 'PUT') { // If it was an update, still refresh deals in case store name changed etc.
                 loadUserDeals();
            }


        } else {
            console.error("Failed to save store profile:", responseData.message);
            showToast(responseData.message || `Failed to save store profile.`, 'error');
        }
    } catch (error) {
        console.error("Error saving store profile:", error);
        showToast("An unexpected error occurred while saving the store profile.", 'error');
    } finally {
        if (saveStoreProfileBtn) setButtonLoadingState(saveStoreProfileBtn, false, initialButtonText);
    }
}


// --- Modal Opening/Closing (Generic or Specific) ---
// Generic open function
function openModal(modalElement) {
    if (modalElement) {
        modalElement.classList.add('is-open');
        modalElement.setAttribute('aria-hidden', 'false');
        // Focus on the first focusable element in the modal, e.g., an input or button
        modalElement.querySelector('input, select, textarea, button[type="submit"]')?.focus();
    } else {
        console.warn("Attempted to open a modal that was not found.");
    }
}

// Generic close function (can be adapted if specific modals need more distinct reset logic)
function closeModal(modalElement) {
    if (modalElement) {
        modalElement.classList.remove('is-open');
        modalElement.setAttribute('aria-hidden', 'true');

        const form = modalElement.querySelector('form');
        if (form) form.reset();

        // Reset specific states depending on the modal
        if (modalElement.id === 'listingModal') {
            editingDealId = null;
            const modalTitle = document.getElementById('listingModalTitle');
            const saveBtn = listingForm?.querySelector('button[type="submit"]');
            if (modalTitle) modalTitle.textContent = 'Add New Listing';
            if (saveBtn) saveBtn.textContent = 'Save Listing';
        } else if (modalElement.id === 'storeProfileModal') {
            // Reset store profile modal specific title/button if needed, though
            // openStoreProfileModal handles setting them before opening.
            // No specific 'editingStoreId' type variable to reset here yet.
        }
    } else {
        console.warn("Attempted to close a modal that was not found.");
    }
}


// --- Function to Open and Populate Store Profile Modal ---
function openStoreProfileModal() {
    if (!storeProfileModal || !storeProfileForm || !storeProfileModalTitle || !saveStoreProfileBtn) {
        console.error("Store profile modal elements not initialized.");
        showToast("Cannot open store profile form, elements missing.", "error");
        return;
    }

    if (currentUserStore) {
        // Populate form for editing
        storeProfileForm.elements.storeName.value = currentUserStore.name || '';
        storeProfileForm.elements.address.value = currentUserStore.address || '';
        storeProfileForm.elements.contactInfo.value = currentUserStore.contactInfo || '';
        storeProfileForm.elements.openingHours.value = currentUserStore.openingHours || '';
        storeProfileForm.elements.logoURL.value = currentUserStore.logoURL || '';

        storeProfileModalTitle.textContent = 'Edit Store Profile';
        saveStoreProfileBtn.textContent = 'Save Changes';
    } else {
        // Clear form for creating
        storeProfileForm.reset();
        storeProfileModalTitle.textContent = 'Create Your Store Profile';
        saveStoreProfileBtn.textContent = 'Create Store';
    }
    openModal(storeProfileModal); // Use generic open
}


// --- Function to Fetch User's Store ---
async function fetchUserStore(userId) {
    const token = getAuthToken();
    if (!token) {
        console.error("No token available for fetching store.");
        // This case should ideally be handled by the main auth check,
        // but as a safeguard:
        showToast("Authentication token missing, cannot fetch store.", "error");
        return null;
    }

    try {
        const response = await fetch('/api/stores', {
            method: 'GET',
            headers: {
                'x-auth-token': token, // Good practice, even if endpoint is public for now
            },
        });

        if (response.ok) {
            const stores = await response.json();
            const foundStore = stores.find(store => store.user && store.user._id === userId);

            if (foundStore) {
                currentUserStore = foundStore;
                console.log("User's store found and assigned:", currentUserStore);
            } else {
                currentUserStore = null;
                console.log("No store found for the current user.");
                // It's not necessarily an error if a user doesn't have a store yet.
                // Depending on app logic, you might prompt them to create one.
                // showToast("You do not have a store registered yet. Please create one.", "info");
            }
            return currentUserStore;
        } else {
            const errorData = await response.json();
            console.error("Failed to fetch stores:", errorData.message || response.status);
            showToast(errorData.message || "Failed to load store information.", 'error');
            currentUserStore = null;
            return null;
        }
    } catch (error) {
        console.error("Error during fetchUserStore:", error);
        showToast("An unexpected error occurred while fetching store details.", 'error');
        currentUserStore = null;
        return null;
    }
}


// --- Function to Fetch User's Deals (Dashboard Specific) ---
async function loadUserDeals() {
    if (!listingsContainer) {
        console.log("Listings container not found, skipping user deals load.");
        return;
    }

    if (!currentUserStore || !currentUserStore._id) {
        console.log("Current user store not available. Cannot fetch deals.");
        listingsContainer.innerHTML = `<p class="info-message">Please register or complete your store profile to manage deals.</p>`;
        if (noListingsMessage) noListingsMessage.style.display = 'none'; // Hide "no listings" if showing this message
        return;
    }

    const token = getAuthToken();
    if (!token) {
        showToast("Authentication required to view deals. Please login.", "error");
        logoutUser(); // Redirect to login
        return;
    }

    try {
        const response = await fetch(`/api/deals?storeId=${currentUserStore._id}`, {
            method: 'GET',
            headers: {
                'x-auth-token': token,
            },
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // currentListings = result.data; // Decide if currentListings global is still needed
                renderListings(result.data); // Pass deals data directly to renderListings
            } else {
                // This case might not happen if backend always returns success:true with empty array on no deals
                console.error("Failed to fetch deals, API success flag was false:", result.message);
                listingsContainer.innerHTML = `<p class="error-message">Could not load your deals: ${result.message || 'Unknown error'}</p>`;
                if (noListingsMessage) noListingsMessage.style.display = 'none';
            }
        } else {
            const errorData = await response.json();
            console.error(`Failed to fetch deals (HTTP ${response.status}):`, errorData.message || 'Server error');
            listingsContainer.innerHTML = `<p class="error-message">Could not load your deals. Status: ${response.status}</p>`;
            if (noListingsMessage) noListingsMessage.style.display = 'none';
            showToast(errorData.message || `Failed to fetch deals. Server responded with ${response.status}.`, 'error');
        }
    } catch (error) {
        console.error("Error loading user deals:", error);
        listingsContainer.innerHTML = `<p class="error-message">An unexpected error occurred while loading your deals.</p>`;
        if (noListingsMessage) noListingsMessage.style.display = 'none';
        showToast("An error occurred while loading deals.", 'error');
    }
}

// --- Login Form Handling ---
export async function handleLoginFormSubmit(event) {
    event.preventDefault();
    clearAllErrors(loginForm); // Clear previous errors

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const loginButton = loginForm.querySelector('button[type="submit"]');

    let isValid = true;

    // Validate Login Email
    if (emailInput && !isNotEmpty(emailInput.value)) {
        displayError(emailInput, 'Email is required.');
        isValid = false;
    } else if (emailInput && !isValidEmail(emailInput.value)) {
        displayError(emailInput, 'Please enter a valid email address.');
        isValid = false;
    } else if (!emailInput) {
        console.warn('Login email input not found');
        showToast('Login email input not found in the form.', 'error');
        isValid = false;
    }

    // Validate Login Password
    if (passwordInput && !isNotEmpty(passwordInput.value)) {
        displayError(passwordInput, 'Password is required.');
        isValid = false;
    } else if (!passwordInput) {
        console.warn('Login password input not found');
        showToast('Login password input not found in the form.', 'error');
        isValid = false;
    }

    if (isValid) {
        if (loginButton) setButtonLoadingState(loginButton, true, 'Logging in...');

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) { // Typically 200-299 status codes
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    showToast('Login successful! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = 'business-dashboard.html';
                    }, 1000); // Redirect after 1 second
                } else {
                    console.error('Login successful, but no token received:', data);
                    showToast(data.message || 'Login successful, but no token received. Please try again.', 'error');
                }
            } else {
                // Handle 400, 401, 500 errors
                console.error('Login failed:', data);
                showToast(data.message || 'Login failed. Please check your credentials or try again later.', 'error');
            }
        } catch (error) {
            console.error('Error during login fetch:', error);
            showToast('An unexpected error occurred during login. Please try again.', 'error');
        } finally {
            if (loginButton) setButtonLoadingState(loginButton, false, 'Login');
        }
    }
}

// --- Signup Form Handling ---
export async function handleSignupFormSubmit(event) {
    event.preventDefault();

    // At the very beginning of the function:
    if (!signupForm) {
        console.error("Critical: Signup form element not found when trying to submit!");
        showToast('An essential part of the page is missing. Please refresh and try again or contact support.', 'error');
        return; // Stop execution
    }

    clearAllErrors(signupForm); // Clear previous errors

    const businessNameInput = document.getElementById('signup-business-name');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const confirmPasswordInput = document.getElementById('signup-confirm-password');
    const signupButton = signupForm.querySelector('button[type="submit"]');

    let isValid = true;

    try {
        // Validate Business Name
        if (businessNameInput && !isNotEmpty(businessNameInput.value)) {
            displayError(businessNameInput, 'Business name is required.');
            isValid = false;
        } else if (!businessNameInput) {
            console.warn('Signup business name input not found');
            showToast('Business name input not found in the form.', 'error');
            isValid = false;
        }

        // Validate Email
        if (emailInput && !isNotEmpty(emailInput.value)) {
            displayError(emailInput, 'Email is required.');
            isValid = false;
        } else if (emailInput && !isValidEmail(emailInput.value)) {
            displayError(emailInput, 'Please enter a valid email address.');
            isValid = false;
        } else if (!emailInput) {
            console.warn('Signup email input not found');
            showToast('Email input not found in the form.', 'error');
            isValid = false;
        }

        // Validate Password
        if (passwordInput && !isNotEmpty(passwordInput.value)) {
            displayError(passwordInput, 'Password is required.');
            isValid = false;
        } else if (passwordInput && !isPasswordComplex(passwordInput.value, 8)) { // Assuming minLength 8
            displayError(passwordInput, 'Password must be at least 8 characters long.');
            isValid = false;
        } else if (!passwordInput) {
            console.warn('Signup password input not found');
            showToast('Password input not found in the form.', 'error');
            isValid = false;
        }

        // Validate Confirm Password
        if (confirmPasswordInput && !isNotEmpty(confirmPasswordInput.value)) {
            displayError(confirmPasswordInput, 'Please confirm your password.');
            isValid = false;
        } else if (passwordInput && confirmPasswordInput && passwordInput.value !== confirmPasswordInput.value) {
            displayError(confirmPasswordInput, 'Passwords do not match.');
            isValid = false;
        } else if (!confirmPasswordInput) {
            console.warn('Signup confirm password input not found');
            showToast('Confirm password input not found in the form.', 'error');
            isValid = false;
        }
    } catch (error) {
        console.error("Unexpected error during signup form validation:", error);
        showToast('An unexpected error occurred while preparing the form. Please refresh and try again.', 'error');
        if (signupButton) setButtonLoadingState(signupButton, false, 'Sign Up'); // Ensure button is reset
        return; // Stop execution
    }

    if (isValid) {
        if (signupButton) setButtonLoadingState(signupButton, true, 'Signing up...');

        const name = businessNameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (response.ok || response.status === 201) { // Handle 200 or 201 for successful registration
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    showToast('Registration successful! Redirecting to dashboard...', 'success');
                    setTimeout(() => {
                        window.location.href = 'business-dashboard.html';
                    }, 1500);
                } else {
                    // If no token, but success, redirect to login
                    showToast(data.message || 'Registration successful! Please login.', 'success');
                     setTimeout(() => {
                        window.location.href = 'business-login.html';
                    }, 1500);
                }
                 if (signupForm) signupForm.reset(); // Reset form on success
            } else {
                // Handle errors like "User already exists" (400 or 409 typically) or server errors (500)
                console.error('Signup failed:', data);
                showToast(data.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error during signup fetch:', error);
            showToast('An unexpected error occurred during signup. Please try again.', 'error');
        } finally {
            if (signupButton) setButtonLoadingState(signupButton, false, 'Sign Up');
        }
    }
}


// --- Modal Interaction Functions (Dashboard Specific) ---
// Exported for testing if needed, or test via UI interaction
// export function openModal() { // This is now generic openModal(modalElement)
//     if (listingModal) {
//         listingModal.classList.add('is-open');
//         listingModal.setAttribute('aria-hidden', 'false');
//         if (listingForm) {
//              listingForm.querySelector('input, select, textarea')?.focus();
//         }
//     } else {
//         console.warn("listingModal not found. Cannot open modal.");
//     }
// }

// export function closeModal() { // This is now generic closeModal(modalElement)
//     if (listingModal) {
//         listingModal.classList.remove('is-open');
//         listingModal.setAttribute('aria-hidden', 'true');

//         const modalTitle = document.getElementById('listingModalTitle');
//         const saveBtn = listingForm?.querySelector('button[type="submit"]');

//         if (modalTitle) modalTitle.textContent = 'Add New Listing';
//         if (saveBtn) saveBtn.textContent = 'Save Listing';

//         if (listingForm) {
//             listingForm.reset();
//         }
//         editingDealId = null; // Reset editing state
//     } else {
//         console.warn("listingModal not found. Cannot close modal.");
//     }
// }

// --- Handle Edit Deal Click ---
async function handleEditDealClick(dealId) {
    editingDealId = dealId; // Still specific to deal editing context
    const token = getAuthToken();

    if (!token) {
        showToast("Authentication required. Please login.", "error");
        logoutUser();
        return;
    }

    try {
        const response = await fetch(`/api/deals/${dealId}`, {
            headers: { 'x-auth-token': token }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                const deal = result.data;
                if (listingForm) {
                    listingForm.elements.itemName.value = deal.itemName || '';
                    listingForm.elements.itemDescription.value = deal.description || '';
                    listingForm.elements.itemCategory.value = deal.category || '';
                    listingForm.elements.itemPrice.value = deal.originalPrice || '';
                    listingForm.elements.itemDiscountedPrice.value = deal.discountedPrice || '';
                    listingForm.elements.itemQuantity.value = deal.quantityAvailable || '';
                    listingForm.elements.itemExpiryDate.value = deal.bestBeforeDate ? deal.bestBeforeDate.split('T')[0] : '';
                    listingForm.elements.itemPickupLocation.value = deal.pickupInstructions || '';
                }

                const modalTitle = document.getElementById('listingModalTitle');
                const saveBtn = listingForm?.querySelector('button[type="submit"]');
                if (modalTitle) modalTitle.textContent = 'Edit Deal';
                if (saveBtn) saveBtn.textContent = 'Save Changes';

                openModal(listingModal); // Open the specific listing/deal modal
            } else {
                throw new Error(result.message || "Deal data not found in response.");
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch deal (HTTP ${response.status})`);
        }
    } catch (error) {
        console.error("Error fetching deal for edit:", error);
        showToast(`Failed to fetch deal details: ${error.message}`, 'error');
        editingDealId = null; // Reset on error
    }
}


// --- Listings Display Function (Dashboard Specific) ---
// Exported for testing
export function renderListings(dealsArray) { // Parameter renamed to dealsArray
    if (!listingsContainer) {
        console.warn("listingsContainer not found. Cannot render listings.");
        return;
    }

    listingsContainer.innerHTML = ''; // Clear existing listings

    if (dealsArray.length === 0) {
        if (noListingsMessage) noListingsMessage.style.display = 'block';
    } else {
        if (noListingsMessage) noListingsMessage.style.display = 'none';
    }

    dealsArray.forEach(deal => { // Iterate over deal
        const listingElement = document.createElement('div');
        listingElement.classList.add('listing-item');
        listingElement.dataset.id = deal._id; // Use deal._id from MongoDB

        let priceDisplay = '';
        const discountedPrice = parseFloat(deal.discountedPrice);
        const originalPrice = parseFloat(deal.originalPrice);

        if (deal.discountedPrice && discountedPrice < originalPrice) {
            priceDisplay = `<p class="listing-item-details"><strong>Price:</strong> R${discountedPrice.toFixed(2)} <s class="original-price-display">R${originalPrice.toFixed(2)}</s></p>`;
        } else {
            priceDisplay = `<p class="listing-item-details"><strong>Price:</strong> R${originalPrice.toFixed(2)}</p>`;
        }

        // Format bestBeforeDate if it exists
        let formattedBestBeforeDate = 'N/A';
        if (deal.bestBeforeDate) {
            try {
                formattedBestBeforeDate = new Date(deal.bestBeforeDate).toLocaleDateString('en-ZA', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
            } catch (e) {
                console.warn("Could not parse bestBeforeDate:", deal.bestBeforeDate, e);
                // Keep N/A or use raw value if preferred
                formattedBestBeforeDate = deal.bestBeforeDate.split('T')[0]; // Basic fallback
            }
        }


        listingElement.innerHTML = `
            <div class="listing-item-content">
                <h3 class="listing-item-name">${deal.itemName}</h3>
                ${priceDisplay}
                <p class="listing-item-details"><strong>Quantity:</strong> ${deal.quantityAvailable}</p>
                <p class="listing-item-details"><strong>Best Before:</strong> ${formattedBestBeforeDate}</p>
                <p class="listing-item-details" data-field="description"><strong>Description:</strong> ${deal.description || 'N/A'}</p>
                <p class="listing-item-details"><strong>Category:</strong> ${deal.category || 'N/A'}</p>
                <p class="listing-item-details"><strong>Pickup:</strong> ${deal.pickupInstructions || 'N/A'}</p>
            </div>
            <div class="listing-item-actions">
                <button type="button" class="button-style button-edit" data-id="${deal._id}">Edit</button>
                <button type="button" class="button-style button-delete" data-id="${deal._id}">Delete</button>
            </div>
        `;
        listingsContainer.appendChild(listingElement);
    });
}

// --- Form Submission Handling (Dashboard Specific - Add/Edit Listing) ---
// Exported for testing or can be tested via UI interaction
export async function handleFormSubmit(event) {
    event.preventDefault(); // Prevent default page reload

    if (!listingForm) {
        console.error("listingForm not found. Cannot handle form submission.");
        return;
    }

    const saveBtn = listingForm.querySelector('button[type="submit"]'); // Get the submit button

    // Check for currentUserStore
    if (!currentUserStore || !currentUserStore._id) {
        showToast("You must have a registered store to add deals. Please create or verify your store profile.", 'error');
        if (saveBtn) setButtonLoadingState(saveBtn, false); // Reset button if it was set to loading
        return;
    }

    const token = getAuthToken();
    if (!token) {
        showToast("Authentication token not found. Please login again.", 'error');
        if (saveBtn) setButtonLoadingState(saveBtn, false);
        logoutUser(); // Redirect to login
        return;
    }

    if (saveBtn) setButtonLoadingState(saveBtn, true, "Saving...");

    const dealData = {
        storeId: currentUserStore._id,
        itemName: listingForm.elements.itemName.value,
        description: listingForm.elements.itemDescription.value,
        category: listingForm.elements.itemCategory.value,
        originalPrice: parseFloat(listingForm.elements.itemPrice.value),
        quantityAvailable: listingForm.elements.itemQuantity.value, // API expects quantityAvailable
        bestBeforeDate: listingForm.elements.itemExpiryDate.value,
        pickupInstructions: listingForm.elements.itemPickupLocation.value,
        // imageURL can be added if an input field for it exists
    };

    // Handle optional discountedPrice
    const discountedPriceValue = listingForm.elements.itemDiscountedPrice.value;
    if (discountedPriceValue && parseFloat(discountedPriceValue) > 0) {
        dealData.discountedPrice = parseFloat(discountedPriceValue);
    }

    // TODO: Add client-side validation for prices (e.g., discounted < original) if not already covered by backend.

    let response;
    let endpoint;
    let method;

    if (editingDealId) {
        // Update existing deal
        method = 'PUT';
        endpoint = `/api/deals/${editingDealId}`;
    } else {
        // Create new deal
        method = 'POST';
        endpoint = '/api/deals';
    }

    try {
        response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify(dealData),
        });

        if (response.ok) {
            // const responseData = await response.json(); // Get response data if needed
            if (editingDealId) {
                showToast('Deal updated successfully!', 'success');
            } else {
                showToast('Deal added successfully!', 'success');
            }
            await loadUserDeals();
            closeModal(); // This also resets editingDealId, form, title, button
        } else {
            const errorData = await response.json();
            console.error(`Failed to ${editingDealId ? 'update' : 'add'} deal:`, errorData);
            showToast(errorData.message || `Failed to ${editingDealId ? 'update' : 'add'} deal. Please check the form.`, 'error');
            // Optionally, do not close modal on error for edits, so user can correct
        }
    } catch (error) {
        console.error(`Error submitting ${editingDealId ? 'update' : 'add'} deal:`, error);
        showToast(`An unexpected error occurred while ${editingDealId ? 'updating' : 'saving'} the deal.`, 'error');
    } finally {
        // Reset button text based on whether it was an edit or add, done by closeModal if successful
        // but if there was an error and modal didn't close, button state needs reset.
        if (saveBtn) {
            const buttonText = editingDealId && !response?.ok ? "Save Changes" : "Save Listing";
            setButtonLoadingState(saveBtn, false, buttonText);
        }
         // If it was an edit and it failed, editingDealId is still set.
         // If it was an add and it failed, editingDealId is null.
         // closeModal() handles resetting editingDealId if successful.
    }
}

// --- Handle Delete Deal Click ---
async function handleDeleteDealClick(dealId) {
    if (!window.confirm("Are you sure you want to delete this deal?")) {
        return;
    }

    const token = getAuthToken();
    if (!token) {
        showToast("Authentication required. Please login.", "error");
        logoutUser();
        return;
    }

    try {
        const response = await fetch(`/api/deals/${dealId}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });

        if (response.ok || response.status === 204) { // 204 No Content is also a success for DELETE
            showToast('Deal deleted successfully!', 'success');
            await loadUserDeals(); // Refresh the list
        } else {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                // If response is not JSON (e.g. just text for a 500 error)
                errorData = { message: response.statusText || "Failed to delete deal." };
            }
            console.error(`Failed to delete deal (HTTP ${response.status}):`, errorData.message);
            showToast(errorData.message || `Failed to delete deal. Server responded with ${response.status}.`, 'error');
        }
    } catch (error) {
        console.error("Error deleting deal:", error);
        showToast('An unexpected error occurred while deleting the deal.', 'error');
    }
}


// Setter for currentListings for testing purposes
export function setCurrentListings(listings) {
    currentListings = listings;
}

// --- Authentication Utility Functions ---
export function getAuthToken() {
    return localStorage.getItem('authToken');
}

export function logoutUser() {
    localStorage.removeItem('authToken');
    // Redirect to login page, ensuring it's the correct path
    // Assuming business-login.html is at the same level or root.
    // Adjust path if structure is different, e.g., '/pages/business-login.html'
    window.location.href = 'business-login.html';
}


// --- Auto-initialize on DOMContentLoaded for browser environment ---
// For testing, initBusinessPortal will be called manually.
if (typeof window !== 'undefined') { // Check if running in a browser
    document.addEventListener('DOMContentLoaded', initBusinessPortal);
}
