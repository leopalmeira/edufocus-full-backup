import sqlite3
import os

DB_PATH = 'c:\\Users\\User\\Desktop\\edufocus1\\edufocus1-main\\server_python\\school_14.db' # ID 14 = escola123

if not os.path.exists(DB_PATH):
    print(f"Banco não encontrado: {DB_PATH}")
else:
    db = sqlite3.connect(DB_PATH)
    cur = db.cursor()
    
    # Encontrar duplicatas (mesmo title e event_date e description, manter o menor ID)
    cur.execute('''
        SELECT id, title, event_date FROM events
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM events
            GROUP BY title, event_date, description
        )
    ''')
    
    duplicates = cur.fetchall()
    
    if duplicates:
        print(f"Encontrados {len(duplicates)} eventos duplicados para remover:")
        for dup in duplicates:
            print(f"- ID {dup[0]}: {dup[1]} ({dup[2]})")
            
        cur.execute('''
            DELETE FROM events
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM events
                GROUP BY title, event_date, description
            )
        ''')
        db.commit()
        print("✅ Duplicatas removidas com sucesso!")
    else:
        print("🎉 Nenhuma duplicata encontrada.")
        
    db.close()
