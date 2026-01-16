---
title: Jekyll 블로그 설치 및 로컬 실행 가이드
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2025-10-11 18:50:00 +0900
category: [Blog]
tags: [jekyll, git-blog]
math: true
mermaid: false
---
## 개요

- Jekyll 기반 GitHub Pages 블로그를 처음부터 설치하고 로컬에서 실행하는 과정을 설명함


<br/><br/>

## 사전 준비사항

### 필수 도구 확인

- 블로그 구축에 필요한 도구들
  - Git
    - 버전 관리 시스템
    - GitHub Pages 배포에 필수
  - Ruby
    - Jekyll이 동작하는 런타임 환경
    - 버전 2.5 이상 권장
  - RubyGems
    - Ruby 패키지 관리자
    - Ruby 설치 시 함께 설치됨
  - Bundler
    - Ruby 의존성 관리 도구
    - Jekyll 프로젝트 관리에 필수

### 운영체제별 도구 설치

#### Windows

- Ruby 설치
  - RubyInstaller 다운로드
    - [RubyInstaller 공식 사이트](https://rubyinstaller.org/) 접속
    - Ruby+Devkit 최신 버전 다운로드
  - 설치 과정
    - 다운로드한 설치 파일 실행
    - "Add Ruby executables to your PATH" 옵션 체크
    - MSYS2 설치 단계에서 모든 옵션 선택 (1, 2, 3)
  - 설치 확인
    ```bash
    ruby -v
    gem -v
    ```

- Git 설치
  - Git for Windows 다운로드
    - [Git 공식 사이트](https://git-scm.com/download/win) 접속
    - 최신 버전 다운로드
  - 설치 과정
    - 기본 설정으로 설치 진행
  - 설치 확인
    ```bash
    git --version
    ```

- Bundler 설치
  ```bash
  gem install bundler
  
  # 설치 확인
  bundle -v
  ```

#### macOS

- Homebrew 설치
  - 터미널에서 실행
    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```
  - 설치 확인
    ```bash
    brew --version
    ```

- Ruby 설치
  - rbenv를 통한 Ruby 설치
    ```bash
    # rbenv 설치
    brew install rbenv ruby-build
    
    # rbenv 초기화
    rbenv init
    
    # .zshrc 또는 .bash_profile에 추가
    echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
    source ~/.zshrc
    
    # 설치 가능한 Ruby 버전 확인
    rbenv install -l
    
    # Ruby 설치 (최신 안정 버전)
    rbenv install 3.2.2
    rbenv global 3.2.2
    
    # 설치 확인
    ruby -v
    ```

- Git 설치
  ```bash
  # Git 설치
  brew install git
  
  # 설치 확인
  git --version
  ```

- Bundler 설치
  ```bash
  gem install bundler
  
  # 설치 확인
  bundle -v
  ```


<br/><br/>

## Jekyll 테마 선택 및 설치

### 테마 찾기

- Jekyll 테마 사이트
  - [Jekyll Themes](http://jekyllthemes.org/)
    - 무료 Jekyll 테마 모음
    - 카테고리별 분류
    - 미리보기 제공
  - [Jekyll Themes.io](https://jekyllthemes.io/)
    - 무료/유료 테마 제공
    - 인기순, 최신순 정렬
    - 상세한 테마 설명
  - [JamStack Themes - Jekyll](https://jamstackthemes.dev/ssg/jekyll/)
    - JamStack 기반 테마 모음
    - Jekyll 테마 필터링
    - GitHub 스타 수 표시
  - [GitHub Jekyll Theme 토픽](https://github.com/topics/jekyll-theme)
    - GitHub에서 직접 검색
    - 최신 업데이트 확인 용이
    - 이슈, PR 활동 확인 가능

### 인기 Jekyll 테마 소개

- Chirpy
  - 깔끔한 디자인의 블로그 테마
  - 다크 모드 지원
  - 카테고리, 태그, 검색 기능 내장
  - [GitHub Repository](https://github.com/cotes2020/jekyll-theme-chirpy)

- Minimal Mistakes
  - 가장 많이 사용되는 테마 중 하나
  - 반응형 디자인
  - 다양한 레이아웃 옵션
  - [GitHub Repository](https://github.com/mmistakes/minimal-mistakes)

- Beautiful Jekyll
  - 초보자 친화적인 테마
  - 간단한 설정
  - 빠른 시작 가능
  - [GitHub Repository](https://github.com/daattali/beautiful-jekyll)

- TeXt Theme
  - 문서화 친화적 테마
  - 다국어 지원
  - 커스터마이징 용이
  - [GitHub Repository](https://github.com/kitian616/jekyll-TeXt-theme)

- Basically Basic
  - 미니멀한 디자인
  - 빠른 로딩 속도
  - 접근성 중심 설계
  - [GitHub Repository](https://github.com/mmistakes/jekyll-theme-basically-basic)

### GitHub에서 테마 가져오기
* 방법 1, 2 중 선택
1. Fork 하기

    - GitHub에서 테마 Repository 접속
    - 예시: Chirpy 테마
        - [Jekyll Theme Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) 접속
    - Fork 버튼 클릭
        - Repository name을 `username.github.io` 형식으로 변경
        - username은 자신의 GitHub 사용자명
    - 생성된 Repository 확인

    - 로컬로 Clone
        ```bash
        # 원하는 디렉토리로 이동
        cd ~/Documents
        
        # Repository Clone
        git clone https://github.com/username/username.github.io.git
        
        # 프로젝트 디렉토리로 이동
        cd username.github.io
        ```

2. Template 사용하기

    - GitHub에서 "Use this template" 버튼 클릭
    - Repository name 입력
        - `username.github.io` 형식 권장
    - Public으로 설정
        - GitHub Pages는 Public Repository에서만 무료
    - "Create repository from template" 클릭

    - 생성된 Repository Clone
        ```bash
        git clone https://github.com/username/username.github.io.git
        cd username.github.io
        ```


<br/><br/>

## Jekyll 블로그 설정

### 의존성 설치

- Gemfile 확인
  - 프로젝트 루트에 있는 Gemfile 열기
  - 테마에서 제공하는 기본 Gemfile 사용
  - 필요한 gem 패키지 목록 예시
    ```ruby
    source "https://rubygems.org"
    
    gem "jekyll"
    gem "jekyll-theme-chirpy"
    
    # Windows and JRuby does not include zoneinfo files
    install_if -> { RUBY_PLATFORM =~ %r!mingw|mswin|java! } do
      gem "tzinfo"
      gem "tzinfo-data"
    end
    
    # Performance-booster for watching directories on Windows
    gem "wdm", :install_if => Gem.win_platform?
    
    # Jekyll compatibility with Ruby 3.0
    gem "webrick"
    ```

- Bundle 설치 실행
  ```bash
  # 의존성 설치
  bundle install
  ```

- 설치 확인
  ```bash
  # Jekyll 버전 확인
  bundle exec jekyll -v
  ```

### 블로그 기본 설정

- _config.yml 파일 수정
  - 기본 정보 설정
    ```yaml
    # 사이트 제목
    title: 
    
    # 사이트 설명
    tagline: 
    
    # 사이트 URL
    url: "https://username.github.io"
    
    # GitHub 사용자명
    github:
      username: username
    
    # 소셜 정보
    social:
      name: Your Name
      email: your.email@example.com
      links:
        - https://github.com/username
        - https://twitter.com/username
    
    # 타임존 설정
    timezone: Asia/Seoul
    
    # 언어 설정
    lang: ko-KR
    ```

  - 테마 설정
    ```yaml
    # 테마 모드
    theme_mode: dual  # [light | dark | dual]
    
    # 아바타 이미지
    avatar: /assets/img/profile.jpg
    
    # TOC (Table of Contents) 설정
    toc: true
    
    # 댓글 시스템 설정
    comments:
      active: giscus  # [disqus | utterances | giscus]
      
      # Giscus 설정 
      giscus:
        repo: username/username.github.io
        repo_id: YOUR_REPO_ID
        category: Comments
        category_id: YOUR_CATEGORY_ID
    
    # Google Analytics
    google_analytics:
      id: G-XXXXXXXXXX
    ```

### 프로필 이미지 추가

- 이미지 파일 준비
  - 정사각형 이미지 권장
    - 추천 크기: 512x512px
  - 파일 형식
    - PNG, JPG 지원
  - 파일 배치
    - assets/img 디렉토리에 이미지 파일 복사
    - _config.yml의 avatar 경로와 일치하도록 저장


<br/><br/>

## 로컬에서 블로그 실행하기

### Jekyll 개발 서버 시작

- 기본 실행 방법
  ```bash
  # 프로젝트 디렉토리에서 실행
  bundle exec jekyll serve
  ```

- 자동 새로고침 옵션
  ```bash
  # LiveReload 기능 활성화
  bundle exec jekyll serve --livereload
  
  # 브라우저에서 파일 수정 시 자동 새로고침됨
  ```

- 포트 변경
  ```bash
  # 다른 포트로 실행 (기본: 4000)
  bundle exec jekyll serve --port 4001
  ```

- 빌드 캐시 초기화
  ```bash
  # 기존 빌드 파일 삭제 후 실행
  bundle exec jekyll clean
  bundle exec jekyll serve
  ```

### 브라우저에서 확인

- 로컬 서버 접속
  - 주소창에 입력
    - `http://localhost:4000`
    - `http://127.0.0.1:4000`
  - 블로그 메인 페이지 확인
  - 메뉴 및 기능 테스트

- 변경사항 실시간 확인
  - 파일 수정 후 저장
  - LiveReload 사용 시 자동 새로고침
  - 수동 새로고침 필요 시
    - Windows: `Ctrl + R` 또는 `F5`
    - Mac: `Cmd + R`
  - 브라우저 캐시 강제 새로고침
    - Windows: `Ctrl + Shift + R`
    - Mac: `Cmd + Shift + R`


<br/><br/>

## 첫 번째 포스트 작성하기

### 포스트 파일 생성

- 파일 이름 규칙
  - 형식
    - `YYYY-MM-DD-title.md`
  - 예시
    - `2025-10-11-my-first-post.md`
  - 위치
    - `_posts` 디렉토리에 생성

- 포스트 파일 생성
  - _posts 디렉토리에 새 파일 생성
    - 파일명: 2025-10-11-my-first-post.md
  - 텍스트 편집기로 열기
    - VSCode, 메모장 등 사용

### Front Matter 작성

- 기본 구조
  ```yaml
  ---
  title: "첫 번째 포스트"
  author:
    name: Your Name
    link: https://github.com/username
  date: 2025-10-11 14:00:00 +0900
  category:
    - [Blog]
  tags:
    - [first post, jekyll, blog]
  ---
  ```

- 주요 옵션 설명
  - title
    - 포스트 제목
    - 따옴표로 감싸기 권장
  - date
    - 작성 날짜와 시간
    - 타임존 포함
  - category
    - 카테고리 분류
    - 배열 형식으로 작성
    - 대분류, 소분류 지원
  - tags
    - 태그 목록
    - 배열 형식으로 작성
  - pin
    - 메인 페이지에 고정
    - true/false
  - math
    - 수학 수식 렌더링 활성화
    - true/false
  - mermaid
    - 다이어그램 렌더링 활성화
    - true/false

### 본문 작성

- Markdown 기본 문법
  ```markdown
  # 제목 1
  ## 제목 2
  ### 제목 3
  
  - 일반 텍스트 작성
    - 들여쓰기를 통한 계층 구조
  ```

- 이미지 삽입
  - 이미지 추가 방법
    - 이미지 파일을 assets/img 폴더에 저장
    - Markdown에서 참조
      ```markdown
      ![이미지 설명](/assets/img/sample-image.jpg)
      ```

- 코드 블록
  - 코드 작성 예시
    ```python
    def hello_world():
        print("Hello, Jekyll!")
    ```

- 링크 추가
  - 외부 링크
    - [Jekyll 공식 문서](https://jekyllrb.com/)


<br/><br/>

## GitHub Pages에 배포하기

### Git 설정

- Git 사용자 정보 설정
  ```bash
  # 전역 설정
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  
  # 설정 확인
  git config --list
  ```

- Git 저장소 확인
  ```bash
  # 이미 Clone한 경우 이 단계는 건너뜀
  # Git 상태 확인
  git status
  ```

### 변경사항 커밋

- 작성한 포스트 추가
  ```bash
  # 새 파일 추가
  git add _posts/2025-10-11-my-first-post.md
  
  # 또는 모든 변경사항 추가
  git add .
  
  # 상태 확인
  git status
  
  # 커밋
  git commit -m "첫 번째 포스트 작성"
  ```

- 설정 파일 변경사항 커밋
  ```bash
  # 설정 파일 추가
  git add _config.yml
  
  # 커밋
  git commit -m "블로그 기본 설정 완료"
  ```

### GitHub에 푸시

- 원격 저장소 확인
  ```bash
  # 원격 저장소 목록 확인
  git remote -v
  ```

- 변경사항 푸시
  ```bash
  # main 브랜치에 푸시
  git push origin main
  
  # 또는 master 브랜치인 경우
  git push origin master
  ```

### GitHub Pages 설정 확인

- GitHub Repository 설정
  - GitHub에서 Repository 접속
  - Settings 메뉴 클릭
  - Pages 섹션으로 이동
  - Source 설정 확인
    - Branch: main (또는 master)
    - Folder: / (root)
  - Save 버튼 클릭

- 배포 상태 확인
  - Actions 탭에서 빌드 진행 상황 확인
  - 녹색 체크 표시가 나타나면 배포 완료

- 배포된 사이트 접속
  - 브라우저에서 접속
    - `https://username.github.io`
  - 포스트 확인
  - 기능 테스트


<br/><br/>

## 주요 디렉토리 구조 이해하기

### Jekyll 프로젝트 구조

```
username.github.io/
├── _config.yml           # 사이트 전역 설정
├── _posts/              # 블로그 포스트
│   └── YYYY-MM-DD-title.md
├── _layouts/            # 레이아웃 템플릿
│   ├── default.html
│   └── post.html
├── _includes/           # 재사용 가능한 컴포넌트
│   ├── header.html
│   └── footer.html
├── _sass/               # SASS 스타일시트
│   └── main.scss
├── assets/              # 정적 파일
│   ├── css/
│   ├── js/
│   └── img/
├── _site/               # 생성된 사이트 (Git 무시)
├── .gitignore           # Git 무시 파일 목록
├── Gemfile              # Ruby 의존성 정의
├── Gemfile.lock         # 의존성 버전 고정
└── index.html           # 메인 페이지
```

### 중요 디렉토리 설명

- _posts
  - 역할
    - 블로그 포스트 저장 위치
  - 파일 규칙
    - YYYY-MM-DD-title.md 형식
  - 주의사항
    - 날짜가 미래인 포스트는 표시되지 않음
    - --future 옵션으로 확인 가능

- assets
  - 역할
    - 이미지, CSS, JavaScript 등 정적 파일
  - 구조
    - img: 이미지 파일
    - css: 스타일시트
    - js: JavaScript 파일
  - 참조 방법
    - Markdown: `/assets/img/image.jpg`
    - HTML: `{{ '/assets/img/image.jpg' | relative_url }}`

- _site
  - 역할
    - Jekyll이 생성한 정적 사이트
  - 특징
    - 빌드할 때마다 자동 생성
    - Git에 커밋하지 않음
  - 주의사항
    - 직접 수정하지 말 것
    - 수정 사항은 소스 파일에서


<br/><br/>

## 테마 커스터마이징

### 스타일 수정

- SCSS 파일 위치
  - `_sass` 디렉토리
  - `assets/css` 디렉토리

- 커스텀 스타일 추가
  - _sass 디렉토리에 custom.scss 파일 생성

- 색상 변경 예시
  ```scss
  // _sass/custom.scss
  
  // 메인 컬러 변경
  $primary-color: #007bff;
  $secondary-color: #6c757d;
  
  // 다크 모드 배경색
  $dark-bg: #1a1a1a;
  
  // 링크 색상
  a {
    color: $primary-color;
    
    &:hover {
      color: darken($primary-color, 10%);
    }
  }
  ```

### 레이아웃 수정

- 레이아웃 파일 확인
  - `_layouts` 디렉토리
  - default.html
    - 기본 레이아웃
  - post.html
    - 포스트 레이아웃
  - page.html
    - 페이지 레이아웃

- 커스텀 레이아웃 생성
  ```html
  <!-- _layouts/custom.html -->
  ---
  layout: default
  ---
  
  <div class="custom-container">
    <article class="post">
      <header class="post-header">
        <h1>{{ page.title }}</h1>
      </header>
      
      <div class="post-content">
        {{ content }}
      </div>
    </article>
  </div>
  ```

### 메뉴 커스터마이징

- Chirpy 테마 메뉴 관리
  - `_tabs` 디렉토리에서 관리
  - 기본 메뉴
    - about.md, archives.md, categories.md, tags.md

- 새 메뉴 추가하기
  - _tabs 디렉토리에 새 파일 생성
    - 예: projects.md
  - Front Matter 설정
    ```yaml
    ---
    layout: page
    title: Projects
    icon: fas fa-folder
    order: 5
    ---
    
    # Projects
    
    - 여기에 프로젝트 내용 작성
    ```
  - order 값으로 메뉴 순서 조정
    - 숫자가 작을수록 왼쪽에 배치
    - 기본 메뉴들의 order 값 참고
  - 아이콘 변경
    - Font Awesome 아이콘 사용
    - [Font Awesome Icons](https://fontawesome.com/icons) 참고


<br/><br/>

## 트러블슈팅

### 자주 발생하는 문제와 해결 방법

#### Ruby 버전 호환성 문제

- 문제 상황
  - Jekyll 빌드 시 Ruby 버전 오류 발생
    ```bash
    # 오류 메시지
    Error: Your Ruby version is 2.7.0, but your Gemfile specified ~> 3.0
    ```

- 해결 방법
  - rbenv로 Ruby 버전 변경
    ```bash
    # 설치 가능한 Ruby 버전 확인
    rbenv install -l
    
    # 필요한 버전 설치 (Gemfile 요구사항에 맞는 버전)
    rbenv install [버전번호]
    
    # 프로젝트에 Ruby 버전 설정
    rbenv local [버전번호]
    
    # 버전 확인
    ruby -v
    
    # Bundle 재설치
    bundle install
    ```

#### Bundler 버전 충돌

- 문제 상황
  - Gemfile.lock에 명시된 Bundler 버전과 설치된 버전이 다름
    ```bash
    # 오류 메시지
    Bundler could not find compatible versions for gem "bundler"
    ```

- 해결 방법
  ```bash
  # Bundler 업데이트
  gem install bundler
  bundle install
  
  # 또는 Gemfile.lock 삭제 후 재생성
  # Windows PowerShell: Remove-Item Gemfile.lock
  # Git Bash / Mac / Linux: rm Gemfile.lock
  bundle install
  
  # 또는 특정 버전 설치 후 사용 (Gemfile.lock에 명시된 버전)
  gem install bundler -v [버전번호]
  bundle install
  ```

#### 포트 충돌 오류

- 문제 상황
  - 4000번 포트가 이미 사용 중
    ```bash
    # 오류 메시지
    Address already in use - bind(2) for 127.0.0.1:4000
    ```

- 해결 방법
  ```bash
  # 다른 포트로 실행
  bundle exec jekyll serve --port 4001
  
  # 또는 기존 프로세스 종료 (Windows)
  netstat -ano | findstr :4000
  taskkill /PID [프로세스ID] /F
  
  # 또는 기존 프로세스 종료 (Mac/Linux)
  lsof -ti:4000 | xargs kill -9
  ```

#### 파일 변경사항이 반영되지 않음

- 문제 상황
  - 파일 수정 후 변경사항이 보이지 않음
  - LiveReload가 작동하지 않음

- 해결 방법
  ```bash
  # 캐시 삭제 후 재실행
  bundle exec jekyll clean
  bundle exec jekyll serve --livereload
  
  # 브라우저 캐시 강제 새로고침
  # Windows: Ctrl + Shift + R
  # Mac: Cmd + Shift + R
  
  # _config.yml 변경 시 서버 재시작 필요
  # Ctrl + C로 중단 후 다시 실행
  ```

#### 이미지가 표시되지 않음

- 문제 상황
  - Markdown에 이미지 추가했지만 화면에 나타나지 않음

- 원인 분석
  - 이미지 경로 오류
  - 파일 이름 대소문자 불일치
  - 상대 경로 문제

- 해결 방법
  - 절대 경로 사용 권장
    - 올바른 방법
      ```markdown
      ![이미지 설명](/assets/img/sample.jpg)
      ```
    - 잘못된 방법
      ```markdown
      ![이미지 설명](../../assets/img/sample.jpg)
      ```
  
  - 파일 이름 확인
    - Linux/Mac은 대소문자 구분
    - sample.jpg ≠ Sample.jpg
  
  - 이미지 파일 존재 확인
    - 파일 탐색기에서 assets/img 디렉토리 확인
    - 파일 이름과 경로가 정확한지 확인

#### GitHub Pages 배포 실패

- 문제 상황
  - Push 후 사이트가 업데이트되지 않음
  - GitHub Actions에서 빌드 실패

- 해결 방법
  ```bash
  # 1. Actions 탭에서 오류 로그 확인
  # GitHub Repository > Actions 탭 클릭
  # 실패한 워크플로우 클릭하여 로그 확인
  
  # 2. 로컬에서 빌드 테스트
  bundle exec jekyll build
  
  # 3. Gemfile.lock 커밋 확인
  git add Gemfile.lock
  git commit -m "Update Gemfile.lock"
  git push origin main
  
  # 4. GitHub Pages 설정 재확인
  # Settings > Pages > Source 확인
  ```

#### Liquid 문법 오류

- 문제 상황
  - 포스트에서 중괄호 사용 시 빌드 오류
    ```bash
    # 오류 메시지
    Liquid Exception: Liquid syntax error
    ```

- 해결 방법
  - Liquid 문법 이스케이프
    - raw 태그 사용
      ```liquid
      {% raw %}
      {{ 중괄호 내용을 그대로 표시 }}
      {% endraw %}
      ```
  
  - 코드 블록에서 자동 이스케이프
    - 백틱 3개로 감싸기
      ```
      print("{{ test }}")
      ```

#### 한글 깨짐 문제

- 문제 상황
  - Windows에서 한글이 깨져서 표시됨

- 해결 방법
  ```bash
  # 파일 인코딩을 UTF-8로 저장
  # VSCode 설정
  # File > Preferences > Settings
  # "files.encoding": "utf8" 확인
  
  # PowerShell 인코딩 설정
  chcp 65001
  
  # _config.yml에 인코딩 명시
  encoding: utf-8
  ```


<br/><br/>

## 성능 최적화 팁

### 이미지 최적화

- 이미지 압축 도구 사용
  - 도구 설치
    ```bash
    # macOS
    brew install pngquant jpegoptim
    
    # Ubuntu/Debian
    sudo apt-get install pngquant jpegoptim
    
    # Windows
    # pngquant: https://pngquant.org/
    # jpegoptim: Linux/Mac 전용, Windows는 온라인 도구 사용 권장
    ```
  - 이미지 압축 실행
    ```bash
    # PNG 압축
    pngquant --quality=65-80 assets/img/*.png
    
    # JPEG 압축 (Mac/Linux)
    jpegoptim --max=85 assets/img/*.jpg
    ```

- WebP 형식 사용
  - 변환 도구 설치
    ```bash
    # macOS
    brew install webp
    
    # Ubuntu/Debian
    sudo apt-get install webp
    
    # Windows
    # Google WebP 공식 사이트에서 다운로드
    # https://developers.google.com/speed/webp/download
    ```
  - 이미지 변환
    ```bash
    cwebp -q 80 input.jpg -o output.webp
    ```

### 빌드 시간 단축

- Incremental 빌드 활성화
  ```bash
  bundle exec jekyll serve --incremental
  ```
  - 주의사항
    - 불안정할 수 있으며 변경사항이 누락될 수 있음
    - 파일 수정이 제대로 반영되지 않으면 `jekyll clean` 후 재실행 권장
    - 프로덕션 빌드에서는 사용하지 않는 것을 권장

- 불필요한 플러그인 비활성화
  - _config.yml에서 사용하지 않는 플러그인 제거

- 개발 환경 설정
  - _config.yml 파일 분리
    ```yaml
    # _config.yml (프로덕션)
    environment: production
    
    # _config_dev.yml (개발)
    environment: development
    ```
  - 개발 환경으로 실행
    ```bash
    bundle exec jekyll serve --config _config.yml,_config_dev.yml
    ```


<br/><br/>

## 유용한 명령어 정리

### Jekyll 명령어

```bash
# 새 Jekyll 사이트 생성
jekyll new my-blog

# 개발 서버 실행
bundle exec jekyll serve

# LiveReload로 실행
bundle exec jekyll serve --livereload

# 미래 날짜 포스트 포함
bundle exec jekyll serve --future

# 다른 포트로 실행
bundle exec jekyll serve --port 4001

# 증분 빌드 (주의: 불안정할 수 있음)
bundle exec jekyll serve --incremental

# 상세 로그 출력
bundle exec jekyll serve --verbose

# 빌드만 실행 (서버 미실행)
bundle exec jekyll build

# 캐시 삭제
bundle exec jekyll clean

# 버전 확인
bundle exec jekyll -v
```

### Git 명령어

```bash
# 저장소 클론
git clone https://github.com/username/username.github.io.git

# 상태 확인
git status

# 변경사항 추가
git add .
git add filename

# 커밋
git commit -m "커밋 메시지"

# 푸시
git push origin main

# 풀
git pull origin main

# 브랜치 생성 및 전환
git checkout -b new-branch

# 브랜치 목록 확인
git branch

# 로그 확인
git log --oneline

# 변경사항 되돌리기
git checkout -- filename
```

### Bundle 명령어

```bash
# 의존성 설치
bundle install

# 의존성 업데이트
bundle update

# 특정 gem 업데이트
bundle update jekyll

# 설치된 gem 목록
bundle list

# gem 정보 확인
bundle info jekyll

# 실행 환경 확인
bundle env

# Gemfile.lock 삭제 후 재생성
# Windows PowerShell
Remove-Item Gemfile.lock
bundle install

# Git Bash / Mac / Linux
rm Gemfile.lock
bundle install
```


<br/><br/>

## Reference

- [Jekyll 공식 문서](https://jekyllrb.com/docs/)
- [GitHub Pages 문서](https://docs.github.com/en/pages)
- [Jekyll Theme Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy)
- [Markdown Guide](https://www.markdownguide.org/)
- [Liquid Template Language](https://shopify.github.io/liquid/)
- [Ruby 공식 사이트](https://www.ruby-lang.org/)
- [RubyGems.org](https://rubygems.org/)
- [Bundler 공식 문서](https://bundler.io/)