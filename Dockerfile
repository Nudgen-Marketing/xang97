# Stage 1: Install dependencies
FROM node:24-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies with the project's Yarn v1 lockfile.
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# Stage 2: Rebuild the source code only when needed
FROM node:24-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set up build arguments for client-side environment variables
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_GOOGLE_MAP_ID
ARG NEXT_PUBLIC_GOOGLE_MAP_LANGUAGE
ARG NEXT_PUBLIC_GOOGLE_MAP_REGION
ARG NEXT_PUBLIC_MAP_ISSUE_URL
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID

# Expose build arguments as environment variables for Next.js build
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_GOOGLE_MAP_ID=$NEXT_PUBLIC_GOOGLE_MAP_ID
ENV NEXT_PUBLIC_GOOGLE_MAP_LANGUAGE=$NEXT_PUBLIC_GOOGLE_MAP_LANGUAGE
ENV NEXT_PUBLIC_GOOGLE_MAP_REGION=$NEXT_PUBLIC_GOOGLE_MAP_REGION
ENV NEXT_PUBLIC_MAP_ISSUE_URL=$NEXT_PUBLIC_MAP_ISSUE_URL
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID


# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js app
RUN yarn build && mkdir -p public

# Stage 3: Runner stage
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next \
  && chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost or 0.0.0.0
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]
