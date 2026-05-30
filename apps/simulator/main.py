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

# def generate_data():
#     return {
#         "district_id": random.choice(DISTRICTS),
#         "substation_id": f"SUB-{random.randint(1, 10):02d}",
#         "consumption_kw": round(random.uniform(100.0, 5000.0), 2),
#         "timestamp": datetime.now().isoformat()
#     }
def generate_data(is_chaos_active=False):
    district = random.choice(DISTRICTS)
    substation = f"SUB-{random.randint(1, 10):02d}"
    timestamp = datetime.now().isoformat()

    if is_chaos_active:
        # PICO DE DEMANDA CRÍTICO: Enviamos entre 5,500 y 8,500 kW 
        # Esto obligará a la fórmula del frontend a calcular porcentajes mayores al 95% o 100%
        consumption_kw = round(random.uniform(5500.0, 8500.0), 2)
    else:
        # FLUJO NOMINAL ESTÁNDAR
        consumption_kw = round(random.uniform(100.0, 4000.0), 2)

    return {
        "district_id": district,
        "substation_id": substation,
        "consumption_kw": consumption_kw,
        "timestamp": timestamp
    }

# def run_simulator():
#     # Limpiamos los slashes innecesarios por seguridad si la URL viene con uno al final
#     base_url = BACKEND_URL.rstrip('/')
    
#     print(f"[SIMULATOR] Starting telemetry stream to {base_url}/api/telemetry...")
    
#     while True:
#         try:
#             data = generate_data()
#             # Concatenamos de forma segura el endpoint final
#             response = requests.post(f"{base_url}/api/telemetry", json=data)
            
#             # Nota: Si tu backend devuelve 200 o 201 al guardar, ambos son válidos.
#             if response.status_code in [200, 201]:
#                 print(f"[INFO] Data sent: {data['district_id']} - {data['consumption_kw']} kW")
#             else:
#                 print(f"[WARNING] Backend responded with {response.status_code}: {response.text}")
                
#         except Exception as e:
#             print(f"[ERROR] Connection failed: {e}")
        
#         time.sleep(5) # Enviar cada 5 segundos
def run_simulator():
    base_url = BACKEND_URL.rstrip('/')
    print(f"[SIMULATOR] Starting telemetry stream to {base_url}/api/telemetry...")
    
    while True:
        sleep_time = 5.0 
        is_chaos_active = False
        
        # 1. Consultar al backend la configuración operativa planificada
        try:
            state_response = requests.get(f"{base_url}/api/system/chaos-state", timeout=2)
            if state_response.status_code == 200:
                config = state_response.json()
                is_chaos_active = config.get("isChaosActive", False)
                scheduled_time = config.get("scheduledTime") # Puede ser "HH:MM" o None

                # EXTRAER LA HORA VIRTUAL ACTUAL DE LA CIUDAD SIMULADA
                current_virtual_time = datetime.now().strftime("%H:%M")

                # VALIDACIÓN CRON BLINDADA: Comprobamos si la hora actual está contenida en el tiempo agendado
                # Esto soluciona si el frontend manda formatos con segundos extra (ej: "14:53:00")
                time_match = False
                if scheduled_time:
                    # Normalizamos limpiando espacios y comparando solo los primeros 5 caracteres (HH:MM)
                    clean_scheduled = str(scheduled_time).strip()[:5]
                    if current_virtual_time == clean_scheduled:
                        time_match = True

                if time_match and not is_chaos_active:
                    # Avisamos de forma activa al backend que la hora pico de la ciudad ha iniciado
                    print(f"[⚡ TRIGGER] ¡Hora Pico virtual alcanzada! Desatando caos a las {current_virtual_time}...")
                    requests.post(f"{base_url}/api/system/chaos", json={"action": "START_NOW"})
                    is_chaos_active = True

                if is_chaos_active:
                    sleep_time = 0.02  # Cambio inmediato a ráfaga masiva inundante
                    print(f"[🔥 CAOS EN CURSO] Hora Pico Virtual Detectada ({current_virtual_time}). Inundando BD...")
                    
        except Exception as e:
            print(f"[WARNING] No se pudo sincronizar el cronómetro del caos: {e}")

        # 2. Generar y mandar la telemetría pasando el estado del caos
        try:
            data = generate_data(is_chaos_active=is_chaos_active) 
            response = requests.post(f"{base_url}/api/telemetry", json=data, timeout=3)
            
            if response.status_code in [200, 201] and sleep_time == 5.0:
                print(f"[INFO] Data sent: {data['district_id']} - {data['consumption_kw']} kW")
        except Exception as e:
            print(f"[ERROR] Fallo al inyectar telemetría en tiempo real: {e}")
        
        time.sleep(sleep_time)

if __name__ == "__main__":
    run_simulator()