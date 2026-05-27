# apps/auth-service/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiamos los manifiestos de paquetes primero
COPY package*.json ./

# Instalamos únicamente las dependencias de producción (--only=production)
# Esto reduce el tamaño de la imagen significativamente y acelera el build
RUN npm ci --only=production

# Copiamos el resto del código del servicio de autenticación
COPY . .

# Comando por defecto para iniciar tu servicio leyendo el index.js modificado
CMD ["node", "src/index.js"]
