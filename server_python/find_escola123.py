import sqlite3
import os

# Caminho para o banco de dados do sistema
DB_DIR = os.path.join(os.path.dirname(__file__), '..', 'database')
SYSTEM_DB = os.path.join(DB_DIR, 'system.db')

print(f"🔍 Procurando escola 'escola123' em: {SYSTEM_DB}")

conn = sqlite3.connect(SYSTEM_DB)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Buscar escola
cur.execute("SELECT * FROM schools WHERE email LIKE '%escola123%' OR name LIKE '%escola123%'")
school = cur.fetchone()

if school:
    print(f"\n✅ Escola encontrada:")
    print(f"  - ID: {school['id']}")
    print(f"  - Nome: {school['name']}")
    print(f"  - Email: {school['email']}")
    print(f"  - Admin: {school['admin_name']}")
    
    school_id = school['id']
    
    # Verificar banco de dados da escola
    school_db_path = os.path.join(DB_DIR, f'school_{school_id}.db')
    print(f"\n📂 Banco da escola: {school_db_path}")
    print(f"   Existe: {os.path.exists(school_db_path)}")
    
    if os.path.exists(school_db_path):
        school_conn = sqlite3.connect(school_db_path)
        school_conn.row_factory = sqlite3.Row
        school_cur = school_conn.cursor()
        
        # Contar alunos
        school_cur.execute("SELECT COUNT(*) as count FROM students")
        students_count = school_cur.fetchone()['count']
        print(f"   Alunos: {students_count}")
        
        # Contar eventos
        school_cur.execute("SELECT COUNT(*) as count FROM events")
        events_count = school_cur.fetchone()['count']
        print(f"   Eventos: {events_count}")
        
        # Listar alguns alunos
        school_cur.execute("SELECT id, name, class_name FROM students LIMIT 5")
        students = school_cur.fetchall()
        print(f"\n📚 Alunos cadastrados:")
        for s in students:
            print(f"  - ID {s['id']}: {s['name']} (Turma: {s['class_name']})")
        
        school_conn.close()
else:
    print("\n❌ Escola 'escola123' não encontrada!")
    print("\n📋 Escolas disponíveis:")
    cur.execute("SELECT id, name, email FROM schools")
    schools = cur.fetchall()
    for s in schools:
        print(f"  - ID {s['id']}: {s['name']} ({s['email']})")

conn.close()
