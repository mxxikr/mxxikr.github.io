// 항상 표시되는 네비게이션 버튼 - 단순하고 확실한 방법
(function() {
  'use strict';
  
  console.log('🚀 Always Visible Navigation Buttons Starting...');
  
  // 버튼을 항상 표시하는 함수 (스크롤과 무관)
  function makeButtonsAlwaysVisible() {
    const backToTopBtn = document.getElementById('back-to-top');
    const goToBottomBtn = document.getElementById('go-to-bottom');
    
    if (backToTopBtn) {
      // 완전히 강제로 표시
      backToTopBtn.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: fixed !important;
        bottom: 90px !important;
        left: 40px !important;
        z-index: 999999 !important;
        width: 50px !important;
        height: 50px !important;
        background: var(--button-bg) !important;
        color: var(--btn-backtotop-color) !important;
        border: 1px solid var(--btn-backtotop-border-color) !important;
        border-radius: 50% !important;
        cursor: pointer !important;
        text-decoration: none !important;
        box-sizing: border-box !important;
        pointer-events: auto !important;
        transform: none !important;
      `;
      
      // 모든 숨김 관련 속성 제거
      backToTopBtn.classList.remove('hide', 'd-none', 'invisible', 'hidden');
      backToTopBtn.removeAttribute('hidden');
      backToTopBtn.removeAttribute('style-display');
    }
    
    if (goToBottomBtn) {
      goToBottomBtn.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: fixed !important;
        bottom: 150px !important;
        left: 40px !important;
        z-index: 999999 !important;
        width: 50px !important;
        height: 50px !important;
        background: var(--button-bg) !important;
        color: var(--btn-backtotop-color) !important;
        border: 1px solid var(--btn-backtotop-border-color) !important;
        border-radius: 50% !important;
        cursor: pointer !important;
        text-decoration: none !important;
        box-sizing: border-box !important;
        pointer-events: auto !important;
        transform: none !important;
      `;
      
      goToBottomBtn.classList.remove('hide', 'd-none', 'invisible', 'hidden');
      goToBottomBtn.removeAttribute('hidden');
      goToBottomBtn.removeAttribute('style-display');
    }
    
    console.log('✅ Buttons forced to be visible');
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
  
  // 매우 자주 버튼 표시 확인 (다른 스크립트 간섭 방지)
  setInterval(makeButtonsAlwaysVisible, 200);
  
  console.log('🎯 Always visible navigation buttons script loaded');
  
})();
