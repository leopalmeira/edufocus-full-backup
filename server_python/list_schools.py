import sqlite3
import os

system_db = r'c:\Users\User\Desktop\edufocus1\edufocus1-main\database\system.db'
conn = sqlite3.connect(system_db)
cur = conn.cursor()
schools = cur.execute('SELECT id, name FROM schools').fetchall()
print("--- LISTA DE ESCOLAS ---")
for s in schools:
    print(f"ID: {s[0]} | Nome: {s[1]}")
conn.close()
