from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from google.cloud.sql.connector import Connector
from google.oauth2 import service_account
import pymysql
import os
from dotenv import load_dotenv
import hashlib
import jwt
from datetime import datetime, timezone, timedelta
from flask_cors import cross_origin

import pymysql.cursors

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='../frontend-react/build', static_url_path='')
CORS(app)  # Enable CORS for all routes
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')  # Add this to your .env file

# Get credentials from environment variables
DB_USER = os.getenv('DB_USER')
DB_NAME = os.getenv('DB_NAME')
INSTANCE_CONNECTION_NAME = os.getenv('INSTANCE_CONNECTION_NAME')
SERVICE_ACCOUNT_KEY = os.getenv('SERVICE_ACCOUNT_KEY')

# Load credentials
credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_KEY)

def get_db_connection():
    connector = Connector(credentials=credentials)
    connection = connector.connect(
        INSTANCE_CONNECTION_NAME,
        "pymysql",
        user=DB_USER,
        db=DB_NAME
    )
    return connection

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
        connection = get_db_connection()
        cursor = connection.cursor()

        # Check if username or email already exists in both tables
        cursor.execute("""
            SELECT CustomerID FROM Customer 
            WHERE Username = %s OR Email = %s
        """, (data['username'], data['email']))
        if cursor.fetchone():
            return jsonify({"error": "Username or email already exists"}), 400

        cursor.execute("""
            SELECT AccountID FROM Restaurant_Account 
            WHERE Username = %s OR Email = %s
        """, (data['username'], data['email']))
        if cursor.fetchone():
            return jsonify({"error": "Username or email already exists"}), 400

        # Get the next AccountID for Restaurant_Account
        cursor.execute("SELECT MAX(AccountID) FROM Restaurant_Account")
        max_acc_id = cursor.fetchone()[0]
        next_acc_id = 1 if max_acc_id is None else max_acc_id + 1

        # Insert new restaurant account
        cursor.execute("""
            INSERT INTO Restaurant_Account (AccountID, Username, Email, Password)
            VALUES (%s, %s, %s, %s)
        """, (
            next_acc_id,
            data['username'],
            data['email'],
            hash_password(data['password'])
        ))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({
            "message": "Restaurant account created successfully",
            "accountId": next_acc_id
        }), 201
    except Exception as e:
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
        connection = get_db_connection()
        cursor = connection.cursor()

        # First try Customer table
        cursor.execute(
            "SELECT CustomerID, Username, Password, Email FROM Customer WHERE (Username = %s OR Email = %s)",
            (username_or_email, username_or_email)
        )
        user = cursor.fetchone()
        account_type = 'customer'

        # If not found in Customer table, try Restaurant_Account table
        if not user:
            cursor.execute(
                "SELECT AccountID, Username, Password, Email FROM Restaurant_Account WHERE (Username = %s OR Email = %s)",
                (username_or_email, username_or_email)
            )
            user = cursor.fetchone()
            account_type = 'restaurant'

        print(f"Database query result: {user}")
        print(f"Account type: {account_type}")

        if user:
            stored_password = user[2]  # Password is now always at index 2 due to explicit column selection
            if check_password(password, stored_password):
                response = {
                    'message': f'Login successful - You are logged in as a {account_type} account',
                    'user': {
                        'username': user[1],  # Username
                        'email': user[3],     # Email
                        'accountType': account_type,
                        'accountId': user[0],  # ID is always at index 0
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

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

def update_password_to_hash(customer_id, hashed_password):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.execute(
            "UPDATE Customer SET Password = %s WHERE CustomerID = %s",
            (hashed_password, customer_id)
        )
        
        connection.commit()
        cursor.close()
        connection.close()
        print(f"Updated password to hash for customer {customer_id}")
    except Exception as e:
        print(f"Error updating password hash: {str(e)}")

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

        connection = get_db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("SELECT CustomerID, Username, Email FROM Customer WHERE CustomerID = %s", (user_id,))
        user = cursor.fetchone()
        
        cursor.close()
        connection.close()

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "user": {
                "id": user['CustomerID'],
                "username": user['Username'],
                "email": user['Email']
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/api/restaurants', methods=['GET'])
def get_all_restaurants():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)

        cursor.execute("SELECT * FROM Restaurant")
        restaurants = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "restaurants": restaurants
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/restaurants/<int:id>/foods', methods=['GET'])
def get_restaurant_foods():
    try:
        restID = request.json["id"]
        connection = get_db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)

        cursor.execute("SELECT FoodName FROM Food WHERE RestaurantID = %s", restID)
        foodlist = cursor.fetchall()

        cursor.close()
        connection.close()
        if (foodlist):
            return jsonify({
                "foodlist": foodlist
            })
        else:
            return jsonify({
                "message":"restaurant has no foods"
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/restaurants/<int:id>', methods=['GET'])
def get_restaurant_by_id():
    try:
        id = request.json["id"]
        connection = get_db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        cursor.execute("SELECT * FROM Restaurants WHERE Address = %s",(id))
        restaurant = cursor.fetchone()
            
        cursor.close()
        connection.close()

        if (restaurant):
            return jsonify({
                "message":"restaurant {id} selected successfully",
                "restaurant": restaurant
            })
        else:
            return jsonify({
                "message":"restaurant not found"
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/restaurants', methods=['POST'])
def create_restaurant():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        data = request.json["restaurantData"]
        cursor.execute("SELECT MAX(CustomerID) FROM Customer")
        max_id = cursor.fetchone()[0]
        next_id = 1 if max_id is None else max_id + 1

        cursor.execute("""
                INSERT INTO Restaurant
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (next_id, data['name'], data['category'], data['rating'], data['phone_number'], data['address'], data['accountID']))
        cursor.close()
        connection.commit()
        connection.close()
        return jsonify({'message': 'Restaurant created successfully'}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/restaurants/<int:id>', methods=['PUT'])
def update_restaurant():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        data =  request.json
        restaurantData = data["restaurantData"]
        cursor.execute("""
                UPDATE restaurants 
                SET RestaurantName = %s, Category = %s, Rating = %s, PhoneNumber = %s, Address = %s
                WHERE id = %s
            """, (restaurantData['RestaurantName'], restaurantData['Category'], restaurantData['Rating'],
                       restaurantData['PhoneNumber'], restaurantData['Address'], data["id"]))
        cursor.close()
        connection.commit()
        connection.close()
        return jsonify({'message': 'Restaurant updated successfully'})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/restaurants/<int:id>', methods = ['DELETE'])
def delete_restaurant():
    try:
        id = request.json["id"]
        connection = get_db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)
        cursor.execute("SELECT * FROM Restaurants WHERE RestaurantID = %s",(id))
        restaurant = cursor.fetchone()
        return_val = jsonify({
            "message":"restaurant deleted successfully",
            "restaurant_info": restaurant
        })
        cursor.execute("DELETE FROM Restaurants WHERE RestaurantID = %s",(id))
        return return_val
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)