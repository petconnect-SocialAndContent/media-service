# Etapa 1: Build con dependencias de producción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json y lock
COPY package*.json ./

# Instalar solo dependencias necesarias
RUN npm install --only=production

# Copiar el resto del código fuente
COPY . .

# Etapa 2: Imagen final liviana
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app /app

# Expón el puerto si usas Express (puedes cambiarlo si usas otro)
EXPOSE 3008

CMD ["node", "src/app.js"]

