/**
 * Main Application Logic for O Evangelho Segundo o Espiritismo
 */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  currentChapterId: 'prefacio',
  currentFontSize: 1.125, // rem

  init() {
    this.renderSidebar();
    this.bindEvents();
    this.checkUrlHash();
    if (window.AIChat) {
      window.AIChat.init();
    }
  },

  renderSidebar() {
    const listContainer = document.getElementById('sidebar-list');
    if (!listContainer || !window.BOOK_DATA) return;

    listContainer.innerHTML = '';

    BOOK_DATA.chapters.forEach(chap => {
      const item = document.createElement('a');
      item.className = `chapter-item ${chap.id === this.currentChapterId ? 'active' : ''}`;
      item.id = `nav-${chap.id}`;
      item.href = `#${chap.id}`;
      
      const numLabel = chap.number > 0 ? (Number.isInteger(chap.number) ? `Capítulo ${chap.number}` : 'Introdução') : 'Abertura';

      item.innerHTML = `
        <span class="chapter-num">${numLabel}</span>
        <strong>${chap.title}</strong>
      `;

      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadChapter(chap.id);
        if (window.innerWidth <= 992) {
          document.getElementById('sidebar')?.classList.remove('open');
        }
      });

      listContainer.appendChild(item);
    });
  },

  bindEvents() {
    // Theme toggle
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        themeBtn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('evangelho_theme', newTheme);
      });

      // Restore saved theme
      const savedTheme = localStorage.getItem('evangelho_theme');
      if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        themeBtn.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
      }
    }

    // Font size controls
    const fontIncBtn = document.getElementById('btn-font-increase');
    const fontDecBtn = document.getElementById('btn-font-decrease');

    if (fontIncBtn) {
      fontIncBtn.addEventListener('click', () => {
        if (this.currentFontSize < 1.6) {
          this.currentFontSize += 0.1;
          document.documentElement.style.setProperty('--reader-font-size', `${this.currentFontSize}rem`);
        }
      });
    }

    if (fontDecBtn) {
      fontDecBtn.addEventListener('click', () => {
        if (this.currentFontSize > 0.9) {
          this.currentFontSize -= 0.1;
          document.documentElement.style.setProperty('--reader-font-size', `${this.currentFontSize}rem`);
        }
      });
    }

    // Toggle Chat Drawer
    const aiToggleBtn = document.getElementById('btn-toggle-ai');
    const chatDrawer = document.getElementById('chat-drawer');
    if (aiToggleBtn && chatDrawer) {
      aiToggleBtn.addEventListener('click', () => {
        chatDrawer.classList.toggle('collapsed');
      });
    }

    const chatCloseBtn = document.getElementById('chat-close-btn');
    if (chatCloseBtn && chatDrawer) {
      chatCloseBtn.addEventListener('click', () => {
        chatDrawer.classList.add('collapsed');
      });
    }

    // Toggle Mobile Sidebar
    const mobileMenuBtn = document.getElementById('btn-mobile-menu');
    const sidebar = document.getElementById('sidebar');
    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Chapter filter search in sidebar
    const filterInput = document.getElementById('chapter-filter-input');
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        document.querySelectorAll('.chapter-item').forEach(item => {
          const text = item.textContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (text.includes(val)) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    }

    // Header search
    const globalSearchInput = document.getElementById('global-search-input');
    if (globalSearchInput) {
      globalSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const val = globalSearchInput.value.trim();
          if (val && window.AIChat) {
            // Open chat and trigger query
            document.getElementById('chat-drawer')?.classList.remove('collapsed');
            const chatInput = document.getElementById('chat-input');
            if (chatInput) chatInput.value = val;
            window.AIChat.handleSendMessage();
          }
        }
      });
    }

    // Hash change event
    window.addEventListener('hashchange', () => this.checkUrlHash());
  },

  checkUrlHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash && window.BOOK_DATA) {
      const exists = BOOK_DATA.chapters.some(c => c.id === hash);
      if (exists) {
        this.loadChapter(hash);
      } else {
        this.loadChapter('prefacio');
      }
    } else {
      this.loadChapter('prefacio');
    }
  },

  loadChapter(chapterId) {
    if (!window.BOOK_DATA) return;

    const chap = BOOK_DATA.chapters.find(c => c.id === chapterId);
    if (!chap) return;

    this.currentChapterId = chapterId;
    window.location.hash = chapterId;

    // Update active state in sidebar
    document.querySelectorAll('.chapter-item').forEach(item => item.classList.remove('active'));
    const activeNav = document.getElementById(`nav-${chapterId}`);
    if (activeNav) activeNav.classList.add('active');

    // Render Content in Reader View
    const readerContainer = document.getElementById('reader-container');
    const contentBox = document.getElementById('reader-content');

    if (!contentBox) return;

    const badgeLabel = chap.number > 0 ? (Number.isInteger(chap.number) ? `Capítulo ${chap.number}` : 'Introdução') : 'Abertura';

    let sectionsHtml = chap.sections.map(sec => `
      <div class="reader-section">
        <h3 class="section-title">${sec.title}</h3>
        ${sec.subtitle ? `<h4 style="color:var(--text-secondary); font-size:1rem; margin-bottom:1rem; font-style:italic;">${sec.subtitle}</h4>` : ''}
        ${sec.content.map(p => `<p>${p}</p>`).join('')}
      </div>
    `).join('');

    // Previous & Next Chapter Links
    const chapIndex = BOOK_DATA.chapters.findIndex(c => c.id === chapterId);
    const prevChap = chapIndex > 0 ? BOOK_DATA.chapters[chapIndex - 1] : null;
    const nextChap = chapIndex < BOOK_DATA.chapters.length - 1 ? BOOK_DATA.chapters[chapIndex + 1] : null;

    contentBox.innerHTML = `
      <div class="reader-header">
        <span class="chapter-badge">${badgeLabel}</span>
        <h1 class="reader-title">${chap.title}</h1>
        ${chap.subtitle ? `<div class="reader-subtitle">${chap.subtitle}</div>` : ''}
        ${chap.summary ? `<div class="reader-summary"><b>Síntese:</b> ${chap.summary}</div>` : ''}
      </div>
      <div class="reader-body">
        ${sectionsHtml}
      </div>
      <div class="reader-nav">
        ${prevChap ? `<a class="btn-nav" onclick="App.loadChapter('${prevChap.id}')">← ${prevChap.title}</a>` : '<div></div>'}
        ${nextChap ? `<a class="btn-nav" onclick="App.loadChapter('${nextChap.id}')">${nextChap.title} →</a>` : '<div></div>'}
      </div>
    `;

    if (readerContainer) {
      readerContainer.scrollTop = 0;
    }
  }
};

window.App = App;
