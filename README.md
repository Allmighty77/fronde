# Fronde

Simulateur de gravité orbitale dans le navigateur.

Cliquez-glissez pour lancer des corps, observez les orbites, les frondes
gravitationnelles et les fusions. La physique utilise un intégrateur de Verlet
à pas fixe, une gravité adoucie (Plummer) et la conservation de la quantité de
mouvement lors des collisions.

## Contrôles

- **Clic-glisser** : lancer un corps (la longueur donne la vitesse)
- **Clic droit / deux doigts** : déplacer la vue
- **Molette / pincement** : zoomer
- **Espace** : pause
- **1–5** : préréglages de masse
- **C** : effacer
- **T** : traînées
- **F** : suivre le barycentre

## Scènes

Vide, soleil central, binaire, chorégraphie en huit, mini-système.

## Structure

| Chemin | Rôle |
| --- | --- |
| `src/lib/sim/physics.ts` | Verlet, gravité n-corps, fusions |
| `src/lib/sim/scenes.ts` | Préréglages (huit, binaire, système) |
| `src/lib/sim/world.ts` | Caméra, spawn, particules |
| `src/components/orbit/` | Canvas, HUD, overlay |

## Licence

MIT
