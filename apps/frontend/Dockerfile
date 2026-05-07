FROM node:20-alpine

WORKDIR /app

# Copiamos solo los archivos de dependencias primero (Optimización de capas)
COPY package*.json ./
RUN npm install

# Copiamos el resto del proyecto
COPY . .

EXPOSE 5173

# Comando para iniciar el servidor de desarrollo de Vite
CMD ["npm", "run", "dev", "--", "--host"]