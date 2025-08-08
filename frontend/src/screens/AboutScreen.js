import React from 'react';
import { Link } from 'react-router-dom';

const AboutScreen = () => {
  // Basic styles can be kept inline or moved to a CSS file
  const contentPageStyle = {
    padding: '2rem 1rem',
    maxWidth: '900px',
    margin: '0 auto',
  };

  const sectionStyle = {
    opacity: 1, // Simplified from fade-in for now
  };

  const buttonStyle = {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
    textAlign: 'center',
    marginTop: '2rem',
  };

  return (
    <div style={contentPageStyle}>
      <section style={sectionStyle}>
        <h2>About Mzansi Fresh Finds</h2>

        <p>
          Welcome to Mzansi Fresh Finds! We're a proudly South African platform
          driven by a simple idea: connect savvy shoppers with great deals while
          tackling the significant challenge of food waste.
        </p>

        <h3>Our Mission: Good Food, Good Prices, Less Waste</h3>
        <p>
          Did you know that a substantial amount of perfectly edible food is
          discarded daily, often just because it's approaching its 'best before'
          date? This contributes to environmental strain and represents lost
          value. Simultaneously, many South African households are looking for
          ways to make their budgets stretch further, especially with rising
          food costs.
        </p>
        <p>
          Mzansi Fresh Finds bridges this gap. Our mission is to empower local
          businesses – from bakeries and butchers to grocers and cafes – to
          easily offer their quality surplus food items at discounted prices. By
          doing so, we help them recover potential losses, reduce their
          environmental footprint, and connect with value-conscious customers in
          their community.
        </p>

        <h3>How It Works for Shoppers</h3>
        <ul>
          <li>
            <strong>Discover Deals:</strong> Browse listings from businesses in
            your area using our easy search and category filters.
          </li>
          <li>
            <strong>View Details:</strong> Click on a deal to see the item
            description, price, best before date, and seller information.
          </li>
          <li>
            <strong>Connect Directly:</strong> Use the provided contact details
            to connect with the business and arrange your purchase and
            collection.
          </li>
          <li>
            <strong>Save & Support:</strong> Enjoy significant savings on your
            food bill while supporting local businesses and contributing to a
            more sustainable food system.
          </li>
        </ul>

        <h3>How It Works for Businesses</h3>
        <ul>
          <li>
            <strong>Easy Listing:</strong> (Coming Soon!) Our future business
            portal will allow you to quickly list items, set prices, and specify
            pickup details.
          </li>
          <li>
            <strong>Reduce Spoilage:</strong> Turn potential waste into revenue
            by selling items before they expire.
          </li>
          <li>
            <strong>Attract New Customers:</strong> Reach local shoppers
            actively looking for value and convenience.
          </li>
          <li>
            <strong>Be Sustainable:</strong> Demonstrate your commitment to
            reducing food waste.
          </li>
        </ul>

        <h3>Join the Fresh Finds Movement!</h3>
        <p>
          We believe that saving money and saving the planet can go hand-in-hand.
          Whether you're hunting for a bargain or looking for a smarter way to
          manage surplus stock, Mzansi Fresh Finds is here for you.
        </p>

        <p>
          Explore the deals on our <Link to="/">homepage</Link> or, if you're a
          business, sign up for updates about our launch!
        </p>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login" style={buttonStyle}>
            I'm a Business - Tell Me More!
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutScreen;
