// tests/business-portal.test.js

import {
    initBusinessPortal,
    renderListings,
    openModal,
    closeModal,
    handleFormSubmit,
    currentListings, // Direct import for inspection (can be risky if not careful)
    setCurrentListings // Helper to reset state for tests
} from '../js/business-portal.js';

let testDOMContainer; // Renamed to avoid confusion with individual test DOMs

// --- Dashboard Page DOM Setup ---
function setupDashboardDOM() {
    // Simulate being on the business-dashboard.html page
    // For the isPage() utility, we can set body.id or ensure a key element exists
    document.body.id = 'business-dashboard-page-test'; // For isPage utility if it checks body.id

    testDOMContainer = document.createElement('div');
    testDOMContainer.id = 'test-dashboard-dom';
    document.body.appendChild(testDOMContainer);

    const listingsContainerHTML = `<div id="business-listings-container"></div>`;
    const noListingsMessageHTML = `<p id="no-listings-message" style="display: none;"></p>`;
    const addNewListingBtnHTML = `<button id="addNewListingBtn">Add New Listing</button>`;
    const modalHTML = `
        <div id="listingModal" class="modal" aria-hidden="true">
            <div class="modal-overlay" data-close-modal></div>
            <div class="modal-content">
                <button class="modal-close" data-close-modal>&times;</button>
                <h2 id="listingModalTitle">Add/Edit Listing</h2>
                <form id="listingForm">
                    <div class="form-group"><label for="itemName">Item Name:</label><input type="text" id="itemName" name="itemName" required></div>
                    <div class="form-group"><label for="itemDescription">Description:</label><textarea id="itemDescription" name="itemDescription" rows="3" required></textarea></div>
                    <div class="form-group"><label for="itemCategory">Category:</label><select id="itemCategory" name="itemCategory" required><option value="" disabled selected>Select a category...</option><option value="bakery">Bakery</option></select></div>
                    <div class="form-group"><label for="itemPrice">Original Price (R):</label><input type="number" id="itemPrice" name="itemPrice" step="0.01" min="0" required></div>
                    <div class="form-group"><label for="itemDiscountedPrice">Discounted Price (R):</label><input type="number" id="itemDiscountedPrice" name="itemDiscountedPrice" step="0.01" min="0"></div>
                    <div class="form-group"><label for="itemQuantity">Quantity:</label><input type="text" id="itemQuantity" name="itemQuantity" required></div>
                    <div class="form-group"><label for="itemExpiryDate">Expiry Date:</label><input type="date" id="itemExpiryDate" name="itemExpiryDate" required></div>
                    <div class="form-group"><label for="itemPickupLocation">Pickup Location:</label><input type="text" id="itemPickupLocation" name="itemPickupLocation" required></div>
                    <div class="form-actions"><button type="submit" class="button-style" id="saveListingBtn">Save Listing</button><button type="button" class="button-style button-cancel" data-close-modal>Cancel</button></div>
                </form>
            </div>
        </div>`;

    testDOMContainer.innerHTML = listingsContainerHTML + noListingsMessageHTML + addNewListingBtnHTML + modalHTML;
    // Add a way for isPage to identify this as the dashboard
    const dashboardIdentifier = document.createElement('div');
    dashboardIdentifier.id = 'business-listings-container'; // isPage checks for this element
    if (!testDOMContainer.querySelector('#business-listings-container')) { // ensure it's not duplicated
        testDOMContainer.appendChild(dashboardIdentifier);
    }
}

function teardownDashboardDOM() {
    if (testDOMContainer) {
        testDOMContainer.remove();
        testDOMContainer = null;
    }
    setCurrentListings([]); // Reset the shared state
    document.body.id = ''; // Clear body id
}

// --- Login Page DOM Setup ---
function setupLoginDOM() {
    // Simulate being on the business-login.html page
    document.body.id = 'business-login-page-test'; // For isPage utility

    testDOMContainer = document.createElement('div');
    testDOMContainer.id = 'test-login-dom';
    document.body.appendChild(testDOMContainer);

    const loginFormHTML = `
        <form id="login-form">
            <input type="email" id="login-email" name="login-email" required>
            <input type="password" id="login-password" name="login-password" required>
            <button type="submit">Login</button>
        </form>`;
    const signupFormHTML = `
        <form id="signup-form">
            <input type="text" id="signup-business-name" name="signup-business-name" required>
            <input type="email" id="signup-email" name="signup-email" required>
            <input type="password" id="signup-password" name="signup-password" required minlength="8">
            <input type="password" id="signup-confirm-password" name="signup-confirm-password" required minlength="8">
            <button type="submit">Sign Up</button>
        </form>`;

    testDOMContainer.innerHTML = loginFormHTML + signupFormHTML;
}

function teardownLoginDOM() {
    if (testDOMContainer) {
        testDOMContainer.remove();
        testDOMContainer = null;
    }
    document.body.id = ''; // Clear body id
    // Reset any relevant state if needed, though login/signup handlers don't modify currentListings
}


