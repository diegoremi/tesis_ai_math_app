# Frontend Dockerfile (for local development with Docker Compose)
FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Dev server command (for docker-compose)
CMD ["npm", "run", "dev"]
