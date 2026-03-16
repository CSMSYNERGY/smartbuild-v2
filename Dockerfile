# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies separately to leverage layer cache
COPY frontend/package.json frontend/package-lock.json* ./
ENV NODE_OPTIONS=--max-old-space-size=512
RUN npm install --prefer-offline --no-audit --no-fund

# Copy source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Node backend
FROM node:20-alpine AS production
WORKDIR /app

# Install backend production dependencies
COPY package.json package-lock.json* ./
ENV NODE_OPTIONS=--max-old-space-size=512
RUN npm install --omit=dev --prefer-offline --no-audit --no-fund

# Copy backend source
COPY src/ ./src/

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["node", "src/start.js"]
