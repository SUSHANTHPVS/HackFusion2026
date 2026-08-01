FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1

CMD ["node", "server.js"]
