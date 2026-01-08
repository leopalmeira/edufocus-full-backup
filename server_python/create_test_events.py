import sqlite3
import os
from datetime import datetime, timedelta

# Caminho para o banco de dados
DB_DIR = os.path.join(os.path.dirname(__file__), '..', 'database')
SCHOOL_DB = os.path.join(DB_DIR, 'school_14.db')

print(f"🎉 Criando evento de teste em: {SCHOOL_DB}")

conn = sqlite3.connect(SCHOOL_DB)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Verificar se já existem eventos
cur.execute("SELECT COUNT(*) as count FROM events")
count = cur.fetchone()['count']
print(f"📊 Eventos existentes: {count}")

# Criar um evento de teste
event_date = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
payment_deadline = (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d')

cur.execute('''
INSERT INTO events (title, description, event_date, cost, class_name, pix_key, payment_deadline, type)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', (
    'Passeio ao Zoológico',
    'Visita educativa ao zoológico municipal. Trazer lanche e água. Saída às 8h.',
    event_date,
    25.50,
    'TURMA 701A',
    'escola@pix.com.br',
    payment_deadline,
    'trip'
))

cur.execute('''
INSERT INTO events (title, description, event_date, cost, class_name, pix_key, payment_deadline, type)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', (
    'Reunião de Pais',
    'Reunião para discutir o desempenho dos alunos no 1º bimestre.',
    (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d'),
    0,
    None,  # Geral para todas as turmas
    None,
    None,
    'event'
))

cur.execute('''
INSERT INTO events (title, description, event_date, cost, class_name, pix_key, payment_deadline, type)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', (
    'IMPORTANTE: Mudança de Horário',
    'A partir de segunda-feira, o horário de entrada será às 7h30.',
    (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d'),
    0,
    None,
    None,
    None,
    'warning'
))

conn.commit()

# Verificar eventos criados
cur.execute("SELECT * FROM events ORDER BY created_at DESC LIMIT 5")
events = cur.fetchall()

print(f"\n✅ {len(events)} eventos no banco:")
for e in events:
    print(f"  - {e['title']} ({e['type']}) - {e['event_date']}")

conn.close()
print("\n✅ Eventos de teste criados com sucesso!")
