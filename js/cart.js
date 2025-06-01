// Initialize cart from localStorage or create an empty one
let cart = [];

const CART_STORAGE_KEY = 'shoppingCart';

/**
 * Loads cart data from localStorage when the page loads.
 * Initializes an empty cart in localStorage if one doesn't exist.
 */
function loadCart() {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      cart = JSON.parse(storedCart);
    } else {
      // Initialize with an empty cart if nothing is stored
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
      cart = [];
    }
  } catch (error) {
    console.error("Error loading cart from localStorage:", error);
    // In case of error (e.g., localStorage disabled), use an in-memory cart
    cart = [];
  }
}

/**
 * Dispatches a custom event to notify other parts of the application that the cart has been updated.
 */
function dispatchCartUpdateEvent() {
  const event = new CustomEvent('cartUpdated');
  document.dispatchEvent(event);
}

/**
 * Saves the current cart state to localStorage.
 */
function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    dispatchCartUpdateEvent(); // Notify that the cart has changed
  } catch (error) {
    console.error("Error saving cart to localStorage:", error);
    // Optionally, notify the user that the cart couldn't be saved
  }
}

/**
 * Adds an item to the cart and saves the cart to localStorage.
 * @param {object} product - The product object with id, name, and price.
 * @param {number} quantity - The quantity of the product to add.
 */
function addItemToCart(product, quantity) {
  if (!product || typeof product.id === 'undefined' || typeof product.name === 'undefined' || typeof product.price === 'undefined') {
    console.error("Invalid product object provided to addItemToCart");
    return;
  }
  if (typeof quantity !== 'number' || quantity <= 0) {
    console.error("Invalid quantity provided to addItemToCart");
    return;
  }

  const existingItemIndex = cart.findIndex(item => item.productId === product.id);

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
    });
  }
  saveCart();
}

/**
 * Removes an item from the cart and saves the cart to localStorage.
 * @param {*} productId - The ID of the product to remove.
 */
function removeItemFromCart(productId) {
  cart = cart.filter(item => item.productId !== productId);
  saveCart();
}

/**
 * Updates the quantity of an item in the cart and saves the cart to localStorage.
 * @param {*} productId - The ID of the product to update.
 * @param {number} newQuantity - The new quantity for the item.
 */
function updateItemQuantity(productId, newQuantity) {
  if (typeof newQuantity !== 'number' || newQuantity < 0) {
    console.error("Invalid newQuantity provided to updateItemQuantity");
    return;
  }

  const itemIndex = cart.findIndex(item => item.productId === productId);

  if (itemIndex > -1) {
    if (newQuantity === 0) {
      removeItemFromCart(productId); // Or cart.splice(itemIndex, 1); saveCart();
    } else {
      cart[itemIndex].quantity = newQuantity;
      saveCart();
    }
  } else {
    console.warn(`Product with ID ${productId} not found in cart. Cannot update quantity.`);
  }
}

/**
 * Retrieves the cart from localStorage.
 * @returns {Array} The current cart.
 */
function getCart() {
  // loadCart() is called on script load, so `cart` variable should be up-to-date.
  // If direct access to localStorage is preferred, uncomment the next lines:
  /*
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) : [];
  } catch (error) {
    console.error("Error retrieving cart from localStorage:", error);
    return []; // Return empty cart or handle error as appropriate
  }
  */
  return [...cart]; // Return a copy to prevent direct modification
}

/**
 * Clears all items from the cart and localStorage.
 */
function clearCart() {
  cart = [];
  saveCart(); // This will save an empty array to localStorage
}

/**
 * Calculates the total price of items in the cart.
 * @returns {number} The total price of the cart.
 */
function calculateCartTotal() {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Load the cart when the script is first loaded
loadCart();

// Export functions
export {
  loadCart,
  addItemToCart,
  removeItemFromCart,
  // Exporting for potential external use, though primarily internal to cart.js
  // saveCart,
  // dispatchCartUpdateEvent, // Typically not called directly from outside
  updateItemQuantity,
  getCart,
  clearCart,
  calculateCartTotal,
};
