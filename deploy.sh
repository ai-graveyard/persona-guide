#!/bin/bash

echo ">> Pulling latest code..."
git pull

echo ">> Building docker image..."
docker build -t persona-guide .

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