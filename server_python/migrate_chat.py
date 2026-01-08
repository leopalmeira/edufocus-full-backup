import sqlite3
import os

# Caminho para o banco de dados
DB_DIR = os.path.join(os.path.dirname(__file__), '..', 'database')
SCHOOL_DB = os.path.join(DB_DIR, 'school_14.db')

print(f"🔧 Migrando banco de dados: {SCHOOL_DB}")

conn = sqlite3.connect(SCHOOL_DB)
cur = conn.cursor()

# Criar tabela chat_messages se não existir
cur.execute('''
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    school_id INTEGER,
    sender_type TEXT, 
    sender_id INTEGER,
    message_type TEXT DEFAULT 'text',
    content TEXT,
    file_url TEXT,
    file_name TEXT,
    read INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id)
)
''')

# Verificar se a tabela foi criada
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_messages'")
result = cur.fetchone()

if result:
    print("✅ Tabela chat_messages criada/verificada com sucesso!")
    
    # Contar mensagens existentes
    cur.execute("SELECT COUNT(*) FROM chat_messages")
    count = cur.fetchone()[0]
    print(f"📊 Total de mensagens no banco: {count}")
else:
    print("❌ Erro: Tabela chat_messages não foi criada!")

conn.commit()
conn.close()

print("✅ Migração concluída!")
