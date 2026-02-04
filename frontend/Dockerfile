# Build stage
FROM nginx:alpine

# Copy all HTML files
COPY *.html /usr/share/nginx/html/

# Copy CSS
COPY *.css /usr/share/nginx/html/

# Copy all JavaScript files
COPY *.js /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
