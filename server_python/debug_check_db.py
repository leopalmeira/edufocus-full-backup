import sqlite3
import os

print("Files in dir:", [f for f in os.listdir('.') if f.endswith('.db')])

try:
    conn = sqlite3.connect('school_1.db')
    c = conn.cursor()
    print("--- Event Participations (School 1) ---")
    try:
        rows = c.execute("SELECT * FROM event_participations").fetchall()
        for r in rows: print(r)
    except Exception as e: print("Error Query 1:", e)
    conn.close()
except Exception as e:
    print("Error Connect 1:", e)

if os.path.exists('school_19.db'):
    conn = sqlite3.connect('school_19.db')
    c = conn.cursor()
    print("--- Event Participations (School 19) ---")
    try:
        rows = c.execute("SELECT * FROM event_participations").fetchall()
        for r in rows: print(r)
    except Exception as e: print("Error Query 19:", e)
    conn.close()
else:
    print("school_19.db not found")
