import requests
import json

def test_events():
    base_url = "http://localhost:5000/api"
    email = "leandro2703palmeira@gmail.com"
    password = "123" # Tentei no passo 868 e funcionou com login OK.
    
    # 1. Login
    login_url = f"{base_url}/guardian/login"
    res = requests.post(login_url, json={'email': email, 'password': password})
    if res.status_code != 200:
        res = requests.post(login_url, json={'email': email, 'password': '123456'})
    
    if res.status_code != 200:
        print(f"Erro login: {res.text}")
        return
        
    token = res.json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # 2. Testar eventos
    events_url = f"{base_url}/guardian/school-events"
    print(f"Testando GET {events_url}...")
    try:
        res_events = requests.get(events_url, headers=headers, timeout=10)
        print(f"Status: {res_events.status_code}")
        if res_events.status_code == 200:
            print("Eventos encontrados:")
            print(json.dumps(res_events.json(), indent=2))
        else:
            print(f"Erro: {res_events.text}")
    except Exception as e:
        print(f"Exceção: {e}")

if __name__ == "__main__":
    test_events()
