import sys
sys.path.append("./backend") 
from db.dbconnect import get_db_connection
import bcrypt



def create_users_table():
    
    """Create users table if it does not exist."""
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_info (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            industry TEXT NOT NULL,
            usr_type INTEGER NOT NULL
        );
    """)
    connection.commit()
    cursor.close()
    connection.close()

def insert_user(name, email, password, industry, usr_type):
    connection = get_db_connection()
    cursor = connection.cursor()
    """Insert a new user into the database."""
    try:
        cursor.execute("INSERT INTO user_info (name, email, password, industry, usr_type) VALUES (%s, %s, %s, %s, %s) RETURNING id;",
                       (name, email, password, industry, 1))
        user_id = cursor.fetchone()[0]
        connection.commit()
        return user_id
    except Exception as e:
        connection.rollback()
        raise e
    finally:
        cursor.close()
        connection.close()

def get_user_by_email(email):
    """Retrieve a user by email."""
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM user_info WHERE email = %s;", (email,))
    user = cursor.fetchone()
    cursor.close() 
    connection.close()
    return user

def verify_user(email, password):
    user = get_user_by_email(email)
    
    if user:
        stored_password = user[3]  # Assuming password is stored in the 4th column
        if bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')):
            return user
    return None  # Return None if authentication fails

# ✅ Get user details by email
def get_useremail(email):
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT name, email, industry FROM user_info WHERE email = %s", (email,))
    return cursor.fetchone()

# ✅ Update user details
def update_user_details(email, name, industry):
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("UPDATE user_info SET name = %s, industry = %s WHERE email = %s", (name, industry, email))
    connection.commit()

# ✅ Get hashed password
def get_user_password(email):
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT password_hash FROM user_info WHERE email = %s", (email,))
    return cursor.fetchone()

# ✅ Update password with hash
def update_user_password(email, new_password):
    connection = get_db_connection()
    cursor = connection.cursor()
    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    cursor.execute("UPDATE user_info SET password_hash = %s WHERE email = %s", (hashed_password, email))
    connection.commit()