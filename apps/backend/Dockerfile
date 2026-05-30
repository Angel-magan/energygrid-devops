# apps/backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar manifiestos primero para aprovechar la caché de Docker
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar el resto del código fuente del backend
COPY . .

# Exponer el puerto dinámico que asigna Railway (por defecto Railway usa PORT)
EXPOSE 3000

# Comando para arrancar la aplicación
CMD ["node", "src/index.js"]