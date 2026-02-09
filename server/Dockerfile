FROM node:20-alpine

WORKDIR /usr/src/app

# install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --production || npm install --production

# copy app
COPY . .

EXPOSE 4000

CMD ["npm", "start"]
