# 🔧 Configuration ErgRace

## 📡 Port WebSocket ErgRace

### Trouver le bon port

ErgRace utilise un serveur WebSocket local. Pour trouver le port utilisé :

1. **Lancez ErgRace**
2. **Vérifiez dans les paramètres ErgRace** :
   - Menu → Settings → WebSocket
   - Notez le numéro de port (ex: 8081, 8080, 443, etc.)

3. **Ou testez avec la console navigateur** :
   ```javascript
   // Ouvrez la console (F12) et testez :
   const ws = new WebSocket('ws://localhost:8081');
   ws.onopen = () => console.log('✅ Port 8081 fonctionne !');
   ws.onerror = () => console.log('❌ Port 8081 ne répond pas');
   ```

### Changer le port dans l'application

Éditez le fichier : `src/config/ergrace.ts`

```typescript
export const ERGRACE_CONFIG = {
  PORT: 8081,  // ⬅️ Changez ce numéro
};
```

**Ports courants** :
- `8081` - Port par défaut (recommandé)
- `8080` - Alternative courante
- `443` - Port HTTPS (peut être bloqué par le navigateur)
- `9090` - Autre alternative

### ⚠️ Problèmes courants

#### ❌ "Connexion..." mais jamais connecté

**Causes possibles :**
1. **ErgRace n'est pas lancé**
   - Solution : Démarrez ErgRace

2. **Mauvais port configuré**
   - Solution : Vérifiez le port dans ErgRace et modifiez `src/config/ergrace.ts`

3. **Port 443 bloqué**
   - Problème : Les navigateurs bloquent souvent `ws://` sur le port 443
   - Solution : Utilisez un autre port (8081, 8080, 9090)

4. **Firewall bloque la connexion**
   - Solution : Autorisez ErgRace dans votre pare-feu

#### 🔍 Débogage

1. **Ouvrez la console du navigateur** (F12)
2. Cliquez sur "SE CONNECTER"
3. Vérifiez les messages :
   ```
   🔌 Attempting to connect to ErgRace on port 8081...
   ✅ Connected to ErgRace status on port 8081
   ```

4. Si vous voyez des erreurs :
   - `❌ ErgRace status connection error` → Mauvais port ou ErgRace non lancé
   - `WebSocket connection failed` → Vérifiez le port et le pare-feu

### ✅ Test de connexion

Pour vérifier que tout fonctionne :

1. **Lancez ErgRace**
2. **Lancez l'application** : `npm run dev`
3. **Cliquez sur "SE CONNECTER"**
4. Le bouton doit devenir **VERT** avec "CONNECTÉ"
5. Si c'est **GRIS** avec "CONNEXION...", le port est incorrect

### 📝 Configuration avancée

Si vous avez plusieurs instances d'ErgRace ou une configuration spéciale :

```typescript
// src/config/ergrace.ts
export const ERGRACE_CONFIG = {
  PORT: 8081,           // Port principal
  HOST: 'localhost',    // Changez si ErgRace est sur un autre PC
};
```

Puis modifiez les hooks pour utiliser `HOST` :
```typescript
const ws = new WebSocket(`ws://${ERGRACE_CONFIG.HOST}:${ERGRACE_CONFIG.PORT}`);
```

## 🆘 Support

Si la connexion ne fonctionne toujours pas :

1. Vérifiez qu'ErgRace est bien lancé
2. Testez manuellement le port dans la console
3. Essayez différents ports (8080, 8081, 9090)
4. Vérifiez les logs dans la console navigateur
5. Consultez la documentation ErgRace pour le port WebSocket
