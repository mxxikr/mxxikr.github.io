---
title:  "Jekyll 블로그 이미지 자동 최적화 시스템 구축"
author:
  name: mxxikr
  link: https://github.com/mxxikr"
date: 2025-10-08 18:50:00 +0900
category:
  - [Blog]
tags:
  - [jekyll, performance, automation]
math: true
mermaid: true
---

# Jekyll 블로그 이미지 자동 최적화

---

## 개요

- Jekyll 기반 블로그에서 이미지 자동 최적화 시스템을 구축하여 웹 성능을 개선한 과정을 소개합니다. 

## 문제 상황 분석

### 초기 성능 문제

- 기술 블로그에서 측정된 성능 지표
    - **이미지 용량**
        - 149MB
    - **페이지 로딩 시간**
        - 3-5초 (이미지 중심 페이지)
    - **이미지 파일 수**
        - 1,000개 이상

### 이미지 현황 파악

```bash
# 이미지 디렉토리 용량 분석
du -sh assets/img
# 결과: 149M	assets/img

# 이미지 파일 개수 확인
find assets/img -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) | wc -l
# 결과: 1,000개 이상의 이미지 파일
```

- **이미지 파일 특성**
    - **파일 형식**
        - PNG, JPEG
    - **압축 상태**
        - 압축되지 않은 원본 파일
     - **파일 수**
         - 1,000개 이상의 이미지 파일

### Core Web Vitals 측정

- **Core Web Vitals 지표**
    - Google이 정의한 웹사이트 사용자 경험을 측정하는 핵심 지표

    - **측정 방법**
        - **측정 도구**
            - Chrome DevTools, Lighthouse
        - **측정 환경**
            - 로컬 Jekyll 서버 (localhost:4000)

        ```bash
        # Lighthouse CLI를 사용한 성능 측정
        npm install -g lighthouse
        lighthouse http://localhost:4000 --output=json --output-path=./lighthouse-report.json
        ```

    - **측정된 Core Web Vitals 지표**

        - **LCP (Largest Contentful Paint)**: 3.2초
        - 페이지의 가장 큰 콘텐츠 요소가 화면에 렌더링되는 시간
        - 좋은 점수: 2.5초 이하, 개선 필요: 4.0초 초과
        - 이미지가 가장 큰 콘텐츠인 경우 로딩 시간에 직접 영향

        - **CLS (Cumulative Layout Shift)**: 0.15
        - 페이지 로딩 중 예상치 못한 레이아웃 변화의 정도
        - 좋은 점수: 0.1 이하, 개선 필요: 0.25 초과
        - 이미지 로딩 시 크기 변화로 인한 레이아웃 시프트 발생

        - **FID (First Input Delay)**: 180ms
        - 사용자가 페이지와 처음 상호작용할 때의 응답 시간
        - 좋은 점수: 100ms 이하, 개선 필요: 300ms 초과
        - 대용량 이미지 로딩으로 인한 메인 스레드 블로킹 영향

## 자동화 시스템 구성

### 이미지 최적화 도구 설치

```bash
# 이미지 최적화 도구 설치
brew install pngquant jpegoptim

# 설치 확인
which pngquant && which jpegoptim
```

### 자동 최적화 스크립트 생성
- **파일 생성 위치**
    - 프로젝트 루트 디렉토리에 `auto-optimize-images.js` 파일 생성
    - 실행 권한 부여
        ```bash
        chmod +x auto-optimize-images.js
        ```

