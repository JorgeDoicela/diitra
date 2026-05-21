import { useEffect, useState } from 'react';
import * as Font from 'expo-font';

/**
 * Hook para cargar las fuentes Geist Sans y Geist Mono.
 * Si los archivos .ttf no están presentes en assets/fonts/,
 * usará las fuentes del sistema como fallback.
 *
 * Para instalar las fuentes:
 * 1. Descarga Geist desde: https://github.com/vercel/geist-font/releases
 * 2. Copia los archivos .ttf a assets/fonts/
 * 3. Reinicia la app
 */
export function useGeistFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Geist Sans': require('@/assets/fonts/GeistSans-Regular.ttf'),
          'Geist Mono': require('@/assets/fonts/GeistMono-Regular.ttf'),
        });
        setFontsLoaded(true);
      } catch {
        // Si las fuentes no están disponibles, usar system fonts
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  return fontsLoaded;
}
