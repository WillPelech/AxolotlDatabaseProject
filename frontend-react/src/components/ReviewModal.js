import React, { useState, useEffect } from 'react';

function ReviewModal({ isOpen, onClose, onSubmit, initialData, restaurantId, restaurantName }) {
  const [rating, setRating] = useState(initialData?.Rating || 5);
  const [content, setContent] = useState(initialData?.ReviewContent || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setRating(initialData.Rating);
      setContent(initialData.ReviewContent);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await onSubmit({ rating, content });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">
            {initialData ? 'Edit Review' : 'Write Review'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            for {restaurantName}
          </p>
          {error && (
            <div className="mb-4 text-red-600 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <svg
                      className={`w-8 h-8 ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
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
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                rows="4"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {initialData ? 'Update' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReviewModal; 