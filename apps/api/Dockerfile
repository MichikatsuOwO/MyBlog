FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/content/package.json packages/content/package.json
RUN npm install
COPY apps/api apps/api
COPY packages/content packages/content
RUN npm run build -w @paperlane/content && npm run build -w @paperlane/api
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/api/dist dist
COPY --from=build /app/packages/content /app/packages/content
ENV PORT=8787
CMD ["node", "dist/index.js"]
