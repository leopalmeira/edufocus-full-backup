import sqlite3
import os
import glob

db_dir = r'c:\Users\User\Desktop\edufocus1\edufocus1-main\database'
dbs = glob.glob(os.path.join(db_dir, 'school_*.db'))

print(f"Bancos encontrados: {len(dbs)}")

found = False
for db in dbs:
    try:
        conn = sqlite3.connect(db)
        cur = conn.cursor()
        # Verificar se tabela students existe
        try:
            res = cur.execute("SELECT id, name FROM students WHERE name LIKE '%LEANDRO%'").fetchall()
            if res:
                print(f"ACHEI EM: {os.path.basename(db)}")
                for r in res:
                    print(f"  - Aluno: {r}")
                
                # Ver logs desse banco
                try:
                    logs = cur.execute("SELECT * FROM access_logs ORDER BY id DESC LIMIT 5").fetchall()
                    print(f"  Últimos Logs: {logs}")
                except:
                    print("  Sem tabela logs")
                found = True
        except:
            pass # Tabela students nao existe neste db
        conn.close()
    except Exception as e:
        print(f"Erro em {db}: {e}")

if not found:
    print("ALUNO NÃO ENCONTRADO EM NENHUM BANCO.")
