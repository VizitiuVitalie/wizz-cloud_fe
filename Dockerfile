# Stage 1: Development
FROM node:18 AS development

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install nodemon --save-dev

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev:nodemon"]

# Stage 2: Production
FROM node:18 AS production

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]