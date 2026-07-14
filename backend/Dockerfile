FROM node:20.19-alpine

# Install PM2 globally
RUN npm install -g pm2

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

# Run server.js under PM2 in no-daemon mode so the container stays foregrounded
CMD ["pm2-runtime", "start", "server.js", "--name", "backend"]
