import {
  USER_LOGIN_FAIL,
  USER_LOGIN_REQUEST,
  USER_LOGIN_SUCCESS,
  USER_LOGOUT,
  USER_REGISTER_FAIL,
  USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS,
} from '../constants/userConstants';
import { auth, googleProvider, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: USER_LOGIN_REQUEST });

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch additional user data from Firestore if needed, or just use Auth object
    // For now, we'll construct a userInfo object similar to what the backend returned
    const userInfo = {
      _id: user.uid,
      name: user.displayName || email.split('@')[0], // Fallback name
      email: user.email,
      token: await user.getIdToken(), // Firebase token
      isAdmin: false // We might need to fetch this from Firestore 'users' collection
    };

    // Try to get more info (like isAdmin, name) from Firestore 'users' collection
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
       const userData = userDocSnap.data();
       userInfo.name = userData.name || userInfo.name;
       userInfo.isAdmin = userData.isAdmin || false;
    }

    dispatch({
      type: USER_LOGIN_SUCCESS,
      payload: userInfo,
    });

    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  } catch (error) {
    dispatch({
      type: USER_LOGIN_FAIL,
      payload: error.message,
    });
  }
};

export const googleLogin = () => async (dispatch) => {
  try {
    dispatch({ type: USER_LOGIN_REQUEST });

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userInfo = {
      _id: user.uid,
      name: user.displayName,
      email: user.email,
      token: await user.getIdToken(),
      isAdmin: false
    };

    // Check if user exists in Firestore, if not create them
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
       const userData = userDocSnap.data();
       userInfo.isAdmin = userData.isAdmin || false;
    } else {
       // Save new Google user to Firestore
       await setDoc(userDocRef, {
         name: user.displayName,
         email: user.email,
         isAdmin: false,
         createdAt: new Date().toISOString()
       });
    }

    dispatch({
      type: USER_LOGIN_SUCCESS,
      payload: userInfo,
    });

    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  } catch (error) {
    dispatch({
      type: USER_LOGIN_FAIL,
      payload: error.message,
    });
  }
};

export const logout = () => async (dispatch) => {
  try {
    await signOut(auth);
    localStorage.removeItem('userInfo');
    dispatch({ type: USER_LOGOUT });
  } catch (error) {
    console.error("Logout Error:", error);
  }
};

export const register = (name, email, password) => async (dispatch) => {
  try {
    dispatch({ type: USER_REGISTER_REQUEST });

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update Profile Name
    await updateProfile(user, { displayName: name });

    const userInfo = {
      _id: user.uid,
      name: name,
      email: email,
      token: await user.getIdToken(),
      isAdmin: false
    };

    // Create User Document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      isAdmin: false,
      createdAt: new Date().toISOString()
    });

    dispatch({
      type: USER_REGISTER_SUCCESS,
      payload: userInfo,
    });

    dispatch({
      type: USER_LOGIN_SUCCESS,
      payload: userInfo,
    });

    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  } catch (error) {
    dispatch({
      type: USER_REGISTER_FAIL,
      payload: error.message,
    });
  }
};
