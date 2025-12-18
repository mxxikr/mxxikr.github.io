/*
 * Navigation Buttons Fix (Move to Body & Force Fixed)
 * 1. Inject Force CSS
 * 2. Move buttons to <body> to avoid parent transform issues
 */
(function () {
  'use strict';

  // 1. 강제 스타일 주입 (디자인 및 위치 고정)
  const style = document.createElement('style');
  style.innerHTML = `
    /* 버튼 공통 스타일 */
    #back-to-top, #go-to-bottom {
      position: fixed !important; /* 스크롤 무시하고 화면 전체 기준 고정 */
      left: 2rem !important;      /* 왼쪽에서 2rem */
      z-index: 2147483647 !important; /* 모든 요소보다 위에 표시 */
      
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      
      width: 2.7rem !important;
      height: 2.7rem !important;
      border-radius: 50% !important;
      background-color: var(--sidebar-btn-bg, #8a76e7) !important; /* 테마 색상 또는 보라색 */
      color: #ffffff !important;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important;
      
      visibility: visible !important; /* 무조건 보이게 */
      opacity: 1 !important;
      pointer-events: auto !important;
      cursor: pointer !important;
      text-decoration: none !important;
      transform: none !important; /* 부모 영향 제거 */
    }
    
    /* 개별 위치 설정 */
    #back-to-top { bottom: 5.5rem !important; }
    #go-to-bottom { bottom: 2rem !important; }
    
    /* 아이콘 크기 및 정렬 */
    #back-to-top i, #go-to-bottom i {
      line-height: 1 !important;
      font-size: 1.1rem !important;
      margin: 0 !important;
    }
  `;
  document.head.appendChild(style);

  // 2. 버튼 초기화 함수
  function initButtons() {
    const backToTop = document.getElementById('back-to-top');
    const goToBottom = document.getElementById('go-to-bottom');

    // [핵심] 버튼을 사이드바에서 꺼내서 <body> 바로 아래로 이동
    if (backToTop) {
      document.body.appendChild(backToTop);
      // 기존 이벤트 제거를 위해 새로 복제하거나 리스너만 추가 (여기선 리스너 추가만)
      backToTop.onclick = function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }

    if (goToBottom) {
      document.body.appendChild(goToBottom);
      goToBottom.onclick = function (e) {
        e.preventDefault();
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      };
    }
  }

  // DOM 로드 시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initButtons);
  } else {
    initButtons();
  }

})();
