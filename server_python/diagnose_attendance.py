import sqlite3
import os
import datetime

db_path = r'c:\Users\User\Desktop\edufocus1\edufocus1-main\database\school_1.db'

if not os.path.exists(db_path):
    print(f"Erro: {db_path} não encontrado.")
    exit()

conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("--- ALUNOS ---")
try:
    students = cur.execute("SELECT id, name, face_descriptor FROM students").fetchall()
    for s in students:
        has_face = "SIM" if s[2] else "NÃO"
        print(f"ID: {s[0]} | Nome: {s[1]} | Face: {has_face}")
except Exception as e:
    print(f"Erro alunos: {e}")

print("\n--- PRESENÇA (attendance) ---")
try:
    att = cur.execute("SELECT id, student_id, timestamp, type FROM attendance ORDER BY id DESC LIMIT 10").fetchall()
    if not att:
        print("Nenhum registro encontrado na tabela 'attendance'.")
    for a in att:
        print(f"Reg ID: {a[0]} | Aluno ID: {a[1]} | Data: {a[2]} | Tipo: {a[3]}")
except Exception as e:
    print(f"Erro attendance: {e}")

print("\n--- LOGS ACESSO (access_logs) ---")
try:
    logs = cur.execute("SELECT id, student_id, event_type, timestamp, notified_guardian FROM access_logs ORDER BY id DESC LIMIT 10").fetchall()
    if not logs:
        print("Nenhum log encontrado na tabela 'access_logs'.")
    for l in logs:
        print(f"Log ID: {l[0]} | Aluno ID: {l[1]} | Tipo: {l[2]} | Data: {l[3]} | Notificado: {l[4]}")
except Exception as e:
    print(f"Erro logs: {e}")

conn.close()
