# Guide d'Utilisation - Application Course d'Aviron

## 🚀 Démarrage du Système

### Étape 1 : Démarrer le serveur WebSocket

Ouvrez un premier terminal et exécutez :

```bash
cd server
npm install  # (uniquement la première fois)
npm start
```

Vous devriez voir :
```
🚀 WebSocket server running on ws://localhost:8080
```

### Étape 2 : Démarrer ErgRace

1. Lancez **ErgRace** sur votre ordinateur
2. Configurez les rameurs (PM5) connectés
3. Dans ErgRace, allez dans les paramètres de diffusion WebSocket
4. Assurez-vous que le port est configuré (par défaut : 443 pour le premier rameur, 444 pour le second, etc.)

### Étape 3 : Démarrer l'application web

Ouvrez un second terminal et exécutez :

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

---

## 🎮 Processus Complet d'une Course

### 1. Configuration de la Course (Page Setup)

1. Accédez à `http://localhost:5173`
2. Remplissez les informations :
   - **Nom de la course** (ex: "Course du Samedi")
   - **Mode** : Solo ou Team
   - **Cadence cible** (ex: 24 SPM)
   - **Tolérance** (ex: ±2 SPM)
3. Ajoutez les participants :
   - Cliquez sur "Ajouter Participant"
   - Entrez le nom
   - Pour le mode équipe, assignez un numéro d'équipe
4. Cliquez sur **"DÉMARRER LA COURSE"**

### 2. Pendant la Course (Page Race)

**L'application détecte automatiquement les données d'ErgRace :**

- Les PM5 envoient leurs données via WebSocket (ports 443, 444, etc.)
- L'application reçoit la cadence en temps réel
- Le compteur démarre automatiquement (5 minutes)
- Les distances s'accumulent pour chaque rameur dans la cadence

**Écran principal affiche :**
- Cadence cible et plage acceptée
- Temps restant
- Pour chaque participant :
  - Cadence actuelle (SPM)
  - État de connexion PM5
  - Distance accumulée en cadence
  - Indicateur visuel (vert = dans la cadence)

**Panneau de contrôle admin (bouton ⚙️) :**
- Modifier la cadence cible pendant la course
- Ajuster la tolérance
- Changements diffusés en temps réel à tous les écrans

### 3. Fin de la Course

**Déclenchement automatique :**
- Lorsque le chronomètre atteint 0:00
- L'application met à jour le statut de la course à "completed"
- Redirection automatique vers la page des résultats

**Ou déclenchement manuel :**
- (À implémenter si besoin)

### 4. Résultats (Page Results)

Affiche le classement :
- **Mode Solo** : Classement individuel par distance
- **Mode Team** : Classement par équipe (somme des distances)

**Actions disponibles :**
- Bouton "NOUVELLE COURSE" pour recommencer

---

## 📡 Détection Automatique d'ErgRace

### Comment ça fonctionne ?

L'application utilise le hook `useErgRaceWebSocket` qui :

1. **Se connecte automatiquement** aux ports WebSocket d'ErgRace (443, 444, 445, etc.)
2. **Écoute les messages JSON** envoyés par les PM5
3. **Parse les données** :
   ```json
   {
     "SPM": 24,        // Cadence (Strokes Per Minute)
     "Distance": 1250, // Distance totale
     "Time": 180,      // Temps écoulé
     "Watts": 150      // Puissance
   }
   ```
4. **Met à jour en temps réel** :
   - Cadence actuelle
   - État "dans la cadence" ou non
   - Distance accumulée en fonction de la cadence

### États de Connexion

- 🟢 **CONNECTED** : PM5 connecté et données reçues
- 🔴 **DISCONNECTED** : Pas de connexion
- ⚠️ **ERROR** : Erreur de connexion

---

## 🖥️ Configuration Multi-Écrans

### Écran 1 : Setup + Admin
- Configuration initiale
- Panneau de contrôle pendant la course

### Écran 2 : Affichage Course
- Affichage principal pour les rameurs
- Visible par tous

### Écran 3 : Résultats
- Classement en direct ou final
- Podium

**Pour utiliser sur plusieurs machines :**

1. Tous les appareils doivent être sur le **même réseau local**
2. Trouvez l'IP du serveur :
   ```bash
   ifconfig  # Linux/Mac
   ipconfig  # Windows
   ```
3. Modifiez `src/lib/websocket.ts` ligne 39 :
   ```typescript
   const WS_URL = 'ws://192.168.1.10:8080';
   ```
4. Sur chaque appareil, ouvrez `http://IP_DU_SERVEUR:5173`

---

## 🔧 Dépannage

### Les PM5 ne se connectent pas

- Vérifiez qu'ErgRace est lancé
- Vérifiez les ports WebSocket dans ErgRace (443+)
- Regardez la console du navigateur (F12) pour les erreurs de connexion

### La synchronisation ne fonctionne pas

- Vérifiez que le serveur WebSocket est lancé (`ws://localhost:8080`)
- Regardez les logs du serveur pour les connexions

### L'application ne détecte pas les changements de cadence

- Vérifiez que les PM5 envoient bien des données (console ErgRace)
- Vérifiez le mapping des ports (participant 0 → port 443, participant 1 → port 444, etc.)

---

## 📊 Ports Utilisés

- **8080** : Serveur WebSocket principal (synchronisation)
- **443-453** : Ports ErgRace (un par rameur, jusqu'à 10 rameurs)
- **5173** : Application web (dev)
- **4173** : Application web (preview production)

---

## 🎯 Prochaines Étapes

Pour améliorer l'intégration avec ErgRace :

1. ✅ Déjà fait : Détection automatique des données PM5
2. 🔄 À venir : Détection du statut de course ErgRace (`race_status`)
3. 🔄 À venir : Synchronisation du départ avec ErgRace
4. 🔄 À venir : Page de logs ErgRace

Consultez le fichier `ERGRACE_INTEGRATION.md` pour les détails techniques.
