import sqlite3
import os

db_path = r'c:\Users\User\Desktop\edufocus1\edufocus1-main\database\school_1.db'

conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("--- ALUNOS ---")
try:
    students = cur.execute("SELECT id, name, face_descriptor FROM students").fetchall()
    for s in students:
        desc_len = len(s[2]) if s[2] else 0
        print(f"ID: {s[0]} | Nome: {s[1]} | DescritorLen: {desc_len}")
except Exception as e:
    print(f"Erro alunos: {e}")

print("\n--- ULTIMO LOG ---")
try:
    log = cur.execute("SELECT * FROM access_logs ORDER BY id DESC LIMIT 1").fetchone()
    print(log)
except:
    pass
conn.close()
