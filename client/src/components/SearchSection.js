import React from 'react';

const SearchSection = () => {
  return (
    <section className="search-section">
      <input
        type="text"
        className="search-input"
        placeholder="Search for artists, bands, tracks, podcasts"
      />
      <button className="search-btn">Upload your own</button>
    </section>
  );
};

export default SearchSection;
