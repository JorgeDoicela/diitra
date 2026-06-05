// SERVICE WORKER DE NOTIFICACIONES DIITRA (PWA / WEB PUSH)
// Corre en segundo plano y se activa cuando el servidor de push del navegador (ej: Google FCM) 
// despacha un mensaje encriptado enviado por el backend.
//
// POLÍTICA DE PRIVACIDAD (Enfoque de Máxima Seguridad):
// - Si el usuario tiene la pestaña de DIITRA abierta y visible (está usando la app activamente),
//   se muestra el mensaje real con título y contenido completo.
// - Si la pestaña está cerrada, en segundo plano, o el usuario no está presente,
//   se muestra ÚNICAMENTE un mensaje genérico para proteger información confidencial
//   de miradas no autorizadas en la pantalla del dispositivo.

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Notificación Push recibida.');

  if (!event.data) {
    console.log('[Service Worker] El evento push no contiene información.');
    return;
  }

  let pushData = null;
  try {
    pushData = event.data.json();
    console.log('[Service Worker] Datos descifrados:', pushData);
  } catch (error) {
    console.error('[Service Worker] Error al procesar datos del payload Push:', error);
    // Fallback si los datos no son JSON válido
    const fallbackText = event.data.text();
    event.waitUntil(
      self.registration.showNotification('DIITRA - Nueva Notificación', {
        body: 'Tienes una nueva notificación. Abre la aplicación para verla.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'diitra-notificacion-fallback',
        data: { url: '/notificaciones' }
      })
    );
    return;
  }

  const data = pushData;
  const targetUrl = data.url || '/notificaciones';

  event.waitUntil(
    // Verificar si el usuario tiene la aplicación abierta y VISIBLE (pestaña activa en primer plano)
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      
      // Buscar una pestaña de DIITRA que esté actualmente visible y en primer plano
      const hasActiveFocusedTab = clientList.some(function(client) {
        return client.visibilityState === 'visible';
      });

      let title, body, options;

      if (hasActiveFocusedTab) {
        // ✅ USUARIO ACTIVO: La pestaña está abierta y visible → Mostrar mensaje completo
        // El SignalR/toast ya se encarga en la app, pero mostramos el banner completo también
        // para casos donde el foco esté en otra pestaña del mismo navegador.
        console.log('[Service Worker] Pestaña activa detectada → Mostrando notificación completa.');

        // Limpiar etiquetas HTML del cuerpo del mensaje
        let cleanBody = data.body || '';
        cleanBody = cleanBody.replace(/<\/?[^>]+(>|$)/g, '');

        title = data.title || 'DIITRA Notificaciones';
        body = cleanBody;
        options = {
          body: body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: { url: targetUrl },
          vibrate: [100, 50, 100],
          tag: 'diitra-notificacion',
          // No usar requireInteraction si la app está abierta, para no ser invasivo
          requireInteraction: false,
          actions: [
            { action: 'explore', title: 'Ver Detalles' }
          ]
        };
      } else {
        // 🔒 USUARIO AUSENTE/NO PRESENTE: La pestaña está cerrada o en segundo plano
        // → Mostrar ÚNICAMENTE mensaje genérico (Política de Máxima Privacidad)
        console.log('[Service Worker] Sin pestaña activa → Mostrando notificación genérica por privacidad.');

        title = 'DIITRA - Nueva Notificación';
        body = 'Tienes una nueva notificación. Inicia sesión para ver los detalles.';
        options = {
          body: body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: { url: targetUrl },
          vibrate: [150, 75, 150],
          tag: 'diitra-notificacion',
          // Mantener visible hasta que el usuario interactúe (importante si no está en la pc)
          requireInteraction: true,
          actions: [
            { action: 'explore', title: 'Abrir DIITRA' }
          ]
        };
      }

      return self.registration.showNotification(title, options);
    })
  );
});

// Manejo del clic en la notificación nativa del sistema operativo
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Clic en notificación detectado.');
  
  event.notification.close(); // Cierra el banner de notificación

  // Determinar la url a la cual navegar
  let targetUrl = '/dashboard';
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  // Resolver redirección enfocando la pestaña existente o abriendo una nueva
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // 1. Si hay alguna pestaña de DIITRA abierta, enfocarla y navegar a la URL
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        
        // Verificar si la pestaña está en el mismo origen de nuestro sitio
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
        }
      }

      // 2. Si no hay pestañas abiertas, abrir una nueva ventana con la url
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
