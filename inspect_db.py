import os
from dotenv import load_dotenv
import mysql.connector

# Load environment variables
load_dotenv()

# Get DB connection details from env vars
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_NAME = os.getenv('DB_NAME')

# Connect to the database
conn = mysql.connector.connect(
    host=DB_HOST,
    port=DB_PORT,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME
)

cursor = conn.cursor()

# Show the create table statement for Restaurant
cursor.execute("SHOW CREATE TABLE Restaurant")
result = cursor.fetchone()
if result:
    print("CREATE TABLE STATEMENT:")
    print(result[1])

# Show columns in Restaurant table
print("\nCOLUMNS IN RESTAURANT TABLE:")
cursor.execute("DESCRIBE Restaurant")
column_info = cursor.fetchall()
for column in column_info:
    print(f"Column: {column[0]}, Type: {column[1]}, Null: {column[2]}, Key: {column[3]}, Default: {column[4]}, Extra: {column[5]}")

# Extract column names for testing
column_names = [col[0] for col in column_info]
print(f"\nColumn names: {column_names}")

# Try with various column name possibilities
print("\nTesting delete queries with different column names (will roll back):")

try:
    cursor.execute("START TRANSACTION")  # Start transaction to avoid actual deletion
    
    # Try with each of the actual column names for ID
    for col in column_names:
        try:
            query = f"DELETE FROM Restaurant WHERE {col} = 14"
            cursor.execute(query)
            print(f"Query with column '{col}' worked!")
        except mysql.connector.Error as e:
            print(f"Query with column '{col}' failed: {e}")
    
    # Try with common case variations
    possible_column_names = [
        "RestaurantID", "restaurantid", "Restaurantid", "restaurant_id", 
        "id", "ID", "restaurantID", "restaurant_ID"
    ]
    
    for col in possible_column_names:
        if col not in column_names:  # Skip ones we already tried
            try:
                query = f"DELETE FROM Restaurant WHERE {col} = 14"
                cursor.execute(query)
                print(f"Query with column '{col}' worked!")
            except mysql.connector.Error as e:
                print(f"Query with column '{col}' failed: {e}")
        
    cursor.execute("ROLLBACK")  # Roll back to avoid actual deletion
except Exception as e:
    print(f"Test failed: {e}")
    cursor.execute("ROLLBACK")  # Ensure rollback in case of any other errors

# Close connections
cursor.close()
conn.close() 