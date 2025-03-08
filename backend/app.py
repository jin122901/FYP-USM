from flask import Flask, session
from flask_cors import CORS
from flask_session import Session
from model.user import create_users_table  
from routes.auth import auth
from datetime import timedelta

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Configure session
app.config["SESSION_TYPE"] = "filesystem"
app.secret_key = "121212"
app.permanent_session_lifetime = timedelta(minutes=1)
Session(app)

# Create users table
with app.app_context():
    create_users_table()

# Register Routes
app.register_blueprint(auth, url_prefix="/api")

if __name__ == "__main__":
    app.run(debug=True)