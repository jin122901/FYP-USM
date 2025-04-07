import os
import uuid
import datetime
import pandas as pd
from flask import Blueprint, request, jsonify,session, send_file
from werkzeug.utils import secure_filename
from model.file import insert_file_path, fetch_user_files, update_file_status, delete_uploaded_file, get_file_details_from_db
from transformers import pipeline
from ml_model import sentiment_pipeline,topic_names, kmeans 
from tqdm import tqdm
import threading
from sentence_transformers import SentenceTransformer
from collections import Counter
import re
import io
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import google.generativeai as genai
from flask import current_app as app


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

        required_columns = {"Feedback", "Comment", "Review","review","feedback"}
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

bert_model = SentenceTransformer("all-MiniLM-L6-v2")
def classify_topics(feedback_list):
    """
    Assigns topics to feedback using a pre-trained KMeans model and SentenceTransformer.

    Args:
        feedback_list (list): List of feedback texts.
        kmeans_model (KMeans): Preloaded KMeans clustering model.
        topic_names (dict): Dictionary mapping cluster labels to topic names.

    Returns:
        list: Assigned topic names for each feedback.
    """
    topics = []
    for feedback in tqdm(feedback_list, desc="🔍 Assigning Topics"):
        embedding = bert_model.encode(feedback, convert_to_tensor=True).cpu().numpy().reshape(1, -1)
        cluster = kmeans.predict(embedding)[0]  # Predict cluster
        assigned_topic = topic_names.get(str(cluster), "Unknown Topic")
        topics.append(assigned_topic)
    
    return topics

def save_processed_data(df, original_filename):
    """ Saves processed data with sentiment results and returns the file path """
    unique_filename = f"processed_{secure_filename(original_filename)}"
    processed_file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    
    # Debugging: Print the path to verify
    print(f"Processed file will be saved to: {processed_file_path}")
    
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

        # Filter non-English feedback
        import langdetect
        
        def is_english(text):
            try:
                if not isinstance(text, str) or text.strip() == '':
                    return False
                    
                # Detect language
                lang = langdetect.detect(text)
                return lang == 'en'
            except:
                # If detection fails, we'll exclude the text
                return False
        
        # Apply language filter and inform about the filtering
        total_feedback = len(df)
        df = df[df["Feedback"].apply(is_english)]
        english_feedback = len(df)
        
        if total_feedback > english_feedback:
            print(f"ℹ Filtered out {total_feedback - english_feedback} non-English feedback entries.")
    
        if english_feedback == 0:
            print("❌ No English feedback found. Analysis cannot proceed.")
            os.remove(file_path)
            update_file_status("failed", unique_filename)
            return

        # Extract feedback list (now English only)
        feedback_list = df["Feedback"].astype(str).tolist()

        # Perform sentiment analysis
        sentiment_results = perform_sentiment_analysis(feedback_list)
        
        print("✅ Sentiment analysis completed successfully!")
       
        # Add sentiment results to DataFrame
        df["Sentiment"] = [result["label"] for result in sentiment_results]
        update_file_status("35","", unique_filename)

        # Perform topic classification
        df["Predicted_Topic"] = classify_topics(feedback_list)
        print("✅ Topic mining completed!")
        # Update database status
        update_file_status("60","", unique_filename)
        save_processed_data(df, file_path)
        processed_filename = f"processed_uploads_{unique_filename}"
        recome = generaterecommendation(processed_filename)
        update_file_status("100",recome, unique_filename)

        

    except Exception as e:
        print(f"❌ Error during analysis: {e}")

def generaterecommendation(filepath):
    # Remove this line - we already have an app context from the caller
    # with app.app_context():  # <-- REMOVE THIS

    genai.configure(api_key="AIzaSyDWMCleTLS_bk4SWtnmUj1k_nFIPt2LClM")
    model = genai.GenerativeModel("gemini-2.0-flash")
    file_path = filepath or request.args.get('filePath')

    if not file_path:
        return jsonify({'error': 'File path is missing'}), 400

    filename = os.path.basename(file_path)
    full_path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(full_path):
        return jsonify({'error': f'File not found: {full_path}'}), 404

    try:
        # Read the CSV file
        df = pd.read_csv(full_path)
        print(full_path)
        # Filter negative feedback (Sentiment = "LABEL_0")
        negative_feedback = df[df['Sentiment'] == "LABEL_0"]["Feedback"].tolist()

        if not negative_feedback:
            return jsonify({'message': 'No negative feedback found in the dataset!'}), 200

        # Join negative feedback into a single text block
        feedback_text = "\n".join(negative_feedback)

        # Generate recommendation using Gemini API
        prompt = f"""
        You are an AI analyzing student feedback.
        Below is a collection of negative reviews from students:

        {feedback_text}

        Based on this, provide specific recommendations for me to improve student satisfaction in 100 words.
        """
        response = model.generate_content(prompt)

        # Return the generated recommendation
        return response.text  # Changed to return just the text instead of jsonify response

    except Exception as e:
        return f"Error processing file: {str(e)}"  # Changed to return just error text

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
        print("❌ Error:", str(e))
        # Return error response in case of any failure
        return jsonify({"success": False, "message": str(e)}), 500

