/* SeeIt Restaurant Dashboard — light navigation & UI helpers */
(function () {
  'use strict';

  function markActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      var match = el.getAttribute('data-nav');
      if (!match) return;
      var matches = match.split(',').map(function (s) { return s.trim(); });
      if (matches.indexOf(path) !== -1) {
        el.classList.add('is-active');
      }
    });
  }

  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (group) {
      var items = group.querySelectorAll('.tabs__item');
      items.forEach(function (el) {
        el.addEventListener('click', function (e) {
          if (el.tagName !== 'A' || !el.getAttribute('href') || el.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            items.forEach(function (x) { x.classList.remove('tabs__item--active'); });
            el.classList.add('tabs__item--active');
          }
        });
      });
    });
  }

  function initToolbarGroups() {
    document.querySelectorAll('.toolbar__group').forEach(function (group) {
      var btns = group.querySelectorAll('button');
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.classList.remove('is-active'); });
          b.classList.add('is-active');
        });
      });
    });
  }

  function initModalClose() {
    document.querySelectorAll('[data-modal-close]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var modal = el.closest('.modal-overlay');
        if (modal) modal.style.display = 'none';
      });
    });
    document.querySelectorAll('[data-modal-open]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(el.getAttribute('data-modal-open'));
        if (target) target.style.display = 'flex';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    markActiveNav();
    initTabs();
    initToolbarGroups();
    initModalClose();
  });
})();
