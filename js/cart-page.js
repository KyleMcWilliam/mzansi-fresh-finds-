import {
    getCart,
    removeItemFromCart,
    updateItemQuantity,
    clearCart,
    calculateCartTotal,
    loadCart // Import loadCart to initialize cart from localStorage
} from './cart.js';

// DOM Elements
let cartItemsContainer;
let cartTotalElement;
let clearCartButton;
let headerCartCountElement; // For updating cart count in the header

/**
 * Formats a number as currency (e.g., R123.45).
 * @param {number} amount - The amount to format.
 * @returns {string} The formatted currency string.
 */
function formatCurrency(amount) {
    return `R${amount.toFixed(2)}`;
}

/**
 * Renders the entire cart page, including items and total.
 */
function renderCartPage() {
    if (!cartItemsContainer || !cartTotalElement || !headerCartCountElement) {
        console.warn("Cart page elements not fully initialized. Skipping render.");
        return;
    }

    const cart = getCart();
    cartItemsContainer.innerHTML = ''; // Clear previous items

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is currently empty. <a href="index.html">Continue shopping!</a></p>';
    } else {
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            // Using item.productId for data attributes, which is consistent with cart.js
            itemElement.innerHTML = `
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatCurrency(item.price)}</div>
                <div class="cart-item-quantity">
                    <label for="qty-${item.productId}">Qty:</label>
                    <input type="number" id="qty-${item.productId}" class="quantity-input" value="${item.quantity}" min="1" data-product-id="${item.productId}">
                </div>
                <div class="cart-item-subtotal">Subtotal: ${formatCurrency(item.price * item.quantity)}</div>
                <button class="remove-item-btn button-danger" data-product-id="${item.productId}" aria-label="Remove ${item.name}">
                    <i class="fas fa-trash-alt"></i> Remove
                </button>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
    }

    // Update total
    cartTotalElement.textContent = formatCurrency(calculateCartTotal());

    // Update header cart count
    const totalItems = cart.reduce((sum, currentItem) => sum + currentItem.quantity, 0);
    headerCartCountElement.textContent = totalItems;


    // Re-attach event listeners after rendering
    attachCartItemEventListeners();
}

/**
 * Attaches event listeners to cart item controls (remove buttons, quantity inputs).
 */
function attachCartItemEventListeners() {
    // Remove buttons
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        // Clear old listener before adding new one to prevent duplication
        const newButton = button.cloneNode(true); // Clone to easily remove listeners
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', (event) => {
            const productId = event.currentTarget.dataset.productId;
            if (productId) {
                removeItemFromCart(productId);
                // renderCartPage(); // No longer needed here, cartUpdated event handles it
            }
        });
    });

    // Quantity inputs
    document.querySelectorAll('.quantity-input').forEach(input => {
        const newQtyInput = input.cloneNode(true);
        input.parentNode.replaceChild(newQtyInput, input);

        newQtyInput.addEventListener('change', (event) => {
            const productId = event.currentTarget.dataset.productId;
            const newQuantity = parseInt(event.currentTarget.value, 10);
            if (productId && !isNaN(newQuantity) && newQuantity > 0) {
                updateItemQuantity(productId, newQuantity);
                // renderCartPage(); // No longer needed here, cartUpdated event handles it
            } else if (productId && !isNaN(newQuantity) && newQuantity <= 0) {
                // If user sets quantity to 0 or less, remove item or set to 1
                // For now, let's treat 0 as remove, consistent with cart.js updateItemQuantity logic
                updateItemQuantity(productId, 0); // This should trigger removal in cart.js
                // renderCartPage();
            } else {
                // Reset to current cart value if input is invalid
                console.warn("Invalid quantity input. Resetting.");
                const currentCart = getCart();
                const cartItem = currentCart.find(ci => ci.productId === productId);
                if (cartItem) {
                    event.currentTarget.value = cartItem.quantity;
                }
            }
        });
    });
}


/**
 * Initializes the cart page elements and event listeners.
 */
function initializeCartPage() {
    cartItemsContainer = document.getElementById('cart-items-container');
    cartTotalElement = document.getElementById('cart-total');
    clearCartButton = document.getElementById('clear-cart-btn');
    headerCartCountElement = document.getElementById('cart-count'); // In the header

    if (!cartItemsContainer || !cartTotalElement || !clearCartButton || !headerCartCountElement) {
        console.error("One or more critical cart page elements are missing. Cart page may not function correctly.");
        return;
    }

    // Initial cart load from localStorage
    loadCart(); // Ensure cart is loaded before the first render

    // Initial render
    renderCartPage();

    // Event listener for the "Clear Cart" button
    clearCartButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear all items from your cart?")) {
            clearCart();
            // renderCartPage(); // No longer needed here, cartUpdated event handles it
        }
    });

    // Listen for cart updates from other parts of the app or cart.js internal changes
    document.addEventListener('cartUpdated', () => {
        console.log("cartUpdated event received on cart page. Re-rendering.");
        renderCartPage();
    });

    console.log("Cart page initialized.");
}

// Run initialization once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeCartPage);
