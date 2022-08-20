FROM node:16.16
WORKDIR /image
COPY . .
RUN npm ci
RUN npm run build