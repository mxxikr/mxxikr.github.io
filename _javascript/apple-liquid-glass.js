
class AppleLiquidGlassRenderer {
  constructor() {
    this.elements = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.isAnimating = false;
    this.animationFrame = null;
    
    this.init();
  }
  
  init() {
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    document.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // 모든 Liquid Glass 요소 등록
    this.registerElements();
    
    // 실시간 렌더링 시작
    this.startRendering();
  }
  
  registerElements() {
    // Apple Liquid Glass 클래스를 가진 모든 요소 등록
    const selectors = [
      '.btn-apple',
      '.card-apple', 
      '.nav-item-apple',
      '.tag-apple',
      '.input-apple',
      '.year-liquid-glass',
      '.archive-item-liquid-glass'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        this.elements.add(element);
        this.setupElement(element);
      });
    });
  }
  
  setupElement(element) {
    // 요소별 초기 설정
        element.style.setProperty('--mouse-x', '50%');
        element.style.setProperty('--mouse-y', '50%');
        element.style.setProperty('--mouse-angle', '0deg');
    element.style.setProperty('--ambient-hue', '0deg');
    
    // 마우스 이벤트 리스너 추가
    element.addEventListener('mouseenter', () => {
      element.classList.add('liquid-glass-active');
    });
    
    element.addEventListener('mouseleave', () => {
      element.classList.remove('liquid-glass-active');
    });
  }
  
  handleMouseMove(event) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
    
    // 실시간 렌더링 트리거
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animationFrame = requestAnimationFrame(() => {
        this.renderAllElements();
        this.isAnimating = false;
      });
    }
  }
  
  handleMouseEnter(event) {
    // 마우스 진입 시 주변 환경 감지
    this.detectAmbientEnvironment(event.target);
  }
  
  handleMouseLeave(event) {
    // 마우스 이탈 시 기본 상태로 복원
    this.resetElement(event.target);
  }
  
  handleResize() {
    // 화면 크기 변경 시 요소 재등록
    this.elements.clear();
    this.registerElements();
  }
  
  renderAllElements() {
    this.elements.forEach(element => {
      if (this.isElementInViewport(element)) {
        this.renderElement(element);
      }
    });
  }
  
  renderElement(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // 마우스 위치를 요소 중심 기준으로 변환
    const relativeX = ((this.mouseX - centerX) / rect.width) * 100;
    const relativeY = ((this.mouseY - centerY) / rect.height) * 100;
    
    // 각도 계산
    const angle = Math.atan2(relativeY, relativeX) * (180 / Math.PI);
    
    // CSS 변수 업데이트
    element.style.setProperty('--mouse-x', `${50 + relativeX * 0.3}%`);
    element.style.setProperty('--mouse-y', `${50 + relativeY * 0.3}%`);
    element.style.setProperty('--mouse-angle', `${angle}deg`);
    
    // 주변 환경 반사 효과
    this.updateAmbientReflection(element, relativeX, relativeY);
  }
  
  updateAmbientReflection(element, x, y) {
    // 거리 기반 반사 강도 계산
    const distance = Math.sqrt(x * x + y * y);
    const intensity = Math.max(0, 1 - distance / 100);
    
    // 색상 변화 계산
    const hue = (Math.atan2(y, x) * (180 / Math.PI) + 180) % 360;
    
    // CSS 변수 업데이트
    element.style.setProperty('--reflection-intensity', intensity);
    element.style.setProperty('--ambient-hue', `${hue}deg`);
    element.style.setProperty('--reflection-x', `${50 + x * 0.2}%`);
    element.style.setProperty('--reflection-y', `${50 + y * 0.2}%`);
  }
  
  detectAmbientEnvironment(element) {
    // 주변 환경 색상 감지
    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor;
    
    // 배경색에서 색상 추출 및 반영
    if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      const rgb = backgroundColor.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const hue = this.rgbToHue(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
        element.style.setProperty('--ambient-hue', `${hue}deg`);
      }
    }
  }
  
  resetElement(element) {
    // 기본 상태로 복원
    element.style.setProperty('--mouse-x', '50%');
    element.style.setProperty('--mouse-y', '50%');
    element.style.setProperty('--mouse-angle', '0deg');
    element.style.setProperty('--reflection-intensity', '0');
    element.style.setProperty('--ambient-hue', '0deg');
  }
  
  isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  rgbToHue(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let hue = 0;
    
    if (diff !== 0) {
      if (max === r) {
        hue = ((g - b) / diff) % 6;
      } else if (max === g) {
        hue = (b - r) / diff + 2;
      } else {
        hue = (r - g) / diff + 4;
      }
    }
    
    return Math.round(hue * 60);
  }
  
  startRendering() {
    // 지속적인 렌더링 루프
    const render = () => {
      if (this.elements.size > 0) {
        this.renderAllElements();
      }
      requestAnimationFrame(render);
    };
    
    requestAnimationFrame(render);
  }
  
  // 새로운 요소 등록 메서드
  registerElement(element) {
    this.elements.add(element);
    this.setupElement(element);
  }
  
  // 요소 제거 메서드
  unregisterElement(element) {
    this.elements.delete(element);
  }
  
  // 성능 모니터링
  getPerformanceMetrics() {
    return {
      elementCount: this.elements.size,
      isAnimating: this.isAnimating,
      mousePosition: { x: this.mouseX, y: this.mouseY }
    };
  }
}

window.AppleLiquidGlass = new AppleLiquidGlassRenderer();

document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const liquidGlassElements = node.querySelectorAll('.btn-apple, .card-apple, .nav-item-apple, .tag-apple, .input-apple, .year-liquid-glass, .archive-item-liquid-glass');
          liquidGlassElements.forEach(element => {
            window.AppleLiquidGlass.registerElement(element);
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // 애니메이션 비활성화
  document.documentElement.style.setProperty('--animation-duration', '0s');
  document.documentElement.style.setProperty('--transition-duration', '0s');
}