# Stage 1: Build Vue.js app
FROM node:14-alpine as build-stage

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Set up Flask and R environment
FROM continuumio/miniconda3 as final-stage

# Install R
RUN apt-get update && apt-get install -y r-base && rm -rf /var/lib/apt/lists/*

# Set up Flask environment
WORKDIR /app

RUN pip install flask

COPY backend/r ./backend/r
COPY backend/py ./backend.py


# Copy built frontend from stage 1
COPY --from=build-stage /app/frontend/dist ./frontend/dist

# Set environment variables for Flask
ENV FLASK_APP=backend.py/app.py

EXPOSE 5000

# Command to run Flask server
CMD ["flask", "run", "--host=0.0.0.0"]