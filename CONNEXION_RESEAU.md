# Connexion Réseau - Accès Admin depuis un autre PC

## Configuration du serveur (PC principal)

### 1. Démarrer le serveur WebSocket
```bash
cd server
node server.js
```

Le serveur affichera les adresses disponibles :
```
🚀 WebSocket server running on:
   - Local: ws://localhost:8081
   - Network: ws://192.168.1.100:8081
```

**Notez l'adresse IP réseau affichée** (ex: 192.168.1.100)

### 2. Démarrer l'application React
```bash
npm run dev
```

Vite affichera :
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
```

## Configuration sur le PC Admin (autre PC)

### Option 1 : Utiliser l'application déployée

1. Ouvrez votre navigateur sur le PC admin
2. Accédez à : `http://[IP_DU_SERVEUR]:5173`
   - Exemple : `http://192.168.1.100:5173`

3. Modifiez le fichier `.env` sur le PC serveur :
   ```
   VITE_WS_HOST=192.168.1.100
   ```
   (Remplacez par l'IP réelle de votre serveur)

4. Redémarrez l'application React avec `npm run dev`

### Option 2 : Configuration dynamique (recommandé)

Si vous voulez que plusieurs PCs puissent se connecter sans modifier le code :

1. Sur le PC admin, accédez à : `http://[IP_DU_SERVEUR]:5173`
2. L'application se connectera automatiquement au serveur WebSocket

## Vérification de la connexion

### Sur le serveur
- Le serveur affichera "✅ New client connected" quand un PC se connecte
- Vous verrez les messages des actions effectuées

### Sur le PC admin
- Ouvrez la console du navigateur (F12)
- Vous devriez voir : "✅ WebSocket connected"

## Résolution des problèmes

### Impossible de se connecter

1. **Vérifier le pare-feu**
   - Windows : Autorisez les ports 5173 et 8081
   - Panneau de configuration → Pare-feu → Autoriser une application

2. **Vérifier que les deux PCs sont sur le même réseau**
   - Même réseau Wi-Fi ou même réseau local

3. **Tester la connexion**
   - Sur le PC admin, ouvrez : `http://[IP_SERVEUR]:5173`
   - Si la page se charge, le serveur web fonctionne
   - Si l'application ne réagit pas, c'est le WebSocket (port 8081)

4. **Vérifier l'IP du serveur**
   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   ```
   Cherchez l'adresse IPv4 (ex: 192.168.1.100)

## Ports utilisés

- **5173** : Application React (Vite)
- **8081** : Serveur WebSocket (base de données locale)
- **443** : ERGRACE WebSocket (données PM5)

## Configuration du pare-feu Windows

```powershell
# Autoriser le port 5173 (React)
netsh advfirewall firewall add rule name="Cadence Race - React" dir=in action=allow protocol=TCP localport=5173

# Autoriser le port 8081 (WebSocket)
netsh advfirewall firewall add rule name="Cadence Race - WebSocket" dir=in action=allow protocol=TCP localport=8081
```

## Utilisation typique

### PC Principal (Écran de course)
- Affiche la course en temps réel
- Connecté à ERGRACE (port 443)
- URL : `http://localhost:5173/race/[race-id]`

### PC Admin (Contrôle)
- Permet de modifier la cadence en direct
- Pas besoin de connexion ERGRACE
- URL : `http://[IP_SERVEUR]:5173/admin/[race-id]`

Les deux PCs partagent la même base de données SQLite via le serveur WebSocket.
