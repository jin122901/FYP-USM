from flask import Blueprint, request, jsonify, session
from model.user import get_all_users,insert_user, get_user_by_email, update_user_details,get_user_password,update_user_password,get_useremail
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


@auth.route("/login", methods=["POST", "GET"])
def login():
    data = request.get_json()

    # Validate input fields
    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Missing required fields"}), 400

    user = get_user_by_email(data["email"])

    if user:
        stored_password = user[3] 

        if bcrypt.checkpw(data["password"].encode("utf-8"), stored_password.encode("utf-8")):
            # Store user ID and type in session
            malaysia_tz = pytz.timezone("Asia/Kuala_Lumpur")
            session["user_id"] = user[0]  # Assuming ID is in the 1st column
            session["user_type"] = user[5]  # Assuming user type is in the 6th column
            session["email"] = user[2]  # Assuming email is in the 2nd column
            session["last_activity"] = datetime.now(malaysia_tz).isoformat()  # Store last activity
            session.modified=True
            session.permanent = True
            print(dict(session))
            return jsonify({
                "message": "Login successful",
                "user_type": user[5]  # Send user type for redirection
            }), 200
    
    return jsonify({"error": "Invalid email or password"}), 401

@auth.route("/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    session.pop("user_type", None)
    session.pop("email", None)  # Remove email from session
    return jsonify({"message": "Logged out successfully"}), 200

@auth.route("/check_session", methods=["GET"])
def check_session():
    if "email" in session:
        malaysia_tz = pytz.timezone("Asia/Kuala_Lumpur")
        
        # Get last_activity from session
        last_activity_str = session.get("last_activity")
        
        if not last_activity_str:
            return jsonify({"error": "Last activity not found"}), 400  # Handle missing last_activity
        
        # Convert last_activity to datetime and ensure it has timezone
        last_activity = datetime.fromisoformat(last_activity_str)

        if last_activity.tzinfo is None:  # Ensure it's timezone-aware
            last_activity = malaysia_tz.localize(last_activity)

        # Get current time in Malaysia timezone
        now = datetime.now(malaysia_tz)

        # Check inactivity timeout (10 minutes)
        if (now - last_activity) > timedelta(minutes=10):
            session.pop("user_id", None)
            session.pop("user_type", None)
            session.clear()  # Auto logout user
            return jsonify({"error": "Session expired"}), 401
        
        # Update session activity timestamp
        session["last_activity"] = now.isoformat()

        return jsonify({"user_type": session["user_type"]}), 200

    return jsonify({"error": "Not logged in"}), 401


@auth.route("/clear_session", methods=["POST"])
def clear_session():
    session.clear()  # Clear all session data
    return jsonify({"message": "Session cleared successfully"}), 200


@auth.route('/account', methods=['GET'])
def get_account():
    if 'email' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user = get_useremail(session['email'])
    if user:
        return jsonify(user)
    
    return jsonify({"error": "User not found"}), 404

# ✅ Update user details
@auth.route('/account', methods=['PUT'])
def update_account():
    if 'email' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    update_user_details(session['email'], data.get("name"), data.get("industry"))
    return jsonify({"message": "Account updated successfully"})

# ✅ Change password
@auth.route('/change-password', methods=['PUT'])
def change_password():
    if 'email' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    email = session['email']
    old_password = data.get("oldPassword")
    new_password = data.get("newPassword")

    user = get_user_password(email)
    if not user or not bcrypt.check_password_hash(user["password_hash"], old_password):
        return jsonify({"error": "Old password is incorrect"}), 400

    update_user_password(email, new_password)
    return jsonify({"message": "Password updated successfully"})
