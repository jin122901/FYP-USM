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
import json
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import google.generativeai as genai
from flask import current_app as app
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk.corpus import stopwords



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
    """Validate the uploaded file has valid columns"""
    try:
        df = pd.read_csv(file_path) if file_path.endswith(".csv") else pd.read_excel(file_path)
        
        # Basic validation - file should have at least one column
        if len(df.columns) == 0:
            return False, "File has no columns."
            
        return True, None  # Validation success
    except Exception as e:
        return False, f"Error processing file: {str(e)}"
    
def process_file(file_path):
    """ Reads the uploaded CSV/XLSX file and returns a DataFrame with all columns """
    try:
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        return None, None, f"Failed to read file: {str(e)}"
    
    # Return the dataframe and all column names
    columns = df.columns.tolist()
    return df, columns, None

@upload_bp.route('/get_columns', methods=['GET'])
def get_file_columns():
    file_path = request.args.get('filePath')
    
    if not file_path:
        return jsonify({'error': 'File path is missing'}), 400
        
    filename = os.path.basename(file_path)
    full_path = os.path.join(UPLOAD_FOLDER, filename)
    
    if not os.path.exists(full_path):
        return jsonify({'error': f'File not found: {full_path}'}), 404
    
    try:
        # Read file and get columns
        df = pd.read_csv(full_path) if full_path.endswith('.csv') else pd.read_excel(full_path)
        columns = df.columns.tolist()
        
        # Return preview data for the first 5 rows
        preview = df.head(5).to_dict('records')
        
        return jsonify({ 
            'columns': columns,
            'preview': preview,
            'rowCount': len(df)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def save_processed_data(df, original_filename):
    """ Saves processed data with sentiment results and returns the file path """
    unique_filename = f"processed_{secure_filename(original_filename)}"
    processed_file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    
    # Debugging: Print the path to verify
    print(f"Processed file will be saved to: {processed_file_path}")
    
    df.to_csv(processed_file_path, index=False)
    return processed_file_path

@upload_bp.route('/preview_file', methods=['POST'])
def preview_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    
    if not file or file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Allowed: CSV, XLSX"}), 400

    try:
        # Read file directly from memory without saving
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        
        # Get column information
        columns = df.columns.tolist()
        
        # Get preview of first 5 rows
        preview = df.head(5).to_dict('records')
        
        return jsonify({
            'columns': columns,
            'preview': preview,
            'rowCount': len(df),
            'filename': file.filename
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error reading file: {str(e)}"}), 500

@upload_bp.route('/upload', methods=['POST'])
def upload_file():
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Get the columns data from the form
    columns_data = request.form.get('columns', '[]')
    print(f"Received columns data: {columns_data}")  # Debug print
    
    coursename = request.form.get('coursename', '')
    if not coursename:
        return jsonify({'error': 'Course name is required'}), 400

    # Handle different possible formats for columns
    try:
        if isinstance(columns_data, str):
            selected_columns = json.loads(columns_data)
        else:
            selected_columns = columns_data
            
        # Ensure it's a list
        if not isinstance(selected_columns, list):
            selected_columns = [selected_columns]
            
        print(f"Parsed columns: {selected_columns}")  # Debug print
    except Exception as e:
        print(f"Error parsing columns: {str(e)}")
        selected_columns = []
        
    if not selected_columns or len(selected_columns) == 0:
        return jsonify({'error': 'No columns selected for analysis'}), 400
    
    # Get full path if only filename was provided
    original_filename = secure_filename(file.filename)
    unique_filename = generate_unique_filename(original_filename)
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    
    # First save the file
    try:
        file.save(file_path)
        print("✅ File saved successfully!")
    except Exception as e:
        print(f"❌ Error saving file: {e}")
        return jsonify({"error": f"File saving failed: {str(e)}"}), 500
    
    # Now check if it was saved correctly
    if not os.path.exists(file_path):
        return jsonify({'error': 'File could not be saved properly'}), 500
    
    # Start analysis in background thread
    userid = session.get('user_id')
    
    response = {"message": "File uploaded successfully!", "file_path": file_path}
    threading.Thread(
        target=run_sentiment_analysis_on_columns, 
        args=(file_path, unique_filename, coursename, userid, selected_columns)
    ).start()
    
    return jsonify(response), 200

def run_sentiment_analysis_on_columns(file_path, filename, coursename, userid, selected_columns):
    try:
        print(f"🚀 Starting sentiment analysis on columns: {selected_columns}...")
        insert_file_path(filename, filename, coursename, userid)
        # Update file status in database
        update_file_status("10", "", filename)
        
        # Read the file
        df = pd.read_csv(file_path) if file_path.endswith('.csv') else pd.read_excel(file_path)
        
        # Process each selected column
        for i, column in enumerate(selected_columns):
            print(f"Processing column: {column}")
            
            # Create a sentiment result column name (adjacent to original column)
            col_index = df.columns.get_loc(column)
            
            # Convert to string and truncate
            df[column] = df[column].astype(str).apply(lambda x: x[:512])
            
            # Filter non-English feedback if needed
            import langdetect
            
            def is_english(text):
                try:
                    if not isinstance(text, str) or text.strip() == '':
                        return False
                    lang = langdetect.detect(text)
                    return lang == 'en'
                except:
                    return False
            
            # Create a mask for English text
            english_mask = df[column].apply(is_english)
            
            # Get English feedback for analysis
            feedback_list = df.loc[english_mask, column].tolist()
            
            if not feedback_list:
                print(f"No English text found in column '{column}'")
                continue
            
            # Perform sentiment analysis on this column
            sentiment_results = perform_sentiment_analysis(feedback_list)
            
            # Map results back to the original dataframe
            sentiment_column = f"Sentiment_{column}"
            df.loc[english_mask, sentiment_column] = [result["label"] for result in sentiment_results]
            
            # Fill non-English rows with "N/A"
            df.loc[~english_mask, sentiment_column] = "N/A"
            
            # Insert the sentiment column right after the original column
            columns = df.columns.tolist()
            df = df.reindex(columns=columns[:col_index+1] + [sentiment_column] + 
                             [c for c in columns if c != sentiment_column and c not in columns[:col_index+1]])
            
            # Perform topic classification
            topic_column = f"Topic_{column}"
            df.loc[english_mask, topic_column] = classify_topics([text for text in feedback_list])
            df.loc[~english_mask, topic_column] = "N/A"
            
            # Insert the topic column after the sentiment column
            columns = df.columns.tolist()
            sentiment_idx = columns.index(sentiment_column)
            df = df.reindex(columns=columns[:sentiment_idx+1] + [topic_column] + 
                             [c for c in columns if c != topic_column and c not in columns[:sentiment_idx+1]])
            
            # Update progress
            progress = int(((i + 1) / len(selected_columns)) * 90)  # Up to 90% for processing
            update_file_status(str(progress), "", filename)
        
        # Save processed data
        processed_filename = f"processed_{filename}"
        processed_path = os.path.join(UPLOAD_FOLDER, processed_filename)
        df.to_csv(processed_path, index=False)
        
        # Generate recommendation based on all analyzed columns
        recome = generate_combined_recommendation(processed_path, selected_columns)
        
        # Update file status to complete
        update_file_status("100", recome, filename)
        
        print("✅ Analysis completed for all selected columns!")
        
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        update_file_status("failed", str(e), filename)

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

def generate_combined_recommendation(filepath, selected_columns):
    genai.configure(api_key="AIzaSyDWMCleTLS_bk4SWtnmUj1k_nFIPt2LClM")
    model = genai.GenerativeModel("gemini-2.0-flash")
    
    try:
        # Read the CSV file
        df = pd.read_csv(filepath)
        
        all_negative_feedback = []
        
        # Collect negative feedback from each analyzed column
        for column in selected_columns:
            sentiment_column = f"Sentiment_{column}"
            if sentiment_column in df.columns:
                negative_feedback = df[df[sentiment_column] == "LABEL_0"][column].tolist()
                all_negative_feedback.extend(negative_feedback)
        
        if not all_negative_feedback:
            return "No negative feedback found in the analyzed columns!"

        # Join negative feedback into a single text block
        feedback_text = "\n".join(all_negative_feedback)

        # Generate recommendation using Gemini API
        prompt = f"""
        You are an AI analyzing feedback.
        Below is a collection of negative feedback:

        {feedback_text}

        Based on this, provide specific recommendations for improvement in 100 words.
        """
        response = model.generate_content(prompt)

        # Return the generated recommendation
        return response.text
    except Exception as e:
        return f"Error processing file: {str(e)}"
    
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
    selected_columns = request.args.getlist('columns')  # Get multiple columns from query params

    if not file_path:
        return jsonify({'error': 'File path is missing'}), 400

    filename = os.path.basename(file_path)
    full_path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(full_path):
        return jsonify({'error': f'File not found: {full_path}'}), 404

    try:
        df = pd.read_csv(full_path)
        row_count = len(df)
        
        # Initialize result dictionary
        result = {
            "totalRows": row_count,
            "columns": {},
            "word_cloud_url": "/wordcloud-image"
        }

        # Find all sentiment columns (both original and processed)
        all_sentiment_cols = [col for col in df.columns if col.startswith('Sentiment_')]
        
        # If no specific columns requested, use all found sentiment columns
        columns_to_process = selected_columns if selected_columns else all_sentiment_cols
        
        for col in columns_to_process:
            if col not in df.columns:
                continue
                
            # Process each sentiment column
            sentiment_counts = df[col].value_counts().to_dict()
            
            # Find corresponding topic column (if exists)
            topic_col = f"Topic_{col.replace('Sentiment_', '')}"
            topic_counts = df[topic_col].value_counts().to_dict() if topic_col in df.columns else {}
            
            # Sentiment distribution per topic (if topics exist)
            sentiment_by_topic = {}
            if topic_col in df.columns:
                sentiment_by_topic = (
                    df.groupby(topic_col)[col]
                    .value_counts()
                    .unstack(fill_value=0)
                    .to_dict("index")
                )
            
            result["columns"][col] = {
                "sentiment": {
                    "negative": sentiment_counts.get("LABEL_0", 0),
                    "neutral": sentiment_counts.get("LABEL_1", 0),
                    "positive": sentiment_counts.get("LABEL_2", 0)
                },
                "topics": topic_counts,
                "sentiment_by_topic": sentiment_by_topic
            }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@upload_bp.route('/wordcloud-image', methods=['GET'])
def generate_wordcloud():
    file_path = request.args.get("filePath")
    sentiment_filter = request.args.get("sentiment")

    if not file_path:
        return jsonify({"error": "File path is missing"}), 400

    filename = os.path.basename(file_path)
    full_path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(full_path):
        return jsonify({"error": "File not found"}), 404

    df = pd.read_csv(full_path)

    if "Feedback" not in df.columns or "Sentiment" not in df.columns:
        return jsonify({"error": "Missing required columns"}), 400

    # Filter by sentiment if not "all"
    sentiment_map = {"negative": "LABEL_0", "neutral": "LABEL_1", "positive": "LABEL_2"}
    if sentiment_filter and sentiment_filter in sentiment_map and sentiment_filter != "all":
        df = df[df["Sentiment"] == sentiment_map[sentiment_filter]]

    # Filter out rows with less than 3 words
    df["word_count"] = df["Feedback"].fillna("").apply(lambda x: len(re.findall(r'\b\w+\b', x)))
    df = df[df["word_count"] >= 3]

    # Initialize sentiment analyzer
    sia = SentimentIntensityAnalyzer()
    
    # Get our custom stop words
    custom_stopwords = {"lecturer", "lectures", "course", "students", "teaching"}
    stop_words = set(stopwords.words('english')).union(custom_stopwords)
    
    # Process each feedback to extract and classify words by sentiment
    positive_words = []
    neutral_words = []
    negative_words = []
    
    for feedback in df["Feedback"].dropna():
        words = re.findall(r"\b\w+\b", feedback.lower())
        
        for word in words:
            # Skip stopwords and very short words
            if word in stop_words or len(word) <= 2:
                continue
                
            # Get sentiment score for this word
            sentiment_score = sia.polarity_scores(word)
            
            # Classify word based on sentiment score
            if sentiment_score['compound'] >= 0.05:
                positive_words.append(word)
            elif sentiment_score['compound'] <= -0.05:
                negative_words.append(word)
            else:
                neutral_words.append(word)
    
    # Determine which words to use based on sentiment filter
    if sentiment_filter == "positive":
        word_counts = Counter(positive_words)
        color_func = lambda *args, **kwargs: "green"  # Use green for positive words
    elif sentiment_filter == "negative":
        word_counts = Counter(negative_words)
        color_func = lambda *args, **kwargs: "red"    # Use red for negative words
    elif sentiment_filter == "neutral":
        word_counts = Counter(neutral_words)
        color_func = lambda *args, **kwargs: "gray"   # Use gray for neutral words
    else:  # "all" or any other value
        # Combine all words but keep their original sentiment colors
        all_words = []
        all_words.extend(positive_words)
        all_words.extend(neutral_words)
        all_words.extend(negative_words)
        word_counts = Counter(all_words)
        
        # Custom color function to color words by sentiment
        def color_func(word, font_size, position, orientation, random_state=None, **kwargs):
            sentiment_score = sia.polarity_scores(word)
            if sentiment_score['compound'] >= 0.05:
                return "green"
            elif sentiment_score['compound'] <= -0.05:
                return "red"
            else:
                return "gray"
    
    # If we don't have enough words, use a generic approach as fallback
    if len(word_counts) < 10:
        all_feedback_text = " ".join(df["Feedback"].dropna())
        words = re.findall(r"\b\w+\b", all_feedback_text.lower())
        word_counts = Counter([word for word in words if word not in stop_words and len(word) > 2])
    
    # Generate the word cloud with appropriate colors
    if sentiment_filter in ["positive", "negative", "neutral"]:
        wordcloud = WordCloud(
            width=800, 
            height=400, 
            background_color="white",
            color_func=color_func,
            max_words=100
        ).generate_from_frequencies(word_counts)
    else:
        # For "all", use color_func to distinguish sentiment
        wordcloud = WordCloud(
            width=800, 
            height=400, 
            background_color="white",
            color_func=color_func,
            max_words=100
        ).generate_from_frequencies(word_counts)

    # Save image to memory
    img_io = io.BytesIO()
    plt.figure(figsize=(10, 5))
    plt.imshow(wordcloud, interpolation="bilinear")
    plt.axis("off")
    plt.tight_layout(pad=0)
    plt.savefig(img_io, format="PNG", bbox_inches="tight")
    img_io.seek(0)
    
    return send_file(img_io, mimetype="image/png")

