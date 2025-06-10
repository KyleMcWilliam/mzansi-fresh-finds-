import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom'; // Added Link
import { Carousel, Image } from 'react-bootstrap'; // Added Carousel and Image
import { listProducts, listTopProducts } from '../actions/productActions'; // Added listTopProducts
import Product from '../components/Product'; // Component to display each product
// import Loader from '../components/Loader'; // Placeholder for Loader component
// import Message from '../components/Message'; // Placeholder for Message component

const HomeScreen = () => {
  const dispatch = useDispatch();
  const { keyword } = useParams(); // Get keyword from URL for search

  const productList = useSelector((state) => state.productList);
  const { loading, error, products } = productList;

  const productTopRated = useSelector((state) => state.productTopRated);
  const { products: productsTopRated, loading: loadingTopRated, error: errorTopRated } = productTopRated;

  useEffect(() => {
    dispatch(listProducts(keyword || '')); // Pass empty string if keyword is undefined
    dispatch(listTopProducts()); // Dispatch new action for top products
  }, [dispatch, keyword]);

  return (
    <>
      {/* Carousel for Top Rated Products */}
      {loadingTopRated ? (
        <p>Loading top products...</p> // Simple loader
      ) : errorTopRated ? (
        <p style={{ color: 'red' }}>{errorTopRated}</p> // Simple error message
      ) : !productsTopRated || productsTopRated.length === 0 ? (
        <p>No top products to display.</p> // Handle empty top products
      ) : (
        <Carousel pause='hover' className='bg-dark mb-4'>
          {productsTopRated.map(product => (
            <Carousel.Item key={product._id}>
              <Link to={`/product/${product._id}`}>
                <Image src={product.image} alt={product.name} fluid />
                <Carousel.Caption className='carousel-caption'>
                  <h2>{product.name} (${product.price})</h2>
                </Carousel.Caption>
              </Link>
            </Carousel.Item>
          ))}
        </Carousel>
      )}

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
