import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://username:password@localhost:5432/foodhub')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Secret key for JWT tokens
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here') 