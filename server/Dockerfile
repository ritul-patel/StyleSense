# ─────────────────────────────────────────────────────────
# StyleSense Backend — Production Dockerfile
# Target: Koyeb (Docker deployment)
# Also compatible with: Fly.io, Railway Docker, GCP Cloud Run
# ─────────────────────────────────────────────────────────

# Stage 1: Build TypeScript
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies (uses lockfile for reproducibility)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Production runtime
FROM node:20-slim AS runtime

WORKDIR /app

# Install Python 3 + OpenCV system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
  && rm -rf /var/lib/apt/lists/*

# Install Python packages (only what detect.py actually uses)
RUN pip3 install --no-cache-dir --break-system-packages \
    numpy \
    opencv-python-headless

# Install production Node.js dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# sharp needs platform-specific binaries — install separately
RUN npm rebuild sharp

# Copy built JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Copy Python detector script
COPY python/ ./python/

# Create uploads directory (used by multer for temp files)
RUN mkdir -p uploads

# Koyeb injects PORT env var at runtime
ENV NODE_ENV=production
ENV PYTHON_BIN=python3
EXPOSE 8000

# Health check for container orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 8000) + '/health').then(r => { if(!r.ok) process.exit(1) }).catch(() => process.exit(1))"

# Start server — Koyeb provides PORT via environment
CMD ["node", "dist/index.js"]
