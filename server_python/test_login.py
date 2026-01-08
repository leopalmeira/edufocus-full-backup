import requests
import json

# Testar login do Super Admin
url = "http://localhost:5000/api/login"
data = {
    "email": "admin@edufocus.com",
    "password": "admin123"
}

print("🔐 Testando login do Super Admin...")
print(f"📡 URL: {url}")
print(f"📤 Dados: {json.dumps(data, indent=2)}")

try:
    response = requests.post(url, json=data)
    print(f"\n📥 Status: {response.status_code}")
    print(f"📥 Resposta: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✅ Login bem-sucedido!")
        print(f"🔑 Token: {response.json().get('token')[:50]}...")
        print(f"👤 Role: {response.json().get('role')}")
    else:
        print("\n❌ Erro no login!")
except Exception as e:
    print(f"\n❌ Erro na requisição: {e}")
