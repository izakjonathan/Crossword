import './globals.css';
import { browserThemeBootstrap } from '../lib/browser-theme.mjs';
import { DEFAULT_THEME } from '../lib/theme.mjs';

export const metadata = {title:'Crossword puzzle',description:'A simple mobile crossword. Fresh puzzles, clear clues, and three difficulty levels.',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,statusBarStyle:'default',title:'Crossword'},icons:{icon:'/icon.svg',apple:'/apple-icon.png'}};
// UI Studio owns the colour metadata below; do not also emit a static
// viewport.themeColor that could replace the restored palette during hydration.
export const viewport = {width:'device-width',initialScale:1,viewportFit:'cover',interactiveWidget:'resizes-visual'};

export default function Layout({children}) {
  return <html lang="en" suppressHydrationWarning>
    <head>
      <meta name="theme-color" content={DEFAULT_THEME.background} suppressHydrationWarning />
      <meta name="color-scheme" content="light" suppressHydrationWarning />
      <script dangerouslySetInnerHTML={{ __html: browserThemeBootstrap() }} />
    </head>
    <body suppressHydrationWarning>
      <div className="browser-canvas" aria-hidden="true" />
      {children}
    </body>
  </html>;
}
