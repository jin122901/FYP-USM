import os
import pandas as pd

file_path = "backend/uploads/processed_uploads_20250402_193342_ca239b61.csv"

# Convert to absolute path
full_path = os.path.abspath(file_path)

print("Checking file at:", full_path)

if os.path.exists(full_path):
    print("✅ File exists! Trying to read...")
    try:
        df = pd.read_csv(full_path)
        print("✅ File read successfully! Total rows:", len(df))
    except Exception as e:
        print("❌ Error reading CSV:", e)
else:
    print("❌ File NOT found at:", full_path)
