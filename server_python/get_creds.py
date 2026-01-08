import sqlite3
sys_db = r'c:\Users\User\Desktop\edufocus1\edufocus1-main\database\system.db'
conn = sqlite3.connect(sys_db)
s14 = conn.execute("SELECT name, email, password FROM schools WHERE id=14").fetchone()
s18 = conn.execute("SELECT name, email, password FROM schools WHERE id=18").fetchone()
print(f"Escola 14 ({s14[0]}): {s14[1]} / {s14[2]}")
if s18:
    print(f"Escola 18 ({s18[0]}): {s18[1]} / {s18[2]}")
else:
    print("Escola 18 não encontrada")
conn.close()
