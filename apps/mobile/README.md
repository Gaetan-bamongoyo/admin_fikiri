# Fikiri Traffic - Application Mobile (Flutter)

## Objectif du Projet

L'application mobile **Fikiri Traffic** est développée dans le cadre de l'initiative UNDP (Fikiri). Elle a pour objectif de fournir aux utilisateurs une plateforme mobile permettant de suivre le trafic en temps réel, de signaler des incidents routiers et d'accéder aux informations de circulation.

---

## Structure du dossier `lib/`

Le code de l'application est structuré selon une architecture modulaire et orientée fonctionnalités (Feature-First) :

```text
lib/
├── core/                    # Code transversal et partagé
│   ├── theme/               # Design system (couleurs, typographie, espacement, radius)
│   └── widget/              # Bibliothèque de widgets réutilisables (UI Kit)
├── data/                    # Services de données globaux et modèles partagés
├── features/                # Fonctionnalités métier de l'application
│   └── [nom_feature]/
│       ├── data/            # Modèles locaux, sources de données et dépôts
│       ├── domain/          # Entités métier et cas d'utilisation (Use Cases)
│       └── presentation/    # Écrans (Pages), widgets locaux et gestion d'état
├── routes/                  # Configuration des routes et de la navigation
│   ├── app_routes.dart      # Constantes des noms de routes
│   └── app_router.dart      # Résolution des routes (generateRoute)
└── main.dart                # Point d'entrée de l'application Flutter
```

---

## Charte Graphique & Design System (`lib/core/theme/`)

L'application utilise un design system unifié pour garantir la cohérence visuelle de l'interface.

### 1. Couleurs (`app_colors.dart`)

| Catégorie         | Token                  | Valeur      |
|-------------------|------------------------|-------------|
| **Marque**        | `primary`              | `#006EB5`   |
|                   | `secondary`            | `#4DA3D9`   |
| **Statuts**       | `success`              | `#28A745`   |
|                   | `warning`              | `#F59E0B`   |
|                   | `danger`               | `#DC3545`   |
| **Fond & Surface**| `background`           | `#F8FAFC`   |
|                   | `surface`              | `#FFFFFF`   |
|                   | `inputFilled`          | Gris clair  |
|                   | `border`               | Gris léger  |
| **Texte**         | `textPrimary`          | `#1E293B`   |
|                   | `textSecondary`        | `#64748B`   |
| **Trafic**        | `trafficFluid`         | `#28A745`   |
|                   | `trafficDense`         | `#F59E0B`   |
|                   | `trafficBlocked`       | `#DC3545`   |
|                   | `trafficAccident`      | `#B91C1C`   |
|                   | `trafficRoadworks`     | `#D97706`   |
|                   | `trafficPoliceControl` | `#2563EB`   |

### 2. Espacements (`app_spacing.dart`)

Échelle normalisée utilisée dans tous les widgets pour les marges et paddings :

| Token    | Valeur |
|----------|--------|
| `xs`     | 4px    |
| `sm`     | 8px    |
| `md`     | 12px   |
| `lg`     | 16px   |
| `xl`     | 20px   |
| `xxl`    | 24px   |
| `xxxl`   | 32px   |
| `huge`   | 40px   |
| `giant`  | 48px   |

### 3. Angles arrondis (`app_radius.dart`)

| Token     | Valeur | Usage                     |
|-----------|--------|---------------------------|
| `input`   | 10px   | Champs de saisie          |
| `button`  | 10px   | Boutons                   |
| `card`    | 12px   | Cartes                    |
| `modal`   | 20px   | Modales / fiches détails  |

### 4. Typographie (`app_typography.dart`)

Police globale : **Inter** (via Google Fonts dans `app_theme.dart`).

| Style       | Taille | Graisse    | Usage                      |
|-------------|--------|------------|----------------------------|
| `heading1`  | 28px   | Bold       | Titres principaux          |
| `heading2`  | 22px   | Semi-Bold  | Titres de sections         |
| `heading3`  | 18px   | Medium     | Sous-titres                |
| `body`      | 16px   | Regular    | Corps de texte             |
| `bodySmall` | 14px   | Regular    | Texte secondaire, labels   |
| `caption`   | 12px   | Regular    | Légendes, petites indications |

