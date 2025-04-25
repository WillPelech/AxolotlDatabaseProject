from flask import Flask, request, jsonify, send_from_directory, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv
import hashlib
import jwt
from datetime import datetime, timezone, timedelta
from flask_cors import cross_origin
import pymysql
import base64
from functools import wraps


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

class Customer_Address(db.Model):
    __tablename__ = 'Customer_Address'
    CustomerID = db.Column(db.Integer, db.ForeignKey('Customer.CustomerID'), primary_key = True)
    Customer_Address = db.Column(db.String(255), primary_key = True)

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
    FoodID = db.Column(db.Integer, db.ForeignKey('Food.FoodID'))
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
        
        user = None
        account_type = None
        account_id = None
        
        # Try Customer table
        customer = Customer.query.filter(
            (Customer.Username == username_or_email) | (Customer.Email == username_or_email)
        ).first()
        if customer and check_password(password, customer.Password):
            user = customer
            account_type = 'customer'
            account_id = customer.CustomerID
            
        # If not customer, try Restaurant_Account table
        if not user:
             restaurant_acc = RestaurantAccount.query.filter(
                 (RestaurantAccount.Username == username_or_email) | (RestaurantAccount.Email == username_or_email)
             ).first()
             if restaurant_acc and check_password(password, restaurant_acc.Password):
                 user = restaurant_acc
                 account_type = 'restaurant'
                 account_id = restaurant_acc.AccountID

        print(f"Database query result: {user}")
        print(f"Account type found: {account_type}")

        if user and account_id is not None:
            token = generate_token(user_id=account_id, account_type=account_type)
            if not token:
                 # Handle error if token generation fails
                 return jsonify({'error': 'Failed to generate authentication token.'}), 500
                 
            response_data = {
                'message': f'Login successful - You are logged in as a {account_type} account',
                'token': token, # Include the token in the response
                'user': {
                    'username': user.Username,
                    'email': user.Email,
                    'accountType': account_type,
                    # Use the consistent account_id determined above
                    'accountId': account_id, 
                    'isRestaurant': account_type == 'restaurant'
                }
            }
            return jsonify(response_data), 200
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
        else: # Catch any other login failure cases
             print("Login failed for unknown reason")
             return jsonify({'error': 'Login failed'}), 401


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
            
        except Exception as e:
             print(f"[Auth Debug] Error loading user from token: {e}")
             import traceback
             traceback.print_exc()
             return jsonify({'message': 'Error processing token user data!'}), 500

        return f(*args, **kwargs)
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

@app.route('/api/restaurants/<int:id>', methods = ['DELETE'])
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
        
        # 2. Delete associated Orders (depends on Restaurant)
        Orders.query.filter_by(RestaurantID=id).delete(synchronize_session=False)
            
        # 3. Delete associated Reviews (depends on Restaurant)
        Review.query.filter_by(RestaurantID=id).delete(synchronize_session=False)
        
        # 4. Delete associated FrontPage entries (depends on Restaurant)
        FrontPage.query.filter_by(RestaurantID=id).delete(synchronize_session=False)
        
        # 5. Delete associated Food items (depends on Restaurant)
        if food_ids:
             Food.query.filter_by(RestaurantID=id).delete(synchronize_session=False)
        
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

@app.route('/api/customers/address', methods=['GET']) # Changed route
@require_customer
def get_customer_address(): # Removed id parameter
    try:
        customer_id = g.current_user['id'] # Get ID from token context
        customer = Customer_Address.query.get(customer_id)

        if customer:
            addresses = Customer_Address.query.filter_by(CustomerID = customer_id).all()
            if addresses:
                return jsonify({
                    "address": a.address
                }for a in addresses)
            else:
                return jsonify({
                    "Error": "Customer has no addresses"
                }),400
        else:
            return jsonify({
                "Error": "Customer not found"
            }),404
    except Exception as e:
        # Add more specific logging
        print(f"Error fetching customer addresses for ID {customer_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/customers/address', methods=['POST']) # Changed route
@require_customer
def create_customer_address(): # Removed id parameter
    try:
        customer_id = g.current_user['id']
        customer = Customer_Address.query.get(customer_id)

        if customer:
            input_address = request.json['address']
            if input_address & Customer_Address.query.get(input_address) is None:
                newCustomerAddress = Customer(customer_id,input_address)
                db.session.add(newCustomerAddress)
                db.session.commit()
                
                # Return the updated address as part of the response
                return jsonify({"New Address": customer.Customer_Address})
            else:
                return jsonify({"Error": "No address provided or address is already in the db"}), 400
        else:
            return jsonify({"Error": "Customer not found"}), 404

    except Exception as e:
        # Add more specific logging
        print(f"Error updating customer addresses for ID {customer_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/customers/address', methods=['DELETE']) # Changed route
@require_customer
def delete_customer_address(): # Removed id parameter
    try:
        data = request.json
        input_address=data["Address"]
        customer_id = g.current_user['id']
        tgt_address = db.session.query(Customer_Address).filter_by(CustomerID = customer_id).filter_by(Customer_Address=input_address)
        if tgt_address:                
            db.session.delete(tgt_address)
            db.session.commit()
            # Return the updated address as part of the response
            return jsonify({"Message": (input_address, "Deleted") })
        else:
            return jsonify({"Error": "Customer Address not found"}), 404

    except Exception as e:
        # Add more specific logging
        print(f"Error deleting customer addresses for ID {customer_id}: {str(e)}")
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

@app.route('/api/messages/user_messages/<int:userid>', methods = ['GET'])
def get_messages_by_userid():
    try:
        userid = request.json["userid"]
        message = Messages.query.filter_by(SenderID=userid).union(Messages.query.filter_by(RecipientID=userid))
        
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
            'PhotoImage': decodeBase64(f.PhotoImage)
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
def update_restaurant_photos(restaurant_id):
    try:
        data = request.get_json()
        photo_image=data.get('PhotoImage')

        # Get the next FoodID
        max_photo_id = db.session.query(db.func.max(Photo.PhotoID)).scalar()
        next_photo_id = 1 if max_photo_id is None else max_photo_id + 1

        # Create new food item
        new_photo = Photo(
            FoodID=next_photo_id,
            RestaurantID=restaurant_id,
            PhotoImage=encodeBase64(photo_image)
        )
        db.session.add(new_photo)
        db.session.commit()
        
        # Return the created food item
        new_photo_dict = {
            'PhotoID': new_photo.Photo,
            'RestaurantID': new_photo.RestaurantID,
            'PhotoImage':new_photo.PhotoImage
        }
        
        return jsonify({
            'success': True,
            'food': new_photo_dict
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error creating photo: {str(e)}")  # Add logging
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)