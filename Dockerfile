FROM node:20-alpine

WORKDIR /app

# Copier les fichiers
COPY server/package*.json ./server/
COPY server/src ./server/src
COPY server/migrations ./server/migrations
COPY server/scripts ./server/scripts

# Installer les dépendances
WORKDIR /app/server
RUN npm install --production

# Exposer le port
EXPOSE 4000

# Lancer le serveur
CMD ["npm", "start"]
