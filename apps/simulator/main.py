import time
import requests
import os

BACKEND_URL = os.getenv("BACKEND_URL", "http://eg-backend:3000")

def run_simulation():
    print("Iniciando simulador de EnergyGrid...")
    while True:
        # Aquí irá la lógica de telemetría más adelante
        try:
            print(f"Ping a Backend: {BACKEND_URL}/health")
            time.sleep(10)
        except Exception as e:
            print(f"Error conectando al backend: {e}")
            time.sleep(5)

if __name__ == "__main__":
    run_simulation()