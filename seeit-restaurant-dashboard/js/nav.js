/* SeeIt for Restaurants — navigation & UI helpers */
(function () {
  'use strict';

  // Active nav highlighting
  function markActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      var match = el.getAttribute('data-nav');
      if (!match) return;
      var matches = match.split(',').map(function (s) { return s.trim(); });
      if (matches.indexOf(path) !== -1) el.classList.add('is-active');
    });
  }

  // Mobile sidebar toggle
  function initSidebar() {
    var sidebar = document.querySelector('.sidebar');
    var hamburger = document.querySelector('[data-sidebar-toggle]');
    var closeBtn = document.querySelector('[data-sidebar-close]');
    var backdrop = document.querySelector('[data-sidebar-backdrop]');
    if (!sidebar) return;

    function open() {
      sidebar.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      sidebar.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    if (hamburger) hamburger.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
  }

  // Location switcher dropdown
  function initLocSwitcher() {
    var btn = document.querySelector('[data-loc-toggle]');
    var dropdown = document.querySelector('[data-loc-dropdown]');
    if (!btn || !dropdown) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('is-open');
    });
    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target) && e.target !== btn) {
        dropdown.classList.remove('is-open');
      }
    });
  }

  // Tabs (underline) — visual only swap
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

  // Toolbar / segmented group active state
  function initToolbarGroups() {
    document.querySelectorAll('.toolbar__group, .segmented').forEach(function (group) {
      var btns = group.querySelectorAll('button');
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.classList.remove('is-active'); });
          b.classList.add('is-active');
        });
      });
    });
  }

  // Tag chip toggle
  function initTagChips() {
    document.querySelectorAll('[data-tag-toggle]').forEach(function (el) {
      el.addEventListener('click', function () {
        el.classList.toggle('is-active');
        // Kosher detail expansion
        var expandTarget = el.getAttribute('data-expand');
        if (expandTarget) {
          var t = document.querySelector(expandTarget);
          if (t) t.style.display = el.classList.contains('is-active') ? 'block' : 'none';
        }
      });
    });
  }

  // Modals
  function initModals() {
    document.querySelectorAll('[data-modal-open]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(el.getAttribute('data-modal-open'));
        if (target) {
          target.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
      });
    });
    document.querySelectorAll('[data-modal-close]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var modal = el.closest('.modal-overlay');
        if (modal) {
          modal.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
    });
    // Click on overlay (outside modal box) closes
    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          overlay.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
    });
  }

  // Wizard "next step" navigation (visual)
  function initWizardNext() {
    document.querySelectorAll('[data-step-next]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var target = btn.getAttribute('data-step-next');
        var current = document.querySelector('[data-step="' + target.split(':')[0] + '"]');
        var nextEl = document.querySelector('[data-step="' + target.split(':')[1] + '"]');
        if (current && nextEl) {
          e.preventDefault();
          current.style.display = 'none';
          nextEl.style.display = 'block';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    markActiveNav();
    initSidebar();
    initLocSwitcher();
    initTabs();
    initToolbarGroups();
    initTagChips();
    initModals();
    initWizardNext();
  });
})();
