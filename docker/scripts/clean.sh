#!/bin/bash
# Clean up Docker resources for TCE project

set -e

echo "🧹 Cleaning up Docker resources..."

# Stop services
echo "Stopping services..."
docker-compose down

# Remove volumes (optional)
read -p "Remove volumes (deletes data)? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose down -v
    echo "✅ Volumes removed"
fi

# Clean up unused Docker resources
read -p "Clean up unused Docker images/containers? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker system prune -a
    echo "✅ Docker system cleaned"
fi

echo "✅ Cleanup complete"
