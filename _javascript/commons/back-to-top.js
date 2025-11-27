// 항상 표시되는 네비게이션 버튼 - 단순하고 확실한 방법
(function() {
  'use strict';
  
  console.log('🚀 Always Visible Navigation Buttons Starting...');
  
  // 버튼을 항상 표시하는 함수 (스크롤과 무관) - 최대 강도
  function makeButtonsAlwaysVisible() {
    const backToTopBtn = document.getElementById('back-to-top');
    const goToBottomBtn = document.getElementById('go-to-bottom');
    
    if (backToTopBtn) {
      // 모든 스타일 속성 직접 설정
      backToTopBtn.style.setProperty('display', 'block', 'important');
      backToTopBtn.style.setProperty('visibility', 'visible', 'important');
      backToTopBtn.style.setProperty('opacity', '1', 'important');
      backToTopBtn.style.setProperty('position', 'fixed', 'important');
      backToTopBtn.style.setProperty('bottom', '90px', 'important');
      backToTopBtn.style.setProperty('left', '40px', 'important');
      backToTopBtn.style.setProperty('z-index', '999999', 'important');
      backToTopBtn.style.setProperty('width', '50px', 'important');
      backToTopBtn.style.setProperty('height', '50px', 'important');
      backToTopBtn.style.setProperty('cursor', 'pointer', 'important');
      backToTopBtn.style.setProperty('pointer-events', 'auto', 'important');
      backToTopBtn.style.setProperty('transform', 'none', 'important');
      
      // 모든 숨김 관련 속성 제거
      backToTopBtn.classList.remove('hide', 'd-none', 'invisible', 'hidden', 'fade-out');
      backToTopBtn.removeAttribute('hidden');
      backToTopBtn.removeAttribute('aria-hidden');
      
      // DOM에서 직접 표시
      if (backToTopBtn.parentNode) {
        backToTopBtn.parentNode.style.display = '';
      }
    }
    
    if (goToBottomBtn) {
      // 모든 스타일 속성 직접 설정
      goToBottomBtn.style.setProperty('display', 'block', 'important');
      goToBottomBtn.style.setProperty('visibility', 'visible', 'important');
      goToBottomBtn.style.setProperty('opacity', '1', 'important');
      goToBottomBtn.style.setProperty('position', 'fixed', 'important');
      goToBottomBtn.style.setProperty('bottom', '150px', 'important');
      goToBottomBtn.style.setProperty('left', '40px', 'important');
      goToBottomBtn.style.setProperty('z-index', '999999', 'important');
      goToBottomBtn.style.setProperty('width', '50px', 'important');
      goToBottomBtn.style.setProperty('height', '50px', 'important');
      goToBottomBtn.style.setProperty('cursor', 'pointer', 'important');
      goToBottomBtn.style.setProperty('pointer-events', 'auto', 'important');
      goToBottomBtn.style.setProperty('transform', 'none', 'important');
      
      // 모든 숨김 관련 속성 제거
      goToBottomBtn.classList.remove('hide', 'd-none', 'invisible', 'hidden', 'fade-out');
      goToBottomBtn.removeAttribute('hidden');
      goToBottomBtn.removeAttribute('aria-hidden');
      
      // DOM에서 직접 표시
      if (goToBottomBtn.parentNode) {
        goToBottomBtn.parentNode.style.display = '';
      }
    }
  }
  
  // 클릭 이벤트 설정
  function setupClickEvents() {
    const backToTopBtn = document.getElementById('back-to-top');
    const goToBottomBtn = document.getElementById('go-to-bottom');
    
    if (backToTopBtn) {
      // 기존 이벤트 제거
      backToTopBtn.onclick = null;
      
      // 새로운 클릭 이벤트
      backToTopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔝 Going to top');
        
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        
        return false;
      }, true);
    }
    
    if (goToBottomBtn) {
      // 기존 이벤트 제거
      goToBottomBtn.onclick = null;
      
      // 새로운 클릭 이벤트
      goToBottomBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔽 Going to bottom');
        
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
        
        return false;
      }, true);
    }
    
    console.log('✅ Click events setup complete');
  }
  
  // 초기화 함수
  function init() {
    console.log('🔧 Initializing always visible buttons...');
    
    const backToTopBtn = document.getElementById('back-to-top');
    const goToBottomBtn = document.getElementById('go-to-bottom');
    
    if (!backToTopBtn || !goToBottomBtn) {
      console.log('⏳ Buttons not found, retrying in 100ms...');
      setTimeout(init, 100);
      return;
    }
    
    // 버튼 항상 표시
    makeButtonsAlwaysVisible();
    
    // 클릭 이벤트 설정
    setupClickEvents();
    
    console.log('🎉 Navigation buttons ready!');
  }
  
  // 즉시 시작
  init();
  
  // DOM 준비 후에도 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  }
  
  // 페이지 로드 후에도 실행
  window.addEventListener('load', function() {
    setTimeout(init, 100);
  });
  
  // 매우 자주 버튼 표시 확인 (다른 스크립트 간섭 방지) - 더 자주 체크
  setInterval(makeButtonsAlwaysVisible, 100);
  
  // MutationObserver로 버튼 변경 감지 및 강제 표시
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' || mutation.type === 'childList') {
        makeButtonsAlwaysVisible();
      }
    });
  });
  
  // DOM 준비 후 Observer 시작
  function startObserver() {
    const backToTopBtn = document.getElementById('back-to-top');
    const goToBottomBtn = document.getElementById('go-to-bottom');
    
    if (backToTopBtn) {
      observer.observe(backToTopBtn, {
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden'],
        childList: false,
        subtree: false
      });
    }
    
    if (goToBottomBtn) {
      observer.observe(goToBottomBtn, {
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden'],
        childList: false,
        subtree: false
      });
    }
  }
  
  // Observer 시작
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(startObserver, 100);
    });
  } else {
    setTimeout(startObserver, 100);
  }
  
  // 스크롤 이벤트에서도 버튼 표시 보장
  window.addEventListener('scroll', makeButtonsAlwaysVisible, { passive: true });
  window.addEventListener('resize', makeButtonsAlwaysVisible, { passive: true });
  
  console.log('🎯 Always visible navigation buttons script loaded');
  
})();
