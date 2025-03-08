import psycopg2

# Fetch variables
USER = "postgres.akmdanrovajjyunxpadq"
PASSWORD = "@007757461jJ"
HOST = "aws-0-ap-southeast-1.pooler.supabase.com"
PORT = "5432"
DBNAME = "postgres"

def get_db_connection():
    return psycopg2.connect(
    user=USER,
    password=PASSWORD,
    host=HOST,
    port=PORT,
    dbname=DBNAME
    )
print("Connection successful!")

# Create a cursor to execute SQL queries
connection = get_db_connection()