- **auto-optimize-images.js**

    ```javascript
    #!/usr/bin/env node

    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');

    // 설정
    const IMG_DIR = 'assets/img';
    const QUALITY = 85;
    const SKIP_FAVICONS = true;

    // 이미지 최적화 함수
    function optimizeImage(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        try {
            if (ext === '.png') {
                execSync(`pngquant --force --ext .png --quality=65-${QUALITY} "${filePath}"`, { stdio: 'ignore' });
            } else if (ext === '.jpg' || ext === '.jpeg') {
                execSync(`jpegoptim --max=${QUALITY} --strip-all "${filePath}"`, { stdio: 'ignore' });
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    // 새로 추가된 이미지 파일 찾기
    function getNewImages() {
        try {
            const addedFiles = execSync('git diff --cached --name-status', { encoding: 'utf8' });
            const newImages = [];
            const lines = addedFiles.split('\n');
            
            lines.forEach(line => {
                if (line.startsWith('A\t') && line.includes(IMG_DIR)) {
                    const filePath = line.substring(2);
                    const ext = path.extname(filePath).toLowerCase();
                    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                        if (!SKIP_FAVICONS || !filePath.includes('favicon')) {
                            newImages.push(filePath);
                        }
                    }
                }
            });
            
            return newImages;
        } catch (error) {
            return [];
        }
    }

    // 메인 실행
    function main() {
        console.log('이미지 자동 최적화 시작...');
        
        const newImages = getNewImages();
        
        if (newImages.length === 0) {
            console.log('최적화할 새 이미지가 없습니다.');
            return;
        }
        
        console.log(`${newImages.length}개의 새 이미지를 발견했습니다.`);
        
        let optimized = 0;
        let failed = 0;
        
        newImages.forEach(imagePath => {
            console.log(`최적화 중: ${imagePath}`);
            
            if (optimizeImage(imagePath)) {
                optimized++;
                console.log(`완료: ${imagePath}`);
            } else {
                failed++;
                console.log(`실패: ${imagePath}`);
            }
        });
        
        console.log(`최적화 완료: ${optimized}개 성공, ${failed}개 실패`);
        
        if (optimized > 0) {
            console.log('최적화된 파일들을 Git에 다시 추가합니다...');
            try {
                execSync(`git add ${newImages.join(' ')}`, { stdio: 'ignore' });
                console.log('Git에 추가 완료!');
            } catch (error) {
                console.log('Git 추가 실패:', error.message);
            }
        }
    }

    main();
    ```

### Git 훅 설정
- **파일 생성 위치**
    - `.git/hooks/pre-commit` 파일 생성
    - 실행 권한 부여
        ```bash
        chmod +x .git/hooks/pre-commit
        ```

- **pre-commit 훅**

    ```bash
    #!/bin/bash

    # 자동 이미지 최적화 Git 훅
    echo "이미지 최적화를 확인합니다..."

    # Node.js가 설치되어 있는지 확인
    if ! command -v node &> /dev/null; then
        echo "Node.js가 설치되어 있지 않습니다. 이미지 최적화를 건너뜁니다."
        exit 0
    fi

    # 이미지 최적화 도구가 설치되어 있는지 확인
    if ! command -v pngquant &> /dev/null || ! command -v jpegoptim &> /dev/null; then
        echo "이미지 최적화 도구가 설치되어 있지 않습니다."
        echo "다음 명령어로 설치하세요: brew install pngquant jpegoptim"
        exit 0
    fi

    # 자동 최적화 스크립트 실행
    node auto-optimize-images.js

    echo "이미지 최적화 완료!"
    ```


### 실시간 파일 감시 스크립트
- **파일 생성 위치**
    - 프로젝트 루트 디렉토리에 `watch-images.js` 파일 생성
    - 실행 권한 부여
        ```bash
        chmod +x watch-images.js
        ```
        
