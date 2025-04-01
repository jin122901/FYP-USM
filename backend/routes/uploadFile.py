import os
import uuid
import datetime
import pandas as pd
from flask import Blueprint, request, jsonify,session
from werkzeug.utils import secure_filename
from model.file import insert_file_path, fetch_user_files, update_file_status, delete_uploaded_file
from transformers import pipeline
from ml_model import sentiment_pipeline 
from tqdm import tqdm
import threading


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

def validate_and_fix_file_columns(file_path):
    """Validate and modify the uploaded file columns to ensure 'Feedback' is present."""
    try:
        df = pd.read_csv(file_path) if file_path.endswith(".csv") else pd.read_excel(file_path)

        required_columns = {"Feedback", "Comment", "Review"}
        found_columns = [col for col in df.columns if col in required_columns]

        if not found_columns:
            return False, "File must contain at least one of these columns: Feedback, Comment, Review."

        # Rename the first found column to "Feedback" if it's not already "Feedback"
        if "Feedback" not in df.columns:
            df.rename(columns={found_columns[0]: "Feedback"}, inplace=True)

        # Save the modified file back
        if file_path.endswith(".csv"):
            df.to_csv(file_path, index=False)
        else:
            df.to_excel(file_path, index=False)

        return True, None  # Validation success

    except Exception as e:
        return False, f"Error processing file: {str(e)}"
    
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

    # Check if 'file' exists in the request
    if 'file' not in request.files:
        print("❌ Error: No file found in request")
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    coursename = request.form.get("coursename")
    userid = session.get('user_id')

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

    # Save file
    try:
        file.save(file_path)
        print("✅ File saved successfully!")
    except Exception as e:
        print(f"❌ Error saving file: {e}")
        return jsonify({"error": "File saving failed"}), 500

    # Validate file content
    is_valid, error_msg = validate_and_fix_file_columns(file_path)
    if not is_valid:
        print(f"❌ File Validation Failed: {error_msg}")
        os.remove(file_path)  # Remove invalid file
        return jsonify({"error": error_msg}), 400

    # ✅ **Return success response immediately**
    
    response = {"message": "File uploaded successfully!", "file_path": file_path}
    threading.Thread(target=run_sentiment_analysis, args=(file_path, unique_filename, coursename, userid)).start()
    return jsonify(response), 200


def run_sentiment_analysis(file_path, unique_filename, coursename, userid):
    try:
        print("🚀 Starting sentiment analysis...")
        # Save processed data

        # Store file path in database
        insert_file_path(unique_filename, unique_filename, coursename, userid)
        # Process file to extract feedback
        df, error_msg = process_file(file_path)
        if df is None:
            print(f"❌ File Processing Error: {error_msg}")
            os.remove(file_path)
            return

        # Extract feedback list
        feedback_list = df["Feedback"].astype(str).tolist()

        # Perform sentiment analysis
        sentiment_results = perform_sentiment_analysis(feedback_list)
        print("✅ Sentiment analysis completed successfully!")

        # Add sentiment results to DataFrame
        df["Sentiment"] = [result["label"] for result in sentiment_results]

        print("✅ File path stored in database successfully!")
        update_file_status("35",unique_filename)

    except Exception as e:
        print(f"❌ Error during sentiment analysis: {e}")

@upload_bp.route('/files', methods=['GET'])
def get_uploaded_files():
    userid = session.get('user_id')
    search_query = request.args.get("search", "")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))

    try:
        print(f"[DEBUG] Fetching files for user ID: {userid}")

        files = fetch_user_files(userid,search_query,page,limit)
        print(f"[DEBUG] Retrieved files: {files}")  # ✅ Now prints dictionaries, not tuples

        return jsonify({"files": files}), 200  # ✅ Now JSON-compatible

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return jsonify({"error": str(e)}), 500


@upload_bp.route('/files/deleteFile/<int:file_id>', methods=['DELETE'])
def delete_file(file_id):
    try:
        # Call the function to delete the file from the database and filesystem
        delete_uploaded_file(file_id)  # Use your existing function with file_id

        # Return success response
        return jsonify({"success": True, "message": "File deleted successfully."}), 200
    except Exception as e:
        # Return error response in case of any failure
        return jsonify({"success": False, "message": str(e)}), 500