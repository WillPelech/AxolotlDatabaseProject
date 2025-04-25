import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import ReviewModal from '../components/ReviewModal';
import ConfirmDialog from '../components/ConfirmDialog';

function MyReviews() {
  const { user, getAuthToken } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    reviewId: null,
    restaurantName: ''
  });

  const getAuthHeaders = (includeContentType = true) => {
    const token = getAuthToken();
    let headers = {};
    if (includeContentType) {
         headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  useEffect(() => {
    fetchReviews();
  }, [user, getAuthToken]);

  const fetchReviews = async () => {
    if (!user || !user.accountId) {
      setError('Please log in to view your reviews');
      setLoading(false);
      setReviews([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/customers/reviews`, { 
          headers: getAuthHeaders(false)
      }); 
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
             setError("Authentication failed. Please log in again.");
        } else {
             const errorData = await response.json();
             throw new Error(errorData.error || 'Failed to fetch reviews');
        }
      } else {
            const data = await response.json();
            setReviews(data.reviews || []);
      }
    } catch (err) {
      setError(err.message);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (reviewId, restaurantName) => {
    setDeleteConfirmation({
      isOpen: true,
      reviewId,
      restaurantName
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.reviewId) return;
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/reviews/${deleteConfirmation.reviewId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(false)
      });

      if (!response.ok) {
         if (response.status === 401 || response.status === 403) {
             setError("Authentication failed or permission denied.");
         } else {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to delete review');
         }
      } else {
          setReviews(reviews.filter(review => review.ReviewID !== deleteConfirmation.reviewId));
          setSuccessMessage('Review deleted successfully');
          setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteConfirmation({ isOpen: false, reviewId: null, restaurantName: '' });
    }
  };

  const handleUpdateReview = async ({ rating, content }) => {
    if (!editingReview || !editingReview.ReviewID) return;
    setError('');
    try {
       const response = await fetch(`http://localhost:5000/api/reviews/${editingReview.ReviewID}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          rating: rating, 
          content: content,
        }),
      });

      if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
             setError("Authentication failed or permission denied.");
          } else {
               const errorData = await response.json();
               throw new Error(errorData.error || 'Failed to update review');
          }
      } else {
          const updatedReviewData = await response.json();
          setReviews(reviews.map(review => 
            review.ReviewID === editingReview.ReviewID 
              ? { ...review, Rating: updatedReviewData.review.Rating, ReviewContent: updatedReviewData.review.ReviewContent }
              : review
          ));
          setSuccessMessage('Review updated successfully');
          setTimeout(() => setSuccessMessage(''), 3000);
          setIsModalOpen(false);
          setEditingReview(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-600">Loading your reviews...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Reviews</h1>
        
        {error && (
          <div className="mb-4 text-red-600 text-center">{error}</div>
        )}
        
        {successMessage && (
          <div className="mb-4 text-green-600 text-center">{successMessage}</div>
        )}
        
        {reviews.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            You haven't written any reviews yet.
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.ReviewID} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <Link 
                    to={`/restaurants/${review.RestaurantID}`}
                    className="text-neutral-600 hover:text-primary font-medium"
                  >
                    {review.RestaurantName}
                  </Link>
                  <div className="flex items-center space-x-4">
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
                    <span className="text-gray-600">
                      {new Date(review.Date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap mb-4">
                  {review.ReviewContent}
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleEdit(review)}
                    className="text-primary hover:text-primary-dark font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(review.ReviewID, review.RestaurantName)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReview(null);
        }}
        onSubmit={handleUpdateReview}
        initialData={editingReview}
      />

      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, reviewId: null, restaurantName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Review"
        message={`Are you sure you want to delete your review for ${deleteConfirmation.restaurantName}? This action cannot be undone.`}
      />
    </div>
  );
}

export default MyReviews; 