(function() {
  // Get the current script tag to extract configuration
  const scripts = document.getElementsByTagName('script');
  let currentScript = null;
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src.includes('qlynk-agent.js')) {
      currentScript = scripts[i];
      break;
    }
  }

  if (!currentScript) return;

  const widgetId = currentScript.getAttribute('data-widget-id');
  const username = currentScript.getAttribute('data-username');
  const identifier = widgetId || username;
  if (!identifier) {
    console.error('Qlynk Agent: Missing data-widget-id attribute.');
    return;
  }

  // Determine the base URL (where the script is hosted)
  const scriptUrl = currentScript.src;
  const baseUrl = scriptUrl.substring(0, scriptUrl.lastIndexOf('/'));
  // If baseUrl is just a path, we need the origin
  const origin = baseUrl.startsWith('http') ? baseUrl.split('/').slice(0, 3).join('/') : window.location.origin;

  // Create the iframe
  const iframe = document.createElement('iframe');
  iframe.id = `qlynk-chat-widget-${identifier}`;
  iframe.title = 'Qlynk website chat';

  // Initial styles - small enough for the floating button but large enough for the tooltip/shadow
  const initialStyles = {
    position: 'fixed',
    bottom: '0',
    right: '0',
    width: '96px',
    height: '96px',
    border: 'none',
    zIndex: '2147483647',
    transition: 'width 0.3s ease, height 0.3s ease',
    background: 'transparent',
    colorScheme: 'none'
  };

  Object.assign(iframe.style, initialStyles);

  iframe.src = `${origin}/embed/${encodeURIComponent(identifier)}`;
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');

  let initAttempts = 0;
  let initRetryTimer = null;
  const maxInitAttempts = 40;

  const stopInitRetries = () => {
    if (initRetryTimer !== null) {
      window.clearInterval(initRetryTimer);
      initRetryTimer = null;
    }
  };

  const sendInit = () => {
    if (!iframe.isConnected || initAttempts >= maxInitAttempts) {
      stopInitRetries();
      return;
    }
    initAttempts += 1;
    iframe.contentWindow?.postMessage({ type: 'qlynk_widget_init' }, origin);
  };

  const startInitRetries = () => {
    sendInit();
    if (initRetryTimer === null && initAttempts < maxInitAttempts) {
      initRetryTimer = window.setInterval(sendInit, 250);
    }
  };

  iframe.addEventListener('load', () => {
    startInitRetries();
  });

  // Listen for messages from the iframe to resize
  window.addEventListener('message', (event) => {
    // Basic security check: ensure message is from our origin
    if (event.origin !== origin || event.source !== iframe.contentWindow) return;

    const type = typeof event.data === 'string' ? event.data : event.data?.type;

    if (type === 'qlynk_widget_ready') {
      sendInit();
      return;
    }

    if (type === 'qlynk_widget_initialized') {
      stopInitRetries();
      return;
    }

    if (type === 'qlynk_widget_position') {
      const position = event.data?.position === 'bottom-left' ? 'bottom-left' : 'bottom-right';
      iframe.style.left = position === 'bottom-left' ? '0' : 'auto';
      iframe.style.right = position === 'bottom-right' ? '0' : 'auto';
      return;
    }

    if (type === 'qlynk_chat_open') {
      iframe.style.width = 'min(420px, 100vw)';
      iframe.style.height = 'min(620px, 100dvh)';
    } else if (type === 'qlynk_chat_closed') {
      iframe.style.width = '96px';
      iframe.style.height = '96px';
    } else if (type === 'qlynk_widget_denied') {
      stopInitRetries();
      iframe.remove();
    }
  });

  const mountIframe = () => {
    if (!iframe.isConnected && document.body) {
      document.body.appendChild(iframe);
    }
  };

  if (document.body) {
    mountIframe();
  } else {
    document.addEventListener('DOMContentLoaded', mountIframe, { once: true });
  }
})();
