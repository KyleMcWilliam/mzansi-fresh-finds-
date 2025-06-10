import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Using useNavigate hook for React Router v6+

const SearchBox = () => {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/search/${keyword}`);
    } else {
      navigate('/'); // Navigate to home or a main product listing page if keyword is empty
    }
    setKeyword(''); // Optionally clear keyword from input after search
  };

  return (
    <form onSubmit={submitHandler} style={{ display: 'flex' }}> {/* Basic inline style for layout */}
      <input
        type='text'
        name='q'
        onChange={(e) => setKeyword(e.target.value)}
        value={keyword} // Control the input
        placeholder='Search Products...'
        style={{ marginRight: '5px' }} // Basic inline style
      />
      <button type='submit' style={{ padding: '5px 10px' }}> {/* Basic inline style */}
        Search
      </button>
    </form>
  );
};

export default SearchBox;
