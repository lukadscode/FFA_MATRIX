#!/bin/bash

echo "🔍 Recherche du serveur sur le port 8081..."

# Trouver le PID
PID=$(netstat -tulpn 2>/dev/null | grep :8081 | awk '{print $7}' | cut -d'/' -f1)

if [ -z "$PID" ]; then
  PID=$(ss -tulpn 2>/dev/null | grep :8081 | grep -o 'pid=[0-9]*' | cut -d'=' -f2)
fi

if [ -z "$PID" ]; then
  echo "❌ Aucun serveur trouvé sur le port 8081"
  exit 1
fi

echo "✅ Serveur trouvé (PID: $PID)"
echo "🛑 Arrêt du serveur..."

kill $PID

sleep 1

# Vérifier si le processus est toujours actif
if ps -p $PID > /dev/null 2>&1; then
  echo "⚠️  Arrêt forcé nécessaire..."
  kill -9 $PID
fi

echo "✅ Serveur arrêté avec succès"
