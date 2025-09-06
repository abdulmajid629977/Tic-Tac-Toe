// State
const APP_STATE = {
  apiKey: null,
  model: 'openai/gpt-oss-120b',
  messages: [],
  isRequestInFlight: false,
};

// Elements
const messagesEl = document.getElementById('messages');
const formEl = document.getElementById('chat-form');
const inputEl = document.getElementById('user-input');
const setKeyBtn = document.getElementById('set-api-key');
const apiKeyDialog = document.getElementById('api-key-dialog');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeySave = document.getElementById('api-key-save');

// Utils
function formatTimestamp(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function saveApiKey(key) {
  APP_STATE.apiKey = key;
  localStorage.setItem('groq_api_key', key);
}

function loadApiKey() {
  const key = localStorage.getItem('groq_api_key');
  if (key) APP_STATE.apiKey = key;
}

function escapeHtml(unsafe) {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Enhanced Markdown setup (marked + highlight.js + task lists + autolink)
function setupMarkdown() {
  if (!window.marked) return;

  function linkifyTextNode(textNode) {
    const urlRegex = /(https?:\/\/[^\s<]+)|(www\.[^\s<]+)/gi;
    const text = textNode.nodeValue;
    let match;
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    while ((match = urlRegex.exec(text)) !== null) {
      const url = match[0];
      const href = url.startsWith('http') ? url : `https://${url}`;
      if (match.index > lastIndex) frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      const a = document.createElement('a');
      a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = url;
      frag.appendChild(a);
      lastIndex = match.index + url.length;
    }
    if (lastIndex < text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    textNode.replaceWith(frag);
  }

  function enhanceHtml(html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    // Task lists: transform leading [ ] or [x]
    wrapper.querySelectorAll('li').forEach(li => {
      const text = li.textContent || '';
      const m = text.match(/^\s*\[( |x|X)\]\s+(.*)$/);
      if (m) {
        li.innerHTML = '';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.disabled = true;
        checkbox.checked = m[1].toLowerCase() === 'x';
        li.appendChild(checkbox);
        li.appendChild(document.createTextNode(' ' + m[2]));
      }
    });

    // Code block copy header injection
    wrapper.querySelectorAll('pre > code').forEach((codeEl) => {
      const pre = codeEl.parentElement;
      const langMatch = (codeEl.className || '').match(/language-([\w-]+)/);
      const label = (langMatch && langMatch[1]) || 'text';
      const id = 'cb_' + Math.random().toString(36).slice(2);
      codeEl.id = id;

      const header = document.createElement('div');
      header.className = 'code-header';
      const span = document.createElement('span');
      span.textContent = label;
      const btn = document.createElement('button');
      btn.className = 'code-copy'; btn.setAttribute('data-target', id); btn.textContent = 'Copy';
      header.appendChild(span); header.appendChild(btn);
      pre.parentElement.insertBefore(header, pre);

      if (window.hljs) {
        try { window.hljs.highlightElement(codeEl); } catch (_) {}
      }
    });

    // Autolink URLs in text nodes excluding code/pre/a
    const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentNode;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.nodeName.toLowerCase();
        if (tag === 'code' || tag === 'pre' || tag === 'a' || tag === 'script' || tag === 'style') return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !/(https?:\/\/|www\.)/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(linkifyTextNode);

    return wrapper.innerHTML;
  }

  window.renderMarkdown = function(mdText) {
    const rawHtml = marked.parse(mdText);
    return enhanceHtml(rawHtml);
  };
}

function renderMessage(message, index) {
  const side = message.role === 'user' ? 'user' : 'assistant';
  const avatarText = message.role === 'user' ? 'U' : 'AI';
  const timestamp = formatTimestamp(message.createdAt);
  const contentHtml = window.renderMarkdown ? window.renderMarkdown(message.content) : (window.marked ? marked.parse(message.content) : `<p>${escapeHtml(message.content)}</p>`);
  return `
    <div class="message ${side}" data-index="${index}">
      <div class="avatar">${avatarText}</div>
      <div class="bubble">
        <div class="row">
          <div class="meta">${message.role === 'user' ? 'You' : 'Assistant'} • ${timestamp}</div>
          <div class="hover-tools"><button class="copy-button" data-index="${index}">Copy</button></div>
        </div>
        <div class="content">${contentHtml}</div>
      </div>
    </div>
  `;
}

function renderMessages() {
  messagesEl.innerHTML = APP_STATE.messages.map((m, i) => renderMessage(m, i)).join('');

  // Bind copy for message bubble
  messagesEl.querySelectorAll('.copy-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-index'));
      const text = APP_STATE.messages[idx].content;
      navigator.clipboard.writeText(text);
      btn.textContent = 'Copied';
      setTimeout(() => (btn.textContent = 'Copy'), 1000);
    });
  });

  // Bind copy for code blocks
  messagesEl.querySelectorAll('.code-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const codeEl = document.getElementById(targetId);
      if (codeEl) {
        const text = codeEl.innerText;
        navigator.clipboard.writeText(text);
        btn.textContent = 'Copied';
        setTimeout(() => (btn.textContent = 'Copy'), 1000);
      }
    });
  });

  // Scroll to bottom
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addMessage(role, content) {
  APP_STATE.messages.push({ role, content, createdAt: new Date().toISOString() });
  renderMessages();
}

async function callGroqChat(messages) {
  const apiKey = APP_STATE.apiKey;
  if (!apiKey) throw new Error('Missing Groq API key');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: APP_STATE.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  return content;
}

// Events
formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const value = inputEl.value.trim();
  if (!value || APP_STATE.isRequestInFlight) return;
  if (!APP_STATE.apiKey) {
    apiKeyDialog.showModal();
    return;
  }

  addMessage('user', value);
  inputEl.value = '';

  try {
    APP_STATE.isRequestInFlight = true;
    const assistantContent = await callGroqChat(APP_STATE.messages);
    addMessage('assistant', assistantContent);
  } catch (err) {
    console.error(err);
    addMessage('assistant', `Error: ${(err && err.message) || 'Unknown error'}`);
  } finally {
    APP_STATE.isRequestInFlight = false;
  }
});

setKeyBtn.addEventListener('click', () => {
  apiKeyInput.value = APP_STATE.apiKey || '';
  apiKeyDialog.showModal();
});

apiKeySave.addEventListener('click', (e) => {
  e.preventDefault();
  const key = apiKeyInput.value.trim();
  if (key) {
    saveApiKey(key);
    apiKeyDialog.close();
  }
});

document.getElementById('api-key-cancel')?.addEventListener('click', (e) => {
  e.preventDefault();
  apiKeyDialog.close();
});

// Init
loadApiKey();
setupMarkdown();
renderMessages();
addMessage('assistant', 'Hi! Set your Groq API key to start chatting with openai/gpt-oss-120b.');

if (!APP_STATE.apiKey) {
  setTimeout(() => {
    try { apiKeyDialog.showModal(); } catch (_) {}
  }, 300);
}

