# =============================================================================
# EdgeTwin-BMS+ Frontend Dockerfile
# =============================================================================

# Build stage
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY frontend/ .

# Build application
RUN npm run build

# =============================================================================
# Production stage
# =============================================================================

FROM nginx:alpine as production

# Copy custom nginx configuration
COPY docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx user
RUN addgroup -g 1001 -S edgetwin && \
    adduser -S edgetwin -u 1001 -G edgetwin

# Set permissions
RUN chown -R edgetwin:edgetwin /usr/share/nginx/html && \
    chown -R edgetwin:edgetwin /var/cache/nginx && \
    chown -R edgetwin:edgetwin /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R edgetwin:edgetwin /var/run/nginx.pid

# Switch to non-root user
USER edgetwin

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
