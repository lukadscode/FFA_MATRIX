# Intégration ErgRace - Documentation Technique

## 📡 Architecture de Communication

### Ports WebSocket ErgRace

ErgRace expose un seul serveur WebSocket qui transmet les données de toutes les lanes :

- **Port 443** : Toutes les lanes (1 à 10)
- Les données sont envoyées dans un format unifié avec identification de la lane
- Une seule connexion WebSocket gère tous les rameurs

### Messages Reçus d'ErgRace

#### 1. Données PM5 (Performance Monitor)

Format JSON envoyé à chaque coup de rame :

```json
{
  "SPM": 24,           // Strokes Per Minute (cadence)
  "Distance": 1250,    // Distance totale en mètres
  "Time": 180,         // Temps écoulé en secondes
  "Watts": 150,        // Puissance en Watts
  "Pace": 120,         // Tempo (secondes/500m)
  "CaloriesPerHour": 850
}
```

#### 2. Race Status (Statut de la Course)

Format JSON pour les changements d'état :

```json
{
  "state": 6,
  "state_desc": "row",
  "data": [
    { "lane": 1 },
    { "lane": 2 }
  ]
}
```

**États de la course :**

| State | Description | Description Française |
|-------|-------------|---------------------|
| 1 | warmup | Échauffement |
| 2 | stop rowing | Arrêter de ramer |
| 3 | ready | Prêt |
| 4 | sit ready | En position |
| 5 | attention | Attention |
| 6 | row | Ramer (départ) |
| 7 | false start | Faux départ |
| 8 | technical hold | Arrêt technique |
| 9 | race running | Course en cours |
| 10 | race aborted | Course annulée |
| 11 | race complete | Course terminée |
| 12 | final results | Résultats finaux |
| 13 | inactive | Inactif |
| 14 | exchange | Échange (relais) |

---

## 🔌 Implémentation Actuelle

### Hook WebSocket PM5

Fichier : `src/hooks/useErgRaceWebSocket.ts`

```typescript
export const useErgRaceWebSocket = (
  participantCount: number,
  onData: (data: PM5Data, participantIndex: number) => void,
  isActive: boolean
)
```

**Fonctionnalités :**
- Connexion unique au port 443
- Parse les messages JSON avec support multi-lanes
- Extrait les données de chaque lane individuellement
- Gère les états de connexion pour tous les participants
- Permet la reconnexion

**Utilisation dans `RaceDisplay` :**
```typescript
const { connectionStates } = useErgRaceWebSocket(
  participants.length,
  handlePM5Data,
  true
);
```

---

## 🖥️ Page de Logs ErgRace

**URL :** `http://localhost:5173/ergrace-logs`

**Fonctionnalités :**
- ✅ Connexion automatique aux 10 ports ErgRace
- ✅ Affichage en temps réel des données PM5
- ✅ Détection et affichage des race_status
- ✅ État de connexion par lane
- ✅ Logs colorés par type (data, status, connection, error)
- ✅ Auto-scroll des logs
- ✅ Bouton pour effacer les logs

**Types de logs :**
- 🟢 **Data** : Données PM5 (SPM, Distance, etc.)
- 🔵 **Status** : Changements d'état de course
- 🟡 **Connection** : Connexions/déconnexions
- 🔴 **Error** : Erreurs de connexion ou parsing

**Accès :**
- Depuis la page Setup, cliquez sur le bouton "LOGS" (icône Radio)
- Directement via l'URL `/ergrace-logs`

---

## 🚀 Améliorations Futures

### 1. Synchronisation Automatique du Départ

**Objectif :** Démarrer automatiquement la course quand ErgRace envoie `state: 6` (row)

**Implémentation suggérée :**

```typescript
// Dans RaceDisplay.tsx
useEffect(() => {
  // Écouter les race_status depuis les WebSockets ErgRace
  const ergRaceWs = new WebSocket('ws://localhost:443');

  ergRaceWs.onmessage = (evt) => {
    const data = JSON.parse(evt.data);

    if (data.state === 6 && data.state_desc === 'row') {
      // Démarrer le chronomètre
      startRaceTimer();
    }

    if (data.state === 11 && data.state_desc === 'race complete') {
      // Terminer la course automatiquement
      handleRaceEnd();
    }
  };
}, []);
```

### 2. Détection Automatique du Nombre de Rameurs

**Objectif :** Créer automatiquement les participants quand ErgRace les détecte

