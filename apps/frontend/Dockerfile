# NOTE: Although this Dockerfile is located in apps/backend, IT MUST BE RUN WITH THE CONTEXT OF THE REPO ROOT.
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
RUN turbo prune frontend --docker

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
# This will invoke the turbo build stage and build and packages that have dependencies. We need to mount the client ID and key
RUN --mount=type=secret,id=NK_CLIENT_ID --mount=type=secret,id=MAP_KEY export VITE_NK_CLIENT_ID=$(cat /run/secrets/NK_CLIENT_ID) && export VITE_MAP_KEY=$(cat /run/secrets/MAP_KEY) && pnpm build
# Remove all non-prod dependencies
RUN pnpm prune --prod

FROM base AS runner
RUN pnpm install serve --global
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 frontend
RUN adduser --system --uid 1001 frontend
USER frontend
COPY --from=builder /app/apps/frontend/dist .

# This container must expose said port
EXPOSE 80

# Healthceck to determine if we're actually still serving stuff, just attempt to get the URL
# If that fails, try exiting gracefully (SIGTERM), and if that fails force the container to die with SIGKILL.
# This will invoke the restart policy, allowing compose to automatically rebuild the container
HEALTHCHECK CMD wget --spider localhost:3000 || bash -c 'kill -s 15 -1 && (sleep 10; kill -s 9 -1)'

# Now, simply run the prod
CMD serve . -s