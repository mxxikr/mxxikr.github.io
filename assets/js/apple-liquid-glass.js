/*!
 * Apple Liquid Glass JavaScript
 * 애플 스타일의 인터랙티브 효과와 애니메이션 제어
 */

(function() {
  'use strict';

  // DOM이 로드된 후 실행
  document.addEventListener('DOMContentLoaded', function() {
    initAppleAnimations();
    initScrollReveal();
    initLiquidGlassEffects();
    initAppleInteractions();
  });

  // Apple 스타일 애니메이션 초기화
  function initAppleAnimations() {
    // 페이지 로드 시 요소들에 애니메이션 클래스 추가
    const elements = document.querySelectorAll('.post-content, .card, .sidebar, .topbar');
    
    elements.forEach((element, index) => {
      element.classList.add('animate-fade-in-up');
      element.style.animationDelay = `${index * 0.1}s`;
    });

    // 카드 호버 효과
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.classList.add('hover-lift', 'hover-glow');
    });

    // 버튼 호버 효과
    const buttons = document.querySelectorAll('.btn, button');
    buttons.forEach(button => {
      button.classList.add('hover-scale');
    });
  }

  // 스크롤 기반 애니메이션
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.post-content p, .post-content h1, .post-content h2, .post-content h3, .post-content blockquote, .highlight');
    
    revealElements.forEach(element => {
      element.classList.add('scroll-reveal');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(element => {
      observer.observe(element);
    });
  }

  // Liquid Glass 효과 초기화
  function initLiquidGlassEffects() {
    // Liquid Glass 반사 효과
    const glassElements = document.querySelectorAll('.card, .btn, .tag, .nav-link');
    
    glassElements.forEach(element => {
      element.classList.add('liquid-reflection');
      
      // 마우스 움직임에 따른 반사 효과
      element.addEventListener('mousemove', function(e) {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
      });
      
      element.addEventListener('mouseleave', function() {
        element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      });
    });

    // Liquid Glass 굴절 효과
    const refractionElements = document.querySelectorAll('.highlight, blockquote');
    refractionElements.forEach(element => {
      element.classList.add('liquid-refraction');
    });
  }

  // Apple 스타일 인터랙션
  function initAppleInteractions() {
    // 클릭 시 Apple 스타일 리플 효과
    const clickableElements = document.querySelectorAll('.btn, .nav-link, .tag, .card');
    
    clickableElements.forEach(element => {
      element.addEventListener('click', function(e) {
        createRippleEffect(e, element);
      });
    });

    // Apple 스타일 포커스 효과
    const focusableElements = document.querySelectorAll('input, textarea, select, button, a');
    
    focusableElements.forEach(element => {
      element.addEventListener('focus', function() {
        this.classList.add('apple-pulse');
      });
      
      element.addEventListener('blur', function() {
        this.classList.remove('apple-pulse');
      });
    });

    // 스크롤 시 네비게이션 효과
    let lastScrollTop = 0;
    const topbar = document.querySelector('.topbar');
    
    window.addEventListener('scroll', function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > lastScrollTop && scrollTop > 100) {
        // 스크롤 다운
        if (topbar) {
          topbar.style.transform = 'translateY(-100%)';
        }
      } else {
        // 스크롤 업
        if (topbar) {
          topbar.style.transform = 'translateY(0)';
        }
      }
      
      lastScrollTop = scrollTop;
    });
  }

  // 리플 효과 생성
  function createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // Apple 스타일 토스트 알림
  function showAppleToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-apple toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show', 'toast-animate-in');
    }, 100);
    
    setTimeout(() => {
      toast.classList.add('toast-animate-out');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Apple 스타일 모달
  function showAppleModal(content) {
    const modal = document.createElement('div');
    modal.className = 'modal-apple';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content-apple modal-animate';
    modalContent.innerHTML = content;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    setTimeout(() => {
      modal.classList.add('active');
    }, 100);
    
    // 모달 닫기
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(() => {
          modal.remove();
        }, 300);
      }
    });
  }

  // Apple 스타일 로딩 인디케이터
  function showAppleLoading(element) {
    const loading = document.createElement('div');
    loading.className = 'loading-dots';
    loading.innerHTML = '<span></span><span></span><span></span>';
    
    element.style.position = 'relative';
    element.appendChild(loading);
    
    return {
      hide: function() {
        loading.remove();
      }
    };
  }

  // Apple 스타일 프로그레스 바
  function updateAppleProgress(progressBar, percentage) {
    if (progressBar) {
      progressBar.style.setProperty('--progress', percentage + '%');
    }
  }

  // 글로벌 함수로 노출
  window.AppleLiquidGlass = {
    showToast: showAppleToast,
    showModal: showAppleModal,
    showLoading: showAppleLoading,
    updateProgress: updateAppleProgress
  };

  // CSS 애니메이션 스타일 동적 추가
  const style = document.createElement('style');
  style.textContent = `
    .ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(0, 122, 255, 0.3);
      transform: scale(0);
      animation: ripple-animation 0.6s linear;
      pointer-events: none;
    }
    
    @keyframes ripple-animation {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    .topbar {
      transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .toast-info {
      border-left: 4px solid var(--apple-blue);
    }
    
    .toast-success {
      border-left: 4px solid var(--apple-success);
    }
    
    .toast-warning {
      border-left: 4px solid var(--apple-warning);
    }
    
    .toast-danger {
      border-left: 4px solid var(--apple-danger);
    }
  `;
  document.head.appendChild(style);

})();
