# Servidor de Análise Facial e Gestos (CVZone Edition)
import cv2
import threading
import time
from datetime import datetime
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import sys
import os
import site

# Força Python a ver o site-packages do usuário (onde CVZone e MP estão)
try:
    sys.path.append(site.getusersitepackages())
except: pass

# Importação CVZone (Wrapper mais amigável que lida com MediaPipe internamente)
CVZONE_AVAILABLE = False
try:
    from cvzone.HandTrackingModule import HandDetector
    CVZONE_AVAILABLE = True
    print("✅ CVZone carregado com sucesso!")
except ImportError:
    print("⚠️ CVZone não encontrado. Tentando instalar ou usar fallback.")

app = Flask(__name__)
CORS(app)

ANALYSIS_THREADS = {}
PROCESSED_FRAMES = {}

def analyze_stream(room_id, camera_url, school_id):
    # Setup da Câmera
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW) # Tenta DSHOW primeiro
    if not cap.isOpened(): cap = cv2.VideoCapture(0)
    
    # Detector do CVZone (Muito mais simples e robusto visualmente)
    detector = None
    if CVZONE_AVAILABLE:
        try:
            detector = HandDetector(detectionCon=0.5, maxHands=2)
        except: pass # Se falhar init do MP
    
    # Face Cascade (Nativo)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    while room_id in ANALYSIS_THREADS:
        success, img = cap.read()
        if not success:
            time.sleep(1)
            continue
            
        # Espelhar apenas para visualização
        img = cv2.flip(img, 1) 
        h, w, _ = img.shape

        # 1. Mãos (CVZone faz todo o trabalho duro e desenho)
        responses = {}
        if detector:
            try:
                # O detector já desenha tudo bonito (esqueleto, box) se draw=True
                hands, img = detector.findHands(img, draw=True, flipType=False) 
                
                if hands:
                    for hand in hands:
                        lmList = hand["lmList"]  # Lista de 21 landmarks
                        bbox = hand["bbox"]      # x,y,w,h da bbox
                        center = hand["center"]  # cx, cy
                        handType = hand["type"]  # "Left" ou "Right"
                        
                        # Contar dedos
                        fingers = detector.fingersUp(hand)
                        count = fingers.count(1)
                        
                        # Desenhar INFO EXTRA (Estilo Repo)
                        # Retângulo Azul no topo da mão
                        x, y, w_box, h_box = bbox
                        cv2.rectangle(img, (x, y - 60), (x + w_box, y), (255, 0, 0), cv2.FILLED)
                        cv2.putText(img, f"{handType} | Dedos: {count}", (x + 5, y - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                        
                        responses[f"hand_{count}"] = count
            except Exception as e:
                print(f"Erro CVZ: {e}")
        else:
             cv2.putText(img, "IA STARTING...", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,255), 2)

        # 2. Rostos (Nativo para garantir)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        for (x, y, fw, fh) in faces:
            cv2.rectangle(img, (x, y), (x+fw, y+fh), (0, 255, 255), 2)
            cv2.putText(img, "ALUNO", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)

        # Encode
        ret, buffer = cv2.imencode('.jpg', img)
        if ret: PROCESSED_FRAMES[room_id] = buffer.tobytes()
        
    cap.release()

@app.route('/health')
def health(): return jsonify({'status': 'ok'})

@app.route('/api/analysis/video/<int:room_id>')
def video_feed(room_id):
    def gen():
        while True:
            frame = PROCESSED_FRAMES.get(room_id, b'')
            if frame: yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            time.sleep(0.04)
    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/analysis/start', methods=['POST'])
def start():
    data = request.json
    rid = data.get('room_id')
    if rid not in ANALYSIS_THREADS:
        t = threading.Thread(target=analyze_stream, args=(rid, None, None))
        t.daemon = True
        t.start()
        ANALYSIS_THREADS[rid] = t
    return jsonify({'status': 'ok'})

@app.route('/api/analysis/stop', methods=['POST'])
def stop():
    rid = request.json.get('room_id')
    if rid in ANALYSIS_THREADS: del ANALYSIS_THREADS[rid]
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("🚀 Servidor CVZone (Super Simples) na porta 5001")
    app.run(host='0.0.0.0', port=5001, threaded=True)
