(function() {
  // Get the current script tag to extract configuration
  const scripts = document.getElementsByTagName('script');
  let currentScript = null;
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src.includes('q-agent.js')) {
      currentScript = scripts[i];
      break;
    }
  }

  if (!currentScript) return;

  const username = currentScript.getAttribute('data-username');
  if (!username) {
    console.error('Q-Agent: Missing data-username attribute on script tag.');
    return;
  }

  // Determine the base URL (where the script is hosted)
  const scriptUrl = currentScript.src;
  const baseUrl = scriptUrl.substring(0, scriptUrl.lastIndexOf('/'));
  // If baseUrl is just a path, we need the origin
  const origin = baseUrl.startsWith('http') ? baseUrl.split('/').slice(0, 3).join('/') : window.location.origin;

  // Create the iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'qlynk-chat-widget';
  
  // Initial styles - small enough for the floating button but large enough for the tooltip/shadow
  const initialStyles = {
    position: 'fixed',
    bottom: '0',
    right: '0',
    width: '120px',
    height: '120px',
    border: 'none',
    zIndex: '2147483647',
    transition: 'width 0.3s ease, height 0.3s ease',
    background: 'transparent',
    colorScheme: 'none'
  };

  Object.assign(iframe.style, initialStyles);
  
  iframe.src = `${origin}/embed/${username}`;
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
  
  document.body.appendChild(iframe);
  
  // Listen for messages from the iframe to resize
  window.addEventListener('message', (event) => {
    // Basic security check: ensure message is from our origin
    if (event.origin !== origin) return;

    if (event.data === 'qlynk_chat_open') {
      iframe.style.width = '420px';
      iframe.style.height = '620px';
    } else if (event.data === 'qlynk_chat_closed') {
      iframe.style.width = '120px';
      iframe.style.height = '120px';
    }
  });
})();