---

## Bibliothèque de Widgets (`lib/core/widget/`)

Ensemble de widgets réutilisables constituant l'UI Kit de l'application. Tous les widgets consomment les tokens du design system.

### `AppButton` — Bouton

Widget de bouton avec 3 styles et support des icônes et du chargement.

**Propriétés principales :**

| Propriété       | Type              | Défaut                  | Description                           |
|-----------------|-------------------|-------------------------|---------------------------------------|
| `text`          | `String`          | *requis*                | Libellé du bouton                     |
| `onPressed`     | `VoidCallback?`   | *requis*                | Action au clic (null = désactivé)     |
| `type`          | `AppButtonType`   | `primary`               | Style visuel du bouton                |
| `isLoading`     | `bool`            | `false`                 | Affiche un spinner et désactive le bouton |
| `icon`          | `IconData?`       | `null`                  | Icône optionnelle                     |
| `iconPosition`  | `AppIconPosition` | `prefix`                | Position de l'icône (`prefix`/`suffix`) |
| `width`         | `double?`         | `double.infinity`       | Largeur (null = contenu pour `text`)  |
| `height`        | `double`          | `52`                    | Hauteur                               |
| `backgroundColor`, `textColor`, `borderColor`, `borderRadius` | | | Personnalisation optionnelle |

**Types disponibles (`AppButtonType`) :**
- `primary` → `ElevatedButton` plein (fond `AppColors.primary`)
- `secondary` → `OutlinedButton` avec bordure légère
- `text` → `TextButton` sans fond ni bordure

**Exemple d'utilisation :**
```dart
// Bouton principal
AppButton(
  text: 'Confirmer',
  onPressed: () => _submit(),
),

// Bouton secondaire avec icône
AppButton(
  text: 'Télécharger',
  type: AppButtonType.secondary,
  icon: Icons.download_rounded,
  onPressed: () => _download(),
),

// Bouton en état de chargement
AppButton(
  text: 'Envoi en cours...',
  isLoading: true,
  onPressed: () {},
),
```

---

### `AppInput` — Champ de saisie

Widget de champ de formulaire avec gestion des labels, icônes, validation et mode mot de passe.

**Propriétés principales :**

| Propriété         | Type                        | Défaut           | Description                              |
|-------------------|-----------------------------|------------------|------------------------------------------|
| `controller`      | `TextEditingController`     | *requis*         | Contrôleur du champ                      |
| `hint`            | `String`                    | *requis*         | Texte placeholder                        |
| `label`           | `String?`                   | `null`           | Label affiché au-dessus du champ         |
| `isPassword`      | `bool`                      | `false`          | Active l'obfuscation et le toggle œil    |
| `keyboardType`    | `TextInputType`             | `text`           | Type de clavier                          |
| `validator`       | `String? Function(String?)` | `null`           | Fonction de validation (Form)            |
| `prefixIcon`      | `Widget?`                   | `null`           | Widget icône à gauche                    |
| `suffixIcon`      | `Widget?`                   | `null`           | Widget icône à droite (ignoré si `isPassword`) |
| `enabled`         | `bool`                      | `true`           | Active ou désactive le champ             |
| `maxLines`        | `int`                       | `1`              | Nombre de lignes (textarea)              |
| `maxLength`       | `int?`                      | `null`           | Limite de caractères                     |

**Exemple d'utilisation :**
```dart
// Champ email avec icône
AppInput(
  controller: _emailController,
  label: 'Adresse e-mail',
  hint: 'exemple@email.com',
  keyboardType: TextInputType.emailAddress,
  prefixIcon: const Icon(Icons.email_outlined),
  validator: (v) => v!.isEmpty ? 'Champ requis' : null,
),

// Champ mot de passe (toggle visibilité automatique)
AppInput(
  controller: _passwordController,
  label: 'Mot de passe',
  hint: 'Saisir votre mot de passe',
  isPassword: true,
),
```

---

