import sqlite3
import os

system_db = r'c:\Users\User\Desktop\edufocus1\edufocus1-main\database\system.db'
conn = sqlite3.connect(system_db)
cur = conn.cursor()

email = 'leandro2703palmeira@gmail.com'
user = cur.execute("SELECT id, name FROM guardians WHERE email = ?", (email,)).fetchone()

if user:
    print(f"Guardian: {user}")
    links = cur.execute("SELECT student_id, school_id FROM guardian_students WHERE guardian_id = ?", (user[0],)).fetchall()
    if not links:
        print("  -> Sem alunos vinculados.")
    for l in links:
        print(f"  -> Link: Aluno ID {l[0]} na Escola ID {l[1]}")
        
        # Verificar nome da escola
        school = cur.execute("SELECT name FROM schools WHERE id = ?", (l[1],)).fetchone()
        school_name = school[0] if school else "Desconhecida"
        print(f"     Nome da Escola (no sistemas): {school_name}")

else:
    print(f"Guardian {email} não encontrado no system.db.")

conn.close()
