FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build # run the "build" package script
EXPOSE 3000
WORKDIR /app/build
CMD ["node","index.js"]