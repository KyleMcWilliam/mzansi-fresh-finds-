import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { listProducts } from '../actions/productActions';
import Product from '../components/Product'; // Component to display each product
// import Loader from '../components/Loader'; // Placeholder for Loader component
// import Message from '../components/Message'; // Placeholder for Message component

const HomeScreen = () => {
  const dispatch = useDispatch();
  const { keyword } = useParams(); // Get keyword from URL for search

  const productList = useSelector((state) => state.productList);
  const { loading, error, products } = productList;

  useEffect(() => {
    dispatch(listProducts(keyword || '')); // Pass empty string if keyword is undefined
  }, [dispatch, keyword]);

  return (
    <>
      <h1>Latest Products</h1>
      {loading ? (
        // <Loader />
        <p>Loading...</p>
      ) : error ? (
        // <Message variant='danger'>{error}</Message>
        <p style={{color: 'red'}}>{error}</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}> {/* Basic layout for products */}
          {products && products.length > 0 ? (
            products.map((product) => (
              <Product key={product._id} product={product} />
            ))
          ) : (
            <p>No products found.</p> // Message for no products
          )}
        </div>
      )}
    </>
  );
};

export default HomeScreen;