- **watch-images.js**

    ```javascript
    #!/usr/bin/env node

    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');

    // 설정
    const IMG_DIR = 'assets/img';
    const QUALITY = 85;

    // 이미지 최적화 함수
    function optimizeImage(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        try {
            if (ext === '.png') {
                execSync(`pngquant --force --ext .png --quality=65-${QUALITY} "${filePath}"`, { stdio: 'ignore' });
            } else if (ext === '.jpg' || ext === '.jpeg') {
                execSync(`jpegoptim --max=${QUALITY} --strip-all "${filePath}"`, { stdio: 'ignore' });
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    // 파일 감시 시작
    function startWatching() {
        console.log('이미지 파일 감시를 시작합니다...');
        console.log('감시 디렉토리:', IMG_DIR);
        console.log('품질 설정:', QUALITY + '%');
        console.log('종료하려면 Ctrl+C를 누르세요\n');
        
        fs.watch(IMG_DIR, { recursive: true }, (eventType, filename) => {
            if (eventType === 'rename' && filename) {
                const filePath = path.join(IMG_DIR, filename);
                const ext = path.extname(filename).toLowerCase();
                
                if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                    setTimeout(() => {
                        if (fs.existsSync(filePath)) {
                            console.log(`새 이미지 발견: ${filename}`);
                            
                            if (optimizeImage(filePath)) {
                                console.log(`최적화 완료: ${filename}`);
                            } else {
                                console.log(`최적화 실패: ${filename}`);
                            }
                        }
                    }, 1000);
                }
            }
        });
    }

    startWatching();
    ```


## 사용 방법

### Git 훅 방식

```bash
# 이미지 추가 후 커밋하면 자동으로 최적화됨
git add assets/img/new-image.png
git commit -m "새 이미지 추가"
# 자동으로 최적화 후 커밋됨
```

### 수동 실행

```bash
# 새로 추가된 이미지만 최적화
npm run auto-optimize
```

### 실시간 감시

```bash
# 터미널에서 실행하면 이미지 추가 시 실시간 최적화
npm run watch-images
```

### package.json 설정
- **파일 생성 위치**
    - 프로젝트 루트 디렉토리의 `package.json` 파일에 scripts 섹션 추가
    - 기존 scripts 섹션이 있다면 해당 내용을 추가
- **package.json**
    ```json
    {
    "scripts": {
        "build": "gulp build",
        "dev": "gulp dev",
        "optimize-images": "node optimize-images-safe.js",
        "auto-optimize": "node auto-optimize-images.js",
        "watch-images": "node watch-images.js",
        "test": "echo 'Testing blog functionality...'"
    }
    }
    ```

## 성능 최적화 결과

### 최적화 전후 비교

- **용량 최적화 결과**

    ```bash
    # 최적화 전
    du -sh assets/img
    # 결과: 149M	assets/img

    # 최적화 후
    du -sh assets/img
    # 결과: 45M	assets/img
    ```

- **페이지 로딩 시간 개선** (Chrome DevTools 기준)

    | 페이지 유형 | 최적화 전 | 최적화 후 | 개선율 |
    |------------|----------|----------|--------|
    | 이미지 중심 포스트 | 3-5초 | 1-2초 | 60-70% |
    | 일반 포스트 | 2-3초 | 0.8-1.5초 | 50-60% |
    | 메인 페이지 | 4-6초 | 1.5-2.5초 | 60-70% |

### Core Web Vitals 개선 효과

- **Lighthouse 성능 점수**
    - **최적화 전**
        - Performance: 65-70점
        - LCP: 3.2초
        - CLS: 0.15
        - FID: 180ms

    - **최적화 후**
        - Performance: 85-90점
        - LCP: 1.8초 (44% 개선)
        - CLS: 0.05 (67% 개선)
        - FID: 95ms (47% 개선)

## 최적화 결과 요약

### 핵심 성과

| 항목 | 최적화 전 | 최적화 후 | 개선율 |
|------|----------|----------|--------|
| 이미지 용량 | 149MB | 45MB | 70% 감소 |
| 페이지 로딩 시간 | 3-5초 | 1-2초 | 60-70% 단축 |
| Lighthouse 점수 | 65-70점 | 85-90점 | 20-25점 향상 |
| LCP | 3.2초 | 1.8초 | 44% 개선 |
| CLS | 0.15 | 0.05 | 67% 개선 |
| FID | 180ms | 95ms | 47% 개선 |

### 적용된 기술

- **이미지 압축**
    - pngquant, jpegoptim
