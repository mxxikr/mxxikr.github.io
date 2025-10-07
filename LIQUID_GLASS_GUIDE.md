# 라벤더 + 리퀴드 글라스 테마 가이드

## 🎨 구현된 기능

### 1. 라벤더 색상 팔레트
- **메인 라벤더**: `#9986B3`
- **연한 라벤더**: `#C4BEE2` 
- **가장 연한 라벤더**: `#E0DBEF`
- **액센트 라벤더**: `#B8A9D9`
- **진한 라벤더**: `#7A6B96`

### 2. 리퀴드 글라스 효과
- **실시간 반사 레이어**: 동적 굴절 효과
- **동심원 형태**: Apple 공식 스펙
- **거울 반사**: inset 그림자와 하이라이트
- **실시간 렌더링**: 애니메이션과 함께

### 3. 사용 가능한 클래스들

#### 기본 리퀴드 글라스
```html
<div class="btn-apple">Apple 스타일 버튼</div>
<div class="card-apple">Apple 스타일 카드</div>
<div class="nav-item-apple">네비게이션 아이템</div>
<div class="tag-apple">태그</div>
<div class="input-apple">입력 필드</div>
```

#### 아카이브 페이지 전용
```html
<div class="archives-liquid-glass">
  <div class="year-liquid-glass liquid-glass-breathe">2024</div>
  <ul class="archive-list-liquid-glass">
    <li class="archive-item-liquid-glass liquid-glass-hover">
      <span class="date-liquid-glass">15</span>
      <span class="month-liquid-glass">Jan</span>
      <a href="#" class="archive-link-liquid-glass">포스트 제목</a>
    </li>
  </ul>
</div>
```

#### 애니메이션 클래스
```html
<div class="liquid-glass-wave">웨이브 애니메이션</div>
<div class="liquid-glass-pulse">펄스 애니메이션</div>
<div class="liquid-glass-rotate">회전 애니메이션</div>
<div class="liquid-glass-breathe">호흡 애니메이션</div>
<div class="liquid-glass-magic">마법 조합 효과</div>
<div class="liquid-glass-dynamic">동적 조합 효과</div>
```

#### 유틸리티 클래스
```html
<div class="lavender-gradient">라벤더 그라데이션</div>
<div class="lavender-glass">라벤더 글라스 효과</div>
```

### 4. 반응형 디자인
- **모바일** (768px 이하): 최적화된 블러 효과
- **태블릿** (769px-1024px): 중간 수준의 효과
- **데스크톱** (1440px 이상): 최대 효과

### 5. 접근성 고려사항
- `prefers-reduced-motion` 지원
- 다크 모드 대응
- 키보드 네비게이션 지원

## 🚀 사용 방법

### HTML에 클래스 추가
```html
<!-- 버튼에 리퀴드 글라스 효과 적용 -->
<button class="btn-apple liquid-glass-magic">클릭하세요</button>

<!-- 카드에 라벤더 글라스 효과 적용 -->
<div class="card-apple lavender-glass">
  <h3>제목</h3>
  <p>내용</p>
</div>

<!-- 네비게이션에 동적 효과 적용 -->
<nav class="nav-item-apple liquid-glass-dynamic">메뉴</nav>

<!-- 아카이브 페이지에 적용 -->
<div class="archives-liquid-glass">
  <div class="year-liquid-glass liquid-glass-breathe">2024</div>
  <ul class="archive-list-liquid-glass">
    <li class="archive-item-liquid-glass liquid-glass-hover">
      <span class="date-liquid-glass">15</span>
      <span class="month-liquid-glass">Jan</span>
      <a href="#" class="archive-link-liquid-glass">포스트 제목</a>
    </li>
  </ul>
</div>
```

### CSS 변수 사용
```css
.custom-element {
  background: var(--lavender-primary);
  color: var(--text-primary);
  backdrop-filter: blur(30px);
  border: 1px solid var(--glass-border);
}
```

## 🎯 주요 특징

1. **Apple 스타일**: 최신 Apple 디자인 언어 반영
2. **실시간 렌더링**: 동적 굴절과 반사 효과
3. **라벤더 테마**: 우아하고 세련된 색상 조합
4. **성능 최적화**: GPU 가속 활용
5. **크로스 브라우저**: 모든 모던 브라우저 지원
6. **아카이브 페이지**: 연도별 포스트를 아름답게 표시

## 📱 브라우저 지원

- Chrome 76+
- Firefox 103+
- Safari 14+
- Edge 79+

## 🔧 커스터마이징

### 색상 변경
`_sass/variables-hook.scss`에서 CSS 변수 수정:
```scss
:root {
  --lavender-primary: #your-color;
  --glass-white: rgba(255, 255, 255, 0.8);
}
```

### 애니메이션 조정
`_sass/apple-animations.scss`에서 키프레임 수정:
```scss
@keyframes liquid-glass-float {
  // 애니메이션 값 조정
}
```

## 📋 아카이브 페이지 특징

### 🎨 아카이브 페이지 전용 효과
- **연도 헤더**: `year-liquid-glass` - 호흡 애니메이션과 함께
- **포스트 아이템**: `archive-item-liquid-glass` - 호버 시 리퀴드 글라스 효과
- **날짜 표시**: `date-liquid-glass` - 원형 라벤더 글라스 배지
- **월 표시**: `month-liquid-glass` - 라벤더 색상 텍스트
- **포스트 링크**: `archive-link-liquid-glass` - 호버 시 색상 변화

### 📱 반응형 아카이브 디자인
- **모바일**: 컴팩트한 레이아웃, 최적화된 블러 효과
- **태블릿**: 중간 크기 요소, 균형잡힌 효과
- **데스크톱**: 대형 요소, 최대 리퀴드 글라스 효과

### ✨ 자동 적용
아카이브 페이지는 이미 클래스가 적용되어 있어 별도 설정 없이 바로 사용할 수 있습니다!

---

✨ **라벤더 + 리퀴드 글라스 테마**로 더욱 아름다운 블로그를 만들어보세요!
