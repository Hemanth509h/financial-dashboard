# ---- Build stage ----
FROM node:20.19-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Baked into the static build at build time (Vite inlines VITE_* vars)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Run stage ----
FROM node:20.19-alpine

# Install PM2 and a lightweight static file server
RUN npm install -g pm2 serve

WORKDIR /app

# Only the built assets are needed at runtime
COPY --from=build /app/dist ./dist

ENV PORT=5173

EXPOSE 5173

# Serve the built SPA (with client-side routing fallback) under PM2
CMD ["pm2-runtime", "start", "serve", "--name", "frontend", "--", "-s", "dist", "-l", "5173"]
