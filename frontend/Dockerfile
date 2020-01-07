FROM node:10-slim

# Change working directory
WORKDIR /app

# Install npm production packages
COPY package.json /app/
RUN cd /app; npm install --silent
COPY . /app
RUN npm run build;

ENV PORT 3000

EXPOSE 3000

CMD ["npm", "start"]