@upload_bp.route("/get_file_details/<fileid>", methods=["GET"])
def get_file_path(fileid):
    file_details = get_file_details_from_db(fileid)
    if file_details:
        return jsonify(file_details)  # Now includes file_path & course_name
    return jsonify({"error": "File not found"}), 404

  # Ensure this is set correctly

@upload_bp.route('/read-csv', methods=['GET'])
def read_csv():
    file_path = request.args.get('filePath')

    if not file_path:
        return jsonify({'error': 'File path is missing'}), 400

    filename = os.path.basename(file_path)
    full_path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(full_path):
        return jsonify({'error': f'File not found: {full_path}'}), 404

    try:
        df = pd.read_csv(full_path)
        row_count = len(df)  # Count total rows

        # Count sentiment labels
        sentiment_counts = df["Sentiment"].value_counts().to_dict()
        topic_counts = df["Predicted_Topic"].value_counts().to_dict()

        # Sentiment distribution per topic
        sentiment_by_topic = (
            df.groupby("Predicted_Topic")["Sentiment"]
            .value_counts()
            .unstack(fill_value=0)
            .to_dict("index")
        )

        result = {
            "sentiment": {
                "negative": sentiment_counts.get("LABEL_0", 0),
                "neutral": sentiment_counts.get("LABEL_1", 0),
                "positive": sentiment_counts.get("LABEL_2", 0),
                "totalRows": row_count
            },
            "topics": topic_counts,
            "sentiment_by_topic": sentiment_by_topic,
            "word_cloud_url": "/wordcloud-image"  # URL to fetch word cloud dynamically
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@upload_bp.route('/wordcloud-image', methods=['GET'])
def generate_wordcloud():
    file_path = request.args.get("filePath")
    sentiment_filter = request.args.get("sentiment")  # Accept sentiment type

    if not file_path:
        return jsonify({"error": "File path is missing"}), 400

    filename = os.path.basename(file_path)
    full_path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(full_path):
        return jsonify({"error": "File not found"}), 404

    df = pd.read_csv(full_path)

    if "Feedback" not in df.columns or "Sentiment" not in df.columns:
        return jsonify({"error": "Missing required columns"}), 400

    # Filter by sentiment
    sentiment_map = {"negative": "LABEL_0", "neutral": "LABEL_1", "positive": "LABEL_2"}
    if sentiment_filter and sentiment_filter in sentiment_map:
        df = df[df["Sentiment"] == sentiment_map[sentiment_filter]]

    # Filter out rows with less than 3 words
    df["word_count"] = df["Feedback"].fillna("").apply(lambda x: len(re.findall(r'\b\w+\b', x)))
    df = df[df["word_count"] >= 3]

    feedback_column = df["Feedback"].dropna()
    all_feedback_text = " ".join(feedback_column)

    # Tokenize and clean text
    words = re.findall(r"\b\w+\b", all_feedback_text.lower())
    excluded_words = {"lecturer", "course", "students", "teaching",'the', 'to', 'and', 'a', 'of', 'i', 'this', 'for', 'is', 'it', 'in', 
        'you', 'that', 'was', 'with', 'on', 'as', 'an', 'are', 'be', 'my', 
        'what', 'can', 'have', 'but', 'not', 'will', 'from', 'also', 'who', 's',
        'at', 'by', 'or', 'we', 'me', 'your', 'their', 'our'}
    filtered_words = [word for word in words if word not in excluded_words]
    word_counts = Counter(filtered_words)

    # Generate word cloud
    wordcloud = WordCloud(width=800, height=400, background_color="white").generate_from_frequencies(word_counts)

    # Save image to memory
    img_io = io.BytesIO()
    plt.figure(figsize=(10, 5))
    plt.imshow(wordcloud, interpolation="bilinear")
    plt.axis("off")
    plt.savefig(img_io, format="PNG", bbox_inches="tight", pad_inches=0)
    img_io.seek(0)
    
    return send_file(img_io, mimetype="image/png")

