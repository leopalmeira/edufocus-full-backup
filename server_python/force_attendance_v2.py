import sqlite3
import os
import glob
from datetime import datetime

# Caminho para os bancos de dados
db_dir = r'c:\Users\User\Desktop\edufocus1\edufocus1-main\database'
# Pegar TODOS os arquivos .db que comecem com school_
dbs = glob.glob(os.path.join(db_dir, 'school_*.db'))

# Usar UTC com Z para garantir compatibilidade com PWA/Dashboard
now_iso = datetime.utcnow().isoformat() + 'Z'
print(f"Hora atual (UTC): {now_iso}")

count = 0

for db in dbs:
    try:
        conn = sqlite3.connect(db)
        cur = conn.cursor()
        
        # Verificar se tem aluno Leandro (qualquer case)
        try:
            # Tentar achar tabela students
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='students'")
            if not cur.fetchone():
                continue

            students = cur.execute("SELECT id, name FROM students WHERE name LIKE '%LEANDRO%'").fetchall()
            
            for s in students:
                student_id = s[0]
                name = s[1]
                print(f"-> Inserindo presença para {name} (ID {student_id}) em {os.path.basename(db)}")
                
                # Inserir na tabela attendance
                # (Removi verificação de duplicidade por hora, melhor ter 2 do que 0 se o timestamp for lixoso)
                cur.execute("INSERT INTO attendance (student_id, timestamp, type) VALUES (?, ?, 'arrival')", (student_id, now_iso))
                print("   [OK] Tabela attendance")

                # Inserir na tabela access_logs
                cur.execute("INSERT INTO access_logs (student_id, event_type, timestamp, notified_guardian) VALUES (?, 'arrival', ?, 0)", (student_id, now_iso))
                print("   [OK] Tabela access_logs")
                
                count += 1
                
            conn.commit()
            
        except Exception as e:
            print(f"Erro ao processar {db}: {e}")
            
        conn.close()
    except Exception as e:
        print(f"Erro conexão {db}: {e}")

print(f"\n--- CONCLUÍDO: Presença registrada em {count} lugares. RECARREGUE A PÁGINA. ---")
