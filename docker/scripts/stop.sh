#!/bin/bash
# Stop script for TCE Docker services

set -e

echo "🛑 Stopping TCE Insurance Document Processor..."

docker-compose down

echo "✅ All services stopped"
echo ""
echo "💡 To remove volumes (WARNING: deletes data): docker-compose down -v"
