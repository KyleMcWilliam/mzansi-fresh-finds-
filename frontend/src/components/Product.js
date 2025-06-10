import React from 'react';
import { Link } from 'react-router-dom';

// Basic styling (can be moved to a CSS file)
const cardStyle = {
  border: '1px solid #ddd',
  borderRadius: '5px',
  padding: '1rem',
  margin: '1rem',
  width: '300px', // Fixed width for basic layout
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
};

const imageStyle = {
  width: '100%',
  maxHeight: '200px',
  objectFit: 'cover',
  marginBottom: '0.5rem',
};

const productInfoStyle = {
  textAlign: 'center',
};

const productNameStyle = {
  fontSize: '1.2rem',
  marginBottom: '0.5rem',
};

const productPriceStyle = {
  fontSize: '1rem',
  fontWeight: 'bold',
  marginBottom: '0.5rem',
};

const Product = ({ product }) => {
  return (
    <div style={cardStyle}>
      <Link to={`/product/${product._id}`}>
        <img src={product.image || '/images/sample.jpg'} alt={product.name} style={imageStyle} />
      </Link>
      <div style={productInfoStyle}>
        <Link to={`/product/${product._id}`} style={{textDecoration: 'none', color: 'inherit'}}>
          <h3 style={productNameStyle}>{product.name}</h3>
        </Link>
        {/* Add Rating component here later if needed */}
        <p style={productPriceStyle}>${product.price}</p>
        {/* Add to cart button here later if needed */}
      </div>
    </div>
  );
};

export default Product;
