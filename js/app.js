/**
 * Hedzo Trading Academy - Application Script
 * Handles UI interactions, email notification validation, toasts, course tabs, mobile navigation drawer, and visual effects.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // 0. Initialize AOS (Animate On Scroll) Library
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 500,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
      once: true,
      offset: 40,
      anchorPlacement: 'top-bottom'
    });
  }

  // 0.1 Smooth Scroll Navigation Handler for Anchors
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  anchorLinks.forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // 1. Mobile Navigation Toggle & Drawer Management
  const navToggleBtn = document.getElementById('navToggleBtn');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  if (navToggleBtn && mobileNavDrawer) {
    navToggleBtn.addEventListener('click', () => {
      const isActive = mobileNavDrawer.classList.toggle('active');
      navToggleBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      
      // Toggle icon state
      if (isActive) {
        navToggleBtn.innerHTML = `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
      } else {
        navToggleBtn.innerHTML = `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        `;
      }
    });

    // Close mobile drawer when clicking a link
    mobileNavLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mobileNavDrawer.classList.remove('active');
        navToggleBtn.setAttribute('aria-expanded', 'false');
        navToggleBtn.innerHTML = `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        `;
      });
    });
  }

  // 2. Interactive Course Module Tabs Switcher
  const moduleTabBtns = document.querySelectorAll('.module-tab-btn');
  const modulePanes = document.querySelectorAll('.module-content-pane');

  if (moduleTabBtns.length > 0 && modulePanes.length > 0) {
    moduleTabBtns.forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        const targetModule = tabBtn.getAttribute('data-module');

        // Deactivate all tabs & panes
        moduleTabBtns.forEach((btn) => btn.classList.remove('active'));
        modulePanes.forEach((pane) => {
          pane.style.display = 'none';
          pane.classList.remove('active');
        });

        // Activate selected tab & pane
        tabBtn.classList.add('active');
        const activePane = document.getElementById(`modulePane${targetModule}`);
        if (activePane) {
          activePane.style.display = 'block';
          setTimeout(() => {
            activePane.classList.add('active');
            if (typeof AOS !== 'undefined') AOS.refresh();
          }, 20);
        }
      });
    });
  }

  // 3. Email Subscription Form Handling
  const notifyForm = document.getElementById('notifyForm');
  const emailInput = document.getElementById('emailInput');
  const notifyBtn = document.getElementById('notifyBtn');
  const formFeedback = document.getElementById('formFeedback');

  if (notifyForm && emailInput) {
    notifyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();

      // Clear previous states
      formFeedback.className = 'form-feedback';
      formFeedback.textContent = '';
      emailInput.classList.remove('is-invalid', 'is-valid');

      // Email Validation Regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

      if (!email) {
        showFeedback('Please enter your email address.', 'error');
        emailInput.classList.add('is-invalid');
        emailInput.focus();
        return;
      }

      if (!emailRegex.test(email)) {
        showFeedback('Please enter a valid email address.', 'error');
        emailInput.classList.add('is-invalid');
        emailInput.focus();
        return;
      }

      // Check if already subscribed locally
      const subscribers = JSON.parse(localStorage.getItem('hedzo_subscribers') || '[]');
      if (subscribers.includes(email.toLowerCase())) {
        showFeedback('You are already on our priority launch list! We will notify you soon.', 'info');
        emailInput.classList.add('is-valid');
        return;
      }

      // Simulate loading state
      const originalBtnContent = notifyBtn.innerHTML;
      notifyBtn.disabled = true;
      notifyBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        <span>Securing Spot...</span>
      `;

      setTimeout(() => {
        // Save to localStorage
        subscribers.push(email.toLowerCase());
        localStorage.setItem('hedzo_subscribers', JSON.stringify(subscribers));

        // Restore button state
        notifyBtn.disabled = false;
        notifyBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Subscribed!</span>
        `;
        notifyBtn.classList.add('btn-success-state');

        showFeedback('Welcome aboard! You will be the first to know when we launch.', 'success');
        emailInput.value = '';
        emailInput.classList.add('is-valid');

        // Trigger celebratory toast notification
        showToast('Priority Access Confirmed', 'Thank you for registering. You have been added to our early VIP list.');

        // Revert button after 4 seconds
        setTimeout(() => {
          notifyBtn.innerHTML = originalBtnContent;
          notifyBtn.classList.remove('btn-success-state');
        }, 4000);
      }, 700);
    });

    // Clear error on typing
    emailInput.addEventListener('input', () => {
      if (emailInput.classList.contains('is-invalid')) {
        emailInput.classList.remove('is-invalid');
        formFeedback.textContent = '';
        formFeedback.className = 'form-feedback';
      }
    });
  }

  function showFeedback(message, type) {
    if (!formFeedback) return;
    formFeedback.textContent = message;
    formFeedback.className = `form-feedback feedback-${type} show`;
  }

  // 4. Custom Toast Notification Manager
  function showToast(title, body) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toastId = 'toast-' + Date.now();
    const toastHtml = `
      <div id="${toastId}" class="custom-toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-indicator"></div>
        <div class="toast-content">
          <div class="toast-header-custom">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00FF88" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <strong>${title}</strong>
          </div>
          <div class="toast-body-custom">${body}</div>
        </div>
        <button type="button" class="toast-close-btn" aria-label="Close" onclick="this.parentElement.remove()">
          &times;
        </button>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(toastId);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toastEl && toastEl.parentElement) {
        toastEl.classList.add('fade-out');
        setTimeout(() => toastEl.remove(), 400);
      }
    }, 5000);
  }

  // 5. 3D Card Interactive Tilt & Glow Effect (Desktop / Fine Pointer only)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const cards = document.querySelectorAll('.glass-card, .map-card-wrapper, .stat-card-glass, .step-card, .program-card, .comparison-card, .mentor-glass-card');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -3;
        const rotateY = ((x - centerX) / centerX) * 3;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }

  // 6. Scroll Reveal Animations (Intersection Observer for non-AOS elements)
  const revealElements = document.querySelectorAll('.reveal-on-scroll:not([data-aos])');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach((el) => observer.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  }

  // 7. Click-to-copy utility for email & phone helper
  const copyButtons = document.querySelectorAll('[data-copy]');
  copyButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const textToCopy = btn.getAttribute('data-copy');
      if (textToCopy && navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast('Copied to Clipboard', `${textToCopy} copied successfully.`);
        });
      }
    });
  });

  // 8. Active state update on scroll for navbar links
  const sections = document.querySelectorAll('section[id], header[id]');
  const desktopNavLinks = document.querySelectorAll('.nav-link-custom');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    desktopNavLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
});
