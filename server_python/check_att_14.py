import sqlite3
db_path = r'c:\Users\User\Desktop\edufocus1\edufocus1-main\database\school_14.db'
conn = sqlite3.connect(db_path)
print(f"--- ATTENDANCE ID 7 em {db_path} ---")
rows = conn.execute("SELECT * FROM attendance WHERE student_id=7").fetchall()
for r in rows:
    print(r)
conn.close()
