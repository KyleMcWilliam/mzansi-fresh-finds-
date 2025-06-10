import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux'; // To provide the store
import store from './store'; // Your Redux store
import Header from './components/Header';
import HomeScreen from './screens/HomeScreen';
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
    <Provider store={store}>
      <Router>
        <Header />
        <main style={containerStyle}>
          <Routes>
            <Route path='/search/:keyword' element={<HomeScreen />} />
            <Route path='/' element={<HomeScreen />} /> {/* Removed exact for broader matching */}
                <Route path='/product/:id' element={<ProductScreen />} />
            {/* <Route path='/cart' element={<CartScreen />} /> */}
            {/* <Route path='/login' element={<LoginScreen />} /> */}
            {/* Add other routes here */}
          </Routes>
        </main>
        {/* Footer component can be added here */}
      </Router>
    </Provider>
  );
}

export default App;
