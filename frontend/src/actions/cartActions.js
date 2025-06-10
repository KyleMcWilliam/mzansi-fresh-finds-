import { CART_ADD_ITEM } from '../constants/cartConstants';
// import axios from 'axios'; // If we were fetching product details

// For now, dispatching directly without API call for simplicity
// In a real app, you'd fetch product details here via API:
// const { data } = await axios.get(`/api/products/${id}`);
// And then dispatch with product data as payload.
export const addToCart = (id, qty) => async (dispatch, getState) => {
  // Placeholder: Simulate adding item data.
  // In a real app, you'd get product data from an API or pass it directly.
  const itemData = {
    product: id,
    name: 'Sample Product Name', // Replace with actual product name later
    image: '/images/sample.jpg', // Replace with actual product image later
    price: 0.00, // Replace with actual product price later
    countInStock: 0, // Replace with actual stock later
    qty,
  };

  dispatch({
    type: CART_ADD_ITEM,
    payload: itemData,
  });

  // Optionally, save to localStorage (common practice)
  // localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems));
};
