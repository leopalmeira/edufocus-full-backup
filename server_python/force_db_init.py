from database import get_school_db
import os

print("Forcing Init for School 1...")
try:
    conn = get_school_db(1)
    print("DB 1 Initialized/Updated.")
    conn.close()
except Exception as e:
    print(f"Error 1: {e}")

# Tentar descobrir outros DBs
dbs = [f for f in os.listdir('database') if f.startswith('school_') and f.endswith('.db')]
for db_file in dbs:
    try:
        sid = db_file.replace('school_', '').replace('.db', '')
        print(f"Initing School {sid}...")
        conn = get_school_db(sid)
        conn.close()
        print(f"School {sid} OK.")
    except Exception as e:
        print(f"Error {sid}: {e}")