### `AppLoader` — Indicateur de chargement

Spinner circulaire configurable, centré ou inline.

| Propriété    | Type     | Défaut              | Description               |
|--------------|----------|---------------------|---------------------------|
| `size`       | `double` | `36.0`              | Diamètre du spinner       |
| `color`      | `Color`  | `AppColors.primary` | Couleur de l'anneau       |
| `isCentered` | `bool`   | `true`              | Enveloppe dans un `Center`|

```dart
// Centré dans un conteneur (défaut)
const AppLoader(),

// Inline, couleur personnalisée
const AppLoader(size: 24, isCentered: false, color: AppColors.success),
```

---

### `AppEmpty` — État vide

Composant d'état vide avec icône, titre et message descriptif.

| Propriété | Type       | Défaut                      | Description      |
|-----------|------------|-----------------------------|------------------|
| `icon`    | `IconData` | `Icons.inbox_outlined`      | Icône centrale   |
| `title`   | `String`   | `'Aucune donnée'`           | Titre principal  |
| `message` | `String`   | Message par défaut          | Description      |

```dart
const AppEmpty(
  title: 'Aucun signalement',
  message: 'Aucun incident signalé dans cette zone.',
  icon: Icons.traffic_outlined,
),
```

---

### `AppError` — État d'erreur

Composant d'état d'erreur avec message et bouton de réessai optionnel.

| Propriété   | Type            | Défaut                           | Description                      |
|-------------|-----------------|----------------------------------|----------------------------------|
| `message`   | `String`        | *requis*                         | Message d'erreur détaillé        |
| `onRetry`   | `VoidCallback?` | `null`                           | Callback du bouton réessayer     |
| `retryText` | `String`        | `'Réessayer'`                    | Libellé du bouton réessayer      |
| `icon`      | `IconData`      | `Icons.error_outline_rounded`    | Icône d'erreur                   |

```dart
AppError(
  message: 'Connexion réseau perdue.',
  onRetry: () => _reload(),
),
```

---

### `AppLogo` — Logo de l'application

Widget du logo Fikiri Traffic avec variantes de taille et affichage du texte optionnel.

| Propriété  | Type      | Défaut           | Description                        |
|------------|-----------|------------------|------------------------------------|
| `size`     | `double`  | `120`            | Taille du carré logo               |
| `showText` | `bool`    | `true`           | Affiche le titre et sous-titre     |
| `title`    | `String?` | `'Fikiri Traffic'` | Titre sous le logo               |
| `subtitle` | `String?` | `null`           | Sous-titre optionnel               |

```dart
// Logo complet (page de splash/login)
const AppLogo(size: 120),

// Logo seul sans texte (AppBar)
const AppLogo(size: 40, showText: false),
```

---

### `AppGap` — Espacements (`VGap` / `HGap`)

Widgets sémantiques pour les espacements verticaux et horizontaux, liés aux tokens `AppSpacing`.

```dart
// Espacements verticaux
const VGap.sm()   // 8px
const VGap.md()   // 12px
const VGap.lg()   // 16px
const VGap.xl()   // 20px

// Espacements horizontaux
const HGap.sm()   // 8px
const HGap.lg()   // 16px

// Valeur personnalisée
const VGap(36)
```

---

## Navigation & Routage (`lib/routes/`)

L'application utilise le système de navigation déclaratif de Flutter (`onGenerateRoute`) avec des routes nommées centralisées.

### `AppRoutes` — Constantes de routes

Classe contenant l'ensemble des noms de routes sous forme de constantes `String`.

```dart
class AppRoutes {
  static const widgetDemoPage = '/widget_demo_page';
  // Futures routes : '/home', '/map', '/reports', '/profile', etc.
}
```

### `AppRouter` — Résolution des routes

Classe statique avec la méthode `generateRoute` branchée sur `MaterialApp.onGenerateRoute`. Elle retourne un `MaterialPageRoute` selon la route demandée, avec une page 404 par défaut.

```dart
// Configuration dans main.dart
MaterialApp(
  initialRoute: AppRoutes.widgetDemoPage,
  onGenerateRoute: AppRouter.generateRoute,
)
```

