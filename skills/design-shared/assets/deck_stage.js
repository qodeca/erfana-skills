// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
/**
 * <deck-stage> — HTML slide shell web component
 *
 * Features:
 * - Fixed canvas size (default 1920x1080) + auto-scale + letterbox
 * - Keyboard navigation (<- / -> / Space / Home / End / Esc)
 * - Left/right click-zone navigation
 * - Slide counter (current / total)
 * - localStorage persistence of the current slide
 * - Speaker notes via postMessage (supports outer-frame rendering)
 * - Hash navigation (#slide-5 jumps to slide 5)
 * - Print-to-PDF support (Cmd+P / Ctrl+P, one page per slide)
 * - Automatically tags each slide with data-screen-label
 *
 * Usage:
 *   <deck-stage>
 *     <section>Slide 1</section>
 *     <section>Slide 2</section>
 *   </deck-stage>
 *
 * Custom dimensions:
 *   <deck-stage width="1080" height="1920">...</deck-stage>
 *
 * Speaker notes: add this in <head>
 *   <script type="application/json" id="speaker-notes">
 *   ["slide 1 notes", "slide 2 notes"]
 *   </script>
 */

(function() {
  const STORAGE_KEY_PREFIX = 'deck-stage-slide-';

  class DeckStage extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._currentSlide = 0;
      this._slides = [];
      this._storageKey = STORAGE_KEY_PREFIX + (location.pathname || 'default');
    }

    connectedCallback() {
      this._width = parseInt(this.getAttribute('width')) || 1920;
      this._height = parseInt(this.getAttribute('height')) || 1080;

      // Render the Shadow DOM first (independent of children, unaffected by parser timing)
      this._render();

      // Defensive: if the script is placed in <head> (rather than after </deck-stage>),
      // the parser may not have processed child <section> elements yet, so
      // querySelectorAll could return empty. Defer to the next event-loop tick
      // to ensure children are fully parsed.
      const init = () => {
        this._collectSlides();
        this._setupEventListeners();
        this._restoreSlide();
        this._updateDisplay();
        this._setupPrintStyles();
      };

      if (this.ownerDocument.readyState === 'loading') {
        // Document still parsing — wait for DOMContentLoaded to collect all sections at once
        this.ownerDocument.addEventListener('DOMContentLoaded', init, { once: true });
      } else {
        // Document already parsed (script at body end or `defer`); collect on the next frame
        requestAnimationFrame(init);
      }
    }

    _render() {
      // Safe-DOM construction — no inner-HTML setter so security hooks
      // (e.g., XSS-prevention pre-tool-use hooks) don't reject this script.
      // CSS lives as textContent on a <style> element (textContent is hook-safe).
      const css = `
        :host {
          display: block;
          position: fixed;
          inset: 0;
          background: #000;
          overflow: hidden;
          font-family: -apple-system, 'SF Pro Text', 'PingFang SC', sans-serif;
        }

        :host([noscale]) .stage {
          transform: none !important;
          top: 0 !important;
          left: 0 !important;
        }

        .stage {
          position: absolute;
          top: 50%;
          left: 50%;
          transform-origin: top left;
          will-change: transform;
          background: #fff;
        }

        .slide-wrapper {
          width: 100%;
          height: 100%;
          position: relative;
        }

        ::slotted(section) {
          display: none;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          overflow: hidden;
        }

        ::slotted(section.active) {
          display: block;
        }

        .counter {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-variant-numeric: tabular-nums;
          z-index: 100;
          user-select: none;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .counter:hover {
          opacity: 1;
        }

        .nav-zone {
          position: fixed;
          top: 0;
          bottom: 0;
          width: 15%;
          cursor: pointer;
          z-index: 50;
        }

        .nav-zone.left { left: 0; }
        .nav-zone.right { right: 0; }

        .nav-hint {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .nav-zone.left .nav-hint { left: 20px; }
        .nav-zone.right .nav-hint { right: 20px; }

        .nav-zone:hover .nav-hint {
          opacity: 1;
        }

        @media print {
          :host {
            position: static;
            background: #fff;
          }
          .counter, .nav-zone {
            display: none !important;
          }
          .stage {
            position: static;
            transform: none !important;
            page-break-after: always;
          }
          ::slotted(section) {
            display: block !important;
            position: relative !important;
            page-break-after: always;
            width: 100%;
            height: 100%;
          }
        }
      `;

      const styleEl = document.createElement('style');
      styleEl.textContent = css;

      // .stage > .slide-wrapper > <slot>
      const stage = document.createElement('div');
      stage.className = 'stage';
      stage.id = 'stage';
      stage.style.width = this._width + 'px';
      stage.style.height = this._height + 'px';

      const slideWrapper = document.createElement('div');
      slideWrapper.className = 'slide-wrapper';
      slideWrapper.appendChild(document.createElement('slot'));
      stage.appendChild(slideWrapper);

      // Left nav zone
      const navLeft = document.createElement('div');
      navLeft.className = 'nav-zone left';
      navLeft.id = 'navLeft';
      const navLeftHint = document.createElement('div');
      navLeftHint.className = 'nav-hint';
      navLeftHint.textContent = '‹';
      navLeft.appendChild(navLeftHint);

      // Right nav zone
      const navRight = document.createElement('div');
      navRight.className = 'nav-zone right';
      navRight.id = 'navRight';
      const navRightHint = document.createElement('div');
      navRightHint.className = 'nav-hint';
      navRightHint.textContent = '›';
      navRight.appendChild(navRightHint);

      // Counter
      const counter = document.createElement('div');
      counter.className = 'counter';
      counter.id = 'counter';
      counter.textContent = '1 / 1';

      this.shadowRoot.replaceChildren(styleEl, stage, navLeft, navRight, counter);
    }

    _collectSlides() {
      this._slides = Array.from(this.querySelectorAll(':scope > section'));

      this._slides.forEach((slide, idx) => {
        if (!slide.hasAttribute('data-screen-label')) {
          const num = String(idx + 1).padStart(2, '0');
          slide.setAttribute('data-screen-label', num);
        }
        if (!slide.hasAttribute('data-om-validate')) {
          slide.setAttribute('data-om-validate', '');
        }
      });
    }

    _setupEventListeners() {
      window.addEventListener('resize', () => this._updateScale());

      document.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea, [contenteditable]')) return;

        switch (e.key) {
          case 'ArrowRight':
          case ' ':
          case 'PageDown':
            e.preventDefault();
            this.next();
            break;
          case 'ArrowLeft':
          case 'PageUp':
            e.preventDefault();
            this.prev();
            break;
          case 'Home':
            e.preventDefault();
            this.goTo(0);
            break;
          case 'End':
            e.preventDefault();
            this.goTo(this._slides.length - 1);
            break;
        }
      });

      this.shadowRoot.getElementById('navLeft').addEventListener('click', () => this.prev());
      this.shadowRoot.getElementById('navRight').addEventListener('click', () => this.next());

      window.addEventListener('hashchange', () => this._handleHash());
      if (location.hash) {
        setTimeout(() => this._handleHash(), 0);
      }

      const observer = new MutationObserver(() => {
        if (this.hasAttribute('noscale')) {
          this._updateScale();
        }
      });
      observer.observe(this, { attributes: true, attributeFilter: ['noscale'] });
    }

    _handleHash() {
      const match = location.hash.match(/^#slide-(\d+)$/);
      if (match) {
        const idx = parseInt(match[1]) - 1;
        if (idx >= 0 && idx < this._slides.length) {
          this.goTo(idx);
        }
      }
    }

    _restoreSlide() {
      try {
        const stored = localStorage.getItem(this._storageKey);
        if (stored !== null) {
          const idx = parseInt(stored);
          if (idx >= 0 && idx < this._slides.length) {
            this._currentSlide = idx;
          }
        }
      } catch (e) {}
    }

    _saveSlide() {
      try {
        localStorage.setItem(this._storageKey, String(this._currentSlide));
      } catch (e) {}
    }

    _updateScale() {
      if (this.hasAttribute('noscale')) {
        const stage = this.shadowRoot.getElementById('stage');
        stage.style.transform = 'none';
        stage.style.top = '0';
        stage.style.left = '0';
        return;
      }

      const stage = this.shadowRoot.getElementById('stage');
      if (!stage) return;

      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const scale = Math.min(viewportW / this._width, viewportH / this._height);
      const scaledW = this._width * scale;
      const scaledH = this._height * scale;
      const offsetX = (viewportW - scaledW) / 2;
      const offsetY = (viewportH - scaledH) / 2;

      stage.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
      stage.style.top = '0';
      stage.style.left = '0';
    }

    _updateDisplay() {
      this._slides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === this._currentSlide);
      });

      const counter = this.shadowRoot.getElementById('counter');
      if (counter) {
        counter.textContent = `${this._currentSlide + 1} / ${this._slides.length}`;
      }

      this._updateScale();

      try {
        window.postMessage({
          slideIndexChanged: this._currentSlide,
          totalSlides: this._slides.length
        }, '*');
      } catch (e) {}

      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            slideIndexChanged: this._currentSlide,
            totalSlides: this._slides.length
          }, '*');
        }
      } catch (e) {}
    }

    _setupPrintStyles() {
      const printStyle = document.createElement('style');
      printStyle.textContent = `
        @media print {
          @page {
            size: ${this._width}px ${this._height}px;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          deck-stage {
            position: static !important;
          }
          deck-stage > section {
            display: block !important;
            position: relative !important;
            width: ${this._width}px !important;
            height: ${this._height}px !important;
            page-break-after: always;
            overflow: hidden;
          }
          deck-stage > section:last-child {
            page-break-after: auto;
          }
        }
      `;
      document.head.appendChild(printStyle);
    }

    next() {
      if (this._currentSlide < this._slides.length - 1) {
        this._currentSlide++;
        this._saveSlide();
        this._updateDisplay();
      }
    }

    prev() {
      if (this._currentSlide > 0) {
        this._currentSlide--;
        this._saveSlide();
        this._updateDisplay();
      }
    }

    goTo(idx) {
      if (idx >= 0 && idx < this._slides.length) {
        this._currentSlide = idx;
        this._saveSlide();
        this._updateDisplay();
      }
    }

    get currentSlide() {
      return this._currentSlide;
    }

    get totalSlides() {
      return this._slides.length;
    }
  }

  customElements.define('deck-stage', DeckStage);

  window.DeckStage = DeckStage;
})();
