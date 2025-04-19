import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Reviews() {
  const { restaurantId } = useParams();
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch restaurant details
        const restaurantResponse = await fetch(`http://localhost:5000/api/restaurants/${restaurantId}`);
        const restaurantData = await restaurantResponse.json();

        if (!restaurantResponse.ok) {
          throw new Error(restaurantData.error || 'Failed to fetch restaurant');
        }

        setRestaurant(restaurantData.restaurant);

        // Fetch reviews for the restaurant
        const reviewsResponse = await fetch(`http://localhost:5000/api/restaurants/${restaurantId}/reviews`);
        const reviewsData = await reviewsResponse.json();

        if (!reviewsResponse.ok) {
          throw new Error(reviewsData.error || 'Failed to fetch reviews');
        }

        setReviews(reviewsData.reviews);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchData();
    }
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-600">Loading reviews...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {restaurant && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reviews for {restaurant.RestaurantName}
            </h1>
            <p className="text-gray-600">{restaurant.Category}</p>
          </div>
        )}

        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No reviews yet for this restaurant.
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.ReviewID} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${
                            star <= review.Rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 15.585l-6.327 3.323 1.209-7.037L.172 7.207l7.046-1.024L10 0l2.782 6.183 7.046 1.024-4.71 4.664 1.209 7.037L10 15.585z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-gray-600">
                      {new Date(review.Date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    by {review.CustomerName || 'Anonymous'}
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {review.ReviewContent}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Reviews; 