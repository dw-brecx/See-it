/* SeeIt — minimal navigation & UI helpers for the static mockup */
(function () {
  'use strict';

  // Highlight the current bottom-nav item based on the page filename.
  function markActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'splash.html';
    document.querySelectorAll('[data-nav-target]').forEach(function (el) {
      var target = el.getAttribute('data-nav-target');
      if (target === path) {
        el.classList.add('bottom-nav__item--active');
      }
    });
  }

  // Onboarding slides controller
  function initOnboarding() {
    var slides = document.querySelectorAll('[data-slide]');
    var dots   = document.querySelectorAll('[data-dot]');
    var next   = document.querySelector('[data-onboard-next]');
    if (!slides.length) return;
    var i = 0;

    function show(idx) {
      slides.forEach(function (s, n) { s.style.display = n === idx ? 'flex' : 'none'; });
      dots.forEach(function (d, n) { d.classList.toggle('is-active', n === idx); });
      if (next) {
        next.textContent = idx === slides.length - 1 ? 'Get Started' : 'Continue';
      }
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

  // Segmented toggle (tabs)
  function initSegments() {
    document.querySelectorAll('[data-segment]').forEach(function (group) {
      var btns = group.querySelectorAll('.segmented__btn');
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.classList.remove('segmented__btn--active'); });
          b.classList.add('segmented__btn--active');
          var href = b.getAttribute('data-href');
          if (href) window.location.href = href;
        });
      });
    });
  }

  // Underline tabs (purely visual on detail pages)
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (group) {
      var items = group.querySelectorAll('.tabs__item');
      items.forEach(function (el) {
        el.addEventListener('click', function (e) {
          if (el.tagName !== 'A') {
            e.preventDefault();
            items.forEach(function (x) { x.classList.remove('tabs__item--active'); });
            el.classList.add('tabs__item--active');
          }
        });
      });
    });
  }

  // Filter chips toggle (multi-select demo)
  function initChips() {
    document.querySelectorAll('[data-chip-toggle]').forEach(function (el) {
      el.addEventListener('click', function () {
        el.classList.toggle('chip--active');
      });
    });
  }

  // Mood-tag selection (write review)
  function initMoodTags() {
    document.querySelectorAll('[data-mood]').forEach(function (el) {
      el.addEventListener('click', function () {
        el.classList.toggle('is-active');
      });
    });
  }

  // Star rating selector (write review)
  function initStarSelect() {
    var wrap = document.querySelector('[data-star-select]');
    if (!wrap) return;
    var stars = wrap.querySelectorAll('svg');
    stars.forEach(function (s, idx) {
      s.addEventListener('click', function () {
        stars.forEach(function (x, n) {
          x.style.color = n <= idx ? 'var(--color-star)' : 'var(--color-border-strong)';
        });
      });
    });
  }

  // Save (heart) toggle on cards
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

  document.addEventListener('DOMContentLoaded', function () {
    markActiveNav();
    initOnboarding();
    initSegments();
    initTabs();
    initChips();
    initMoodTags();
    initStarSelect();
    initSaveButtons();
  });
})();
