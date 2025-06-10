import React from 'react';
import { Link } from 'react-router-dom'; // For navigation links
import SearchBox from './SearchBox'; // Import the SearchBox component

// Basic styling (can be moved to a CSS file)
const headerStyle = {
  backgroundColor: '#333',
  padding: '1rem 2rem',
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const navLinksStyle = {
  display: 'flex',
  alignItems: 'center',
};

const linkStyle = {
  color: 'white',
  margin: '0 10px',
  textDecoration: 'none',
};

const logoStyle = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: 'white',
  textDecoration: 'none',
};


const Header = () => {
  return (
    <header style={headerStyle}>
      <div>
        <Link to='/' style={logoStyle}>
          ProShop
        </Link>
      </div>

      {/* Render the SearchBox component */}
      {/* We might want to ensure SearchBox is rendered on a route where search makes sense,
          or adjust its behavior based on route, but for now, include it directly. */}
      <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', padding: '0 20px' }}>
         <SearchBox />
      </div>


      <nav style={navLinksStyle}>
        <Link to='/cart' style={linkStyle}>
          <i className='fas fa-shopping-cart'></i> Cart
        </Link>
        <Link to='/login' style={linkStyle}>
          <i className='fas fa-user'></i> Sign In
        </Link>
        {/* Add other links as needed, e.g., for admin users, user profile dropdown */}
      </nav>
    </header>
  );
};

export default Header;
