from google.cloud.sql.connector import Connector
from google.oauth2 import service_account
import pymysql

# Replace these values with your actual credentials and instance details.
DB_USER = ""  # Fill with DB User
DB_NAME = "project"
# Format: project:region:instance
INSTANCE_CONNECTION_NAME = "axlotl:us-east4:restaurant-map"
SERVICE_ACCOUNT_KEY = r"C:\Users\Summant\Downloads\axlotl-01a230181ba4.json"

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
        cursor.execute("SELECT * FROM Restaurant")
        result = cursor.fetchone()
        print("Connection successful, test query result:", result)

        cursor.close()
        connection.close()
    except Exception as e:
        print("Error connecting to the database:", e)

if __name__ == "__main__":
    test_connection()
