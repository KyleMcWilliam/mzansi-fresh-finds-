import { cartReducer } from './cartReducers';
import { CART_ADD_ITEM, CART_REMOVE_ITEM } from '../constants/cartConstants';

describe('cartReducer', () => {
  it('should return the initial state', () => {
    expect(cartReducer(undefined, {})).toEqual({
      cartItems: [],
    });
  });

  it('should handle CART_ADD_ITEM', () => {
    const item = { product: '1', name: 'Product 1', price: 10 };
    const action = {
      type: CART_ADD_ITEM,
      payload: item,
    };
    const expectedState = {
      cartItems: [item],
    };
    expect(cartReducer(undefined, action)).toEqual(expectedState);
  });

  it('should handle CART_REMOVE_ITEM', () => {
    const initialState = {
      cartItems: [
        { product: '1', name: 'Product 1', price: 10 },
        { product: '2', name: 'Product 2', price: 20 },
      ],
    };
    const action = {
      type: CART_REMOVE_ITEM,
      payload: '1',
    };
    const expectedState = {
      cartItems: [{ product: '2', name: 'Product 2', price: 20 }],
    };
    expect(cartReducer(initialState, action)).toEqual(expectedState);
  });
});
