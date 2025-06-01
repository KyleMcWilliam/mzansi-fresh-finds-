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

let testDOM;

function setupPortalDOM() {
    testDOM = document.createElement('div');
    testDOM.id = 'test-dom-container';
    document.body.appendChild(testDOM);

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
                    <div class="form-group">
                        <label for="itemName">Item Name:</label>
                        <input type="text" id="itemName" name="itemName" required>
                    </div>
                    <div class="form-group">
                        <label for="itemDescription">Description:</label>
                        <textarea id="itemDescription" name="itemDescription" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="itemCategory">Category:</label>
                        <select id="itemCategory" name="itemCategory" required>
                            <option value="" disabled selected>Select a category...</option>
                            <option value="bakery">Bakery</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="itemPrice">Original Price (R):</label>
                        <input type="number" id="itemPrice" name="itemPrice" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="itemDiscountedPrice">Discounted Price (R):</label>
                        <input type="number" id="itemDiscountedPrice" name="itemDiscountedPrice" step="0.01" min="0">
                    </div>
                     <div class="form-group">
                        <label for="itemQuantity">Quantity:</label>
                        <input type="text" id="itemQuantity" name="itemQuantity" placeholder="e.g., 10 units, 5 kg" required>
                    </div>
                    <div class="form-group">
                        <label for="itemExpiryDate">Expiry Date:</label>
                        <input type="date" id="itemExpiryDate" name="itemExpiryDate" required>
                    </div>
                    <div class="form-group">
                        <label for="itemPickupLocation">Pickup Location:</label>
                        <input type="text" id="itemPickupLocation" name="itemPickupLocation" placeholder="e.g., Your Business Address" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="button-style" id="saveListingBtn">Save Listing</button>
                        <button type="button" class="button-style button-cancel" data-close-modal>Cancel</button>
                    </div>
                </form>
            </div>
        </div>`;

    testDOM.innerHTML = listingsContainerHTML + noListingsMessageHTML + addNewListingBtnHTML + modalHTML;
}

function teardownPortalDOM() {
    if (testDOM) {
        testDOM.remove();
        testDOM = null;
    }
    setCurrentListings([]); // Reset the shared state
}


// --- Test Cases ---

function testRenderListings() {
    console.log("\n--- Testing renderListings ---");
    setupPortalDOM();
    initBusinessPortal(); // Initialize to get DOM elements and attach basic listeners

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
    renderListings(currentListings);
    assertEquals(listingsContainer.children.length, 0, "Should render 0 listing items for an empty array.");
    assertEquals(noListingsMsg.style.display, 'block', "No listings message should be visible for an empty array.");

    // Test 3: Correctly displays item details
    const singleListing = [
      { id: '3', itemName: 'Cheese', price: 25.50, originalPrice: 30.00, quantity: '200g', expiryDate: '2023-12-31', description: 'Tasty cheese', category: 'Dairy', pickupLocation: 'Cool Place' }
    ];
    setCurrentListings(singleListing);
    renderListings(currentListings);
    assertEquals(listingsContainer.children.length, 1, "Should render 1 listing item for single item array.");
    const renderedItem = listingsContainer.children[0];
    assert(renderedItem.querySelector('.listing-item-name').textContent.includes('Cheese'), "Item name should be 'Cheese'.");
    assert(renderedItem.querySelector('.listing-item-details').textContent.includes('R25.50'), "Item price should be correctly displayed.");
    assert(renderedItem.querySelector('.original-price-display').textContent.includes('R30.00'), "Original price should be correctly displayed.");
    assert(renderedItem.textContent.includes('Tasty cheese'), "Description should be rendered.");

    teardownPortalDOM();
}

function testModalInteraction() {
    console.log("\n--- Testing Modal Interaction ---");
    setupPortalDOM();
    initBusinessPortal(); // Attaches event listeners

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

    teardownPortalDOM();
}

function testAddNewListingViaForm() {
    console.log("\n--- Testing Add New Listing via Form ---");
    setupPortalDOM();
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

    teardownPortalDOM();
}


// --- Run Tests ---
// These functions are called directly when the module is loaded.
console.log("Starting Business Portal Tests Execution...");

testRenderListings();
testModalInteraction();
testAddNewListingViaForm();

// summarizeTests() is called by test-runner.html after all test modules load.
console.log("Business Portal Tests Definitions Executed.");
