# 🚣 Application de Course d'Aviron - Mode Hors Ligne

Application de gestion de courses d'aviron avec synchronisation temps réel en local via WebSocket (sans BDD) + intégration complète ErgRace.

## 📋 Guides et Documentation

- **[GUIDE_UTILISATION.md](./GUIDE_UTILISATION.md)** - Guide complet d'utilisation de A à Z
- **[ERGRACE_INTEGRATION.md](./ERGRACE_INTEGRATION.md)** - Documentation technique d'intégration ErgRace

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + WebSocket (ws) - Sync local uniquement
- **Stockage**: sessionStorage (pas de BDD, données en session)
- **Synchronisation**: WebSocket pour communication temps réel entre appareils
- **Intégration ErgRace**: Connexion directe au port 443 (tous les participants)

## 🌐 Fonctionnement 100% Local

Cette application fonctionne **sans connexion internet et sans base de données** grâce à :
- 🚫 **Aucune BDD** : Données stockées en sessionStorage
- 🔄 **Serveur WebSocket local** : Synchronisation multi-appareils (port 8080)
- 📡 **Connexion ErgRace unique** : Port 443 pour tous les participants
- 📱 **Multi-appareils** : Contrôlez depuis tablette/téléphone sur le même WiFi

## 📦 Installation

### 1. Installer les dépendances du frontend

```bash
npm install
```

### 2. Installer les dépendances du serveur

```bash
cd server
npm install
```

## 🚀 Démarrage Rapide

### 1. Lancer le serveur WebSocket

Dans un premier terminal :

```bash
cd server
npm start
```

✅ Le serveur démarre sur `ws://localhost:8080`

### 2. Lancer ErgRace (optionnel mais recommandé)

- Lancez ErgRace sur votre machine
- Configurez les PM5 connectés
- Les WebSockets ErgRace seront automatiquement sur les ports 443, 444, 445, etc.

### 3. Lancer l'application frontend

Dans un second terminal (depuis la racine du projet) :

```bash
npm run dev
```

✅ L'application sera accessible sur `http://localhost:5173`

### 4. Vérifier la connexion ErgRace

1. Allez sur `http://localhost:5173`
2. Cliquez sur le bouton **"LOGS"** (icône Radio)
3. Vous verrez l'état des connexions ErgRace en temps réel

## 🖥️ Utilisation Multi-Écrans

Pour utiliser l'application sur plusieurs écrans (admin, course, résultats) :

1. **Assurez-vous que tous les appareils sont sur le même réseau local**
2. **Lancez le serveur WebSocket sur une machine** (ex: `192.168.1.10`)
3. **Sur chaque appareil**, ouvrez l'application et les écrans se synchroniseront automatiquement

### Configuration pour réseau local

Si vous voulez accéder au serveur depuis d'autres appareils :

1. Trouvez l'adresse IP de la machine serveur :
   ```bash
   # Linux/Mac
   ifconfig
   # Windows
   ipconfig
   ```

2. Modifiez `src/lib/websocket.ts` ligne 39 :
   ```typescript
   const WS_URL = 'ws://192.168.1.10:8080'; // Remplacez par l'IP de votre serveur
   ```

## 📁 Structure du Projet

```
.
├── server/
│   ├── server.js          # Serveur WebSocket (port 8080)
│   ├── database.js        # Fonctions SQLite
│   ├── race.db            # Base de données SQLite (créée automatiquement)
│   └── package.json
├── src/
│   ├── lib/
│   │   ├── websocket.ts   # Client WebSocket (sync multi-écrans)
│   ├── hooks/
│   │   └── useErgRaceWebSocket.ts  # Hook pour connexion ErgRace
│   ├── pages/
│   │   ├── SetupPage.tsx        # Configuration de course
│   │   ├── RacePage.tsx         # Écran de course
│   │   ├── AdminPage.tsx        # Panneau de contrôle
│   │   ├── ResultsPage.tsx      # Résultats
│   │   └── ErgRaceLogsPage.tsx  # Logs ErgRace en temps réel
│   └── components/              # Composants React
├── GUIDE_UTILISATION.md         # Guide complet
├── ERGRACE_INTEGRATION.md       # Doc technique ErgRace
└── package.json
```

## 🎮 Fonctionnalités

### Gestion de Course
- Configuration des courses (nom, mode, cadence cible, tolérance)
- Mode Solo ou Team
- Suivi en temps réel des participants
- Panneau de contrôle admin pour ajuster la cadence en direct
- Sons et notifications de changement de cadence

### Intégration ErgRace
- ✅ Connexion automatique aux PM5 (ports 443-452)
- ✅ Réception des données en temps réel (SPM, Distance, Power, etc.)
- ✅ Page de monitoring des logs ErgRace
- ✅ Détection des statuts de course (warmup, ready, row, etc.)
- 🔄 Synchronisation automatique du départ (à venir)

### Synchronisation Multi-Écrans
- Synchronisation automatique entre tous les écrans connectés
- Affichage des résultats en temps réel
- Mise à jour instantanée des modifications admin

## 🔧 Ports Utilisés

- **8080** : Serveur WebSocket de synchronisation local (multi-appareils)
- **443** : Port ErgRace unique (tous les participants sur un seul WebSocket)
- **5173** : Application web (dev)
- **4173** : Application web (preview production)

## 📊 Pages Disponibles

- `/` - Configuration de course
- `/race/:raceId` - Écran de course en direct
- `/admin/:raceId` - Panneau de contrôle admin
- `/results/:raceId` - Résultats de course
- `/ergrace-logs` - Monitoring ErgRace en temps réel

## 🛠️ Production

Pour compiler l'application :

```bash
npm run build
```

Les fichiers seront dans le dossier `dist/`.

Pour servir en production :

```bash
npm run preview
```

## 🐛 Dépannage

### Les PM5 ne se connectent pas
- Vérifiez qu'ErgRace est lancé
- Vérifiez les ports WebSocket dans ErgRace (443+)
- Consultez la page `/ergrace-logs` pour voir les tentatives de connexion

### La synchronisation multi-écrans ne fonctionne pas
- Vérifiez que le serveur WebSocket est lancé (`cd server && npm start`)
- Tous les appareils doivent être sur le même réseau local

### Comment vérifier que tout fonctionne ?
1. Lancez le serveur : `cd server && npm start`
2. Lancez l'app : `npm run dev`
3. Allez sur `/ergrace-logs` pour voir les connexions ErgRace
4. Ouvrez plusieurs onglets pour tester la synchronisation

## 📖 Pour Plus d'Informations

Consultez les guides détaillés :
- **[GUIDE_UTILISATION.md](./GUIDE_UTILISATION.md)** pour le processus complet
- **[ERGRACE_INTEGRATION.md](./ERGRACE_INTEGRATION.md)** pour les détails techniques
