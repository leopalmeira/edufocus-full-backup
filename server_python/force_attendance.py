import sqlite3
import os
import glob
from datetime import datetime

# Caminho para os bancos de dados
db_dir = r'c:\Users\User\Desktop\edufocus1\edufocus1-main\database'
dbs = glob.glob(os.path.join(db_dir, 'school_*.db'))

now_iso = datetime.now().isoformat()
print(f"Hora atual: {now_iso}")

count = 0

for db in dbs:
    try:
        conn = sqlite3.connect(db)
        cur = conn.cursor()
        
        # Verificar se tem aluno Leandro
        try:
            students = cur.execute("SELECT id, name FROM students WHERE name LIKE '%LEANDRO%'").fetchall()
            
            for s in students:
                student_id = s[0]
                name = s[1]
                print(f"-> Inserindo presença para {name} (ID {student_id}) em {os.path.basename(db)}")
                
                # Inserir na tabela attendance (para o calendário e relatório)
                # Verificar se já existe hoje para não duplicar
                has_att = cur.execute("SELECT id FROM attendance WHERE student_id = ? AND timestamp LIKE ?", (student_id, f"{now_iso[:10]}%")).fetchone()
                
                if not has_att:
                    cur.execute("INSERT INTO attendance (student_id, timestamp, type) VALUES (?, ?, 'arrival')", (student_id, now_iso))
                    print("   [OK] Tabela attendance")
                else:
                    print("   [JÁ EXISTE] Tabela attendance")

                # Inserir na tabela access_logs (para notificações)
                cur.execute("INSERT INTO access_logs (student_id, event_type, timestamp, notified_guardian) VALUES (?, 'arrival', ?, 0)", (student_id, now_iso))
                print("   [OK] Tabela access_logs")
                
                count += 1
                
            conn.commit()
            
        except Exception as e:
            # Tabela students pode não existir em alguns dbs
            pass
            
        conn.close()
    except Exception as e:
        print(f"Erro em {db}: {e}")

print(f"\n--- CONCLUÍDO: Presença registrada em {count} lugares. ---")
