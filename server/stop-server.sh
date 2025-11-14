#!/bin/bash

echo "🔍 Recherche du serveur Node.js..."

# Méthode 1 : Chercher par port avec fuser
PID=$(fuser 8081/tcp 2>/dev/null)

# Méthode 2 : Chercher par nom de fichier
if [ -z "$PID" ]; then
  PID=$(ps aux | grep "node.*server.js" | grep -v grep | awk '{print $2}')
fi

# Méthode 3 : Chercher avec ss
if [ -z "$PID" ]; then
  PID=$(ss -tulpn 2>/dev/null | grep :8081 | grep -o 'pid=[0-9]*' | cut -d'=' -f2)
fi

if [ -z "$PID" ]; then
  echo "❌ Aucun serveur trouvé"
  exit 1
fi

echo "✅ Serveur trouvé (PID: $PID)"
echo "🛑 Arrêt du serveur..."

# Essayer d'abord SIGTERM (propre)
kill $PID 2>/dev/null

sleep 2

# Vérifier si le processus est toujours actif
if ps -p $PID > /dev/null 2>&1; then
  echo "⚠️  Arrêt forcé nécessaire (SIGKILL)..."
  kill -9 $PID 2>/dev/null
  sleep 1
fi

# Vérifier que le processus est bien arrêté
if ps -p $PID > /dev/null 2>&1; then
  echo "❌ Impossible d'arrêter le serveur"
  exit 1
else
  echo "✅ Serveur arrêté avec succès"
fi
