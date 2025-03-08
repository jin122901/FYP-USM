from flask import Blueprint, request, jsonify, session
from model.user import insert_user, get_user_by_email
from datetime import datetime, timedelta
import pytz

import bcrypt

auth = Blueprint("auth", __name__)

@auth.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Validate input fields
    if not data or not all(k in data for k in ("name", "email", "password")):
        return jsonify({"error": "Missing required fields"}), 400

    # Check if email already exists
    if get_user_by_email(data["email"]):
        return jsonify({"error": "Email already registered"}), 400

    if "Cpassword" not in data or data["Cpassword"] != data["password"]:
        return jsonify({"error": "Passwords do not match"}), 400

    # Hash the password
    hashed_password = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())

    # Insert user into the database
    try:
        user_id = insert_user(data["name"], data["email"], hashed_password.decode("utf-8"), data["industry"], 1)
        return jsonify({"message": "User registered successfully", "user_id": user_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    # Validate input fields
    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Missing required fields"}), 400

    user = get_user_by_email(data["email"])

    if user:
        stored_password = user[3]  # Assuming password is stored in the 4th column

        if bcrypt.checkpw(data["password"].encode("utf-8"), stored_password.encode("utf-8")):
            # Store user ID and type in session
            malaysia_tz = pytz.timezone("Asia/Kuala_Lumpur")
            session["user_id"] = user[0]  # Assuming ID is in the 1st column
            session["user_type"] = user[5]  # Assuming user type is in the 6th column
            session["last_activity"] = datetime.now(malaysia_tz).isoformat()  # Store last activity
            
            print(malaysia_tz)
            return jsonify({
                "message": "Login successful",
                "user_type": user[5]  # Send user type for redirection
            }), 200

    return jsonify({"error": "Invalid email or password"}), 401

@auth.route("/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    session.pop("user_type", None)
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

@auth.route("/check_session", methods=["GET"])
def check_session():
    if "user_id" in session:
        malaysia_tz = pytz.timezone("Asia/Kuala_Lumpur")
        # Check inactivity timeout (10 minutes)
        last_activity = datetime.fromisoformat(session.get("last_activity", datetime.now(malaysia_tz).isoformat()))
        if datetime.now(malaysia_tz) - last_activity > timedelta(minutes=1):
            session.pop("user_id", None)
            session.pop("user_type", None)
            session.clear()  # Auto logout user
            return jsonify({"error": "Session expired"}), 401
        
        session["last_activity"] = datetime.utcnow().isoformat()  # Update activity time
        return jsonify({"user_type": session["user_type"]}), 200
    
    return jsonify({"error": "Not logged in"}), 401