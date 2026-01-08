import sqlite3
import bcrypt
import os

# Caminho para o banco de dados do sistema
DB_DIR = os.path.join(os.path.dirname(__file__), '..', 'database')
SYSTEM_DB = os.path.join(DB_DIR, 'system.db')

print(f"🔧 Verificando Super Admin em: {SYSTEM_DB}")

conn = sqlite3.connect(SYSTEM_DB)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Verificar se a tabela existe
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='super_admins'")
table_exists = cur.fetchone()

if not table_exists:
    print("⚠️  Tabela super_admins não existe. Criando...")
    cur.execute('''
    CREATE TABLE super_admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )
    ''')
    conn.commit()
    print("✅ Tabela super_admins criada!")

# Verificar se o admin existe
email = 'admin@edufocus.com'
cur.execute('SELECT * FROM super_admins WHERE email = ?', (email,))
admin = cur.fetchone()

# Hash da senha
password = 'admin123'
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

if admin:
    print(f"📝 Super Admin '{email}' já existe. Atualizando senha...")
    cur.execute('UPDATE super_admins SET password = ? WHERE email = ?', (hashed, email))
    conn.commit()
    print("✅ Senha atualizada!")
else:
    print(f"➕ Criando Super Admin '{email}'...")
    cur.execute('INSERT INTO super_admins (email, password) VALUES (?, ?)', (email, hashed))
    conn.commit()
    print("✅ Super Admin criado!")

# Verificar
cur.execute('SELECT id, email FROM super_admins')
admins = cur.fetchall()
print(f"\n📊 Total de Super Admins: {len(admins)}")
for a in admins:
    print(f"  - ID: {a['id']}, Email: {a['email']}")

conn.close()
print("\n✅ Configuração concluída!")
print(f"🔑 Login: {email}")
print(f"🔑 Senha: {password}")
