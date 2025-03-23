from flask import Blueprint, jsonify, request
from model.user import get_all_users, update_user_status

user_bp = Blueprint("users", __name__)  # Create a Blueprint for user routes

# ✅ Route to fetch all users
@user_bp.route('/userlist', methods=['GET'])
def fetch_users():
    users = get_all_users()
    user_list = [
        {"id": user[0], "name": user[1], "email": user[2], "industry": user[4], "usr_type": user[5], "status": user[6]}
        for user in users
    ]
    return jsonify(user_list), 200

# ✅ Route to activate/inactivate user
@user_bp.route('/users/status', methods=['PUT'])
def change_user_status():
    data = request.get_json()
    user_id = data.get("id")
    new_status = data.get("status")  # "Active" or "Inactive"

    if not user_id or new_status not in ["Active", "Inactive"]:
        return jsonify({"error": "Invalid data"}), 400

    update_user_status(user_id, new_status)
    return jsonify({"message": f"User {user_id} status updated to {new_status}"}), 200
