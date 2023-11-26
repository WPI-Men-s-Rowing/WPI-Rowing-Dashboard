# NOTE: Although this Dockerfile is located in packages/database, IT MUST BE RUN WITH THE CONTEXT OF THE REPO ROOT.
FROM node:18-alpine AS base
# Set various PNPM variables, so we can take advantage of the cache layer
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage to reduce to enable us to cache pckage.json files for deps
FROM base AS reducer
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN apk update

# Set working directory
WORKDIR /app
RUN pnpm i turbo --global
COPY . .
RUN turbo prune database --docker

# Install packages based on the reduced inputs from the reducer
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=reducer /app/out/json/ .

# Install with PNPM, take advantage of being able to mount the pnpm store from the host
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build the project and its dependencies
COPY --from=reducer /app/out/full/ .

# Now use pnpm to build a reduced
FROM installer AS builder
# This will invoke the turbo build stage and build and packages that have dependencies
RUN pnpm build

FROM base AS runner
WORKDIR /app

# Copy the build output
COPY --from=builder /app .

# Now go to the backend app and run everything
WORKDIR /app/packages/database

# Set the mode to production
ENV NODE_ENV=production

# Now, simply ensure the DB is up to date and push
CMD export DATABASE_URL=postgres://$(cat /run/secrets/DB_USERNAME):$(cat /run/secrets/DB_PASSWORD)@${DB_URL}:${DB_PORT}/$(cat /run/secrets/DB_NAME) && pnpm prisma migrate deploy