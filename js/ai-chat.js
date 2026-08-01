/**
 * AI Chat Engine for O Evangelho Segundo o Espiritismo
 * RAG Context Retrieval & Q&A Assistant
 */

const AIChat = {
  apiKey: localStorage.getItem('evangelho_gemini_key') || '',
  provider: localStorage.getItem('evangelho_ai_provider') || 'auto', // 'gemini', 'openai', or 'local'

  init() {
    this.bindEvents();
    this.renderInitialGreeting();
  },

  bindEvents() {
    const sendBtn = document.getElementById('chat-send-btn');
    const inputEl = document.getElementById('chat-input');
    const settingsBtn = document.getElementById('btn-chat-settings');

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.handleSendMessage());
    }

    if (inputEl) {
      inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSendMessage();
        }
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettingsModal());
    }

    // Delegate chips click
    const chipsContainer = document.getElementById('chip-suggestions');
    if (chipsContainer) {
      chipsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip')) {
          const query = e.target.textContent;
          if (inputEl) inputEl.value = query;
          this.handleSendMessage();
        }
      });
    }

    // Modal settings
    const saveSettingsBtn = document.getElementById('modal-save-settings');
    const closeSettingsBtn = document.getElementById('modal-close-settings');
    const modalOverlay = document.getElementById('settings-modal');

    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => {
        const keyInput = document.getElementById('input-gemini-key');
        const providerSelect = document.getElementById('select-ai-provider');
        if (keyInput) {
          this.apiKey = keyInput.value.trim();
          localStorage.setItem('evangelho_gemini_key', this.apiKey);
        }
        if (providerSelect) {
          this.provider = providerSelect.value;
          localStorage.setItem('evangelho_ai_provider', this.provider);
        }
        if (modalOverlay) modalOverlay.classList.remove('active');
        this.addSystemMessage('Configurações salvas com sucesso!');
      });
    }

    if (closeSettingsBtn && modalOverlay) {
      closeSettingsBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
      });
    }
  },

  openSettingsModal() {
    const modalOverlay = document.getElementById('settings-modal');
    const keyInput = document.getElementById('input-gemini-key');
    const providerSelect = document.getElementById('select-ai-provider');

    if (keyInput) keyInput.value = this.apiKey;
    if (providerSelect) providerSelect.value = this.provider;
    if (modalOverlay) modalOverlay.classList.add('active');
  },

  renderInitialGreeting() {
    const msgContainer = document.getElementById('chat-messages');
    if (!msgContainer) return;

    msgContainer.innerHTML = `
      <div class="msg ai">
        <div class="msg-bubble">
          Olá! Sou o <b>Assistente Virtual do Evangelho Segundo o Espiritismo</b>. 🕊️<br><br>
          Posso responder suas dúvidas sobre os ensinamentos, parábolas, explicações morais de Allan Kardec e instruções dos Espíritos contidas neste livro.<br><br>
          Como posso ajudar seus estudos hoje?
        </div>
      </div>
    `;
  },

  async handleSendMessage() {
    const inputEl = document.getElementById('chat-input');
    if (!inputEl) return;

    const query = inputEl.value.trim();
    if (!query) return;

    // Append user message
    this.appendMessage('user', query);
    inputEl.value = '';

    // Show typing indicator
    const typingId = this.appendTypingIndicator();

    try {
      // 1. Perform Context Retrieval (RAG)
      const contextMatches = this.retrieveContext(query);

      // 2. Generate Answer
      let responseText = '';
      let sources = contextMatches;

      if (this.apiKey && (this.provider === 'gemini' || this.provider === 'auto')) {
        responseText = await this.callGeminiAPI(query, contextMatches);
      } else {
        responseText = this.generateLocalRAGResponse(query, contextMatches);
      }

      this.removeTypingIndicator(typingId);
      this.appendMessage('ai', responseText, sources);

    } catch (err) {
      console.error("Erro na resposta da IA:", err);
      this.removeTypingIndicator(typingId);
      
      // Fallback to local RAG on error
      const contextMatches = this.retrieveContext(query);
      const fallbackText = this.generateLocalRAGResponse(query, contextMatches);
      this.appendMessage('ai', fallbackText, contextMatches);
    }
  },

  appendMessage(sender, text, sources = []) {
    const msgContainer = document.getElementById('chat-messages');
    if (!msgContainer) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${sender}`;

    let html = `<div class="msg-bubble">${text}</div>`;

    if (sources && sources.length > 0) {
      html += `
        <div class="msg-sources">
          <div class="msg-sources-title">📖 Trechos consultados no livro:</div>
          ${sources.map(s => `<div>• <b>${s.chapterTitle}</b>: ${s.sectionTitle}</div>`).join('')}
        </div>
      `;
    }

    msgDiv.innerHTML = html;
    msgContainer.appendChild(msgDiv);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  },

  addSystemMessage(text) {
    this.appendMessage('ai', `<i>${text}</i>`);
  },

  appendTypingIndicator() {
    const msgContainer = document.getElementById('chat-messages');
    if (!msgContainer) return null;

    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'msg ai';
    div.innerHTML = `<div class="msg-bubble"><i>Consultando o livro e elaborando resposta...</i></div>`;
    msgContainer.appendChild(div);
    msgContainer.scrollTop = msgContainer.scrollHeight;
    return id;
  },

  removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  },

  /**
   * Search BOOK_DATA for sections most relevant to user's query
   */
  retrieveContext(query) {
    if (!window.BOOK_DATA || !BOOK_DATA.chapters) return [];

    const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const words = normalizedQuery.split(/\s+/).filter(w => w.length > 3);

    const matches = [];

    BOOK_DATA.chapters.forEach(chap => {
      let chapScore = 0;
      const normalize = (text) => (text || '')
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const titleNorm = normalize(chap.title);
      const subtitleNorm = normalize(chap.subtitle);
      const summaryNorm = normalize(chap.summary);

      if (titleNorm.includes(normalizedQuery)) chapScore += 100;

      words.forEach(w => {
        if (titleNorm.includes(w)) chapScore += 50;
        if (subtitleNorm.includes(w)) chapScore += 15;
        if (summaryNorm.includes(w)) chapScore += 5;
      });

      chap.sections.forEach(sec => {
        let secScore = chapScore;
        const secText = (sec.title + " " + sec.content.join(" "))
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        words.forEach(w => {
          const count = (secText.split(w).length - 1);
          secScore += Math.min(count, 5) * 2;
        });

        if (secScore > 0) {
          matches.push({
            chapterId: chap.id,
            chapterTitle: chap.title,
            sectionTitle: sec.title,
            score: secScore,
            summary: chap.summary,
            paragraphs: sec.content
          });
        }
      });
    });

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, 3);
  },

  /**
   * Generate intelligent structured response locally if no API key is provided
   */
  generateLocalRAGResponse(query, matches) {
    if (!matches || matches.length === 0) {
      return `Não encontrei uma passagem exata para a busca "<b>${query}</b>" no sumário principal. Você pode navegar pelos capítulos no menu lateral ou refazer a pergunta com termos como <i>'perdão'</i>, <i>'caridade'</i>, <i>'aflições'</i>, <i>'prece'</i>, ou <i>'reencarnação'</i>.`;
    }

    const topMatch = matches[0];
    let contentSnippet = topMatch.paragraphs.slice(0, 4).map(p => `<p style="margin-bottom:8px;">${p}</p>`).join('');

    return `
      <b>Com base no ${topMatch.chapterTitle} (${topMatch.sectionTitle}):</b><br><br>
      ${contentSnippet}
      <br>
      <div style="margin-top:10px; font-size:0.9em; opacity:0.9;">
        💡 <i>Dica: Você pode ir até este capítulo no leitor para conferir a explicação completa de Allan Kardec e as Instruções dos Espíritos.</i>
      </div>
    `;
  },

  /**
   * Call Gemini API with retrieved context
   */
  async callGeminiAPI(query, matches) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

    const contextText = matches.map(m => `
[${m.chapterTitle} - ${m.sectionTitle}]
${m.paragraphs.join("\n")}
    `).join("\n\n");

    const prompt = `
Você é a IA oficial de estudos do livro "O Evangelho Segundo o Espiritismo" de Allan Kardec (tradução Guillon Ribeiro / FEB).
Sua missão é responder à pergunta do usuário de forma clara, acolhedora, respeitosa, precisa e bem fundamentada na Doutrina Espírita.

Contexto extraído do livro para esta pergunta:
---
${contextText}
---

Pergunta do Usuário: ${query}

Instruções para sua resposta:
1. Responda em Português usando formatação limpa (tags HTML como <b>, <br>, <i> se apropriado).
2. Cite expressamente o capítulo e ensinamento relevante.
3. Mantenha o tom fraternal, respeitoso e instrutivo.
    `;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const candidates = data.candidates;
    if (candidates && candidates.length > 0 && candidates[0].content) {
      return candidates[0].content.parts[0].text.replace(/\n/g, '<br>');
    } else {
      throw new Error('Sem resposta válida da API.');
    }
  }
};

window.AIChat = AIChat;
