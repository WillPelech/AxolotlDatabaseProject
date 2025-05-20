# Step 1: Use an official Node image to build the app
FROM node:20 AS builder

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Step 2: Use an Nginx server to serve the build output
FROM nginx:stable-alpine

# Copy the build output to the Nginx HTML folder
COPY --from=builder /app/build /usr/share/nginx/html

# Copy a custom Nginx config (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start Nginx when the container runs
CMD ["nginx", "-g", "daemon off;"]
