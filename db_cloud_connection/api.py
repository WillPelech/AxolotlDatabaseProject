from flask import Flask, request, jsonify, send_from_directory, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv, find_dotenv
import hashlib
import jwt
from datetime import datetime, timezone, timedelta
from flask_cors import cross_origin
import pymysql
import base64
from functools import wraps
import io
from PIL import Image

# Import SQLAlchemy engine utilities for dynamic role switching
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy import text
from sqlalchemy import delete as sa_delete
from sqlalchemy.orm import aliased  # Add aliasing for message joins

# Load environment variables from project root .env file
load_dotenv(find_dotenv())

app = Flask(__name__, static_folder='../frontend-react/build', static_url_path='')
CORS(app)  # Enable CORS for all routes
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')  # Add this to your .env file

# Load primary admin credentials
DB_ADMIN_USER = os.getenv('DB_ADMIN_USER')
DB_ADMIN_PASSWORD = os.getenv('DB_ADMIN_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_NAME = os.getenv('DB_NAME')

# Load credentials for different database roles
DB_GUEST_USER = os.getenv('GUEST_USER')
DB_GUEST_PASSWORD = os.getenv('GUEST_PASSWORD')
DB_CUSTOMER_USER = os.getenv('CUSTOMER_USER')
DB_CUSTOMER_PASSWORD = os.getenv('CUSTOMER_PASSWORD')
DB_RESTAURANT_USER = os.getenv('RESTAURANT_USER')
DB_RESTAURANT_PASSWORD = os.getenv('RESTAURANT_PASSWORD')

# Configure SQLAlchemy with default guest role
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{DB_GUEST_USER}:{DB_GUEST_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,
    'pool_recycle': 3600,
    'pool_pre_ping': True,
    'connect_args': {'ssl': {'ca': None}}  # Use SSL but don't verify certificate
}

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Create SQLAlchemy engines for each role
uri_guest = f"mysql+pymysql://{DB_GUEST_USER}:{DB_GUEST_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
uri_customer = f"mysql+pymysql://{DB_CUSTOMER_USER}:{DB_CUSTOMER_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
uri_restaurant = f"mysql+pymysql://{DB_RESTAURANT_USER}:{DB_RESTAURANT_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
uri_admin = f"mysql+pymysql://{DB_ADMIN_USER}:{DB_ADMIN_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Engine options reused from config
engine_opts = app.config.get('SQLALCHEMY_ENGINE_OPTIONS', {})

# Instantiate engines
engine_guest = create_engine(uri_guest, **engine_opts)
engine_customer = create_engine(uri_customer, **engine_opts)
engine_restaurant = create_engine(uri_restaurant, **engine_opts)
engine_admin = create_engine(uri_admin, **engine_opts)

# Scoped session bound to guest by default
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine_guest))
# Override Flask-SQLAlchemy session
db.session = SessionLocal

# DATABASE ROLE BINDING - This happens on EVERY request
@app.before_request
def bind_database_role():
    """
    Bind database session to the correct user role for each request.
    Sets role based on path or JWT content.
    """
    path = request.path
    
    # CASE 1: Auth endpoints - Need admin role to create accounts
    if path.startswith('/api/auth/signup') or path.startswith('/api/auth/login'):
        # Admin role for auth operations
        role = "admin"
        engine = engine_admin
        
    # CASE 2: Token endpoints - Customer or Restaurant based on JWT token
    else:
        # Default to guest
        role = "guest"
        engine = engine_guest
        
        # Check for JWT token
        auth_header = request.headers.get('Authorization', '')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]
            payload = verify_token(token)
            
            # If valid token, use its account type
            if payload and 'accountType' in payload:
                account_type = payload['accountType']
                if account_type == 'customer':
                    role = "customer"
                    engine = engine_customer
                elif account_type == 'restaurant':
                    role = "restaurant"
                    engine = engine_restaurant
    
    # Apply the binding - This gets invoked on every request
    SessionLocal.configure(bind=engine)
    print(f"[DB ROLE] {role.upper()} role applied for {request.method} {path}")

# Define models
class Customer(db.Model):
    __tablename__ = 'Customer'
    CustomerID = db.Column(db.Integer, primary_key=True)
    Username = db.Column(db.String(50), unique=True, nullable=False)
    Password = db.Column(db.String(64), nullable=False)
    Email = db.Column(db.String(100), unique=True, nullable=False)
    DateOfBirth = db.Column(db.Date, nullable=True)

class Customer_Address(db.Model):
    __tablename__ = 'Customer_Address'
    CustomerID = db.Column(db.Integer, db.ForeignKey('Customer.CustomerID'), primary_key = True)
    Address = db.Column(db.String(255), primary_key = True)

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
    Timestamp = db.Column('Datetime', db.DateTime, nullable=False)
    Contents = db.Column('Content', db.Text, nullable=False)

