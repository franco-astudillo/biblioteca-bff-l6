FROM node:24-alpine AS compilacion

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS produccion

WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=compilacion /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
