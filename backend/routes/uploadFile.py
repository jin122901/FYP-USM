import os
import uuid
import datetime
import pandas as pd
from flask import Blueprint, request, jsonify,session
from werkzeug.utils import secure_filename
from model.file import insert_file_path, fetch_user_files
from transformers import pipeline
from ml_model import sentiment_pipeline 
from tqdm import tqdm


upload_bp = Blueprint("upload", __name__)

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"csv", "xlsx"}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)  # Ensure the folder exists

def allowed_file(filename):
    """Check if the file type is allowed."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_unique_filename(filename):
    """Generate a unique filename to prevent overwriting."""
    file_ext = filename.rsplit(".", 1)[1].lower()  # Extract file extension
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")  # Timestamp
    unique_id = uuid.uuid4().hex[:8]  # Random unique ID (first 8 chars of UUID)
    return f"{timestamp}_{unique_id}.{file_ext}"

def validate_file_columns(file_path):
    """Check if the uploaded file contains at least one required column."""
    try:
        df = pd.read_csv(file_path) if file_path.endswith(".csv") else pd.read_excel(file_path)
        required_columns = {"Feedback", "Comment", "Review"}
        if not any(col in df.columns for col in required_columns):
            return False, "File must contain at least one of these columns: Feedback, Comment, Review."
        return True, None
    except Exception as e:
        return False, f"Error reading file: {str(e)}"
    
def process_file(file_path):
    """ Reads the uploaded CSV/XLSX file, truncates long feedback, and returns a DataFrame with a progress bar """
    try:
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        return None, f"Failed to read file: {str(e)}"
    
    # ✅ Ensure "Feedback" column exists
    if "Feedback" not in df.columns:
        return None, "Missing 'Feedback' column"

    # ✅ Convert to string and truncate to max 512 characters with progress bar
    tqdm.pandas(desc="📝 Processing Feedback")
    df["Feedback"] = df["Feedback"].astype(str).progress_apply(lambda x: x[:512])

    return df, None

def perform_sentiment_analysis(feedback_list, batch_size=16):
    """ Runs sentiment analysis on a list of feedback texts with a progress bar """
    predictions = []
    
    # ✅ Use tqdm to show progress while processing feedback in batches
    for i in tqdm(range(0, len(feedback_list), batch_size), desc="🔍 Analyzing Sentiment"):
        batch = feedback_list[i : i + batch_size]  # Get batch
        batch_predictions = sentiment_pipeline(batch)  # Process batch
        predictions.extend(batch_predictions)  # Store results
    
    return predictions

def save_processed_data(df, original_filename):
    """ Saves processed data with sentiment results and returns the file path """
    unique_filename = f"processed_{secure_filename(original_filename)}"
    processed_file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    df.to_csv(processed_file_path, index=False)
    return processed_file_path

@upload_bp.route('/upload', methods=['POST'])
def upload_file():
    print("\n🔹 [UPLOAD FILE REQUEST RECEIVED] 🔹")

    # Debugging Request Headers & Form Data
    print("➡️ Request Headers:", dict(request.headers))
    print("➡️ Content Type:", request.content_type)
    print("📂 Uploaded Files:", request.files)
    print("📋 Form Data:", request.form)

    # Check if 'file' exists in the request
    if 'file' not in request.files:
        print("❌ Error: No file found in request")
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    coursename = request.form.get("coursename")
    userid = session.get('user_id')

    # Debugging Session Data
    print("🆔 User ID (Session):", userid)

    # Check if the file is empty or has no name
    if not file or file.filename == "":
        print("❌ Error: No selected file")
        return jsonify({"error": "No selected file"}), 400

    # Check if the file type is allowed
    if not allowed_file(file.filename):
        print(f"❌ Error: Invalid file type - {file.filename}")
        return jsonify({"error": "Invalid file type. Allowed: CSV, XLSX"}), 400

    # Check if user is logged in
    if not userid:
        print("❌ Error: User not logged in")
        return jsonify({"error": "User not logged in"}), 401

    # Generate a unique filename
    original_filename = secure_filename(file.filename)
    unique_filename = generate_unique_filename(original_filename)
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

    # Debugging File Details
    print(f"✅ File Accepted: {original_filename} -> {unique_filename}")
    print(f"📌 Saving to: {file_path}")

    # Save file
    try:
        file.save(file_path)
        print("✅ File saved successfully!")
    except Exception as e:
        print(f"❌ Error saving file: {e}")
        return jsonify({"error": "File saving failed"}), 500

    # Validate file content
    is_valid, error_msg = validate_file_columns(file_path)
    if not is_valid:
        print(f"❌ File Validation Failed: {error_msg}")
        os.remove(file_path)  # Remove invalid file
        return jsonify({"error": error_msg}), 400

    # Process file to extract feedback column
    df, error_msg = process_file(file_path)
    if df is None:
        print(f"❌ File Processing Error: {error_msg}")
        os.remove(file_path)
        return jsonify({"error": error_msg}), 400

    # Extract feedback list
    feedback_list = df["Feedback"].astype(str).tolist()

    # Perform sentiment analysis
    try:
        sentiment_results = perform_sentiment_analysis(feedback_list)
        print("✅ Sentiment analysis completed successfully!")
    except Exception as e:
        print(f"❌ Sentiment Analysis Error: {e}")
        os.remove(file_path)
        return jsonify({"error": "Sentiment analysis failed"}), 500

    # Add sentiment results to DataFrame
    df["Sentiment"] = [result["label"] for result in sentiment_results]
    df["Confidence"] = [result["score"] for result in sentiment_results]

    # Save processed data
    processed_file_path = save_processed_data(df, unique_filename)

    # Store file path in database
    try:
        insert_file_path(unique_filename, processed_file_path, coursename, userid)
        print("✅ File path stored in database successfully!")
        return jsonify({
            "message": "File uploaded and analyzed successfully!", 
            "file_path": processed_file_path
        }), 200
    except Exception as e:
        print(f"❌ Database Error: {e}")
        return jsonify({"error": str(e)}), 500

@upload_bp.route("/check_sessionnnn", methods=["GET"])
def check_sessionnnn():
    if not session:
        print("Session is empty or not initialized.")  # Debugging
        return jsonify({"error": "No session data available"}), 400

    userid = session.get('user_id')

    if not userid:
        print("Error: User ID not found in session")  # ✅ Debugging
        return jsonify({"error": "User not logged in"}), 401

    return jsonify({"user_id": userid})

@upload_bp.route('/files', methods=['GET'])
def get_uploaded_files():
    userid = session.get('user_id')  # User ID exists, so it's not the issue

    try:
        print(f"[DEBUG] Fetching files for user ID: {userid}")  # Check if user ID is correct

        files = fetch_user_files(userid)  # Fetch files from database
        print(f"[DEBUG] Retrieved files: {files}")  # See what is returned

        # Ensure the response is in JSON format with a key
        return jsonify({"files": files}), 200  

    except Exception as e:
        print(f"[ERROR] {str(e)}")  # Log the exact error
        return jsonify({"error": str(e)}), 500


