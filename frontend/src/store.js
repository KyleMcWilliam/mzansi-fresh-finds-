import { configureStore } from '@reduxjs/toolkit';
import {
  productListReducer,
  productDetailsReducer,
  productReviewCreateReducer,
  productTopRatedReducer,
} from './reducers/productReducers';
import { cartReducer } from './reducers/cartReducers';

// The individual reducers are combined in the `reducer` field of the configureStore call
const store = configureStore({
  reducer: {
    productList: productListReducer,
    productDetails: productDetailsReducer,
    productReviewCreate: productReviewCreateReducer,
    cart: cartReducer,
    productTopRated: productTopRatedReducer,
  },
  // Redux Toolkit automatically includes middleware like thunk and integrates with Redux DevTools
  // Preloaded state can be configured here if needed, similar to the old initialState
  // preloadedState: {
  //   // initial state goes here
  // }
});

export default store;
