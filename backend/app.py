from flask import Flask, session
from flask_cors import CORS
from flask_session import Session
from model.user import create_users_table  
from routes.auth import auth
from routes.user import user_bp 
from routes.uploadFile import upload_bp
from datetime import timedelta
from ml_model import sentiment_pipeline 

app = Flask(__name__)
CORS(app, supports_credentials=True, origins="http://localhost:5173")

# Configure session
app.config["SESSION_TYPE"] = "filesystem"
app.secret_key = "121212"
app.permanent_session_lifetime = timedelta(minutes=10)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False 
app.config['SESSION_USE_SIGNER'] = True  # Prevent session tampering
app.config['SESSION_COOKIE_HTTPONLY'] = False
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config["SESSION_FILE_DIR"] = "./flask_session"
Session(app)

# Create users table
with app.app_context():
    create_users_table()

# Register Routes
app.register_blueprint(auth, url_prefix="/api")
app.register_blueprint(user_bp, url_prefix="/api/users")  
app.register_blueprint(upload_bp, url_prefix="/api/file")  

if __name__ == "__main__":
    app.run(debug=True)