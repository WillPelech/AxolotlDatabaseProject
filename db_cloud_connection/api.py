from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv
import hashlib
import jwt
from datetime import datetime, timezone, timedelta
from flask_cors import cross_origin
import pymysql

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='../frontend-react/build', static_url_path='')
CORS(app)  # Enable CORS for all routes
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')  # Add this to your .env file

# Database configuration
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_NAME = os.getenv('DB_NAME')

# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,
    'pool_recycle': 3600,
    'pool_pre_ping': True,
    'connect_args': {'ssl': {'ca': None}}  # Use SSL but don't verify certificate
}

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Define models
class Customer(db.Model):
    __tablename__ = 'Customer'
    CustomerID = db.Column(db.Integer, primary_key=True)
    Username = db.Column(db.String(50), unique=True, nullable=False)
    Password = db.Column(db.String(64), nullable=False)
    Email = db.Column(db.String(100), unique=True, nullable=False)
    DateOfBirth = db.Column(db.Date, nullable=True)

class RestaurantAccount(db.Model):
    __tablename__ = 'Restaurant_Account'
    AccountID = db.Column(db.Integer, primary_key=True)
    Username = db.Column(db.String(50), unique=True, nullable=False)
    Password = db.Column(db.String(64), nullable=False)
    Email = db.Column(db.String(100), unique=True, nullable=False)

class Restaurant(db.Model):
    __tablename__ = 'Restaurant'
    RestaurantID = db.Column(db.Integer, primary_key=True)
    RestaurantName = db.Column(db.String(100), nullable=False)
    Category = db.Column(db.String(50), nullable=True)
    Rating = db.Column(db.Float, nullable=True)
    PhoneNumber = db.Column(db.String(20), nullable=True)
    Address = db.Column(db.String(200), nullable=True)
    AccountID = db.Column(db.Integer, db.ForeignKey('Restaurant_Account.AccountID'), nullable=True)

class Food(db.Model):
    __tablename__ = 'Food'
    FoodID = db.Column(db.Integer, primary_key=True)
    FoodName = db.Column(db.String(100), nullable=False)
    Price = db.Column(db.Float, nullable=False)
    RestaurantID = db.Column(db.Integer, db.ForeignKey('Restaurant.RestaurantID'), nullable=False)

class Orders(db.Model):
    __tablename__ = 'Orders'
    OrderID = db.Column(db.Integer, primary_key=True)
    CustomerID = db.Column(db.Integer, db.ForeignKey('Customer.CustomerID'), nullable=False)
    RestaurantID = db.Column(db.Integer, db.ForeignKey('Restaurant.RestaurantID'), nullable=False)
    PriceTotal = db.Column(db.Float, nullable=False)
    Additional_Costs = db.Column(db.Float, nullable=True, default=0)

class FoodOrders(db.Model):
    __tablename__ = 'FoodOrders'
    OrderID = db.Column(db.Integer, db.ForeignKey('Orders.OrderID'), primary_key=True)
    FoodID = db.Column(db.Integer, db.ForeignKey('Food.FoodID'), primary_key=True)
    Quantity = db.Column(db.Integer, nullable=False)

class Messages(db.Model):
    __tablename__ = 'Messages'
    MessageID = db.Column(db.Integer, primary_key=True)
    SenderID = db.Column(db.Integer, nullable=False)
    RecipientID = db.Column(db.Integer, nullable=False)
    Timestamp = db.Column(db.DateTime, nullable=False)
    Contents = db.Column(db.Text, nullable=False)

class Review(db.Model):
    __tablename__ = 'Review'
    ReviewID = db.Column(db.Integer, primary_key=True)
    CustomerID = db.Column(db.Integer, db.ForeignKey('Customer.CustomerID'), nullable=False)
    RestaurantID = db.Column(db.Integer, db.ForeignKey('Restaurant.RestaurantID'), nullable=False)
    Rating = db.Column(db.Integer, nullable=False)
    Comment = db.Column(db.Text, nullable=True)
    Date = db.Column(db.DateTime, nullable=False)

class FrontPage(db.Model):
    __tablename__ = 'Front_Page'
    RestaurantID = db.Column(db.Integer, db.ForeignKey('Restaurant.RestaurantID'), primary_key=True)
    PushPoints = db.Column(db.Integer, nullable=False)
    Date = db.Column(db.DateTime, nullable=False)

def hash_password(password):
    # Ensure the password is a string and encode it consistently
    password_str = str(password).encode('utf-8')
    return hashlib.sha256(password_str).hexdigest()

