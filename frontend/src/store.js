import { configureStore } from '@reduxjs/toolkit';
import {
  productListReducer,
  productDetailsReducer,
  productReviewCreateReducer,
  productTopRatedReducer,
} from './reducers/productReducers';
import { cartReducer } from './reducers/cartReducers';
import { userLoginReducer, userRegisterReducer } from './reducers/userReducers';

const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

const preloadedState = {
  userLogin: { userInfo: userInfoFromStorage },
};

// The individual reducers are combined in the `reducer` field of the configureStore call
const store = configureStore({
  reducer: {
    productList: productListReducer,
    productDetails: productDetailsReducer,
    productReviewCreate: productReviewCreateReducer,
    cart: cartReducer,
    productTopRated: productTopRatedReducer,
    userLogin: userLoginReducer,
    userRegister: userRegisterReducer,
  },
  preloadedState,
  // Redux Toolkit automatically includes middleware like thunk and integrates with Redux DevTools
  // Preloaded state can be configured here if needed, similar to the old initialState
  // preloadedState: {
  //   // initial state goes here
  // }
});

export default store;