```typescript
// Scanner les ports pour détecter les rameurs connectés
const detectRowers = async () => {
  const connectedLanes = [];

  for (let i = 0; i < 10; i++) {
    const ws = new WebSocket(`ws://localhost:${443 + i}`);

    ws.onopen = () => {
      connectedLanes.push(i);
      ws.close();
    };
  }

  // Créer automatiquement les participants
  connectedLanes.forEach(lane => {
    createParticipant({ name: `Rameur ${lane + 1}` });
  });
};
```

### 3. Affichage des Statuts ErgRace

**Objectif :** Afficher l'état de la course ErgRace sur l'écran principal

```typescript
// Composant RaceStatusIndicator
const RaceStatusIndicator = ({ status }) => {
  const statusConfig = {
    4: { label: 'SIT READY', color: 'text-blue-400' },
    5: { label: 'ATTENTION', color: 'text-red-400' },
    6: { label: 'ROW!', color: 'text-green-500' },
    9: { label: 'RACE RUNNING', color: 'text-green-400' },
  };

  return (
    <div className={`text-4xl font-bold ${statusConfig[status]?.color}`}>
      {statusConfig[status]?.label}
    </div>
  );
};
```

### 4. Gestion des Faux Départs

```typescript
// Écouter state: 7 (false start)
if (data.state === 7) {
  // Afficher notification
  showNotification('FAUX DÉPART !');

  // Réinitialiser les compteurs
  resetRaceData();

  // Attendre le nouveau départ
  waitForNextStart();
}
```

### 5. Mode Relais (Exchange)

```typescript
// Écouter state: 14 (exchange)
if (data.state === 14) {
  // Changer de rameur actif
  switchActiveRower();

  // Continuer le comptage
  continueRace();
}
```

---

## 🔧 Configuration Réseau

### Pour Réseau Local

Si votre application et ErgRace sont sur des machines différentes :

1. **Sur la machine ErgRace**, trouvez l'IP :
   ```bash
   ifconfig  # Linux/Mac
   ipconfig  # Windows
   ```

2. **Modifiez `useErgRaceWebSocket.ts`** ligne 65 :
   ```typescript
   const wsUri = `ws://192.168.1.10:443`;  // IP de la machine ErgRace
   ```

3. **Autorisez les connexions** dans le pare-feu pour le port 443

---

## 📊 Diagramme de Flux

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   ErgRace   │────────▶│  WebSocket   │────────▶│  App React  │
│   (PM5s)    │  Port   │   Local      │  JSON   │  (Display)  │
│             │  443+   │              │  Parse  │             │
└─────────────┘         └──────────────┘         └─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   SQLite     │
                        │   Database   │
                        └──────────────┘
```

---

## 🐛 Débogage

### Vérifier la Connexion ErgRace

1. Ouvrez la page `/ergrace-logs`
2. Vérifiez les états de connexion (CONNECTED/DISCONNECTED)
3. Observez les logs en temps réel

### Tester avec un Client Simple

Utilisez l'exemple HTML fourni dans la doc ErgRace pour vérifier que les WebSockets fonctionnent.

### Console du Navigateur

Ouvrez la console (F12) pour voir :
- Messages WebSocket reçus
- Erreurs de connexion
- Parse errors

---

## 📝 Notes Importantes

1. **Un seul port pour tous** : ERGRACE transmet toutes les lanes sur le port 443
2. **Identification par lane** : Chaque rameur est identifié par son numéro de lane (1-10)
3. **Mapping automatique** : Le participant à l'index 0 correspond à la lane 1, index 1 → lane 2, etc.
4. **Pas de serveur central** : ErgRace expose directement le WebSocket
5. **Messages non bidirectionnels** : L'app ne peut que recevoir (pour l'instant)
6. **Format JSON strict** : Tout message doit être du JSON valide

---

## 🎯 Roadmap

- [x] Réception des données PM5
- [x] Calcul de la distance en cadence
- [x] Page de logs en temps réel
- [ ] Synchronisation du départ avec ErgRace
- [ ] Détection automatique des rameurs
- [ ] Affichage des statuts ErgRace
- [ ] Gestion des faux départs
- [ ] Support du mode relais

---

## 🤝 Contribution

Pour ajouter de nouvelles fonctionnalités d'intégration ErgRace :

1. Testez d'abord dans la page `/ergrace-logs`
2. Ajoutez la logique dans `useErgRaceWebSocket.ts`
3. Mettez à jour `RaceDisplay.tsx` pour utiliser les nouvelles données
4. Documentez ici les changements

---

## 📚 Ressources

- [Documentation ErgRace WebSocket](lien vers la doc officielle)
- [Concept2 PM5 API](https://www.concept2.com/service/software/software-development-kit)
