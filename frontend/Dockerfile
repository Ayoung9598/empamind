# Development Dockerfile for Frontend
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
# Using --ignore-scripts to skip postinstall scripts that may fail
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

