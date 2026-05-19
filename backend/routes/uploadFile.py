import os
import uuid
import datetime
import pandas as pd
from flask import Blueprint, request, jsonify,session, send_file
from werkzeug.utils import secure_filename
from model.file import insert_file_path, fetch_user_files, update_file_status, delete_uploaded_file, get_file_details_from_db
from transformers import pipeline
from ml_model import sentiment_pipeline
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
from sklearn.cluster import KMeans
import torch



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

def generate_topic_name(feedback_list, cluster_feedback):
    """
    Generate a topic name based on the feedback in a cluster using BERT embeddings.
    """
    # Get the most representative feedback from the cluster
    if not cluster_feedback:
        return "General Feedback"
    
    # Use BERT to get embeddings for all feedback in the cluster
    embeddings = bert_model.encode(cluster_feedback, convert_to_tensor=True)
    
    # Calculate the centroid of the cluster
    centroid = embeddings.mean(dim=0)
    
    # Find the feedback closest to the centroid
    distances = torch.cdist(centroid.unsqueeze(0), embeddings)[0]
    most_representative_idx = distances.argmin().item()
    
    # Get the most representative feedback
    representative_feedback = cluster_feedback[most_representative_idx]
    
    # Use Gemini to generate a concise topic name
    try:
        genai.configure(api_key="")
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        prompt = f"""
        Based on this feedback, generate a concise topic name (2-4 words) that best represents the main theme.
        Rules:
        1. Topic name should be specific and descriptive, focusing on the main subject matter.
        2. Focus only on academic aspects (teaching quality, assessments, resources, engagement)
        3. Ensure that each topic name is used only once.
        4. Do not use any special characters, asterisks, or markdown formatting.
        5. Use plain text only.
        
        Feedback: {representative_feedback}
        """
        
        response = model.generate_content(prompt)
        topic_name = response.text.strip()
        
        # Clean up the response to ensure it's just the topic name
        topic_name = topic_name.replace('"', '').replace("'", "").strip()
        topic_name = topic_name.replace('*', '').strip()  # Remove asterisks
        topic_name = re.sub(r'[^\w\s-]', '', topic_name)  # Remove any other special characters
        topic_name = ' '.join(topic_name.split())  # Normalize whitespace
        
        if len(topic_name) > 50:  # If too long, truncate
            topic_name = topic_name[:47] + "..."
            
        return topic_name
    except Exception as e:
        print(f"Error generating topic name: {e}")
        return "General Feedback"

