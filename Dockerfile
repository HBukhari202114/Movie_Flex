FROM node:22-slim

WORKDIR /app

# Install dependencies first for Docker caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy all project files
COPY . .

# Create the persistence directory inside the container
RUN mkdir -p /data

# Expose the app port
EXPOSE 5000

# Environment variables
ENV PORT=5000
ENV DATA_DIR=/data
ENV NODE_ENV=production

# Run the app
CMD ["node", "server.js"]
