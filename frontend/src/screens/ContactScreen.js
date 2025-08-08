import React, { useState } from 'react';

const ContactScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Basic styles can be kept inline or moved to a CSS file
  const contentPageStyle = {
    padding: '2rem 1rem',
    maxWidth: '900px',
    margin: '0 auto',
  };

  const formWrapperStyle = {
    marginTop: '2rem',
    padding: '2rem',
    border: '1px solid #eee',
    borderRadius: '8px',
  };

  const formGroupStyle = {
    marginBottom: '1rem',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.8rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
  };

  const buttonStyle = {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
  };

  return (
    <div style={contentPageStyle}>
      <section>
        <h2>Contact Us</h2>
        <p>
          Have questions, feedback, or interested in partnering with us? We'd
          love to hear from you!
        </p>
        <p>
          <strong>Important:</strong> For questions about specific deals listed
          on the site, please contact the seller directly using the details
          provided in the deal listing.
        </p>

        <div style={formWrapperStyle}>
          {/* The form action points to Formspree. This can be replaced with a backend endpoint later. */}
          <form
            action="https://formspree.io/f/YOUR_UNIQUE_FORM_ID"
            method="POST"
          >
            <div style={formGroupStyle}>
              <label htmlFor="contactName" style={labelStyle}>
                Your Name:
              </label>
              <input
                type="text"
                id="contactName"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label htmlFor="contactEmail" style={labelStyle}>
                Your Email:
              </label>
              <input
                type="email"
                id="contactEmail"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label htmlFor="contactSubject" style={labelStyle}>
                Subject:
              </label>
              <input
                type="text"
                id="contactSubject"
                name="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label htmlFor="contactMessage" style={labelStyle}>
                Message:
              </label>
              <textarea
                id="contactMessage"
                name="message"
                rows="6"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={inputStyle}
              ></textarea>
            </div>
            <button type="submit" style={buttonStyle}>
              Send Message
            </button>
          </form>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
            Alternatively, you can reach us via email at:{' '}
            <a href="mailto:info@mzansifreshfinds.placeholder.co.za">
              info@mzansifreshfinds.placeholder.co.za
            </a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default ContactScreen;