def classify_topics(feedback_list, max_clusters=5):
    """
    Assigns topics to feedback using BERT embeddings and dynamic topic generation.
    
    Args:
        feedback_list (list): List of feedback texts to classify
        max_clusters (int): Maximum number of clusters to create (default: 5)
    """
    if not feedback_list:
        return []
    
    # Get embeddings for all feedback
    embeddings = bert_model.encode(feedback_list, convert_to_tensor=True)
    
    # Convert to numpy for clustering
    embeddings_np = embeddings.cpu().numpy()
    
    # Calculate number of clusters based on feedback size, but respect max_clusters
    n_clusters = min(max(3, len(feedback_list) // 10), max_clusters)
    
    # Perform K-means clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    clusters = kmeans.fit_predict(embeddings_np)
    
    # Group feedback by cluster
    cluster_feedback = {}
    for i, cluster_id in enumerate(clusters):
        if cluster_id not in cluster_feedback:
            cluster_feedback[cluster_id] = []
        cluster_feedback[cluster_id].append(feedback_list[i])
    
    # Generate topic names for each cluster
    topic_names = {}
    for cluster_id in cluster_feedback:
        topic_names[cluster_id] = generate_topic_name(feedback_list, cluster_feedback[cluster_id])
    
    # Assign topics to each feedback
    topics = []
    for cluster_id in clusters:
        topics.append(topic_names[cluster_id])
    
    return topics

def generate_combined_recommendation(filepath, selected_columns):
    genai.configure(api_key="")
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

        Based on this, provide specific recommendations for improvement in a paragraph of 100 to 150 words.
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
            "feedbackData": [],
            "word_cloud_url": "/wordcloud-image"
        }

        # Find all sentiment columns (both original and processed)
        all_sentiment_cols = [col for col in df.columns if col.startswith('Sentiment_')]
        
        # If no specific columns requested, use all found sentiment columns
        columns_to_process = selected_columns if selected_columns else all_sentiment_cols
        
        # Process each column and gather feedback data
        for col in columns_to_process:
            if col not in df.columns:
                continue
                
            # Get the base feedback column name
            feedback_col = col.replace('Sentiment_', '')
            topic_col = f"Topic_{feedback_col}"
            
            # Process sentiment counts for analytics
            sentiment_counts = df[col].value_counts().to_dict()
            
            # Get topic counts if topic column exists
            topic_counts = df[topic_col].value_counts().to_dict() if topic_col in df.columns else {}
            
            # Sentiment distribution per topic
            sentiment_by_topic = {}
            if topic_col in df.columns:
                sentiment_by_topic = (
                    df.groupby(topic_col)[col]
                    .value_counts()
                    .unstack(fill_value=0)
                    .to_dict("index")
                )
            
            # Store analytics data
            result["columns"][col] = {
                "sentiment": {
                    "negative": sentiment_counts.get("LABEL_0", 0),
                    "neutral": sentiment_counts.get("LABEL_1", 0),
                    "positive": sentiment_counts.get("LABEL_2", 0)
                },
                "topics": topic_counts,
                "sentiment_by_topic": sentiment_by_topic
            }
            
            # Add properly formatted feedback data
            if feedback_col in df.columns:
                for idx, row in df.iterrows():
                    if pd.notna(row[feedback_col]):
                        # Convert sentiment labels to user-friendly terms
                        sentiment = "neutral"
                        if col in row and pd.notna(row[col]):
                            if row[col] == "LABEL_0":
                                sentiment = "negative"
                            elif row[col] == "LABEL_2":
                                sentiment = "positive"
                        
                        # Get topic if available
                        topic = None
                        if topic_col in df.columns and pd.notna(row[topic_col]):
                            topic = row[topic_col]
                        
                        # Create feedback entry with all required fields
                        feedback_entry = {
                            "id": int(idx),
                            "feedback": str(row[feedback_col]),
                            "sentiment": sentiment,
                            "topic": topic,
                            "source_column": feedback_col
                        }
                        result["feedbackData"].append(feedback_entry)

        print(f"Formatted {len(result['feedbackData'])} feedback entries")
        return jsonify(result)

    except Exception as e:
        print(f"Error in read_csv: {str(e)}")
        return jsonify({'error': str(e)}), 500


@upload_bp.route('/wordcloud-image', methods=['GET'])
def generate_wordcloud():
    file_path = request.args.get("filePath")
    sentiment_filter = request.args.get("sentiment", "all")
    column_name = request.args.get("column")  # Get the column name parameter
    topic_filter = request.args.get("topic")  # New parameter for filtering by topic

    if not file_path:
        return jsonify({"error": "File path is missing"}), 400

    filename = os.path.basename(file_path)
    full_path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(full_path):
        return jsonify({"error": "File not found"}), 404

    try:
        df = pd.read_csv(full_path)
        
        # Determine which feedback column to use based on the column_name parameter
        feedback_column = None
        sentiment_column = None
        topic_column = None
        
        if column_name and column_name.startswith("Sentiment_"):
            # Extract the original column name from the sentiment column name
            original_column = column_name.replace("Sentiment_", "")
            if original_column in df.columns:
                feedback_column = original_column
                sentiment_column = column_name
                topic_column = f"Topic_{original_column}"
        
        # If no valid column found, use the first available column
        if not feedback_column:
            # Try to find a column that has a corresponding Sentiment_ column
            for col in df.columns:
                if f"Sentiment_{col}" in df.columns:
                    feedback_column = col
                    sentiment_column = f"Sentiment_{col}"
                    topic_column = f"Topic_{col}"
                    break
            
            # If still no column found, use "Feedback" as fallback
            if not feedback_column and "Feedback" in df.columns:
                feedback_column = "Feedback"
        
        if not feedback_column or feedback_column not in df.columns:
            return jsonify({"error": "No suitable feedback column found"}), 400

        # Filter by sentiment if provided
        sentiment_map = {"negative": "LABEL_0", "neutral": "LABEL_1", "positive": "LABEL_2"}
        if sentiment_filter in sentiment_map and sentiment_filter != "all" and sentiment_column in df.columns:
            df = df[df[sentiment_column] == sentiment_map[sentiment_filter]]
        
        # Filter by topic if provided
        if topic_filter and topic_filter != "all" and topic_column in df.columns:
            df = df[df[topic_column] == topic_filter]

        # Filter out rows with less than 3 words and empty/NaN values
        df = df[df[feedback_column].notna()]  # Remove NaN values
        df["word_count"] = df[feedback_column].apply(lambda x: len(re.findall(r'\b\w+\b', str(x))))
        df = df[df["word_count"] >= 3]
        
        if len(df) == 0:
            # Create a simple wordcloud showing "No data available"
            wordcloud = WordCloud(
                width=800, 
                height=400, 
                background_color="white"
            ).generate("No data available for selected filters")
            
            img_io = io.BytesIO()
            plt.figure(figsize=(10, 5))
            plt.imshow(wordcloud, interpolation="bilinear")
            plt.axis("off")
            plt.tight_layout(pad=0)
            plt.savefig(img_io, format="PNG", bbox_inches="tight")
            img_io.seek(0)
            return send_file(img_io, mimetype="image/png")
        
        # Initialize sentiment analyzer
        sia = SentimentIntensityAnalyzer()
        
        # Combine all feedback texts
        all_feedback_text = " ".join(df[feedback_column].tolist())
        
        # Get sentiment words from VADER lexicon
        vader_lexicon = sia.lexicon
        sentiment_words = set(word.lower() for word in vader_lexicon.keys())
        
        # Tokenize and filter for sentiment words only
        words = []
        for word in re.findall(r"\b[a-zA-Z]+\b", all_feedback_text.lower()):
            if word in sentiment_words and len(word) > 2:
                words.append(word)
        
        # If no sentiment words found, check with a less strict approach
        if not words:
            for word in re.findall(r"\b[a-zA-Z]+\b", all_feedback_text.lower()):
                if len(word) > 2:
                    score = sia.polarity_scores(word)['compound']
                    if abs(score) >= 0.5:  # Only include strongly sentiment words
                        words.append(word)
        
        # Count word frequencies
        word_counts = Counter(words)
        
        # If still no words, show a message
        if not word_counts:
            wordcloud = WordCloud(
                width=800, 
                height=400, 
                background_color="white"
            ).generate("No sentiment words found for selected filters")
            
            img_io = io.BytesIO()
            plt.figure(figsize=(10, 5))
            plt.imshow(wordcloud, interpolation="bilinear")
            plt.axis("off")
            plt.tight_layout(pad=0)
            plt.savefig(img_io, format="PNG", bbox_inches="tight")
            img_io.seek(0)
            return send_file(img_io, mimetype="image/png")
        
        # Define color function based on sentiment
        def get_color_func(sentiment_filter):
            if sentiment_filter == "positive":
                return lambda *args, **kwargs: "green"
            elif sentiment_filter == "negative":
                return lambda *args, **kwargs: "red"
            elif sentiment_filter == "neutral":
                return lambda *args, **kwargs: "gray"
            else:
                # Custom color function for "all" sentiment
                def color_by_sentiment(word, font_size, position, orientation, random_state=None, **kwargs):
                    score = sia.polarity_scores(word)['compound']
                    if score >= 0.5:
                        return "green"
                    elif score <= -0.5:
                        return "red"
                    else:
                        return "dimgray"  # Neutral words
                return color_by_sentiment
        
        # Generate wordcloud from word frequencies
        wordcloud = WordCloud(
            width=800, 
            height=400,
            background_color="white",
            color_func=get_color_func(sentiment_filter),
            max_words=100,
            collocations=False
        ).generate_from_frequencies(word_counts)
        
        # Save image to memory
        img_io = io.BytesIO()
        plt.figure(figsize=(10, 5))
        plt.imshow(wordcloud, interpolation="bilinear")
        
        # Add a small caption with filter information
        filter_caption = []
        if sentiment_filter != "all":
            filter_caption.append(f"Sentiment: {sentiment_filter}")
        if topic_filter and topic_filter != "all":
            filter_caption.append(f"Topic: {topic_filter}")
        
        if filter_caption:
            plt.title(" | ".join(filter_caption), fontsize=10, pad=5)
        
        plt.axis("off")
        plt.tight_layout(pad=0)
        plt.savefig(img_io, format="PNG", bbox_inches="tight")
        img_io.seek(0)
        
        return send_file(img_io, mimetype="image/png")
        
    except Exception as e:
        print(f"Error generating word cloud: {str(e)}")
        # Return a simple error image
        img_io = io.BytesIO()
        plt.figure(figsize=(10, 5))
        plt.text(0.5, 0.5, f"Error generating word cloud: {str(e)}", 
                 horizontalalignment='center', verticalalignment='center')
        plt.axis("off")
        plt.savefig(img_io, format="PNG", bbox_inches="tight")
        img_io.seek(0)
        return send_file(img_io, mimetype="image/png")

