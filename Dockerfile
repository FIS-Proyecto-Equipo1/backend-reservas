FROM node:14-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY *.js ./
COPY swagger.json .

EXPOSE 4041

CMD npm start