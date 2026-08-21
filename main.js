document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. LÓGICA DO POPUP (DIALOG) E GESTÃO DE FOCO
  // ==========================================
  const dialog = document.getElementById('accessibility-popup');
  const btnOpen = document.getElementById('btn-open-popup');
  const btnClose = document.getElementById('btn-close-popup');
  const announcer = document.getElementById('accessibility-announcer');

  function openDialog() {
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
      if (btnOpen) btnOpen.setAttribute('aria-expanded', 'true');
    }
  }

  function closeDialog() {
    if (dialog) {
      dialog.close();
      if (btnOpen) {
        btnOpen.setAttribute('aria-expanded', 'false');
        btnOpen.focus(); // Retorna o foco ao botão de origem
      }
    }
  }

  if (btnOpen) {
    btnOpen.addEventListener('click', openDialog);
  }

  if (btnClose) {
    btnClose.addEventListener('click', closeDialog);
  }

  if (dialog) {
    dialog.addEventListener('cancel', () => {
      if (btnOpen) btnOpen.setAttribute('aria-expanded', 'false');
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        closeDialog();
      }
    });
  }

  // ==========================================
  // 2. CONTROLE DE TAMANHO DE FONTE ACESSÍVEL
  // ==========================================
  const btnIncrease = document.getElementById('btn-increase');
  const btnDecrease = document.getElementById('btn-decrease');
  const btnReset = document.getElementById('btn-reset');
  const fontSizeIndicator = document.getElementById('font-size-indicator');

  const DEFAULT_SCALE = 100;
  const MIN_SCALE = 75;
  const MAX_SCALE = 150;
  const SCALE_STEP = 12.5;

  let currentScale = parseFloat(localStorage.getItem('fontSizeScale')) || DEFAULT_SCALE;

  function announceToScreenReader(message) {
    if (announcer) {
      announcer.textContent = '';
      setTimeout(() => {
        announcer.textContent = message;
      }, 100);
    }
  }

  function applyFontScale(newScale, announceText = '') {
    currentScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
    document.documentElement.style.fontSize = `${currentScale}%`;

    try {
      localStorage.setItem('fontSizeScale', currentScale.toString());
    } catch (e) {
      console.warn('localStorage não disponível:', e);
    }

    if (fontSizeIndicator) {
      fontSizeIndicator.textContent = `${Math.round(currentScale)}%`;
    }

    const isAtMin = currentScale <= MIN_SCALE;
    const isAtMax = currentScale >= MAX_SCALE;
    const isAtDefault = currentScale === DEFAULT_SCALE;

    if (btnDecrease) {
      btnDecrease.disabled = isAtMin;
      btnDecrease.setAttribute('aria-disabled', isAtMin.toString());
    }

    if (btnIncrease) {
      btnIncrease.disabled = isAtMax;
      btnIncrease.setAttribute('aria-disabled', isAtMax.toString());
    }

    if (btnReset) {
      btnReset.disabled = isAtDefault;
      btnReset.setAttribute('aria-disabled', isAtDefault.toString());
    }

    if (announceText) {
      announceToScreenReader(announceText);
    }
  }

  if (btnIncrease) {
    btnIncrease.addEventListener('click', () => {
      if (currentScale < MAX_SCALE) {
        const nextScale = currentScale + SCALE_STEP;
        const msg = nextScale >= MAX_SCALE
          ? `Tamanho da fonte aumentado para o limite máximo de ${Math.round(MAX_SCALE)}%`
          : `Tamanho da fonte aumentado para ${Math.round(nextScale)}%`;
        applyFontScale(nextScale, msg);
      } else {
        announceToScreenReader(`Tamanho da fonte já está no limite máximo de ${Math.round(MAX_SCALE)}%`);
      }
    });
  }

  if (btnDecrease) {
    btnDecrease.addEventListener('click', () => {
      if (currentScale > MIN_SCALE) {
        const nextScale = currentScale - SCALE_STEP;
        const msg = nextScale <= MIN_SCALE
          ? `Tamanho da fonte diminuído para o limite mínimo de ${Math.round(MIN_SCALE)}%`
          : `Tamanho da fonte diminuído para ${Math.round(nextScale)}%`;
        applyFontScale(nextScale, msg);
      } else {
        announceToScreenReader(`Tamanho da fonte já está no limite mínimo de ${Math.round(MIN_SCALE)}%`);
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      applyFontScale(DEFAULT_SCALE, 'Tamanho da fonte restaurado para o padrão de 100%');
    });
  }

  applyFontScale(currentScale);

  // ==========================================
  // 3. SINTETIZADOR DE VOZ DE LOCUTOR (TTS)
  // ==========================================
  const synth = window.speechSynthesis;
  const btnReadPage = document.getElementById('btn-tts-read-page');
  const btnStopSpeech = document.getElementById('btn-tts-stop');
  const speedSelect = document.getElementById('tts-speed-select');

  let activeHighlightElem = null;
  let isPageReading = false;
  let pageReadingQueue = [];
  let pageReadingIndex = 0;

  function clearActiveHighlight() {
    if (activeHighlightElem) {
      activeHighlightElem.classList.remove('tts-reading-active');
      activeHighlightElem = null;
    }
  }

  function setHighlight(elem) {
    clearActiveHighlight();
    if (elem) {
      activeHighlightElem = elem;
      activeHighlightElem.classList.add('tts-reading-active');
      activeHighlightElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function updateTtsControlsState(isSpeaking) {
    if (btnStopSpeech) {
      btnStopSpeech.disabled = !isSpeaking;
      btnStopSpeech.setAttribute('aria-disabled', (!isSpeaking).toString());
    }
    if (btnReadPage) {
      btnReadPage.textContent = isSpeaking ? '⏸️ Pausar Leitura' : '▶️ Ouvir Página';
    }
  }

  function stopSpeech() {
    if (synth) {
      synth.cancel();
    }
    isPageReading = false;
    pageReadingQueue = [];
    pageReadingIndex = 0;
    clearActiveHighlight();
    updateTtsControlsState(false);
  }

  function speakText(text, targetElem = null, onEndCallback = null) {
    if (!synth) {
      announceToScreenReader('Síntese de voz não é suportada neste navegador.');
      return;
    }

    synth.cancel();

    if (!text || text.trim() === '') return;

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = 'pt-BR';

    // Velocidade de leitura escolhida
    const speed = speedSelect ? parseFloat(speedSelect.value) : 1.0;
    utterance.rate = speed;

    // Tentar selecionar voz em Português
    const voices = synth.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR') || v.lang.includes('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    if (targetElem) {
      setHighlight(targetElem);
    }

    utterance.onstart = () => {
      updateTtsControlsState(true);
    };

    utterance.onend = () => {
      clearActiveHighlight();
      if (onEndCallback) {
        onEndCallback();
      } else if (!isPageReading) {
        updateTtsControlsState(false);
      }
    };

    utterance.onerror = () => {
      clearActiveHighlight();
      updateTtsControlsState(false);
    };

    synth.speak(utterance);
  }

  // Leitura sequencial de toda a página
  function startPageReading() {
    const readableElems = Array.from(document.querySelectorAll('.readable-text, .card h3, section h2, .hero h1'));
    if (readableElems.length === 0) return;

    if (synth.speaking && isPageReading) {
      stopSpeech();
      return;
    }

    isPageReading = true;
    pageReadingQueue = readableElems;
    pageReadingIndex = 0;

    function readNextItem() {
      if (!isPageReading || pageReadingIndex >= pageReadingQueue.length) {
        stopSpeech();
        announceToScreenReader('Leitura da página concluída.');
        return;
      }

      const elem = pageReadingQueue[pageReadingIndex];
      pageReadingIndex++;

      const text = elem.innerText || elem.textContent;
      speakText(text, elem, () => {
        readNextItem();
      });
    }

    readNextItem();
  }

  // Event Listeners dos botões globais de áudio
  if (btnReadPage) {
    btnReadPage.addEventListener('click', () => {
      if (synth.speaking && isPageReading) {
        stopSpeech();
      } else {
        startPageReading();
      }
    });
  }

  if (btnStopSpeech) {
    btnStopSpeech.addEventListener('click', stopSpeech);
  }

  // Associar botões individuais .btn-tts e .btn-tts-icon
  document.querySelectorAll('.btn-tts, .btn-tts-icon').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();

      // Encontrar o contêiner ou texto correspondente
      const sectionOrCard = btn.closest('.hero-content, .sobre-content, .card, .container');
      if (sectionOrCard) {
        const textElements = sectionOrCard.querySelectorAll('.readable-text, h1, h2, h3, p');
        const fullText = Array.from(textElements).map(el => el.innerText).join('. ');
        speakText(fullText, sectionOrCard);
      }
    });
  });

  // Garantir carregamento prévio de vozes do browser
  if (synth && typeof synth.onvoiceschanged !== 'undefined') {
    synth.onvoiceschanged = () => {
      synth.getVoices();
    };
  }

  // ==========================================
  // 4. ATALHOS DE TECLADO DE ACESSIBILIDADE
  // ==========================================
  document.addEventListener('keydown', (e) => {
    // Atalho Alt + '+' ou Alt + '=' (Aumentar fonte)
    if (e.altKey && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      if (btnIncrease && !btnIncrease.disabled) {
        btnIncrease.click();
      }
    }
    // Atalho Alt + '-' (Diminuir fonte)
    else if (e.altKey && e.key === '-') {
      e.preventDefault();
      if (btnDecrease && !btnDecrease.disabled) {
        btnDecrease.click();
      }
    }
    // Atalho Alt + '0' (Restaurar fonte)
    else if (e.altKey && e.key === '0') {
      e.preventDefault();
      if (btnReset && !btnReset.disabled) {
        btnReset.click();
      }
    }
    // Atalho Alt + 'V' (Iniciar/Parar Voz de Locutor)
    else if (e.altKey && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      if (synth && synth.speaking) {
        stopSpeech();
      } else {
        startPageReading();
      }
    }
  });
});