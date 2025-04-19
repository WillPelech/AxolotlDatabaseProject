from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, User, Restaurant, FavoriteRestaurant
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Initialize database
db.init_app(app)

# Create database tables
with app.app_context():
    db.create_all()

# API Routes
@app.route('/api/restaurants', methods=['GET'])
def get_restaurants():
    restaurants = Restaurant.query.all()
    return jsonify([{
        'id': r.id,
        'name': r.name,
        'description': r.description,
        'address': r.address,
        'latitude': r.latitude,
        'longitude': r.longitude,
        'cuisine_type': r.cuisine_type,
        'price_range': r.price_range,
        'rating': r.rating
    } for r in restaurants])

@app.route('/api/restaurants', methods=['POST'])
def create_restaurant():
    data = request.json
    restaurant = Restaurant(
        name=data['name'],
        description=data.get('description'),
        address=data['address'],
        latitude=data['latitude'],
        longitude=data['longitude'],
        cuisine_type=data.get('cuisine_type'),
        price_range=data.get('price_range'),
        rating=data.get('rating')
        

    )
    db.session.add(restaurant)
    db.session.commit()
    return jsonify({
        'id': restaurant.id,
        'name': restaurant.name,
        'message': 'Restaurant created successfully'
    }), 201

@app.route('/api/restaurants/<int:restaurant_id>', methods=['GET'])
def get_restaurant(restaurant_id):
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    return jsonify({
        'id': restaurant.id,
        'name': restaurant.name,
        'description': restaurant.description,
        'address': restaurant.address,
        'latitude': restaurant.latitude,
        'longitude': restaurant.longitude,
        'cuisine_type': restaurant.cuisine_type,
        'price_range': restaurant.price_range,
        'rating': restaurant.rating
    })

if __name__ == '__main__':
    app.run(debug=True) 