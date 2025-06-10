import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk'; // Or 'redux-thunk' based on actual package name
import { composeWithDevTools } from 'redux-devtools-extension';
import {
  productListReducer,
  productDetailsReducer,
  productReviewCreateReducer,
  productTopRatedReducer, // Added
} from './reducers/productReducers';
import { cartReducer } from './reducers/cartReducers';
// Import other reducers here, e.g., userLoginReducer
// import { userLoginReducer } from './reducers/userReducers';


const reducer = combineReducers({
  productList: productListReducer,
  productDetails: productDetailsReducer,
  productReviewCreate: productReviewCreateReducer,
  cart: cartReducer,
  productTopRated: productTopRatedReducer, // Added
  // userLogin: userLoginReducer, // Example of another reducer
  // Add other reducers here
});

// Potentially load initial state from localStorage (e.g., userInfo)
// const userInfoFromStorage = localStorage.getItem('userInfo')
//   ? JSON.parse(localStorage.getItem('userInfo'))
//   : null;

// const initialState = {
//   userLogin: { userInfo: userInfoFromStorage },
// };
const initialState = {};


const middleware = [thunk];

const store = createStore(
  reducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middleware))
);

export default store;
