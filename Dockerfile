FROM node:20-alpine

WORKDIR /app

COPY server.js ./
COPY public/   ./public/

EXPOSE 10004

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:10004/ > /dev/null || exit 1

CMD ["node", "server.js"]
