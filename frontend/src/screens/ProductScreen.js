import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
// Assuming addToCart action will be in cartActions.js
// If it's in productActions.js or another file, adjust the import path accordingly.
import { addToCart } from '../actions/cartActions';
import {
  listProductDetails,
  createProductReview,
} from '../actions/productActions';
import { PRODUCT_CREATE_REVIEW_RESET } from '../constants/productConstants';
// import Loader from '../components/Loader'; // Placeholder
// import Message from '../components/Message'; // Placeholder
// import Rating from '../components/Rating'; // Placeholder for star rating display

// Basic inline styles (extract to CSS later)
const screenStyle = { padding: '1rem' };
const backLinkStyle = { marginBottom: '1rem', display: 'inline-block' };
const productDetailLayout = { display: 'flex', flexWrap: 'wrap', gap: '2rem' };
const imageStyle = { flex: '1 1 400px', maxWidth: '500px', height: 'auto', border: '1px solid #eee' };
const infoStyle = { flex: '1 1 300px' };
const reviewsStyle = { marginTop: '2rem', flexBasis: '100%'};
const reviewFormStyle = { marginTop: '1rem', padding: '1rem', border: '1px solid #eee' };
const formGroupStyle = { marginBottom: '0.5rem' };
const selectStyle = { width: '100%', padding: '0.5rem', marginBottom: '0.5rem'};
const textareaStyle = { width: '100%', padding: '0.5rem', marginBottom: '0.5rem', minHeight: '80px' };
const buttonStyle = { padding: '0.75rem', backgroundColor: '#333', color: 'white', border: 'none', cursor: 'pointer' };
const listItemStyle = { borderBottom: '1px solid #eee', padding: '0.5rem 0'};


const ProductScreen = () => {
  const { id: productId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate(); // For redirecting after review if needed

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin; // Assuming userLogin reducer exists and holds userInfo

  const productReviewCreate = useSelector((state) => state.productReviewCreate);
  const {
    loading: loadingProductReview,
    error: errorProductReview,
    success: successProductReview,
  } = productReviewCreate;

  useEffect(() => {
    if (successProductReview) {
      alert('Review Submitted!'); // Replace with a proper Message component
      setRating(0);
      setComment('');
      dispatch({ type: PRODUCT_CREATE_REVIEW_RESET });
    }
    // Always fetch product details, even if a review was just submitted, to get updated reviews list
    dispatch(listProductDetails(productId));

    // If review was successful and we want to clear the state (already done by RESET)
    // or if we want to ensure no stale review error/success messages are shown on screen load
    if (!successProductReview) { // If not coming from a successful review submission
        dispatch({ type: PRODUCT_CREATE_REVIEW_RESET });
    }

  }, [dispatch, productId, successProductReview, navigate]);

  const submitReviewHandler = (e) => {
    e.preventDefault();
    if (!rating || comment.trim() === '') {
        alert('Please select a rating and write a comment.'); // Basic validation
        return;
    }
    dispatch(createProductReview(productId, { rating, comment }));
  };

  return (
    <div style={screenStyle}>
      <Link to='/' style={backLinkStyle}>
        Go Back
      </Link>
      {loading ? (
        // <Loader />
        <p>Loading product...</p>
      ) : error ? (
        // <Message variant='danger'>{error}</Message>
        <p style={{color: 'red'}}>{error}</p>
      ) : product ? (
        <>
          <div style={productDetailLayout}>
            <img src={product.image || '/images/sample.jpg'} alt={product.name} style={imageStyle} />
            <div style={infoStyle}>
              <h3>{product.name}</h3>
              {/* <Rating value={product.rating} text={`${product.numReviews} reviews`} /> */}
              <p>Rating: {product.rating ? product.rating.toFixed(1) : 'No Rating'} ({product.numReviews} reviews)</p>
              <p>Price: ${product.price}</p>
              <p>Description: {product.description}</p>
              <p>Status: {product.countInStock > 0 ? 'In Stock' : 'Out Of Stock'}</p>
              {product.countInStock > 0 && (
                <button
                  onClick={() => addToCartHandler(product._id, 1)}
                  style={buttonStyle}
                  type="button"
                >
                  Add To Cart
                </button>
              )}
            </div>
          </div>

          <div style={reviewsStyle}>
            <h2>Reviews</h2>
            {product.reviews && product.reviews.length === 0 && <p>No reviews yet.</p>}
            <ul style={{listStyleType: 'none', padding: 0}}>
              {product.reviews && product.reviews.map((review) => (
                <li key={review._id} style={listItemStyle}>
                  <strong>{review.name}</strong>
                  {/* <Rating value={review.rating} /> */}
                   <p>Rating: {review.rating}/5</p>
                  <p>{new Date(review.createdAt).toLocaleDateString()}</p>
                  <p>{review.comment}</p>
                </li>
              ))}
            </ul>

            <div style={reviewFormStyle}>
              <h2>Write a Customer Review</h2>
              {loadingProductReview && <p>Submitting review...</p> /* <Loader /> */}
              {errorProductReview && <p style={{color: 'red'}}>{errorProductReview}</p> /* <Message variant='danger'>{errorProductReview}</Message> */}

              {userInfo ? (
                <form onSubmit={submitReviewHandler}>
                  <div style={formGroupStyle}>
                    <label htmlFor='rating'>Rating</label>
                    <select
                      id='rating'
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      style={selectStyle}
                      required
                    >
                      <option value=''>Select...</option>
                      <option value='1'>1 - Poor</option>
                      <option value='2'>2 - Fair</option>
                      <option value='3'>3 - Good</option>
                      <option value='4'>4 - Very Good</option>
                      <option value='5'>5 - Excellent</option>
                    </select>
                  </div>
                  <div style={formGroupStyle}>
                    <label htmlFor='comment'>Comment</label>
                    <textarea
                      id='comment'
                      rows='3'
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      style={textareaStyle}
                      required
                    ></textarea>
                  </div>
                  <button type='submit' style={buttonStyle} disabled={loadingProductReview}>
                    Submit Review
                  </button>
                </form>
              ) : (
                <p>Please <Link to='/login'>sign in</Link> to write a review.</p>
                // <Message>Please <Link to='/login'>sign in</Link> to write a review</Message>
              )}
            </div>
          </div>
        </>
      ) : (
        <p>Product not found.</p> // Fallback if product is null after loading
      )}
    </div>
  );
};

export default ProductScreen;
