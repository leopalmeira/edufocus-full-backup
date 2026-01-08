import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.getcwd()), 'database', 'system.db')

if not os.path.exists(DB_PATH):
    print(f"Banco não encontrado: {DB_PATH}")
else:
    db = sqlite3.connect(DB_PATH)
    cur = db.cursor()
    
    # Colunas para adicionar
    columns = [
        ('address', 'TEXT'),
        ('number', 'TEXT'),
        ('zip_code', 'TEXT')
    ]
    
    for col_name, col_type in columns:
        try:
            print(f"Tentando adicionar coluna '{col_name}'...")
            cur.execute(f'ALTER TABLE schools ADD COLUMN {col_name} {col_type}')
            print(f"✅ Coluna '{col_name}' adicionada com sucesso.")
        except sqlite3.OperationalError as e:
            if 'duplicate column name' in str(e):
                print(f"ℹ️ Coluna '{col_name}' já existe.")
            else:
                print(f"❌ Erro ao adicionar coluna '{col_name}': {e}")
                
    db.commit()
    db.close()
    print("Migração concluída.")
