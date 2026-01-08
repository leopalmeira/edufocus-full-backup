import sqlite3
import os

system_db = r'c:\Users\User\Desktop\edufocus1\edufocus1-main\database\system.db'
conn = sqlite3.connect(system_db)
cur = conn.cursor()

print("--- TABELAS ---")
tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
for t in tables:
    print(t[0])

print("\n--- TENTANDO LER GUARDIAN STUDENTS ---")
try:
    links = cur.execute("SELECT * FROM guardian_students LIMIT 5").fetchall()
    print(links)
except Exception as e:
    print(f"Erro: {e}")

conn.close()
