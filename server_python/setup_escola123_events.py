import sqlite3
import os
from datetime import datetime, timedelta

# Caminho para o banco de dados da escola123
DB_DIR = os.path.join(os.path.dirname(__file__), '..', 'database')
SCHOOL_DB = os.path.join(DB_DIR, 'school_14.db')

print(f"🎉 Criando eventos para escola123 (Turma 701A)")

conn = sqlite3.connect(SCHOOL_DB)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Limpar eventos antigos
cur.execute("DELETE FROM events")
print("🗑️  Eventos antigos removidos")

# Criar eventos específicos para a Turma 701A
events_data = [
    {
        'title': 'Passeio ao Zoológico',
        'description': 'Visita educativa ao zoológico municipal. Trazer lanche, água e protetor solar. Saída às 8h da manhã.',
        'days': 7,
        'cost': 25.50,
        'class_name': 'Turma 701A',
        'pix_key': 'escola123@pix.com.br',
        'payment_days': 3,
        'type': 'trip'
    },
    {
        'title': 'Reunião de Pais - 1º Bimestre',
        'description': 'Reunião para discutir o desempenho dos alunos e apresentar o planejamento do próximo bimestre. Presença obrigatória.',
        'days': 5,
        'cost': 0,
        'class_name': None,  # Geral
        'pix_key': None,
        'payment_days': None,
        'type': 'event'
    },
    {
        'title': 'IMPORTANTE: Mudança de Horário',
        'description': 'A partir de segunda-feira (13/01), o horário de entrada será às 7h30 e saída às 12h30.',
        'days': 2,
        'cost': 0,
        'class_name': None,  # Geral
        'pix_key': None,
        'payment_days': None,
        'type': 'warning'
    },
    {
        'title': 'Feira de Ciências',
        'description': 'Apresentação dos projetos de ciências desenvolvidos pelos alunos. Convidamos todos os pais!',
        'days': 10,
        'cost': 0,
        'class_name': 'Turma 701A',
        'pix_key': None,
        'payment_days': None,
        'type': 'event'
    },
    {
        'title': 'Material Escolar - 2º Bimestre',
        'description': 'Lista de materiais necessários para o próximo bimestre: 2 cadernos, 1 estojo completo, lápis de cor.',
        'days': 15,
        'cost': 0,
        'class_name': 'Turma 701A',
        'pix_key': None,
        'payment_days': None,
        'type': 'warning'
    }
]

for event in events_data:
    event_date = (datetime.now() + timedelta(days=event['days'])).strftime('%Y-%m-%d')
    payment_deadline = (datetime.now() + timedelta(days=event['payment_days'])).strftime('%Y-%m-%d') if event['payment_days'] else None
    
    cur.execute('''
    INSERT INTO events (title, description, event_date, cost, class_name, pix_key, payment_deadline, type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        event['title'],
        event['description'],
        event_date,
        event['cost'],
        event['class_name'],
        event['pix_key'],
        payment_deadline,
        event['type']
    ))
    print(f"✅ Criado: {event['title']} ({event['type']})")

conn.commit()

# Verificar eventos criados
cur.execute("SELECT * FROM events ORDER BY event_date ASC")
events = cur.fetchall()

print(f"\n📊 Total de {len(events)} eventos criados:")
for e in events:
    turma = e['class_name'] or 'Todas as turmas'
    print(f"  - {e['title']} | {e['type']} | {e['event_date']} | {turma}")

conn.close()
print("\n✅ Eventos criados com sucesso para escola123!")
print("🔄 Agora recarregue o PWA para ver os eventos!")
