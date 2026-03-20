# Serve static files with nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy app files into the nginx web root
COPY index.html /usr/share/nginx/html/
COPY css/       /usr/share/nginx/html/css/
COPY js/        /usr/share/nginx/html/js/

# Expose HTTP port
EXPOSE 80

# nginx starts automatically as the container's default command
