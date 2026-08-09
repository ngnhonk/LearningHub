# Base stage with pnpm setup
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Production dependencies stage
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
# Install only production dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile 

# Build stage - install all dependencies and build
FROM base AS build
COPY package.json pnpm-lock.yaml ./
# Install all dependencies (including dev dependencies)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile 
COPY . .
RUN pnpm run build

# Final stage - combine production dependencies and build output
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

RUN mkdir -p /app/src/uploads/avatars /app/src/uploads/templates && chown -R node:node /app

# Use the node user from the image
USER node

# Expose port 8080
EXPOSE 8080

# Start the server
CMD ["node", "dist/index.js"]

