import time
import requests
import random
from datetime import datetime
import os

# Dejamos la URL base limpia. 
# En local usará 'http://eg-backend:3000' (o tu localhost)
# En Railway leerá la variable de entorno que le inyectemos.
BACKEND_URL = os.getenv("BACKEND_URL", "http://eg-backend:3000")

DISTRICTS = [
    "Santa Ana",
    "Coatepeque",
    "El Congo",
    "Masahuat",
    "Metapán",
    "Santa Rosa Guachipilín",
    "Texistepeque",
    "Candelaria de la Frontera",
    "Chalchuapa",
    "El Porvenir",
    "San Antonio Pajonal",
    "San Sebastián Salitrillo",
    "Santiago de la Frontera"
]

def generate_data():
    return {
        "district_id": random.choice(DISTRICTS),
        "substation_id": f"SUB-{random.randint(1, 10):02d}",
        "consumption_kw": round(random.uniform(100.0, 5000.0), 2),
        "timestamp": datetime.now().isoformat()
    }

def run_simulator():
    # Limpiamos los slashes innecesarios por seguridad si la URL viene con uno al final
    base_url = BACKEND_URL.rstrip('/')
    
    print(f"[SIMULATOR] Starting telemetry stream to {base_url}/api/telemetry...")
    
    while True:
        try:
            data = generate_data()
            # Concatenamos de forma segura el endpoint final
            response = requests.post(f"{base_url}/api/telemetry", json=data)
            
            # Nota: Si tu backend devuelve 200 o 201 al guardar, ambos son válidos.
            if response.status_code in [200, 201]:
                print(f"[INFO] Data sent: {data['district_id']} - {data['consumption_kw']} kW")
            else:
                print(f"[WARNING] Backend responded with {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"[ERROR] Connection failed: {e}")
        
        time.sleep(5) # Enviar cada 5 segundos

if __name__ == "__main__":
    run_simulator()