import React from 'react';
import { useSelector } from 'react-redux';
import { Row, Col, ListGroup, Image, Button, Card, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const DealLocationScreen = () => {
  const cart = useSelector((state) => state.cart);
  const { cartItems } = cart;

  if (cartItems.length === 0) {
    return (
      <Container>
        <div className='alert alert-info'>
          You have no saved deals to locate. <Link to='/'>Go find some!</Link>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="mb-4">Deal Locations & Contact Info</h1>
      <p>Here are the details for your saved deals. Visit the store or contact them to reserve your item.</p>

      <Row>
        <Col md={12}>
          <ListGroup variant='flush'>
            {cartItems.map((item) => (
              <ListGroup.Item key={item.product} className="mb-3 border rounded p-3">
                <Row>
                  <Col md={3}>
                    <Image src={item.image} alt={item.name} fluid rounded />
                  </Col>
                  <Col md={6}>
                    <h3><Link to={`/product/${item.product}`}>{item.name}</Link></h3>
                    <p><strong>Price:</strong> ${item.price}</p>
                    <p><strong>Seller:</strong> {item.seller || 'Local Store'}</p>
                    <p><strong>Address:</strong> {item.address || '123 Main St, Anytown, USA'}</p>
                    <p className="text-muted">
                        <small>Note: This item is near expiry. Please verify stock before traveling.</small>
                    </p>
                  </Col>
                  <Col md={3} className="d-flex flex-column justify-content-center">
                    <Button
                        variant="primary"
                        className="mb-2"
                        onClick={() => window.alert(`Calling ${item.seller || 'Seller'}...`)}
                    >
                        <i className="fas fa-phone"></i> Call Seller
                    </Button>
                    <Button
                        variant="outline-secondary"
                        onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(item.address || '123 Main St')}`, '_blank')}
                    >
                        <i className="fas fa-map-marker-alt"></i> Get Directions
                    </Button>
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>
      <Row className="mt-4">
          <Col>
            <Link to='/' className='btn btn-light'>
                Back to Search
            </Link>
          </Col>
      </Row>
    </Container>
  );
};

export default DealLocationScreen;
