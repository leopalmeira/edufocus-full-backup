import sqlite3
import os

# Caminho para o banco de dados da escola 14 (LEANDRO)
db_path = r'c:\Users\User\Desktop\edufocus1\edufocus1-main\database\school_14.db'

def force_event():
    if not os.path.exists(db_path):
        print(f"Erro: Banco de dados não encontrado em {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    try:
        # 1. Garantir que a tabela events tenha as colunas necessárias (força bruta migration)
        cols_needed = {
            'event_date': 'TEXT',
            'cost': 'REAL',
            'class_name': 'TEXT',
            'pix_key': 'TEXT',
            'payment_deadline': 'TEXT',
            'type': 'TEXT'
        }
        
        cur.execute("PRAGMA table_info(events)")
        existing_cols = [row[1] for row in cur.fetchall()]
        
        for col, type_ in cols_needed.items():
            if col not in existing_cols:
                print(f"Adicionando coluna {col} na tabela events...")
                cur.execute(f"ALTER TABLE events ADD COLUMN {col} {type_}")

        # 2. Inserir um evento global (Geral) para garantir que apareça para todos os responsáveis desta escola
        event_title = "Passeio ao Museu da Tecnologia"
        description = "Um passeio incrível para todos os alunos conhecerem as novas tendências tecnológicas. Levar lanche e autorização assinada."
        event_date = "2026-02-15"
        cost = 45.00
        pix_key = "financeiro@escola123.com.br"
        deadline = "2026-02-10"
        
        # Limpar eventos de teste anteriores com o mesmo nome para não duplicar no PWA
        cur.execute("DELETE FROM events WHERE title = ?", (event_title,))

        print(f"Inserindo evento: {event_title}")
        cur.execute('''
            INSERT INTO events (title, description, event_date, cost, pix_key, payment_deadline, class_name, type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (event_title, description, event_date, cost, pix_key, deadline, 'Geral', 'trip'))

        conn.commit()
        print("--- FORÇA BRUTA: Evento inserido com sucesso na school_14.db! ---")
        print("RECARREGUE A ABA DE EVENTOS NO PWA.")

    except Exception as e:
        print(f"Erro na força bruta de eventos: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    force_event()
