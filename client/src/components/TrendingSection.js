import React from 'react';

const TrendingSection = () => {
  return (
    <section className="trending">
      <h2>What’s Trending Now?</h2>
      <div className="trending-grid">
        <div className="thumbnail">
          <img src="/images/thumb1.jpg" alt="Thumbnail 1" />
          <div className="thumbnail-title">Alba</div>
        </div>
        <div className="thumbnail">
          <img src="/images/thumb2.jpg" alt="Thumbnail 2" />
          <div className="thumbnail-title">Maisha</div>
        </div>
        <div className="thumbnail">
          <img src="/images/thumb1.jpg" alt="Thumbnail 3" />
          <div className="thumbnail-title">Love</div>
        </div>
      </div>
    </section>
  );
};

export default TrendingSection;
