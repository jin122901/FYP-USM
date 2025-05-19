# ml_model.py
from transformers import pipeline
import joblib
import json

# ✅ Load the model once and share it across the app
sentiment_pipeline = pipeline("sentiment-analysis", model="model/fine_tuned_sentiment_model", batch_size=16)

KMeans = joblib.load("model/textminig_model/kmeans_model.pkl")

# Load saved topic names
# with open("model/textminig_model/topic_names.json", "r") as f:
#     topic_names = json.load(f)

print("✅ Model and topics loaded successfully")