- **자동화** 
    - Git pre-commit 훅
- **모니터링**
    - Lighthouse, Chrome DevTools
- **스크립트**
    - Node.js 기반 최적화 도구

## 트러블슈팅

### 자주 발생하는 문제와 해결 방법

- **이미지 최적화 도구 설치 오류**
    - **문제**
        - `pngquant` 또는 `jpegoptim` 명령어를 찾을 수 없음

        ```bash
        # 오류 메시지
        command not found: pngquant
        command not found: jpegoptim
        ```

    - **해결 방법**
    
        ```bash
        # macOS
        brew install pngquant jpegoptim

        # Ubuntu/Debian
        sudo apt-get install pngquant jpegoptim
        ```

- **Git 훅 실행 권한 문제**
    - **문제**
        - pre-commit 훅이 실행되지 않음

        ```bash
        # 오류 메시지
        .git/hooks/pre-commit: Permission denied
        ```

    - **해결 방법**

        ```bash
        # 실행 권한 부여
        chmod +x .git/hooks/pre-commit

        # 권한 확인
        ls -la .git/hooks/pre-commit
        ```

- **이미지 최적화 실패**
    - **문제**: 일부 이미지 파일이 최적화되지 않음

    - **원인 분석**
        - 손상된 이미지 파일
        - 권한 문제
        - 디스크 공간 부족

    - **해결 방법**
        ```bash
        # 이미지 파일 무결성 확인
        file assets/img/problematic-image.png

        # 권한 확인 및 수정
        chmod 644 assets/img/*.png
        chmod 644 assets/img/*.jpg

        # 디스크 공간 확인
        df -h
        ```

- **Node.js 버전 호환성 문제**
    - **문제**
        - 스크립트 실행 시 Node.js 버전 오류

    - **해결 방법**
        ```bash
        # Node.js 버전 확인
        node --version

        # nvm을 사용한 버전 관리
        nvm install 16
        nvm use 16
        ```

- **Git 훅이 실행되지 않는 문제**
    - **문제**
        - pre-commit 훅을 설정했지만 이미지 최적화가 실행되지 않음

    - **원인 분석**
        - Git 훅이 비활성화되어 있음
        - 훅 파일이 올바른 위치에 없음
        - Git 설정에서 훅이 무시됨

    - **해결 방법**
        ```bash
        # Git 훅 활성화 확인
        git config core.hooksPath

        # 훅 파일 위치 확인
        ls -la .git/hooks/pre-commit

        # Git 훅 경로 설정 (필요시)
        git config core.hooksPath .git/hooks

        # 훅 테스트
        git add assets/img/test-image.png
        git commit -m "훅 테스트"
        ```

- **이미지 품질 최적화 문제**
    - **문제**
        - 최적화 후 이미지 품질이 너무 낮아짐
        - 일부 이미지에서 아티팩트 발생

    - **원인 분석**
        - 압축 품질 설정이 너무 낮음 (85%)
        - 이미지 유형에 따른 최적화 설정 부족
        - 원본 이미지 품질 문제

    - **해결 방법**
        ```bash
        # 품질 설정 조정 (auto-optimize-images.js 수정)
        const QUALITY = 90; // 85에서 90으로 상향 조정

        # 이미지 유형별 품질 설정
        if (ext === '.png') {
            // PNG는 더 높은 품질 유지
            execSync(`pngquant --quality=80-95 "${filePath}"`);
        } else if (ext === '.jpg' || ext === '.jpeg') {
            // JPEG는 적당한 품질
            execSync(`jpegoptim --max=90 "${filePath}"`);
        }

        # 원본 이미지 품질 확인
        identify -verbose assets/img/sample-image.jpg
        ```

## Reference

- [pngquant 공식 문서](https://pngquant.org/)
- [jpegoptim 공식 문서](https://github.com/tjko/jpegoptim)
- [Jekyll 공식 문서](https://jekyllrb.com/)
- [Git Hooks 가이드](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
