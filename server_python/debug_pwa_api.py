import requests
import json
from datetime import datetime

base_url = 'http://localhost:5000/api'
email = 'leandro2703palmeira@gmail.com'
password = '123' # Tentar 123 ou 123456

# Tentar login
print(f"Tentando login com {email}...")
# A rota de login de guardian é /guardian/login? Não, /auth/login-guardian ?
# Vou checar guardian.py... rota /api/guardian/login
res = requests.post(f"{base_url}/guardian/login", json={'email': email, 'password': '123'})
if res.status_code != 200:
    res = requests.post(f"{base_url}/guardian/login", json={'email': email, 'password': '123456'})

if res.status_code != 200:
    print(f"Erro login: {res.text}")
    exit()

token = res.json()['data']['token']
headers = {'Authorization': f'Bearer {token}'}
print("Login OK. Token obtido.")

# Buscar presença
# Rota: /guardian/student-attendance?studentId=7&schoolId=14&month=2026-01
print("Buscando presença...")
res = requests.get(f"{base_url}/guardian/student-attendance?studentId=7&schoolId=14&month=2026-01", headers=headers)

if res.status_code == 200:
    data = res.json()
    print("DADOS RECEBIDOS:")
    print(json.dumps(data, indent=2))
else:
    print(f"ERRO API: {res.status_code} - {res.text}")