// --- Test Cases ---

// Simple assertion helper
function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        console.error(`Assertion Failed: ${message}. Expected "${expected}", but got "${actual}".`);
    } else {
        console.log(`Assertion Passed: ${message}.`);
    }
}

function assert(condition, message) {
    if (!condition) {
        console.error(`Assertion Failed: ${message}.`);
    } else {
        console.log(`Assertion Passed: ${message}.`);
    }
}


function testRenderListings() {
    console.log("\n--- Testing renderListings ---");
    setupDashboardDOM(); // Use dashboard specific DOM
    initBusinessPortal();

    const listingsContainer = document.getElementById('business-listings-container');
    const noListingsMsg = document.getElementById('no-listings-message');

    // Test 1: Rendering multiple items
    const mockListings = [
        { id: '1', itemName: 'Bread', price: 10, quantity: '1 loaf', expiryDate: '2023-01-01', description: 'Test desc', category: 'Bakery', pickupLocation: 'Shop' },
        { id: '2', itemName: 'Milk', price: 20, quantity: '1 liter', expiryDate: '2023-01-02', description: 'Test desc', category: 'Dairy', pickupLocation: 'Shop'  }
    ];
    setCurrentListings(mockListings);
    renderListings(currentListings); // currentListings is now the one from business-portal.js
    assertEquals(listingsContainer.children.length, 2, "Should render 2 listing items.");
    assert(listingsContainer.querySelector('.listing-item-name').textContent.includes('Bread'), "First item's name should be rendered.");
    assertEquals(noListingsMsg.style.display, 'none', "No listings message should be hidden when items are present.");

    // Test 2: Rendering an empty list
    setCurrentListings([]);
    renderListings(currentListings); // listings is now currentListings from the module
    assertEquals(listingsContainer.children.length, 0, "Should render 0 listing items for an empty array.");
    assertEquals(noListingsMsg.style.display, 'block', "No listings message should be visible for an empty array.");

    // Test 3: Correctly displays item details
    const singleListing = [
      { id: '3', itemName: 'Cheese', price: 25.50, originalPrice: 30.00, quantity: '200g', expiryDate: '2023-12-31', description: 'Tasty cheese', category: 'Dairy', pickupLocation: 'Cool Place' }
    ];
    setCurrentListings(singleListing);
    renderListings(currentListings); // listings is now currentListings from the module
    assertEquals(listingsContainer.children.length, 1, "Should render 1 listing item for single item array.");
    const renderedItem = listingsContainer.children[0];
    assert(renderedItem.querySelector('.listing-item-name').textContent.includes('Cheese'), "Item name should be 'Cheese'.");
    assert(renderedItem.querySelector('.listing-item-details').textContent.includes('R25.50'), "Item price should be correctly displayed.");
    assert(renderedItem.querySelector('.original-price-display').textContent.includes('R30.00'), "Original price should be correctly displayed.");
    assert(renderedItem.textContent.includes('Tasty cheese'), "Description should be rendered.");

    teardownDashboardDOM();
}

function testModalInteraction() {
    console.log("\n--- Testing Modal Interaction ---");
    setupDashboardDOM(); // Use dashboard specific DOM
    initBusinessPortal();

    const modal = document.getElementById('listingModal');
    const addBtn = document.getElementById('addNewListingBtn');
    const closeBtn = modal.querySelector('.modal-close'); // Get close button from within modal

    // Test 1: Modal opens
    addBtn.click();
    assertEquals(modal.classList.contains('is-open'), true, "Modal should have 'is-open' class after clicking 'Add New Listing'.");
    assertEquals(modal.getAttribute('aria-hidden'), 'false', "Modal aria-hidden should be 'false' when open.");

    // Test 2: Modal closes
    closeBtn.click();
    assertEquals(modal.classList.contains('is-open'), false, "Modal should not have 'is-open' class after clicking close button.");
    assertEquals(modal.getAttribute('aria-hidden'), 'true', "Modal aria-hidden should be 'true' when closed.");

    teardownDashboardDOM();
}

