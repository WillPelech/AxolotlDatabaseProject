from google.cloud.sql.connector import Connector
from google.oauth2 import service_account
import pymysql
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get credentials from environment variables
DB_USER = os.getenv('DB_USER')
DB_NAME = os.getenv('DB_NAME')
INSTANCE_CONNECTION_NAME = os.getenv('INSTANCE_CONNECTION_NAME')
SERVICE_ACCOUNT_KEY = os.getenv('SERVICE_ACCOUNT_KEY')

# Load credentials explicitly from the service account key file.
credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_KEY)

def test_connection():
    # Pass the credentials explicitly to the Connector.
    connector = Connector(credentials=credentials)
    try:
        # Establish a connection to the Cloud SQL instance.
        connection = connector.connect(
            INSTANCE_CONNECTION_NAME,
            "pymysql",  # Use the PyMySQL driver for MySQL.
            user=DB_USER,
            db=DB_NAME
        )

        cursor = connection.cursor()
        # Execute a test query.
        cursor.execute("SELECT * FROM Customer")
        result = cursor.fetchall()
        print("Connection successful, test query result:", result)

        cursor.close()
        connection.close()
    except Exception as e:
        print("Error connecting to the database:", e)

if __name__ == "__main__":
    test_connection()