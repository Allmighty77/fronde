# Fronde

Simulateur de gravité orbitale dans le navigateur.

Cliquez-glissez pour lancer des corps, observez les orbites, les frondes
gravitationnelles et les fusions. La physique utilise un intégrateur de Verlet
à pas fixe, une gravité adoucie (Plummer) et la conservation de la quantité de
mouvement lors des collisions.

## Contrôles

### Ordinateur

- **Clic-glisser** : lancer un corps (la longueur donne la vitesse)
- **Clic droit / deux doigts** : déplacer la vue
- **Molette / pincement** : zoomer
- **Espace** : pause
- **1–5** : préréglages de masse
- **C** : effacer
- **T** : traînées
- **F** : suivre le barycentre

### Téléphone

- **Un doigt, glisser** : lancer
- **Déplacer** : bouton dédié, ou deux doigts
- **Zoom** : boutons +/−, ou pincement
- **Masse** : les cinq cercles (taille = masse)
- **Temps** : bouton ×1, ×2, …
- **Scènes / traînées / suivi** : chevron en bas à droite

## Scènes

Vide, étoile centrale, binaire, chorégraphie en huit, mini-système.

## Développement

```bash
npm install
npm run dev
```
