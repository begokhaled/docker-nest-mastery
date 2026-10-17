# ==============================================================================
# MULTI-STAGE DOCKERFILE FOR NESTJS
# ==============================================================================
# Stages:
#   1. base        -> Common base image with Node.js & security tools
#   2. development -> Local dev environment with nodemon, devDeps & debug port
#   3. build       -> Compiles TypeScript into optimized JavaScript in /dist
#   4. production  -> Lean, unprivileged container running only compiled JS
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: BASE
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base

# Install dumb-init to properly handle PID 1 signal forwarding (SIGTERM / SIGINT)
RUN apk add --no-cache dumb-init

WORKDIR /usr/src/app

# Set default Node environment
ENV NODE_ENV=development

# ------------------------------------------------------------------------------
# STAGE 2: DEVELOPMENT (For local hot-reload with nodemon)
# ------------------------------------------------------------------------------
FROM base AS development

# Copy package manifests first to leverage Docker layer caching
COPY package*.json tsconfig*.json nest-cli.json nodemon.json ./

# Install ALL dependencies (including devDependencies like nodemon, ts-node, etc.)
RUN npm install

# Copy source code (In docker-compose, this will also be bind-mounted for live reload)
COPY src ./src

# Expose NestJS application port (3000) and Node.js inspector port (9229)
EXPOSE 3000 9229

# Start application using nodemon for automatic restarts on code change
CMD ["dumb-init", "npm", "run", "start:nodemon"]

# ------------------------------------------------------------------------------
# STAGE 3: BUILD (Compiles TypeScript and preps production dependencies)
# ------------------------------------------------------------------------------
FROM base AS build

# Copy package manifests
COPY package*.json tsconfig*.json nest-cli.json ./

# Clean install all dependencies for reliable builds
RUN npm install

# Copy source code to compile
COPY src ./src

# Compile TypeScript to JavaScript in /usr/src/app/dist
RUN npm run build

# Prune development dependencies to keep production footprint minimal
RUN npm prune --omit=dev

# ------------------------------------------------------------------------------
# STAGE 4: PRODUCTION (Minimal, hardened image for cloud / AWS / ECS)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling in production
RUN apk add --no-cache dumb-init curl

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Security best practice: Run container as non-root 'node' user provided by Alpine
USER node

# Copy only the pruned node_modules from the build stage
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules

# Copy only the compiled JavaScript from the build stage
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

# Copy package.json for metadata / versioning
COPY --chown=node:node package.json ./

# Expose internal application port
EXPOSE 3000

# Docker Healthcheck to verify the application is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Launch the compiled NestJS application via dumb-init
CMD ["dumb-init", "node", "dist/main.js"]
