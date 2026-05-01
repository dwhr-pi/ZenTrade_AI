# ZenTrade AI SVG Pro Set

Dieses Paket enthält ein produktionsfreundliches SVG-Icon-System für ZenTrade AI.

## Ordner

- `svg-transparent/`  
  Transparente SVGs ohne festen Hintergrund. Empfohlen für Webinterface, Cards, Buttons und Overlays.

- `svg-dark/`  
  SVGs mit dunklem Hintergrund. Empfohlen für GitHub Avatar, Repo Branding und Dark-Only Flächen.

- `svg-light/`  
  SVGs mit hellem Hintergrund und angepasstem Text. Empfohlen für Light Mode.

- `svg-currentcolor/`  
  Monochrome, CSS-steuerbare SVGs. Farbe kann über `color` gesetzt werden.

- `react-components/`  
  React/TypeScript Komponenten als `.tsx`, transparent und direkt importierbar.

## Farben

```css
--zentrade-bg: #070812;
--zentrade-cyan: #23e6ff;
--zentrade-pink: #ff4fd8;
--zentrade-violet: #915cff;
```

## Webinterface Empfehlung

Für normale UI:
```html
<img src="/icons/svg-transparent/auto-trading.svg" width="48" height="48" alt="Auto Trading" />
```

Für CSS steuerbare Icons:
```html
<img class="zentrade-icon" src="/icons/svg-currentcolor/fast-execution.svg" />
```

Für React:
```tsx
import { AutoTradingIcon } from "./react-components";

export function ButtonIcon() {
  return <AutoTradingIcon size={40} className="drop-shadow" />;
}
```

## GitHub Empfehlung

- `svg-dark/github-avatar.svg` für GitHub Avatar
- `svg-dark/zentrade-ai-brand-icon.svg` für README Header
- `svg-transparent/favicon-z.svg` als Basis für Favicon
