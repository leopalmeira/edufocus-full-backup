import sqlite3
db_path = r'c:\Users\User\Desktop\edufocus1\edufocus1-main\database\school_14.db'
conn = sqlite3.connect(db_path)
print(f"--- LOGS RECENTES {db_path} ---")
logs = conn.execute("SELECT * FROM access_logs ORDER BY id DESC LIMIT 5").fetchall()
for l in logs:
    print(l)
conn.close()
