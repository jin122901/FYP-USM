# ml_model.py
from transformers import pipeline

# ✅ Load the model once and share it across the app
sentiment_pipeline = pipeline("sentiment-analysis", model="model/fine_tuned_sentiment_model", batch_size=16)
