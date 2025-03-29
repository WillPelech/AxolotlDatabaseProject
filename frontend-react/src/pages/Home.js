import React from 'react';

function Home() {
  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-[1024px] px-4 py-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-orange-600 mb-4">
            FoodHub
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            Your Ultimate Food Discovery Platform
          </p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover amazing restaurants, explore local cuisines, and find your next favorite meal.
            Whether you're a foodie or a restaurant owner, FoodHub has something for everyone.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home; 