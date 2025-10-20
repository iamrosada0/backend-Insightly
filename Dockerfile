FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY --from=builder /app ./
ENV NODE_ENV=development
ENV PORT=4000
EXPOSE 4000

# Usar o comando para rodar o servidor em modo dev, com watch (ajuste conforme seu script)
CMD ["npm", "run", "start:dev"]

