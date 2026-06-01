// SERVICE WORKER DE NOTIFICACIONES DIITRA (PWA / WEB PUSH)
// Corre en segundo plano y se activa cuando el servidor de push del navegador (ej: Google FCM) 
// despacha un mensaje encriptado enviado por el backend.

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Notificación Push recibida.');

  if (!event.data) {
    console.log('[Service Worker] El evento push no contiene información.');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Datos descifrados:', data);

    const title = data.title || 'DIITRA Notificaciones';
    
    // Limpiar etiquetas HTML para que se vea limpio en el banner nativo del S.O.
    let cleanBody = data.body || '';
    cleanBody = cleanBody.replace(/<\/?[^>]+(>|$)/g, ""); // Remueve cualquier tag HTML
    
    // Configuración visual de la notificación nativa
    const options = {
      body: cleanBody,
      icon: '/favicon.ico', // Icono de la pestaña del navegador
      badge: '/favicon.ico', // Icono de estado pequeño
      data: {
        url: data.url || '/dashboard' // Guardamos la url para redirigir al hacer clic
      },
      vibrate: [150, 75, 150], // Vibración en dispositivos móviles [vibrar, pausar, vibrar]
      tag: 'diitra-notificacion', // Agrupa notificaciones con el mismo tag
      requireInteraction: true, // Mantiene la notificación visible hasta que el usuario interactúe
      actions: [
        {
          action: 'explore',
          title: 'Ver Detalles'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[Service Worker] Error al procesar datos del payload Push:', error);
    
    // Fallback en caso de que no sea un JSON válido
    const fallbackText = event.data.text();
    event.waitUntil(
      self.registration.showNotification('DIITRA Notificaciones', {
        body: fallbackText,
        icon: '/favicon.ico',
        tag: 'diitra-notificacion-fallback'
      })
    );
  }
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
