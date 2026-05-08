import time
import requests
import random
from datetime import datetime
import os

BACKEND_URL = os.getenv("BACKEND_URL", "http://eg-backend:3000")
DISTRICTS = ["Centro", "Norte", "Sur", "Occidente"]

def generate_data():
    return {
        "district_id": random.choice(DISTRICTS),
        "substation_id": f"SUB-{random.randint(1, 10):02d}",
        "consumption_kw": round(random.uniform(100.0, 5000.0), 2),
        "timestamp": datetime.now().isoformat()
    }

def run_simulator():
    print(f"[SIMULATOR] Starting telemetry stream to {BACKEND_URL}...")
    while True:
        try:
            data = generate_data()
            response = requests.post(f"{BACKEND_URL}/api/telemetry", json=data)
            
            if response.status_code == 201:
                print(f"[INFO] Data sent: {data['district_id']} - {data['consumption_kw']} kW")
            else:
                print(f"[WARNING] Backend responded with {response.status_code}")
                
        except Exception as e:
            print(f"[ERROR] Connection failed: {e}")
        
        time.sleep(5) # Enviar cada 5 segundos

if __name__ == "__main__":
    run_simulator()