import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen'; // Added
import ContactScreen from './screens/ContactScreen'; // Added
import PrivacyScreen from './screens/PrivacyScreen'; // Added
import ProductScreen from './screens/ProductScreen'; // Placeholder
// import CartScreen from './screens/CartScreen'; // Placeholder
// import LoginScreen from './screens/LoginScreen'; // Placeholder

// Basic container styling
const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '1rem',
};

function App() {
  return (
    <Router>
      <Header />
      <main style={containerStyle}>
        <Routes>
          <Route path='/search/:keyword' element={<HomeScreen />} />
          <Route path='/' element={<HomeScreen />} /> {/* Removed exact for broader matching */}
          <Route path='/about' element={<AboutScreen />} /> {/* Added */}
          <Route path='/contact' element={<ContactScreen />} /> {/* Added */}
          <Route path='/privacy' element={<PrivacyScreen />} /> {/* Added */}
              <Route path='/product/:id' element={<ProductScreen />} />
          {/* <Route path='/cart' element={<CartScreen />} /> */}
          {/* <Route path='/login' an element={<LoginScreen />} /> */}
          {/* Add other routes here */}
        </Routes>
      </main>
      {/* Footer component can be added here */}
      <ToastContainer position="bottom-center" autoClose={3000} />
    </Router>
  );
}

export default App;
