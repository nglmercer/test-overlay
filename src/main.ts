import { appWindow } from '@tauri-apps/api/window';
import { register, unregister, isRegistered } from '@tauri-apps/api/globalShortcut';

let ignoreCursorEvents = false;

function injectCSS() {
  const css = `
    body {
      background-color: rgba(128, 128, 128, 0.25);
    }
  `;
  const style = document.createElement('style');
  style.type = 'text/css';
  style.id = 'dynamic-css';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
}

function removeCSS() {
  const style = document.getElementById('dynamic-css');
  if (style) {
    document.head.removeChild(style);
  }
}

function toggleCursorEvents() {
  try {
    ignoreCursorEvents = !ignoreCursorEvents; // Cambiar el estado
    appWindow.setIgnoreCursorEvents(ignoreCursorEvents); // Alternar eventos del cursor
    
    if (ignoreCursorEvents) {
        removeCSS(); // Eliminar CSS cuando ignoreCursorEvents es false
    } else {
      injectCSS(); // Inyectar CSS cuando ignoreCursorEvents es true
    }

    console.log('Shortcut triggered, ignoreCursorEvents:', ignoreCursorEvents);
  } catch (error) {
    console.error('Error toggling cursor events:', error);
  }
}

function registerShortcut() {
  isRegistered('CommandOrControl+O').then((registered) => {
    if (registered) {
      unregister('CommandOrControl+O').catch((err) => console.error('Failed to unregister shortcut:', err));
    }
    register('CommandOrControl+O', toggleCursorEvents).then(() => {
      console.log('Shortcut registered');
    }).catch((error) => {
      console.error('Failed to register shortcut:', error);
    });
  }).catch((error) => {
    console.error('Error checking shortcut registration:', error);
  });
}

(() => {
  registerShortcut();

  // Escucha el evento de recarga de la ventana para volver a registrar el atajo
  appWindow.listen('tauri://update', () => {
    console.log('App reloaded, re-registering shortcut');
    registerShortcut();
  });
})();