class Review(db.Model):
    __tablename__ = 'Review'
    ReviewID = db.Column(db.Integer, primary_key=True)
    CustomerID = db.Column(db.Integer, db.ForeignKey('Customer.CustomerID'), nullable=False)
    RestaurantID = db.Column(db.Integer, db.ForeignKey('Restaurant.RestaurantID'), nullable=False)
    Rating = db.Column(db.Integer, nullable=False)
    ReviewContent = db.Column(db.Text, nullable=True)
    Date = db.Column(db.DateTime, nullable=False)

class FrontPage(db.Model):
    __tablename__ = 'Front_Page'
    RestaurantID = db.Column(db.Integer, db.ForeignKey('Restaurant.RestaurantID'), primary_key=True)
    PushPoints = db.Column(db.Integer, nullable=False)
    Date = db.Column(db.DateTime, nullable=False)

class Photo(db.Model):
    __tablename__ = 'Photo'
    PhotoID = db.Column(db.Integer, primary_key = True)
    RestaurantID = db.Column(db.Integer, db.ForeignKey('Restaurant.RestaurantID'))
    PhotoImage = db.Column(db.Text, nullable=False)

def hash_password(password):
    # Ensure the password is a string and encode it consistently
    password_str = str(password).encode('utf-8')
    return hashlib.sha256(password_str).hexdigest()

def check_password(input_password, stored_password):
    print(f"Checking password hash: {hash_password(input_password)}")
    print(f"Against stored hash: {stored_password}")
    return hash_password(input_password) == stored_password

def generate_token(user_id, account_type):
    """Generates JWT containing user ID (sub) and account type."""
    try:
        payload = {
            'sub': user_id, # Use 'sub' (subject) standard claim for ID
            'accountType': account_type,
            'exp': datetime.now(timezone.utc) + timedelta(days=1) # Expiration time
        }
        return jwt.encode(payload, JWT_SECRET, algorithm='HS256')
    except Exception as e:
        print(f"Error generating token: {e}")
        return None

