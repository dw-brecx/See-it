/* SeeIt customer app — light navigation + UI helpers */
(function () {
  'use strict';

  // Bottom nav active state
  function markActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'home.html';
    document.querySelectorAll('[data-nav-target]').forEach(function (el) {
      var target = el.getAttribute('data-nav-target');
      if (!target) return;
      var matches = target.split(',').map(function (s) { return s.trim(); });
      if (matches.indexOf(path) !== -1) el.classList.add('bottom-nav__item--active');
    });
  }

  // Onboarding slides
  function initOnboarding() {
    var slides = document.querySelectorAll('[data-slide]');
    var dots   = document.querySelectorAll('[data-dot]');
    var next   = document.querySelector('[data-onboard-next]');
    if (!slides.length) return;
    var i = 0;
    function show(idx) {
      slides.forEach(function (s, n) { s.style.display = n === idx ? 'flex' : 'none'; });
      dots.forEach(function (d, n) { d.classList.toggle('is-active', n === idx); });
      if (next) next.textContent = idx === slides.length - 1 ? 'Get Started' : 'Continue';
    }
    show(0);
    if (next) {
      next.addEventListener('click', function (e) {
        if (i < slides.length - 1) {
          e.preventDefault();
          i++;
          show(i);
        }
      });
    }
    dots.forEach(function (d, n) {
      d.addEventListener('click', function () { i = n; show(i); });
    });
  }

  // Segmented control (tabs)
  function initSegments() {
    document.querySelectorAll('[data-segment]').forEach(function (group) {
      var btns = group.querySelectorAll('.segmented__btn');
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          var href = b.getAttribute('data-href');
          if (href) { window.location.href = href; return; }
          btns.forEach(function (x) { x.classList.remove('segmented__btn--active'); });
          b.classList.add('segmented__btn--active');
        });
      });
    });
  }

  // Underline tabs (visual)
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (group) {
      var items = group.querySelectorAll('.tabs__item');
      items.forEach(function (el) {
        el.addEventListener('click', function (e) {
          var href = el.getAttribute('href');
          if (el.tagName !== 'A' || !href || href.startsWith('#')) {
            e.preventDefault();
            items.forEach(function (x) { x.classList.remove('tabs__item--active'); });
            el.classList.add('tabs__item--active');
          }
        });
      });
    });
  }

  // Filter chip toggle
  function initChips() {
    document.querySelectorAll('[data-chip-toggle]').forEach(function (el) {
      el.addEventListener('click', function () { el.classList.toggle('chip--active'); });
    });
  }

  // Mood / portion / picker active states
  function initPickers() {
    document.querySelectorAll('[data-mood]').forEach(function (el) {
      el.addEventListener('click', function () { el.classList.toggle('is-active'); });
    });
    document.querySelectorAll('[data-pick]').forEach(function (el) {
      el.addEventListener('click', function () { el.classList.toggle('is-active'); });
    });
    // Single-choice groups
    document.querySelectorAll('[data-pick-group]').forEach(function (group) {
      var btns = group.querySelectorAll('[data-pick-one]');
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.classList.remove('is-active'); });
          b.classList.add('is-active');
        });
      });
    });
  }

  // Star rating selector
  function initStarSelect() {
    document.querySelectorAll('[data-star-select]').forEach(function (wrap) {
      var stars = wrap.querySelectorAll('svg');
      stars.forEach(function (s, idx) {
        s.addEventListener('click', function () {
          stars.forEach(function (x, n) {
            x.style.color = n <= idx ? 'var(--color-star)' : 'var(--color-border-strong)';
          });
        });
      });
    });
  }

  // Heart / save toggle
  function initSaveButtons() {
    document.querySelectorAll('[data-save]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.toggle('is-saved');
        var path = btn.querySelector('path');
        if (path) {
          var saved = btn.classList.contains('is-saved');
          path.setAttribute('fill', saved ? '#E85D3A' : 'none');
          path.setAttribute('stroke', saved ? '#E85D3A' : '#1A1A1A');
        }
      });
    });
  }

  // Sheet open/close
  function initSheets() {
    document.querySelectorAll('[data-sheet-open]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(el.getAttribute('data-sheet-open'));
        if (target) {
          target.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
      });
    });
    document.querySelectorAll('[data-sheet-close]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var sheet = el.closest('.sheet');
        if (sheet) {
          sheet.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
    });
    document.querySelectorAll('.sheet').forEach(function (sheet) {
      sheet.addEventListener('click', function (e) {
        if (e.target === sheet) {
          sheet.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
    });
  }

  // Quantity steppers
  function initSteppers() {
    document.querySelectorAll('[data-stepper]').forEach(function (wrap) {
      var minus = wrap.querySelector('[data-step-down]');
      var plus  = wrap.querySelector('[data-step-up]');
      var count = wrap.querySelector('[data-step-count]');
      if (!count) return;
      function get() { return parseInt(count.textContent, 10) || 0; }
      function set(v) { count.textContent = String(Math.max(0, v)); }
      if (minus) minus.addEventListener('click', function () { set(get() - 1); });
      if (plus)  plus.addEventListener('click',  function () { set(get() + 1); });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    markActiveNav();
    initOnboarding();
    initSegments();
    initTabs();
    initChips();
    initPickers();
    initStarSelect();
    initSaveButtons();
    initSheets();
    initSteppers();
  });
})();
