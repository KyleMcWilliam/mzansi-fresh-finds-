import { CART_ADD_ITEM } from '../constants/cartConstants';

const initialState = {
  cartItems: [],
  // shippingAddress: {},
  // paymentMethod: '',
};

export const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case CART_ADD_ITEM:
      const item = action.payload;
      const existItem = state.cartItems.find((x) => x.product === item.product);

      if (existItem) {
        return {
          ...state,
          cartItems: state.cartItems.map((x) =>
            x.product === existItem.product ? item : x
          ),
        };
      } else {
        return {
          ...state,
          cartItems: [...state.cartItems, item],
        };
      }
    // Future cases: CART_REMOVE_ITEM, etc.
    default:
      return state;
  }
};