**Ajouter une nouvelle route :**
1. Déclarer la constante dans `app_routes.dart`
2. Ajouter un `case` dans le `switch` de `app_router.dart`

---

## Page de Démo (`lib/features/demo_widgets_page.dart`)

La `DemoWidgetsPage` est la page de démarrage actuelle de l'application. Elle sert de **galerie de composants** pour valider visuellement l'ensemble du design system et des widgets du UI Kit.

**Composants illustrés :**
- `AppLogo` — variantes de taille avec et sans texte
- `AppButton` — tous les styles (`primary`, `secondary`, `text`) avec icônes et état de chargement
- `AppInput` — champ simple, champ avec label + icône, champ mot de passe
- `AppLoader` — variantes de taille et de couleur
- `AppEmpty` — état vide personnalisé
- `AppError` — état d'erreur avec bouton réessayer

> Cette page est temporaire et sera remplacée par l'écran d'accueil (`/home`) lors du développement des fonctionnalités métier.

---

## Point d'Entrée (`lib/main.dart`)

```dart
void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fikiri traffic',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,          // Thème global du design system
      initialRoute: AppRoutes.widgetDemoPage,
      onGenerateRoute: AppRouter.generateRoute,
    );
  }
}
```

---

## Dépendances (`pubspec.yaml`)

| Package             | Usage                                        |
|---------------------|----------------------------------------------|
| `google_fonts`      | Police Inter via Google Fonts                |
| `flutter_lints`     | Règles d'analyse statique du code Dart/Flutter |

---

## Lancer l'application

```bash
# Depuis le dossier apps/mobile/
flutter pub get
flutter run
```

> **Note :** Assurez-vous d'avoir un émulateur ou un appareil connecté avant de lancer `flutter run`.

---

## Saved destinations (`trajet` module)

Lets authenticated users save favorite places (Home, Work, Market, etc.) and reuse them to start a route from their current GPS position.

### Structure

```text
lib/features/trajet/
├── models/trajet_model.dart              # Model + icons by category
├── repositories/trajet_repository.dart   # CRUD via NestJS API
└── pages/plan_trajet_page.dart           # Save / manage screen

lib/features/maps/widgets/
├── search_screen.dart                    # Destination search (navigation)
└── address_search_suggestions.dart       # Shared address autocomplete

lib/data/services/
├── geocoding_service.dart                # Photon + GraphHopper, Kinshasa/DRC area
└── geocoding_bounds.dart                  # Local geographic filters
```

### Screens and flows

| Screen | Access | Purpose |
|--------|--------|---------|
| **Plan a trip** | Drawer menu → "Planifier un trajet" | Save / delete destinations |
| **Destination search** | Search bar on the map | Pick a destination and compute a route |

**Plan a trip** (`PlanTrajetPage`):
- **Top**: form — label (Home, Work, Church, Market), address selection
- Two address modes:
  - **Search**: typeahead suggestions (from 2 characters)
  - **My location**: current GPS + reverse geocoding (Nominatim)
- **Save** button
- **Bottom**: scrollable list of saved destinations (with delete)

**Destination search** (`SearchScreen`):
- List of saved destinations (from API)
- Address search with autocomplete
- Tap a destination → route from **current position → destination**

### API consumed

Base endpoint: `ApiEndpoints.trajets` → `/api/v1/trajets` (NestJS, port **7540**).

| Action | Method | Route |
|--------|--------|-------|
| List | `GET` | `/trajets` |
| Create | `POST` | `/trajets` |
| Update | `PATCH` | `/trajets/:id` |
| Delete | `DELETE` | `/trajets/:id` |

JWT authentication required (token via `SecureStorage`).

### Geocoding

- Primary source: **Photon** (Komoot / OpenStreetMap)
- Fallback: **GraphHopper**
- Priority area: Kinshasa / DRC (`countrycode=cd`, ~50 km bbox around user position)
- Reverse geocoding: **Nominatim** (GPS position → readable address)

### Network configuration

File `lib/data/network/api_endpoints.dart`:

```
