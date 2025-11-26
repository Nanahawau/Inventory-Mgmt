# Install deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build app (enable standalone output)
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# If you don’t already set `output: 'standalone'` in next.config.mjs, you can do:
# RUN printf "\nexport default { output: 'standalone' }\n" >> next.config.mjs
RUN npm run build

# Run local server (copy standalone server + static files)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=local
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the minimal standalone server produced by Next
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3001
CMD ["node", "server.js"]