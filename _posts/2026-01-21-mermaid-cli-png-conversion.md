---
title: 'Mermaid CLI로 다이어그램을 고화질 PNG로 변환하기'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-21 18:00:00 +0900
category: [Blog]
tags: [mermaid, cli, diagram, png, documentation, markdown]
math: false
mermaid: false
---
# Mermaid CLI로 다이어그램을 고화질 PNG로 변환하기

- Mermaid 다이어그램을 마크다운에서 사용할 때 렌더링 성능 문제나 호환성 이슈로 PNG 이미지로 변환해야 하는 경우가 있음
- Mermaid CLI(mmdc)를 사용하여 고화질 PNG 이미지로 변환하는 방법을 정리함

<br/><br/>

## Mermaid CLI란?

### 개요

- Mermaid 다이어그램을 명령줄에서 이미지 파일로 변환할 수 있는 도구
- PNG, SVG, PDF 등 다양한 형식으로 출력 가능
- Node.js 기반으로 작동

### 사용 이유

- **성능 개선**
  - 브라우저에서 실시간 렌더링 대신 정적 이미지 사용
  - 페이지 로딩 속도 향상
- **호환성**
  - Mermaid를 지원하지 않는 플랫폼에서도 이미지로 표시 가능
  - GitHub Pages의 일부 테마에서 Mermaid 렌더링 이슈 해결
- **일관성**
  - 모든 환경에서 동일한 렌더링 결과 보장
  - 다크모드/라이트모드 대응 가능

<br/><br/>

## 설치 방법

### macOS (Homebrew)

```bash
# Node.js 설치 (이미 설치되어 있다면 생략)
brew install node

# Mermaid CLI 설치
npm install -g @mermaid-js/mermaid-cli
```

### Linux

```bash
# Node.js 설치
sudo apt-get update
sudo apt-get install nodejs npm

# Mermaid CLI 설치
sudo npm install -g @mermaid-js/mermaid-cli
```

### Windows

```bash
# Node.js 설치 후 (https://nodejs.org)
npm install -g @mermaid-js/mermaid-cli
```

### 설치 확인

```bash
mmdc --version
```

<br/><br/>

## 기본 사용법

### 1. Mermaid 파일 작성

- `.mmd` 확장자로 다이어그램 저장

  ```mermaid
  graph LR
      A[시작] --> B[처리]
      B --> C[종료]
  ```

- 위 내용을 `diagram.mmd` 파일로 저장

### 2. PNG로 변환

```bash
mmdc -i diagram.mmd -o diagram.png
```

- **주요 옵션**
  - `-i` (input)
    - 입력 파일 경로
  - `-o` (output)
    - 출력 파일 경로

<br/><br/>

## 주요 옵션

### 이미지 크기 설정

```bash
# 너비와 높이 지정
mmdc -i diagram.mmd -o diagram.png -w 1200 -H 800
```

- **옵션 설명**
  - `-w` (width)
    - 너비(픽셀)
  - `-H` (height)
    - 높이(픽셀)

### 배경색 설정

```bash
# 투명 배경
mmdc -i diagram.mmd -o diagram.png -b transparent

# 흰색 배경
mmdc -i diagram.mmd -o diagram.png -b white

# 사용자 정의 색상 (HEX)
mmdc -i diagram.mmd -o diagram.png -b "#f0f0f0"
```

- **옵션 설명**
  - `-b` (background)
    - 배경색 지정

### 테마 설정

```bash
# 기본 테마
mmdc -i diagram.mmd -o diagram.png -t default

# 다크 테마
mmdc -i diagram.mmd -o diagram.png -t dark

# 포레스트 테마
mmdc -i diagram.mmd -o diagram.png -t forest
```

- **옵션 설명**
  - `-t` (theme)
    - 테마 선택

### 출력 형식 변경

```bash
# SVG로 출력
mmdc -i diagram.mmd -o diagram.svg

# PDF로 출력
mmdc -i diagram.mmd -o diagram.pdf
```

- 확장자에 따라 자동으로 형식 결정됨

<br/><br/>

## 활용

### 고화질 다이어그램 이미지 생성

- 고화질 이미지 생성

  ```bash
  mmdc -i flowchart.mmd \
       -o assets/img/flowchart.png \
       -w 1400 \
       -H 800 \
       -b transparent \
       -t default
  ```

### 여러 파일 일괄 변환

- 디렉토리 내 모든 `.mmd` 파일을 PNG로 변환

  ```bash
  #!/bin/bash
  # convert-all.sh
  
  for file in diagrams/*.mmd; do
      filename=$(basename "$file" .mmd)
      mmdc -i "$file" \
           -o "output/${filename}.png" \
           -w 1200 \
           -H 600 \
           -b transparent
  done
  ```

### 설정 파일 사용

- 복잡한 옵션을 설정 파일로 관리

  - **config.json**
    ```json
    {
        "theme": "default",
        "width": 1200,
        "height": 800,
        "backgroundColor": "transparent"
    }
    ```

  - **사용**
    ```bash
    mmdc -i diagram.mmd -o diagram.png -c config.json
    ```

<br/><br/>

## Trouble Shooting

### Puppeteer 설치 오류

- **원인**
  - Mermaid CLI는 내부적으로 Puppeteer 사용
  - 설치 중 Chromium 다운로드 오류 발생 가능
- **해결**

  ```bash
  # Chromium 다운로드 건너뛰기
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install -g @mermaid-js/mermaid-cli
  ```

### 한글 폰트 깨짐

- **원인**
  - 시스템 폰트 설정 필요
- **해결**

  **config.json**
  ```json
  {
    "theme": "default",
    "fontFamily": "Arial, sans-serif"
  }
  ```

### 메모리 부족 오류

- **원인**
  - 큰 다이어그램 변환 시 메모리 부족
- **해결**

  ```bash
  # Node.js 메모리 제한 증가
  NODE_OPTIONS="--max-old-space-size=4096" mmdc -i large-diagram.mmd -o output.png
  ```

<br/><br/>

## 팁과 권장사항

### 투명 배경 활용

```bash
mmdc -i diagram.mmd -o diagram.png -b transparent
```

- **장점**
  - 다크모드/라이트모드 모두 대응 가능
  - 다양한 배경에 자연스럽게 배치

### 버전 관리

```bash
# Mermaid 소스 파일(.mmd)을 Git에 포함
git add diagrams/*.mmd

# PNG는 .gitignore에 추가하고 빌드 시 생성
echo "assets/img/*.png" >> .gitignore
```

- **권장 사항**
  - 소스 파일(`.mmd`)만 버전 관리
  - 생성된 이미지는 빌드 시 자동 생성

### CI/CD 통합

- GitHub Actions에서 자동 변환

  ```yaml
  # .github/workflows/generate-diagrams.yml
  name: Generate Diagrams
  
  on:
    push:
      paths:
        - 'diagrams/**.mmd'
  
  jobs:
    generate:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v2
        - uses: actions/setup-node@v2
        - run: npm install -g @mermaid-js/mermaid-cli
        - run: |
            for file in diagrams/*.mmd; do
              mmdc -i "$file" -o "assets/img/$(basename $file .mmd).png" -b transparent
            done
        - uses: stefanzweifel/git-auto-commit-action@v4
          with:
            commit_message: Update diagrams
  ```

<br/><br/>

## Reference

- [Mermaid CLI GitHub](https://github.com/mermaid-js/mermaid-cli)
- [Mermaid 공식 문서](https://mermaid.js.org/)
