#!/bin/bash

echo ">> Pulling latest code..."
git pull

echo ">> Building docker image..."
INVITE_BUILD_ARGS=()
if [ -f .env ]; then
  INVITE_LINE="$(grep -E '^INVITE_CODE=' .env | head -1 || true)"
  if [ -n "${INVITE_LINE}" ]; then
    INVITE_VAL="${INVITE_LINE#INVITE_CODE=}"
    INVITE_VAL="${INVITE_VAL%\"}"
    INVITE_VAL="${INVITE_VAL#\"}"
    INVITE_VAL="${INVITE_VAL%\'}"
    INVITE_VAL="${INVITE_VAL#\'}"
    INVITE_BUILD_ARGS+=(--build-arg "INVITE_CODE=${INVITE_VAL}")
  fi
fi
docker build "${INVITE_BUILD_ARGS[@]}" -t persona-guide .

echo ">> Stopping and removing old container..."
docker rm -f persona-guide

echo ">> Ensuring storage directory exists..."
mkdir -p storage

echo ">> Starting new container..."
docker run -d --restart=always --name persona-guide \
  -p 3300:3000 \
  -v $PWD/.env:/app/.env \
  -v $PWD/storage:/app/storage \
  persona-guide

echo ">> Showing logs..."
docker logs -f persona-guide

echo ">> Done!"