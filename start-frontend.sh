#!/bin/bash

# Quick start script for frontend development

echo "🚀 Starting EmpaMind Frontend..."
echo ""
echo "Choose an option:"
echo "1. Start with Docker (recommended)"
echo "2. Start without Docker (requires Node.js)"
echo ""
read -p "Enter choice (1 or 2): " choice

case $choice in
  1)
    echo "🐳 Starting with Docker..."
    docker-compose up frontend
    ;;
  2)
    echo "📦 Starting without Docker..."
    cd frontend
    if [ ! -d "node_modules" ]; then
      echo "Installing dependencies..."
      npm install
    fi
    npm run dev
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

