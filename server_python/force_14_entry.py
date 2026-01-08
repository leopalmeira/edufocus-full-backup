import sqlite3
import datetime

db = r'c:\Users\User\Desktop\edufocus1\edufocus1-main\database\school_14.db'
conn = sqlite3.connect(db)
now = datetime.datetime.utcnow().isoformat() + 'Z'
student_id = 7

print(f"Inserindo 'entry' em {db} para ID {student_id} em {now}")
try:
    conn.execute("INSERT INTO attendance (student_id, timestamp, type) VALUES (?, ?, 'entry')", (student_id, now))
    conn.commit()
    print("Sucesso na tabela attendance!")
except Exception as e:
    print(f"Erro attendance: {e}")

try:
    conn.execute("INSERT INTO access_logs (student_id, event_type, timestamp, notified_guardian) VALUES (?, 'arrival', ?, 0)", (student_id, now))
    conn.commit()
    print("Sucesso na tabela access_logs!")
except Exception as e:
    print(f"Erro logs: {e}")

conn.close()