def verify_token(token):
    """Verifies the token and returns the payload if valid, otherwise None."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        # Basic check for expected keys
        if 'sub' not in payload or 'accountType' not in payload:
             raise jwt.InvalidTokenError("Token missing required claims.")
        return payload
    except jwt.ExpiredSignatureError:
        print("Token expired.")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {e}")
        return None
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

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
        
        # Initialize user data
        user_obj = None
        account_type = None
        account_id = None
        
        # Try Customer table
        customer = Customer.query.filter(
            (Customer.Username == username_or_email) | (Customer.Email == username_or_email)
        ).first()
        if customer and check_password(password, customer.Password):
            user_obj = customer
            account_type = 'customer'
            account_id = customer.CustomerID
            
        # If not a customer match, try Restaurant_Account table
        if not user_obj:
             restaurant_acc = RestaurantAccount.query.filter(
                 (RestaurantAccount.Username == username_or_email) | (RestaurantAccount.Email == username_or_email)
             ).first()
             if restaurant_acc and check_password(password, restaurant_acc.Password):
                 user_obj = restaurant_acc
                 account_type = 'restaurant'
                 account_id = restaurant_acc.AccountID

        print(f"Database query result: {user_obj}")
        print(f"Account type found: {account_type}")

        # Handle successful authentication
        if user_obj and account_type and account_id is not None:
            token = generate_token(user_id=account_id, account_type=account_type)
            if not token:
                 # Handle error if token generation fails
                 return jsonify({'error': 'Failed to generate authentication token.'}), 500
                 
            response_data = {
                'message': f'Login successful - You are logged in as a {account_type} account',
                'token': token, # Include the token in the response
                'user': {
                    'username': user_obj.Username,
                    'email': user_obj.Email,
                    'accountType': account_type,
                    # Use the consistent account_id determined above
                    'accountId': account_id, 
                    'isRestaurant': account_type == 'restaurant'
                }
            }
            return jsonify(response_data), 200
        # Handle validation failures
        elif customer and not check_password(password, customer.Password):
             return jsonify({'error': 'Invalid password for customer'}), 401
        elif not customer:
             restaurant_acc = RestaurantAccount.query.filter(
                 (RestaurantAccount.Username == username_or_email) | (RestaurantAccount.Email == username_or_email)
             ).first()
             if restaurant_acc and not check_password(password, restaurant_acc.Password):
                 return jsonify({'error': 'Invalid password for restaurant account'}), 401
             elif not restaurant_acc:
                  print("User not found in either table")
                  return jsonify({'error': 'User not found'}), 401
        else:
            print("Login failed for unknown reason")
            return jsonify({'error': 'Login failed - invalid credentials'}), 401

    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Login failed due to server error'}), 500

# Decorator for requiring JWT token
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        print(f"[Auth Debug] Received Authorization header: {auth_header}") # Log header
        
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                print(f"[Auth Debug] Extracted Token: {token[:10]}...") # Log first part of token
            except IndexError:
                print("[Auth Debug] Error: Invalid Bearer format.")
                return jsonify({'message': 'Invalid Authorization header format. Use Bearer token.'}), 401
        else:
             print("[Auth Debug] Warning: Authorization header missing or not Bearer type.")

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        payload = verify_token(token)
        print(f"[Auth Debug] verify_token payload: {payload}") # Log verification result
        
        if not payload:
             return jsonify({'message': 'Token is invalid or expired!'}), 401

        try:
            user_id = payload['sub']
            account_type = payload['accountType']
            print(f"[Auth Debug] Token UserID: {user_id}, AccountType: {account_type}") # Log extracted info
            
            current_user_obj = None
            if account_type == 'customer':
                current_user_obj = Customer.query.get(user_id)
            elif account_type == 'restaurant':
                current_user_obj = RestaurantAccount.query.get(user_id)
            
            print(f"[Auth Debug] Loaded user object: {current_user_obj}") # Log loaded user
            
            if not current_user_obj:
                 print("[Auth Debug] Error: User from token not found in DB.")
                 return jsonify({'message': 'User associated with token not found!'}), 401

            g.current_user = {
                'id': user_id,
                'type': account_type,
                'username': current_user_obj.Username,
                'object': current_user_obj
            }
            print(f"[Auth Debug] Set g.current_user: {g.current_user}") # Log context
            # Database binding is handled in before_request; not binding here
            print(f"[Auth Debug] Returning to view function: {f.__name__}")
            return f(*args, **kwargs)
        except Exception as e:
             print(f"[Auth Debug] Error loading user from token: {e}")
             import traceback
             traceback.print_exc()
             return jsonify({'message': 'Error processing token user data!'}), 500

    return decorated

# Decorator for requiring customer role
def require_customer(f):
     @wraps(f)
     @token_required # Ensures token is valid and g.current_user is set
     def decorated(*args, **kwargs):
         print(f"[Auth Debug] require_customer checking user type: {g.current_user.get('type') if hasattr(g, 'current_user') else 'g.current_user not set'}") # Log type check
         if not hasattr(g, 'current_user') or g.current_user.get('type') != 'customer':
             print("[Auth Debug] Access Denied: Customer role required.")
             return jsonify({'message': 'Access denied: Customer role required.'}), 403
         return f(*args, **kwargs)
     return decorated

def require_restaurant(f):
     @wraps(f)
     @token_required # Ensures token is valid and g.current_user is set
     def decorated(*args, **kwargs):
         if g.current_user['type'] != 'restaurant':
             return jsonify({'message': 'Access denied: Restaurant role required.'}), 403
         return f(*args, **kwargs)
     return decorated

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
@require_restaurant
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

@app.route('/api/restaurants/<int:restaurant_id>/foods/<int:food_id>', methods=['PUT'])
@require_restaurant
def update_food(restaurant_id, food_id):
    """Updates a specific food item for a given restaurant."""
    try:
        food_item = Food.query.filter_by(FoodID=food_id, RestaurantID=restaurant_id).first()
        
        if not food_item:
            return jsonify({'success': False, 'error': 'Food item not found'}), 404
            
        data = request.get_json()
        food_name = data.get('FoodName')
        price = data.get('Price')

        if food_name:
            food_item.FoodName = food_name
        if price is not None:
            try:
                food_item.Price = float(price)
            except ValueError:
                return jsonify({'success': False, 'error': 'Invalid price format'}), 400

        db.session.commit()
        
        updated_food_data = {
            'FoodID': food_item.FoodID,
            'FoodName': food_item.FoodName,
            'Price': food_item.Price,
            'RestaurantID': food_item.RestaurantID
        }
        
        return jsonify({
            'success': True,
            'message': 'Food item updated successfully',
            'food': updated_food_data
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error updating food ID {food_id} for restaurant ID {restaurant_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/restaurants/<int:restaurant_id>/foods/<int:food_id>', methods=['DELETE'])
@require_restaurant
def delete_food(restaurant_id, food_id):
    """Deletes a specific food item for a given restaurant."""
    try:
        food_item = Food.query.filter_by(FoodID=food_id, RestaurantID=restaurant_id).first()
        
        if not food_item:
            return jsonify({'success': False, 'error': 'Food item not found'}), 404
        
        # Store name before deleting
        food_name = food_item.FoodName

        # Delete associated FoodOrders first
        FoodOrders.query.filter_by(FoodID=food_id).delete(synchronize_session=False)
        
        # Delete the food item
        db.session.delete(food_item)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Food item \'{food_name}\' (ID: {food_id}) deleted successfully.' 
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting food ID {food_id} for restaurant ID {restaurant_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'An error occurred while deleting food item ID {food_id}.'
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
@require_restaurant
def create_restaurant():
    try:
        account_id = g.current_user['id'] # Get owner ID from token
        
        # Check if request body is valid JSON
        if not request.is_json:
             return jsonify({'error': 'Request must be JSON.'}), 400
        data = request.get_json()

        # Check if 'restaurantData' key exists
        if "restaurantData" not in data:
             return jsonify({'error': 'Missing restaurantData field in request body.'}), 400
        restaurantData = data["restaurantData"]
        
        # Validate other required fields within restaurantData
        required_fields = ['name', 'category', 'phoneNumber', 'address']
        missing_fields = [field for field in required_fields if field not in restaurantData or not restaurantData[field]]
        if missing_fields:
             return jsonify({'error': f'Missing required restaurant data fields: {", ".join(missing_fields)}.'}), 400
        
        # Get the next RestaurantID
        max_id = db.session.query(db.func.max(Restaurant.RestaurantID)).scalar()
        next_id = 1 if max_id is None else max_id + 1

        # Create new restaurant instance
        new_restaurant = Restaurant(
            RestaurantID=next_id,
            RestaurantName=restaurantData['name'],
            Category=restaurantData['category'],
            PhoneNumber=restaurantData['phoneNumber'],
            Address=restaurantData['address'],
            AccountID=account_id # Assign ownership from token
        )
        db.session.add(new_restaurant)
        db.session.commit()
        
        # Prepare response data
        created_restaurant_data = {
            'RestaurantID': new_restaurant.RestaurantID,
            'RestaurantName': new_restaurant.RestaurantName,
            'Category': new_restaurant.Category,
            'Rating': new_restaurant.Rating, # Will be null initially
            'PhoneNumber': new_restaurant.PhoneNumber,
            'Address': new_restaurant.Address,
            'AccountID': new_restaurant.AccountID
        }
        
        return jsonify({
            'message': 'Restaurant created successfully',
            'restaurant': created_restaurant_data
        }), 201
        
    except KeyError as e:
        # Handle cases where request.json["restaurantData"] fails (though checked above)
        db.session.rollback()
        print(f"Error creating restaurant (KeyError): {str(e)}")
        return jsonify({"error": f"Invalid request format: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Error creating restaurant: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "An unexpected error occurred while creating the restaurant."}), 500

@app.route('/api/restaurants/<int:id>', methods=['PUT'])
@require_restaurant 
def update_restaurant(id):
    try:
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

@app.route('/api/restaurants/<int:id>', methods=['DELETE'])
@require_restaurant
def delete_restaurant(id):
    try:
        # First check if restaurant exists
        restaurant = Restaurant.query.filter_by(RestaurantID=id).first()
        if not restaurant:
            return jsonify({"error": "Restaurant not found"}), 404

        # Get IDs of food items associated with this restaurant
        food_items = Food.query.filter_by(RestaurantID=id).all()
        food_ids = [item.FoodID for item in food_items]

        # 1. Delete associated FoodOrders (depends on Food and Orders)
        if food_ids:
            FoodOrders.query.filter(FoodOrders.FoodID.in_(food_ids)).delete(synchronize_session=False)

        # 2. Delete associated Reviews handled by DB trigger, no manual deletion needed

        # 4. Delete associated FrontPage entries (depends on Restaurant)
        FrontPage.query.filter_by(RestaurantID=id).delete(synchronize_session=False)

        # 6. Finally, delete the restaurant itself
        db.session.delete(restaurant)
        
        # Commit all changes
        db.session.commit()
        
        deleted_restaurant_data = {
            'RestaurantID': id,
            'RestaurantName': restaurant.RestaurantName 
        }
        
        return jsonify({
            "message": f"Restaurant '{deleted_restaurant_data['RestaurantName']}' (ID: {id}) and all associated data deleted successfully.",
            "restaurant": deleted_restaurant_data
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting restaurant ID {id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"An error occurred while deleting restaurant ID {id}."}), 500

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

@app.route('/api/customers/address', methods=['GET']) # Route uses JWT for customer ID
@require_customer
def get_customer_address():
    customer_id = g.current_user['id'] # Use 'id' instead of 'sub'
    try:
        addresses = Customer_Address.query.filter_by(CustomerID=customer_id).all()
        # Extract just the address strings
        address_list = [addr.Address for addr in addresses]
        return jsonify(address_list), 200
    except Exception as e:
        print(f"Error fetching addresses for customer {customer_id}: {str(e)}")
        return jsonify({"error": "Failed to retrieve addresses"}), 500

@app.route('/api/customers/address', methods=['POST']) # Route uses JWT for customer ID
@require_customer
def create_customer_address():
    customer_id = g.current_user['id'] # Use 'id' instead of 'sub'
    data = request.json
    address_text = data.get('address')

    if not address_text:
        return jsonify({"error": "Address text is required"}), 400

    try:
        # Check if address already exists for this customer
        existing_address = Customer_Address.query.filter_by(CustomerID=customer_id, Address=address_text).first()
        if existing_address:
            return jsonify({"error": "Address already exists for this customer"}), 409 # Conflict

        # Create and add the new address
        new_address_entry = Customer_Address(CustomerID=customer_id, Address=address_text)
        db.session.add(new_address_entry)
        db.session.commit()
        return jsonify({"message": "Address added successfully", "address": address_text}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error adding address for customer {customer_id}: {str(e)}")
        return jsonify({"error": "Failed to add address"}), 500

@app.route('/api/customers/address', methods=['DELETE']) # Route uses JWT for customer ID
@require_customer
def delete_customer_address():
    customer_id = g.current_user['id'] # Use 'id' instead of 'sub'
    data = request.json
    address_text = data.get('address') # Address to delete comes in the request body

    if not address_text:
        return jsonify({"error": "Address text is required"}), 400

    try:
        # Find the address to delete
        address_to_delete = Customer_Address.query.filter_by(CustomerID=customer_id, Address=address_text).first()

        if not address_to_delete:
            return jsonify({"error": "Address not found for this customer"}), 404

        # Delete the address
        db.session.delete(address_to_delete)
        db.session.commit()
        return jsonify({"message": "Address deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting address for customer {customer_id}: {str(e)}")
        return jsonify({"error": "Failed to delete address"}), 500

@app.route('/api/customers/address', methods=['PUT']) # Route uses JWT for customer ID
@require_customer
def update_customer_address():
    customer_id = g.current_user['id'] # Use 'id' instead of 'sub'
    data = request.json
    old_address_text = data.get('old_address')
    new_address_text = data.get('new_address')

    if not old_address_text or not new_address_text:
        return jsonify({"error": "Both old_address and new_address are required"}), 400
    
    if old_address_text == new_address_text:
        return jsonify({"message": "New address is the same as the old one. No changes made."}), 200 # Or 304 Not Modified

    try:
        # Find the address entry to update
        address_to_update = Customer_Address.query.filter_by(
            CustomerID=customer_id, 
            Address=old_address_text
        ).first()

        if not address_to_update:
            return jsonify({"error": "Old address not found for this customer"}), 404
        
        # Check if the new address already exists (optional, prevents duplicates if desired)
        # existing_new = Customer_Address.query.filter_by(
        #     CustomerID=customer_id, 
        #     Address=new_address_text
        # ).first()
        # if existing_new:
        #     return jsonify({"error": "The new address already exists for this customer"}), 409

        # Update the address text
        # Since Customer_Address is part of the primary key, we might need to delete and re-add
        # Or, if the DB allows PK updates (less common), update directly.
        # Safest approach: Delete old, add new within a transaction.
        
        db.session.delete(address_to_update)
        new_address_entry = Customer_Address(CustomerID=customer_id, Address=new_address_text)
        db.session.add(new_address_entry)
        
        db.session.commit()
        return jsonify({"message": "Address updated successfully", "new_address": new_address_text}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating address for customer {customer_id} from '{old_address_text}' to '{new_address_text}': {str(e)}")
        # Consider more specific error checking (e.g., duplicate key violation if new address exists)
        return jsonify({"error": "Failed to update address"}), 500

@app.route('/api/messages', methods = ['GET'])
@require_customer
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
@require_customer
def create_message():
    try:
        data = request.get_json()
        recipient_id = data.get('recipientID')
        contents = data.get('contents')
        if not recipient_id or not contents:
            return jsonify({'error': 'recipientID and contents are required'}), 400
        sender_id = g.current_user['id']
        timestamp = datetime.now(timezone.utc)
        # Get the next MessageID
        max_id = db.session.query(db.func.max(Messages.MessageID)).scalar()
        next_id = 1 if max_id is None else max_id + 1

        # Create new message with server-side sender and timestamp
        new_message = Messages(
            MessageID=next_id,
            SenderID=sender_id,
            RecipientID=recipient_id,
            Timestamp=timestamp,
            Contents=contents
        )
        db.session.add(new_message)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Message created successfully',
            'messageID': new_message.MessageID
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/messages/<int:id>', methods = ['GET'])
@require_customer
def get_messages_by_id(id):
    try:
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

@app.route('/api/messages/user_messages/<int:userid>', methods = ['GET'])
@require_customer
def get_messages_by_userid(userid):
    try:
        # Return all messages where user is sender or recipient
        messages = Messages.query.filter(
            (Messages.SenderID == userid) | (Messages.RecipientID == userid)
        ).order_by(Messages.Timestamp.desc()).all()
        message_list = [{
            'MessageID': m.MessageID,
            'SenderID': m.SenderID,
            'RecipientID': m.RecipientID,
            'Timestamp': m.Timestamp.isoformat(),
            'Contents': m.Contents
        } for m in messages]
        return jsonify({ 'messages': message_list }), 200
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
@require_customer
def create_order():
    try:
        data = request.json
        customer_id = g.current_user['id'] # Get ID from token context
        
        # Fetch other data from request body
        restaurant_id = data.get('RestaurantID')
        items = data.get('items', [])
        additional_costs = data.get('Additional_Costs', 0)
        price_total = data.get('PriceTotal')

        # Validate required fields from body (excluding customer_id)
        if not all([restaurant_id, items, price_total is not None]):
             missing = [k for k,v in {'RestaurantID': restaurant_id, 'items': items, 'PriceTotal': price_total}.items() if not v and v is not None]
             return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

        try:
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
            # Flush the session to ensure the Orders row is inserted before FoodOrders
            db.session.flush() 
            
            # Create FoodOrders entries for each item
            for item in items:
                food_order = FoodOrders(
                    OrderID=next_order_id,
                    FoodID=item['FoodID'],
                    Quantity=item['quantity']
                )
                db.session.add(food_order)

            db.session.commit()
            return jsonify({
                'message': 'Order created successfully',
                'orderID': next_order_id
            }), 201

        except Exception as e:
            db.session.rollback()
            print("Database error:", str(e))
            raise e

    except Exception as e:
        print("Error creating order:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/customer', methods=['GET']) # Changed route, ID comes from token
@require_customer
def get_customer_orders(): # Removed customer_id parameter
    try:
        customer_id = g.current_user['id'] # Get ID from token context
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
        print(f"Error fetching orders for customer {customer_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def encodeBase64(image_path):
    try:
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read().decode())
            return encoded_string
    except Exception as e:
        print(f"Image was unable to be encoded:{str(e)}")
        return None
def decodeBase64(base64_str,output_path):
    try:
        image_data = base64.b64decode(base64_str)
        with open(output_path,"wb") as image_file:
            image_file.write(image_data)
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting food: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/reviews', methods=['POST'])
@require_customer
def create_review():
    try:
        data = request.get_json()
        customer_id = g.current_user['id'] # Get ID from token context

        # Check required fields from body
        required_keys = ['RestaurantID', 'Rating', 'ReviewContent', 'Date']
        missing_keys = [key for key in required_keys if key not in data]
        if missing_keys:
            raise KeyError(f"Missing required key(s): {', '.join(missing_keys)}")
        
        # Validate CustomerID from token matches payload if present (optional belt-and-suspenders)
        # if 'CustomerID' in data and data['CustomerID'] != customer_id:
        #     return jsonify({'error': 'Mismatched CustomerID.'}), 400

        # Parse the date string
        date_str = data['Date']
        try:
            review_date = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
        except ValueError as ve:
            raise ValueError(f"Invalid date format for '{date_str}'. Expected 'YYYY-MM-DD HH:MM:SS'. Error: {ve}")

        # Get the next ReviewID
        max_id = db.session.query(db.func.max(Review.ReviewID)).scalar()
        next_id = 1 if max_id is None else max_id + 1

        # Create new review
        new_review = Review(
            ReviewID=next_id,
            CustomerID=customer_id, # Use ID from token
            RestaurantID=data['RestaurantID'],
            Rating=data['Rating'],
            ReviewContent=data['ReviewContent'],
            Date=review_date
        )
        db.session.add(new_review)
        db.session.commit()
        
        # Get customer name for the response (Use CustomerID)
        customer = Customer.query.get(data['CustomerID']) 
        
        review_data = {
            'ReviewID': new_review.ReviewID,
            'CustomerID': new_review.CustomerID,
            # Check if customer exists before accessing Username
            'CustomerName': customer.Username if customer else 'Unknown Customer', 
            'RestaurantID': new_review.RestaurantID,
            'Rating': float(new_review.Rating), # Ensure Rating is float/numeric
            'ReviewContent': new_review.ReviewContent,
            'Date': new_review.Date.isoformat()
        }
        
        return jsonify({
            'message': 'Review created successfully',
            'review': review_data
        }), 201
        
    except KeyError as e:
        print(f"Error creating review (KeyError): {str(e)}")
        # Return the specific key error message
        return jsonify({'error': str(e)}), 400 
    except ValueError as e:
        print(f"Error creating review (ValueError): {str(e)}")
        # Return the specific value error message (e.g., invalid date format)
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        # Log the full traceback for unexpected errors
        print(f"Unexpected error creating review: {str(e)}")
        import traceback
        traceback.print_exc() 
        return jsonify({'error': 'An unexpected error occurred while creating the review.'}), 500

@app.route('/api/restaurants/<int:restaurant_id>/reviews', methods=['GET'])
def get_restaurant_reviews(restaurant_id):
    try:
        # Join Review with Customer to get customer names
        reviews = db.session.query(
            Review, Customer.Username
        ).join(
            Customer, Review.CustomerID == Customer.CustomerID
        ).filter(
            Review.RestaurantID == restaurant_id
        ).order_by(Review.Date.desc()).all()
        
        reviews_data = [{
            'ReviewID': review.ReviewID,
            'CustomerID': review.CustomerID,
            'CustomerName': username,
            'RestaurantID': review.RestaurantID,
            'Rating': float(review.Rating),
            'ReviewContent': review.ReviewContent,
            'Date': review.Date.isoformat()
        } for review, username in reviews]
        
        return jsonify({
            'reviews': reviews_data
        })
    except Exception as e:
        print(f"Error fetching reviews: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/reviews', methods=['GET']) # Changed route
@require_customer
def get_customer_reviews(): # Removed id parameter
    try:
        customer_id = g.current_user['id'] # Get ID from token context
        reviews = db.session.query(Review, Restaurant).join(
            Restaurant, Review.RestaurantID == Restaurant.RestaurantID
        ).filter(Review.CustomerID == customer_id).order_by(Review.Date.desc()).all()
        
        return jsonify({
            "reviews": [{
                'ReviewID': r[0].ReviewID,
                'RestaurantID': r[0].RestaurantID,
                'RestaurantName': r[1].RestaurantName,
                'Rating': r[0].Rating,
                'ReviewContent': r[0].ReviewContent,
                'Date': r[0].Date.isoformat() if r[0].Date else None
            } for r in reviews]
        })
    except Exception as e:
        # Add more specific logging
        print(f"Error fetching customer reviews for ID {customer_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/reviews/<int:review_id>', methods=['PUT'])
@require_customer
def update_review(review_id):
    try:
        review = Review.query.get(review_id)
        if not review:
            return jsonify({'error': 'Review not found'}), 404
        
        # Crucially, check if the logged-in user owns this review
        if review.CustomerID != g.current_user['id']:
            return jsonify({'message': 'Forbidden: You can only update your own reviews.'}), 403
            
        data = request.get_json()
        # Update review fields
        if 'rating' in data:
            review.Rating = data['rating']
        if 'content' in data:
            review.ReviewContent = data['content']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Review updated successfully',
            'review': {
                'ReviewID': review.ReviewID,
                'CustomerID': review.CustomerID,
                'RestaurantID': review.RestaurantID,
                'Rating': review.Rating,
                'ReviewContent': review.ReviewContent,
                'Date': review.Date.isoformat()
            }
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error updating review: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reviews/<int:review_id>', methods=['DELETE'])
@require_customer
def delete_review(review_id):
    try:
        review = Review.query.get(review_id)
        if not review:
            return jsonify({'error': 'Review not found'}), 404
        
        # Check ownership
        if review.CustomerID != g.current_user['id']:
            return jsonify({'message': 'Forbidden: You can only delete your own reviews.'}), 403
            
        db.session.delete(review)
        db.session.commit()
        
        return jsonify({
            'message': 'Review deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting review: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/restaurants/<int:restaurant_id>/photos', methods=['GET'])
def get_restaurant_photos(restaurant_id):
    try:
        photos = Photo.query.filter_by(RestaurantID=restaurant_id).all()
        
        photolist = [{
            'PhotoID': f.PhotoID,
            'PhotoImage': f.PhotoImage
        } for f in photos]
        
        print(f"Retrieved {len(photolist)} photos for restaurant {restaurant_id}")  # Add logging
        
        return jsonify({
            'success': True,
            'photolist': photolist
        })
    except Exception as e:
        print(f"Error fetching photos: {str(e)}")  # Add logging
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/restaurants/<int:restaurant_id>/photos', methods=['POST'])
@require_restaurant
def update_restaurant_photos(restaurant_id):
    try:
        data = request.get_json()
        photo_image = data.get('PhotoImage')

        # Compress the image using PIL
        try:
            # Decode the base64 image
            image_data = base64.b64decode(photo_image)
            img = Image.open(io.BytesIO(image_data))
            
            # Resize the image while maintaining aspect ratio - reduce to smaller size
            max_size = (400, 400)  # Smaller maximum dimensions
            img.thumbnail(max_size, Image.LANCZOS)
            
            # Save with compression
            output = io.BytesIO()
            if img.mode in ('RGBA', 'LA'):
                # Convert images with transparency to RGB
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])  # Use alpha as mask
                background.save(output, format='JPEG', quality=60)  # Lower quality
            else:
                img.save(output, format='JPEG', quality=60)  # Lower quality
            
            # Convert back to base64
            compressed_image = base64.b64encode(output.getvalue()).decode('utf-8')
            
            # Use the compressed image
            original_size = len(photo_image)
            compressed_size = len(compressed_image)
            compression_ratio = (original_size - compressed_size) / original_size * 100
            
            print(f"Image compressed from {original_size} to {compressed_size} bytes ({compression_ratio:.1f}% reduction)")
            
            # Ensure it's small enough for the database
            if len(compressed_image) > 65000:  # Keep it under 65KB for TEXT column
                print("Image still too large after compression, reducing quality further")
                # Try a more aggressive compression
                output = io.BytesIO()
                if img.mode in ('RGBA', 'LA'):
                    background.save(output, format='JPEG', quality=25)  # Very low quality
                else:
                    img.save(output, format='JPEG', quality=25)  # Very low quality
                
                compressed_image = base64.b64encode(output.getvalue()).decode('utf-8')
                print(f"Further compressed to {len(compressed_image)} bytes")
            
            photo_image = compressed_image
        except Exception as e:
            print(f"Warning: Failed to compress image: {str(e)}")
            # If compression fails, use a placeholder
            print("Using placeholder image instead")
            photo_image = "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"

        # Get the next PhotoID
        max_photo_id = db.session.query(db.func.max(Photo.PhotoID)).scalar()
        next_photo_id = 1 if max_photo_id is None else max_photo_id + 1

        # Create new photo
        new_photo = Photo(
            PhotoID=next_photo_id,
            RestaurantID=restaurant_id,
            PhotoImage=photo_image
        )
        db.session.add(new_photo)
        db.session.commit()
        
        # Return the created photo item
        new_photo_dict = {
            'PhotoID': new_photo.PhotoID,
            'RestaurantID': new_photo.RestaurantID,
            'PhotoImage': 'data:image/jpeg;base64,' + photo_image[:30] + '...' # Show prefix for debugging
        }
        
        return jsonify({
            'success': True,
            'photo': new_photo_dict
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error creating photo: {str(e)}")  # Add logging
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/restaurants/<int:restaurant_id>/photos/<int:photo_id>', methods=['DELETE'])
def delete_restaurant_photos(restaurant_id, photo_id):
    try:
        target_photo = Photo.query.filter_by(PhotoID=photo_id).first()
        
        if not target_photo:
            return jsonify({
                'Error':'Image not found'
            }), 404
        else:
            print('deleting photo')
            db.session.delete(target_photo)
            db.session.commit()

            return jsonify({
                'success': True,
            })
    except Exception as e:
        print(f"Error deleting photo: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/restaurants/account', methods=['GET']) # Changed route
@require_restaurant
def get_restaurants_by_account(): # Removed account_id parameter
    try:
        account_id = g.current_user['id'] # Get ID from token context
        restaurants = Restaurant.query.filter_by(AccountID=account_id).all()
        return jsonify({
            "restaurants": [{
                'RestaurantID': r.RestaurantID,
                'RestaurantName': r.RestaurantName,
                'Category': r.Category,
                'Rating': r.Rating,
                'PhoneNumber': r.PhoneNumber,
                'Address': r.Address,
                'AccountID': r.AccountID # Include AccountID for verification if needed
            } for r in restaurants]
        })
    except Exception as e:
        print(f"Error fetching restaurants for account {account_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Lookup a customer by username for starting new chats
@app.route('/api/customers/lookup/<string:username>', methods=['GET'])
@require_customer
def lookup_customer(username):
    try:
        cust = Customer.query.filter_by(Username=username).first()
        if not cust:
            return jsonify({'error': 'User not found'}), 404
        return jsonify({'customerID': cust.CustomerID, 'username': cust.Username}), 200
    except Exception as e:
        print(f"Error looking up customer '{username}': {str(e)}")
        return jsonify({'error': 'Failed to lookup user'}), 500

#gets the message info for each customer
@app.route('/api/customers/messages', methods=['GET'])
@require_customer
def get_customer_messages():
    try:
        customer_id = g.current_user['id']

        # Alias Customer table for sender and recipient
        Sender = aliased(Customer)
        Recipient = aliased(Customer)

        # Join to get usernames for both parties
        query = (
            db.session.query(
                Messages,
                Sender.Username.label('senderUsername'),
                Recipient.Username.label('recipientUsername')
            )
            .join(Sender, Messages.SenderID == Sender.CustomerID)
            .join(Recipient, Messages.RecipientID == Recipient.CustomerID)
            .filter(
                (Messages.SenderID == customer_id) | (Messages.RecipientID == customer_id)
            )
            .order_by(Messages.Timestamp.desc())
        )

        results = query.all()
        message_list = [{
            'MessageID': m.MessageID,
            'SenderID': m.SenderID,
            'SenderUsername': senderUsername,
            'RecipientID': m.RecipientID,
            'RecipientUsername': recipientUsername,
            'Timestamp': m.Timestamp.isoformat(),
            'Contents': m.Contents
        } for m, senderUsername, recipientUsername in results]

        return jsonify({
            'success': True,
            'messages': message_list
        }), 200
    except Exception as e:
        print(f"Error fetching messages for customer {customer_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve messages'
        }), 500

@app.teardown_appcontext
def remove_db_session(exception=None):
    SessionLocal.remove()

if __name__ == '__main__':
    app.run(debug=True, port=5000)