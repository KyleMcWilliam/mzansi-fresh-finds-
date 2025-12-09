import {
  PRODUCT_LIST_REQUEST,
  PRODUCT_LIST_SUCCESS,
  PRODUCT_LIST_FAIL,
  PRODUCT_DETAILS_REQUEST,
  PRODUCT_DETAILS_SUCCESS,
  PRODUCT_DETAILS_FAIL,
  PRODUCT_CREATE_REVIEW_REQUEST,
  PRODUCT_CREATE_REVIEW_SUCCESS,
  PRODUCT_CREATE_REVIEW_FAIL,
  PRODUCT_TOP_RATED_REQUEST,
  PRODUCT_TOP_RATED_SUCCESS,
  PRODUCT_TOP_RATED_FAIL,
} from '../constants/productConstants';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

// List Products (supports basic keyword filtering on client side if needed, or simple fetch)
export const listProducts = (keyword = '') => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_LIST_REQUEST });

    const dealsRef = collection(db, 'deals');
    // Basic query: fetch all. Firebase doesn't support substring search natively.
    // For keyword search, we'd filter in client or use a third-party service (Algolia).
    // We will just fetch all for now and filter in JS if needed, but for "start fresh" small data, fetching all is fine.

    const snapshot = await getDocs(dealsRef);
    let products = snapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));

    // Simple client-side filtering for keyword
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      products = products.filter(p =>
        p.name?.toLowerCase().includes(lowerKeyword) ||
        p.description?.toLowerCase().includes(lowerKeyword)
      );
    }

    dispatch({
      type: PRODUCT_LIST_SUCCESS,
      payload: { products, page: 1, pages: 1 }, // Maintain shape expected by reducers
    });
  } catch (error) {
    dispatch({
      type: PRODUCT_LIST_FAIL,
      payload: error.message,
    });
  }
};

export const listTopProducts = () => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_TOP_RATED_REQUEST });

    const dealsRef = collection(db, 'deals');
    // Order by rating descending, limit 3
    // Note: This requires an index in Firestore. If it fails, check console for index creation link.
    // We'll try a simple fetch all and sort client-side to avoid index errors during initial setup.
    const snapshot = await getDocs(dealsRef);
    let products = snapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));

    // Client-side sort for top rated
    products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const topProducts = products.slice(0, 3);

    dispatch({
      type: PRODUCT_TOP_RATED_SUCCESS,
      payload: topProducts,
    });
  } catch (error) {
    dispatch({
      type: PRODUCT_TOP_RATED_FAIL,
      payload: error.message,
    });
  }
};

export const listProductDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_DETAILS_REQUEST });

    const docRef = doc(db, 'deals', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      dispatch({
        type: PRODUCT_DETAILS_SUCCESS,
        payload: { ...docSnap.data(), _id: docSnap.id },
      });
    } else {
      throw new Error('Product not found');
    }
  } catch (error) {
    dispatch({
      type: PRODUCT_DETAILS_FAIL,
      payload: error.message,
    });
  }
};

export const createProductReview = (productId, review) => async (dispatch, getState) => {
  try {
    dispatch({ type: PRODUCT_CREATE_REVIEW_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    // In Firestore, we can store reviews as a subcollection "reviews" under the product document
    const reviewsRef = collection(db, 'deals', productId, 'reviews');

    await addDoc(reviewsRef, {
      name: userInfo.name,
      rating: Number(review.rating),
      comment: review.comment,
      user: userInfo._id,
      createdAt: serverTimestamp(), // Use server timestamp
    });

    // Also update the main product's rating/numReviews (optional but good for performance)
    // For simplicity in this "start fresh" migration, we might skip the aggregation update
    // or assume the UI recalculates it from the subcollection if fetched.
    // A proper implementation would use a Transaction or Cloud Function to update the average.

    dispatch({ type: PRODUCT_CREATE_REVIEW_SUCCESS });
  } catch (error) {
    dispatch({
      type: PRODUCT_CREATE_REVIEW_FAIL,
      payload: error.message,
    });
  }
};