function testAddNewListingViaForm() {
    console.log("\n--- Testing Add New Listing via Form ---");
    setupDashboardDOM(); // Use dashboard specific DOM
    initBusinessPortal();
    setCurrentListings([]); // Start with no listings

    const listingsContainer = document.getElementById('business-listings-container');
    const modal = document.getElementById('listingModal');
    const form = document.getElementById('listingForm');

    // Open the modal first
    document.getElementById('addNewListingBtn').click();

    // Simulate form filling
    document.getElementById('itemName').value = 'Test Cake';
    document.getElementById('itemDescription').value = 'A yummy cake.';
    document.getElementById('itemCategory').value = 'bakery';
    document.getElementById('itemPrice').value = '100'; // Original Price
    document.getElementById('itemDiscountedPrice').value = '80'; // Discounted Price
    document.getElementById('itemQuantity').value = '1 slice';
    document.getElementById('itemExpiryDate').value = '2024-12-01';
    document.getElementById('itemPickupLocation').value = 'Test Bakery';

    // Simulate form submission
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    assertEquals(currentListings.length, 1, "currentListings array should have one new item after form submission.");
    assertEquals(listingsContainer.children.length, 1, "New listing should be rendered in the container.");

    const newRenderedItem = listingsContainer.children[0];
    assert(newRenderedItem.querySelector('.listing-item-name').textContent.includes('Test Cake'), "Rendered item should contain the new item's name.");
    assert(newRenderedItem.querySelector('.listing-item-details').textContent.includes('R80.00'), "Rendered item should show discounted price.");
    assert(newRenderedItem.querySelector('.original-price-display').textContent.includes('R100.00'), "Rendered item should show original price.");

    assertEquals(modal.classList.contains('is-open'), false, "Modal should be closed after form submission.");

    teardownDashboardDOM();
}

function testLoginSignupForms() {
    console.log("\n--- Testing Login/Signup Form Event Listener Attachment ---");
    setupLoginDOM(); // Use login page specific DOM

    // Mock alert and window.location.href to prevent actual navigation/alerts during tests
    const originalAlert = window.alert;
    const originalLocation = window.location;
    let alertCalledWith = '';
    let locationChangedTo = '';

    window.alert = (message) => {
        console.log(`Mock alert: ${message}`);
        alertCalledWith = message;
    };

    // Mock window.location.href - this is a common way but might not work for all JS environments/test runners.
    // JSDOM usually allows this.
    delete window.location;
    window.location = { href: '' }; // Simple mock
    Object.defineProperty(window.location, 'href', {
        set: (url) => {
            console.log(`Mock navigation to: ${url}`);
            locationChangedTo = url;
        },
        get: () => locationChangedTo // Return the last set URL
    });


    initBusinessPortal(); // This should attach listeners

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    assert(loginForm !== null, "Login form should exist in Login DOM.");
    assert(signupForm !== null, "Signup form should exist in Login DOM.");

    // Test 1: Login form submission (basic check, not deep into handler logic)
    console.log("Simulating login form submission (empty fields)...");
    alertCalledWith = ''; // Reset mock state
    locationChangedTo = ''; // Reset mock state
    loginForm.querySelector('#login-email').value = '';
    loginForm.querySelector('#login-password').value = '';
    loginForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    // Depending on the mocked alert, check if it was called.
    // For now, we're primarily testing that initBusinessPortal ran without error and forms are present.
    // A more robust test would involve spying on addEventListener or the handlers.
    assert(alertCalledWith.includes("Please enter email and password"), "Alert for empty login form expected.");

    console.log("Simulating login form submission (filled fields)...");
    alertCalledWith = '';
    locationChangedTo = '';
    loginForm.querySelector('#login-email').value = 'test@example.com';
    loginForm.querySelector('#login-password').value = 'password123';
    loginForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    assert(locationChangedTo.includes('business-dashboard.html'), "Should attempt to redirect to dashboard on successful login.");


    // Test 2: Signup form submission (basic check)
    console.log("Simulating signup form submission (empty fields)...");
    alertCalledWith = '';
    locationChangedTo = '';
    signupForm.querySelector('#signup-business-name').value = ''; // Empty one field
    signupForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    assert(alertCalledWith.includes("Please fill all fields"), "Alert for empty signup form expected.");

    console.log("Simulating signup form submission (passwords mismatch)...");
    alertCalledWith = '';
    locationChangedTo = '';
    signupForm.querySelector('#signup-business-name').value = 'Test Biz';
    signupForm.querySelector('#signup-email').value = 'biz@example.com';
    signupForm.querySelector('#signup-password').value = 'password123';
    signupForm.querySelector('#signup-confirm-password').value = 'password321';
    signupForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    assert(alertCalledWith.includes("Passwords do not match"), "Alert for mismatching passwords expected.");

    console.log("Simulating signup form submission (successful)...");
    alertCalledWith = '';
    locationChangedTo = '';
    signupForm.querySelector('#signup-business-name').value = 'Test Biz';
    signupForm.querySelector('#signup-email').value = 'biz@example.com';
    signupForm.querySelector('#signup-password').value = 'password123';
    signupForm.querySelector('#signup-confirm-password').value = 'password123';
    signupForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    assert(locationChangedTo.includes('business-dashboard.html'), "Should attempt to redirect to dashboard on successful signup.");

    // Restore original alert and location
    window.alert = originalAlert;
    window.location = originalLocation;

    teardownLoginDOM();
}


// --- Run Tests ---
// These functions are called directly when the module is loaded.
console.log("Starting Business Portal Tests Execution...");

testRenderListings();
testModalInteraction();
testAddNewListingViaForm();
testLoginSignupForms(); // Add the new test suite

// summarizeTests() is called by test-runner.html after all test modules load.
console.log("Business Portal Tests Definitions Executed.");
