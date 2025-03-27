from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud.sql.connector import Connector
from google.oauth2 import service_account
import pymysql
import os
from dotenv import load_dotenv
import hashlib
import jwt
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

app = Flask(__name__)
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
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token(user_id):
    return jwt.encode(
        {'user_id': user_id, 'exp': datetime.utcnow() + timedelta(days=1)},
        JWT_SECRET,
        algorithm='HS256'
    )

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        connection = get_db_connection()
        cursor = connection.cursor()

        # Check if username or email already exists
        cursor.execute("SELECT CustomerID FROM Customer WHERE Username = %s OR Email = %s", 
                      (data['username'], data['email']))
        if cursor.fetchone():
            return jsonify({"error": "Username or email already exists"}), 400

        # Get the next CustomerID
        cursor.execute("SELECT MAX(CustomerID) FROM Customer")
        max_id = cursor.fetchone()[0]
        next_id = 1 if max_id is None else max_id + 1

        # Insert new customer
        sql = """
        INSERT INTO Customer (CustomerID, DateOfBirth, Username, Email, Password)
        VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (
            next_id,
            data['dateOfBirth'],
            data['username'],
            data['email'],
            hash_password(data['password'])
        ))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({
            "message": "Account created successfully",
            "customerId": next_id
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        print(f"Login attempt for username/email: {data['username']}")
        
        connection = get_db_connection()
        cursor = connection.cursor(pymysql.cursors.DictCursor)

        # Find user by username or email
        cursor.execute("""
            SELECT CustomerID, Username, Email, Password 
            FROM Customer 
            WHERE (Username = %s OR Email = %s)
        """, (data['username'], data['username']))
        
        user = cursor.fetchone()
        print(f"Database query result: {user}")
        
        cursor.close()
        connection.close()

        if not user:
            print("User not found")
            return jsonify({"error": "Invalid credentials"}), 401

        hashed_input = hash_password(data['password'])
        stored_password = user['Password']
        
        # Check if stored password is hashed or plain text
        if len(stored_password) == 64:  # SHA-256 hash is 64 characters
            # Password is already hashed
            if stored_password != hashed_input:
                print("Password mismatch (hashed)")
                return jsonify({"error": "Invalid credentials"}), 401
        else:
            # Password is plain text, compare with plain text
            if stored_password != data['password']:
                print("Password mismatch (plain text)")
                return jsonify({"error": "Invalid credentials"}), 401
            # Update the password to hashed version
            update_password_to_hash(user['CustomerID'], hashed_input)

        # Generate JWT token
        token = generate_token(user['CustomerID'])
        print("Login successful")

        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user['CustomerID'],
                "username": user['Username'],
                "email": user['Email']
            }
        })
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"error": str(e)}), 500

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)