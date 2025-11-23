# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances (production uniquement)
RUN npm ci --only=production

# Production stage
FROM node:22-alpine

WORKDIR /app

# Installer git (requis pour PushGuardian)
RUN apk add --no-cache git

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S pushguardian && \
    adduser -S pushguardian -u 1001

# Copier les dépendances depuis builder
COPY --from=builder /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Installer globalement AVANT de changer d'utilisateur
RUN npm link

# Créer les répertoires nécessaires et ajuster les permissions
RUN chown -R pushguardian:pushguardian /app

# Passer à l'utilisateur non-root
USER pushguardian

# Point d'entrée
ENTRYPOINT ["pushguardian"]
CMD ["--help"]
