import './globals.css';
import { browserThemeBootstrap } from '../lib/browser-theme.mjs';
export const metadata = {title:'Crossword puzzle',description:'A simple mobile crossword. Fresh puzzles, clear clues, and three difficulty levels.',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,statusBarStyle:'default',title:'Crossword'},icons:{icon:'/icon.svg',apple:'/apple-icon.png'}};
export const viewport = {width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#fff4c4',colorScheme:'light',interactiveWidget:'resizes-visual'};
export default function Layout({children}) {return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: browserThemeBootstrap() }} /></head><body suppressHydrationWarning>{children}</body></html>}
