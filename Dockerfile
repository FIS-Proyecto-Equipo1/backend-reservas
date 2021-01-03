FROM node:9-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY *.js ./

EXPOSE 4041

CMD npm start