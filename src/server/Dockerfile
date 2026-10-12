FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src/server ./src/server
EXPOSE 5000
CMD ["node", "src/server/index.js"]