def check_password(input_password, stored_password):
    print(f"Checking password hash: {hash_password(input_password)}")
    print(f"Against stored hash: {stored_password}")
    return hash_password(input_password) == stored_password

def generate_token(user_id):
    return jwt.encode(
        {'user_id': user_id, 'exp': datetime.now(timezone.utc) + timedelta(days=1)},
        JWT_SECRET,
        algorithm='HS256'
    )

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        account_type = data.get('accountType', 'customer')  # Default to customer if not specified

        # Check if username or email already exists in both tables
        existing_customer = Customer.query.filter(
            (Customer.Username == data['username']) | (Customer.Email == data['email'])
        ).first()
        
        if existing_customer:
            return jsonify({"error": "Username or email already exists"}), 400

        existing_restaurant = RestaurantAccount.query.filter(
            (RestaurantAccount.Username == data['username']) | (RestaurantAccount.Email == data['email'])
        ).first()
        
        if existing_restaurant:
            return jsonify({"error": "Username or email already exists"}), 400

        if account_type == 'restaurant':
            # Get the next AccountID for Restaurant_Account
            max_acc = db.session.query(db.func.max(RestaurantAccount.AccountID)).scalar()
            next_acc_id = 1 if max_acc is None else max_acc + 1

            # Create new restaurant account
            new_account = RestaurantAccount(
                AccountID=next_acc_id,
                Username=data['username'],
                Email=data['email'],
                Password=hash_password(data['password'])
            )
            db.session.add(new_account)
            
            account_id = next_acc_id
            message = "Restaurant account created successfully"
        else:
            # Get the next CustomerID
            max_cust = db.session.query(db.func.max(Customer.CustomerID)).scalar()
            next_cust_id = 1 if max_cust is None else max_cust + 1

            # Create new customer account
            new_customer = Customer(
                CustomerID=next_cust_id,
                Username=data['username'],
                Password=hash_password(data['password']),
                Email=data['email'],
                DateOfBirth=data.get('dateOfBirth')
            )
            db.session.add(new_customer)
            
            account_id = next_cust_id
            message = "Customer account created successfully"
        
        db.session.commit()
        
        return jsonify({
            "message": message,
            "accountId": account_id,
            "accountType": account_type
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Signup error: {str(e)}")
        return jsonify({"error": str(e)}), 500

def handle_options():
    response = jsonify({})
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response, 200

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
@cross_origin()
def login():
    if request.method == 'OPTIONS':
        return handle_options()

    try:
        data = request.get_json()
        username_or_email = data.get('username')
        password = data.get('password')

        print(f"Login attempt for username/email: {username_or_email}")
        
        # First try Customer table
        user = Customer.query.filter(
            (Customer.Username == username_or_email) | (Customer.Email == username_or_email)
        ).first()
        account_type = 'customer'

        # If not found in Customer table, try Restaurant_Account table
        if not user:
            user = RestaurantAccount.query.filter(
                (RestaurantAccount.Username == username_or_email) | (RestaurantAccount.Email == username_or_email)
            ).first()
            account_type = 'restaurant'

        print(f"Database query result: {user}")
        print(f"Account type: {account_type}")

        if user:
            if check_password(password, user.Password):
                # For customer accounts, use CustomerID
                # For restaurant accounts, use AccountID
                account_id = user.CustomerID if account_type == 'customer' else user.AccountID
                
                response = {
                    'message': f'Login successful - You are logged in as a {account_type} account',
                    'user': {
                        'username': user.Username,
                        'email': user.Email,
                        'accountType': account_type,
                        'accountId': account_id,
                        'isRestaurant': account_type == 'restaurant'
                    }
                }
                return jsonify(response), 200
            else:
                return jsonify({'error': 'Invalid password'}), 401
        else:
            print("User not found")
            return jsonify({'error': 'User not found'}), 401

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@app.route('/api/auth/verify', methods=['POST'])
def verify_auth():
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "No token provided"}), 401

        user_id = verify_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401

        user = Customer.query.filter_by(CustomerID=user_id).first()
        
        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "user": {
                "id": user.CustomerID,
                "username": user.Username,
                "email": user.Email
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/restaurants', methods=['GET'])
def get_all_restaurants():
    try:
        restaurants = Restaurant.query.all()
        return jsonify({
            "restaurants": [{
                'RestaurantID': r.RestaurantID,
                'RestaurantName': r.RestaurantName,
                'Category': r.Category,
                'Rating': r.Rating,
                'PhoneNumber': r.PhoneNumber,
                'Address': r.Address,
                'AccountID': r.AccountID
            } for r in restaurants]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/restaurants/<int:restaurant_id>/foods', methods=['GET'])
def get_restaurant_foods(restaurant_id):
    try:
        foods = Food.query.filter_by(RestaurantID=restaurant_id).all()
        
        foodlist = [{
            'FoodID': f.FoodID,
            'FoodName': f.FoodName,
            'Price': f.Price
        } for f in foods]
        
        print(f"Retrieved {len(foodlist)} foods for restaurant {restaurant_id}")  # Add logging
        
        return jsonify({
            'success': True,
            'foodlist': foodlist
        })
    except Exception as e:
        print(f"Error fetching foods: {str(e)}")  # Add logging
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/restaurants/<int:restaurant_id>/foods', methods=['POST'])
def create_food(restaurant_id):
    try:
        data = request.get_json()
        food_name = data.get('FoodName')
        price = data.get('Price')

        if not food_name or not price:
            return jsonify({
                'success': False,
                'error': 'Food name and price are required'
            }), 400

        # Get the next FoodID
        max_food_id = db.session.query(db.func.max(Food.FoodID)).scalar()
        next_food_id = 1 if max_food_id is None else max_food_id + 1

        # Create new food item
        new_food = Food(
            FoodID=next_food_id,
            FoodName=food_name,
            Price=price,
            RestaurantID=restaurant_id
        )
        db.session.add(new_food)
        db.session.commit()
        
        # Return the created food item
        new_food_dict = {
            'FoodID': new_food.FoodID,
            'FoodName': new_food.FoodName,
            'Price': new_food.Price,
            'RestaurantID': new_food.RestaurantID
        }
        
        return jsonify({
            'success': True,
            'food': new_food_dict
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error creating food: {str(e)}")  # Add logging
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/restaurants/<int:id>', methods=['GET'])
def get_restaurant_by_id(id):
    try:
        restaurant = Restaurant.query.filter_by(RestaurantID=id).first()
            
        if restaurant:
            return jsonify({
                "message": f"Restaurant {id} selected successfully",
                "restaurant": {
                    'RestaurantID': restaurant.RestaurantID,
                    'RestaurantName': restaurant.RestaurantName,
                    'Category': restaurant.Category,
                    'Rating': restaurant.Rating,
                    'PhoneNumber': restaurant.PhoneNumber,
                    'Address': restaurant.Address
                }
            })
        else:
            return jsonify({
                "error": "Restaurant not found"
            }), 404
    except Exception as e:
        print(f"Error fetching restaurant: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/restaurants', methods=['POST'])
def create_restaurant():
    try:
        data = request.json["restaurantData"]
        
        # Get the next RestaurantID
        max_id = db.session.query(db.func.max(Restaurant.RestaurantID)).scalar()
        next_id = 1 if max_id is None else max_id + 1

        # Create new restaurant
        new_restaurant = Restaurant(
            RestaurantID=next_id,
            RestaurantName=data['name'],
            Category=data['category'],
            PhoneNumber=data['phoneNumber'],
            Address=data['address'],
            AccountID=data['accountID']
        )
        db.session.add(new_restaurant)
        db.session.commit()
        
        return jsonify({
            'message': 'Restaurant created successfully',
            'restaurant': {
                'RestaurantID': new_restaurant.RestaurantID,
                'RestaurantName': new_restaurant.RestaurantName,
                'Category': new_restaurant.Category,
                'Rating': new_restaurant.Rating,
                'PhoneNumber': new_restaurant.PhoneNumber,
                'Address': new_restaurant.Address,
                'AccountID': new_restaurant.AccountID
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating restaurant: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/restaurants/<int:id>', methods=['PUT'])
def update_restaurant(id):
    try:
        # First check if restaurant exists
        restaurant = Restaurant.query.filter_by(RestaurantID=id).first()
        
        if not restaurant:
            return jsonify({"error": "Restaurant not found"}), 404
            
        data = request.json
        restaurantData = data["restaurantData"]
        
        # Update the restaurant
        restaurant.RestaurantName = restaurantData['RestaurantName']
        restaurant.Category = restaurantData['Category']
        restaurant.PhoneNumber = restaurantData['PhoneNumber']
        restaurant.Address = restaurantData['Address']
        
        db.session.commit()
        
        return jsonify({
            "message": "Restaurant updated successfully",
            "restaurant": {
                "RestaurantID": restaurant.RestaurantID,
                "RestaurantName": restaurant.RestaurantName,
                "Category": restaurant.Category,
                "PhoneNumber": restaurant.PhoneNumber,
                "Address": restaurant.Address
            }
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error updating restaurant: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/restaurants/<int:id>', methods = ['DELETE'])
def delete_restaurant(id):
    try:
        # First check if restaurant exists
        restaurant = Restaurant.query.filter_by(RestaurantID=id).first()
        
        if not restaurant:
            return jsonify({"error": "Restaurant not found"}), 404
            
        # First delete all associated food items to handle the foreign key constraint
        Food.query.filter_by(RestaurantID=id).delete()
        
        # Then delete the restaurant
        db.session.delete(restaurant)
        db.session.commit()
        
        return jsonify({
            "message": f"Restaurant {id} deleted successfully",
            "restaurant": {
                'RestaurantID': restaurant.RestaurantID,
                'RestaurantName': restaurant.RestaurantName,
                'Category': restaurant.Category,
                'Rating': restaurant.Rating,
                'PhoneNumber': restaurant.PhoneNumber,
                'Address': restaurant.Address
            }
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting restaurant: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/customers/<int:id>/restaurants', methods=['GET'])
def get_reviewed_restaurants(id):
    try:
        # Get restaurants that the customer has reviewed
        restaurants = db.session.query(Restaurant).join(
            Review, Restaurant.RestaurantID == Review.RestaurantID
        ).filter(Review.CustomerID == id).distinct().all()
        
        return jsonify({
            "restaurants": [{
                'RestaurantID': r.RestaurantID,
                'Category': r.Category,
                'Rating': r.Rating,
                'PhoneNumber': r.PhoneNumber,
                'Address': r.Address,
                'RestaurantName': r.RestaurantName
            } for r in restaurants]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/messages', methods = ['GET'])
def get_messages():
    try:
        messages = Messages.query.all()
        return jsonify({
            "messages": [{
                'MessageID': m.MessageID,
                'SenderID': m.SenderID,
                'RecipientID': m.RecipientID,
                'Timestamp': m.Timestamp,
                'Contents': m.Contents
            } for m in messages]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/messages', methods=['POST'])
def create_message():
    try:
        data = request.json["messageData"]
        
        # Get the next MessageID
        max_id = db.session.query(db.func.max(Messages.MessageID)).scalar()
        next_id = 1 if max_id is None else max_id + 1

        # Create new message
        new_message = Messages(
            MessageID=next_id,
            SenderID=data['senderID'],
            RecipientID=data['recipientID'],
            Timestamp=data['timestamp'],
            Contents=data['contents']
        )
        db.session.add(new_message)
        db.session.commit()
        
        return jsonify({'message': 'Message created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/messages/<int:id>', methods = ['GET'])
def get_messages_by_id():
    try:
        id = request.json["id"]
        message = Messages.query.filter_by(MessageID=id).first()
        
        if message:
            return jsonify({
                "message": {
                    'MessageID': message.MessageID,
                    'SenderID': message.SenderID,
                    'RecipientID': message.RecipientID,
                    'Timestamp': message.Timestamp,
                    'Contents': message.Contents
                }
            })
        else:
            return jsonify({"error": "Message not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/restaurants/front-page', methods=['GET'])
def get_front_page_restaurants():
    try:
        print("Attempting to fetch front page restaurants...")
        
        # First check if there are any restaurants in the database
        restaurant_count = db.session.query(Restaurant).count()
        print(f"Total restaurants in database: {restaurant_count}")
        
        # Check if there are any entries in the Front_Page table
        front_page_count = db.session.query(FrontPage).count()
        print(f"Total entries in Front_Page table: {front_page_count}")
        
        # Get restaurants from the Front_Page table
        restaurants = db.session.query(Restaurant).join(
            FrontPage, Restaurant.RestaurantID == FrontPage.RestaurantID
        ).order_by(FrontPage.PushPoints.desc()).limit(6).all()
        
        print(f"Found {len(restaurants)} restaurants for front page")
        
        result = []
        for restaurant in restaurants:
            restaurant_data = {
                'id': restaurant.RestaurantID,
                'name': restaurant.RestaurantName,
                'description': restaurant.Category,  # Using Category as description
                'rating': float(restaurant.Rating) if restaurant.Rating else 0
            }
            result.append(restaurant_data)
            print(f"Added restaurant: {restaurant_data['name']} (ID: {restaurant_data['id']})")
            
        print(f"Returning {len(result)} restaurants")
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching front page restaurants: {str(e)}")
        import traceback
        traceback.print_exc()  # Print the full stack trace
        # Return empty array instead of error to prevent frontend issues
        return jsonify([])

@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        data = request.json
        print("Received order data:", data)  # Debug log
        
        customer_id = data.get('CustomerID')
        restaurant_id = data.get('RestaurantID')
        items = data.get('items', [])
        additional_costs = data.get('Additional_Costs', 0)  # Default to 0 if not provided
        price_total = data.get('PriceTotal')

        if not all([customer_id, restaurant_id, items, price_total]):
            missing_fields = [field for field, value in {
                'CustomerID': customer_id,
                'RestaurantID': restaurant_id,
                'items': items,
                'PriceTotal': price_total
            }.items() if not value]
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        # Get the next OrderID
        max_order_id = db.session.query(db.func.max(Orders.OrderID)).scalar()
        next_order_id = 1 if max_order_id is None else max_order_id + 1

        # Create the order entry with Additional_Costs
        new_order = Orders(
            OrderID=next_order_id,
            CustomerID=customer_id,
            RestaurantID=restaurant_id,
            PriceTotal=price_total,
            Additional_Costs=additional_costs
        )
        db.session.add(new_order)
        
        # Commit the order first to ensure it exists in the database
        db.session.commit()
        
        # Now create FoodOrders entries for each item
        for item in items:
            food_order = FoodOrders(
                OrderID=next_order_id,
                FoodID=item['FoodID'],
                Quantity=item['quantity']
            )
            db.session.add(food_order)
        
        # Commit the food orders
        db.session.commit()
        
        return jsonify({
            'message': 'Order created successfully',
            'orderID': next_order_id
        }), 201

    except Exception as e:
        db.session.rollback()
        print("Error creating order:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/customer/<int:customer_id>', methods=['GET'])
def get_customer_orders(customer_id):
    try:
        # Get all orders for the customer
        orders_data = db.session.query(
            Orders, Restaurant.RestaurantName
        ).join(
            Restaurant, Orders.RestaurantID == Restaurant.RestaurantID
        ).filter(
            Orders.CustomerID == customer_id
        ).order_by(Orders.OrderID.desc()).all()
        
        orders = []
        for order, restaurant_name in orders_data:
            additional_costs = float(order.Additional_Costs) if order.Additional_Costs is not None else 0
            order_dict = {
                'OrderID': order.OrderID,
                'CustomerID': order.CustomerID,
                'RestaurantID': order.RestaurantID,
                'PriceTotal': float(order.PriceTotal),
                'Additional_Costs': additional_costs,
                'TotalCost': float(order.PriceTotal) + additional_costs,  # Sum of PriceTotal and Additional_Costs
                'RestaurantName': restaurant_name,
                'items': []
            }
            
            # Get food items for this order
            food_items = db.session.query(
                Food.FoodID, Food.FoodName, Food.Price, FoodOrders.Quantity
            ).join(
                FoodOrders, Food.FoodID == FoodOrders.FoodID
            ).filter(
                FoodOrders.OrderID == order_dict['OrderID']
            ).all()
            
            # Add food items to the order
            for item in food_items:
                order_dict['items'].append({
                    'FoodID': item[0],
                    'FoodName': item[1],
                    'Price': float(item[2]),
                    'Quantity': item[3]
                })
            
            orders.append(order_dict)

        return jsonify(orders)

    except Exception as e:
        print("Error fetching orders:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/restaurants/<int:restaurant_id>/foods/<int:food_id>', methods=['PUT'])
def update_food(restaurant_id, food_id):
    try:
        # First check if food exists and belongs to the restaurant
        food = Food.query.filter_by(FoodID=food_id, RestaurantID=restaurant_id).first()
        
        if not food:
            return jsonify({
                'success': False,
                'error': 'Food item not found or does not belong to this restaurant'
            }), 404
            
        data = request.get_json()
        
        # Update food details
        food.FoodName = data.get('FoodName', food.FoodName)
        food.Price = data.get('Price', food.Price)
        
        db.session.commit()
        
        # Return the updated food item
        updated_food = {
            'FoodID': food.FoodID,
            'FoodName': food.FoodName,
            'Price': food.Price,
            'RestaurantID': food.RestaurantID
        }
        
        return jsonify({
            'success': True,
            'food': updated_food
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error updating food: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/restaurants/<int:restaurant_id>/foods/<int:food_id>', methods=['DELETE'])
def delete_food(restaurant_id, food_id):
    try:
        # First check if food exists and belongs to the restaurant
        food = Food.query.filter_by(FoodID=food_id, RestaurantID=restaurant_id).first()
        
        if not food:
            return jsonify({
                'success': False,
                'error': 'Food item not found or does not belong to this restaurant'
            }), 404
            
        # Delete the food item
        db.session.delete(food)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Food item deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting food: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)