---
title: "Docker 개념 및 설치 가이드"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2022-10-25 05:50:00 +0900
category:
  - [Infrastructure, Docker]
tags:
  - [docker, docker-compose, devops, container]
math: true
mermaid: true
---

<br/><br/>

## Docker 개요
- 애플리케이션 개발 및 실행을 위한 오픈소스 컨테이너 플랫폼
- OS 수준 가상화 기술로 애플리케이션과 의존성을 컨테이너로 패키징
- 신속한 구축, 테스트, 배포를 지원하는 현대 DevOps의 핵심 도구


<br/><br/>

## Docker와 VM (가상 머신)


### 아키텍처 비교

![image](/assets/img/docker/docker-vm-compare.png)


### 비교표

| 특징 | Docker Container | Virtual Machine |
|------|------------------|-----------------|
| **가상화 수준** | OS 수준 (프로세스 격리) | 하드웨어 수준 (전체 OS) |
| **부팅 시간** | 초 단위 | 분 단위 |
| **리소스 사용** | 매우 가벼움 (MB 단위) | 무거움 (GB 단위) |
| **성능** | 네이티브에 가까움 | 오버헤드 존재 |
| **격리 수준** | 프로세스 격리 | 완전 격리 |
| **OS 제약** | Host OS와 동일 계열만 가능 | 완전히 다른 OS 실행 가능 |
| **배포 속도** | 매우 빠름 | 느림 |

![mermaid-diagram](/assets/img/docker/2022-10-25-docker-install-diagram-1.png)


<br/><br/>

## Docker 개념


### Docker 구성 요소

![mermaid-diagram](/assets/img/docker/2022-10-25-docker-install-diagram-2.png)

![image](/assets/img/docker/docker-components.png)


### Docker Image
- 애플리케이션 실행에 필요한 모든 것을 포함한 읽기 전용 템플릿
  - 소스 코드
  - 라이브러리 및 의존성
  - 환경 변수
  - 실행 명령어
- 레이어 기반 구조로 효율적 저장
- 한 번 빌드하면 어디서든 동일하게 실행 가능
- 이미지 하나로 여러 컨테이너 생성 가능


### Docker Container
- Docker Image를 실행한 격리된 프로세스
- 독립적인 실행 환경 제공
  - 파일 시스템
  - 네트워크
  - 프로세스 공간
- 경량화된 가상 환경
- 컨테이너 삭제 시 내부 데이터도 함께 삭제 (볼륨 미사용 시)


### Dockerfile
- Docker Image를 빌드하기 위한 스크립트 파일
- 텍스트 기반 명령어로 이미지 구성 정의
- 버전 관리 가능하여 재현성 보장

- 기본 빌드 명령어
  ```bash
  # 현재 디렉토리의 Dockerfile 사용
  docker build .
  
  # 태그 지정하여 빌드
  docker build -t myapp:1.0 .
  
  # 특정 파일 지정
  docker build -f /path/to/Dockerfile .
  ```


### Docker Hub
- Docker 이미지 저장 및 공유를 위한 공식 레지스트리
- [Docker Hub 사이트](https://hub.docker.com/)
- 공식(Official) 이미지 제공
  - Nginx, MySQL, Redis, PostgreSQL 등
  - 검증된 이미지로 안전하게 사용 가능
    ![image](/assets/img/docker/docker-3.jpg)
- 커뮤니티 이미지 공유
- Private 레지스트리 지원


<br/><br/>

## Docker Compose 개요


### Docker vs Docker Compose

| 구분 | Docker | Docker Compose |
|------|--------|----------------|
| **관리 단위** | 단일 컨테이너 | 다중 컨테이너 (오케스트레이션) |
| **설정 방식** | CLI 명령어 (긴 옵션) | YAML 파일 (선언적) |
| **주요 용도** | 개별 애플리케이션 실행 | 전체 스택 관리 (앱 + DB + 캐시 등) |
| **네트워크** | 수동 생성 및 연결 | 자동 생성 및 연결 |
| **볼륨 관리** | 개별 볼륨 설정 | 통합 볼륨 관리 |
| **확장성** | 수동으로 여러 컨테이너 실행 | `scale` 명령어로 자동 확장 |


### Docker Compose 특징
- 다중 컨테이너 애플리케이션 정의 및 실행 도구
- YAML 파일로 서비스 구성 선언
- 단일 명령어로 전체 스택 실행 및 관리
- 모든 환경에서 일관된 실행 보장
  - 개발(Development)
  - 스테이징(Staging)
  - 프로덕션(Production)
  - 테스트(Testing)


### Docker Compose 샘플 파일

```yaml
version: '3.8'  # V2에서는 선택 사항 (Optional)

services:
  frontend:
    image: awesome/webapp
    ports:
      - "443:8043"
    networks:
      - front-tier
      - back-tier
    configs:
      - httpd-config
    secrets:
      - server-certificate
    depends_on:
      - backend

  backend:
    image: awesome/database
    volumes:
      - db-data:/etc/data
    networks:
      - back-tier
    environment:
      - MYSQL_ROOT_PASSWORD=secret

volumes:
  db-data:
    driver: flocker
    driver_opts:
      size: "10GiB"

configs:
  httpd-config:
    external: true

secrets:
  server-certificate:
    external: true

networks:
  front-tier: {}
  back-tier: {}
```


<br/><br/>

## Docker 라이프사이클

![mermaid-diagram](/assets/img/docker/2022-10-25-docker-install-diagram-3.png)

![image](/assets/img/docker/docker-lifecycle.png)


<br/><br/>

## Docker 설치 (Ubuntu)


### 설치 프로세스

![image](/assets/img/docker/docker-install-process.png)


### 기존 버전 제거 및 환경 준비

- 기존 Docker 제거
  ```bash
  sudo apt-get remove docker docker-engine docker.io containerd runc
  ```

- 시스템 패키지 업데이트
  ```bash
  sudo apt-get update
  ```

- HTTPS를 통한 Repository 사용을 위한 필수 패키지 설치
  ```bash
  sudo apt-get -y install \
      apt-transport-https \
      ca-certificates \
      curl \
      gnupg \
      lsb-release
  ```

  - `apt-transport-https`
    - HTTPS 프로토콜로 패키지 다운로드
  - `ca-certificates`
    - SSL 인증서 검증
  - `curl`
    - 파일 다운로드 도구
  - `gnupg`
    - GPG 키 관리
  - `lsb-release`
    - Linux 배포판 정보 확인



### Docker Repository 설정

- Docker 공식 GPG 키 추가
  ```bash
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
      sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  ```

- Stable Repository 등록
  ```bash
  # 자동으로 아키텍처 감지
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  ```

  - 특정 아키텍처 지정 (amd64)
    ```bash
    echo \
      "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
      https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    ```



### Docker Engine 설치

- 패키지 인덱스 업데이트 및 최신 버전 설치
  ```bash
  sudo apt-get update
  sudo apt-get install docker-ce docker-ce-cli containerd.io
  ```

  - `docker-ce`
    - Docker Community Edition 엔진
  - `docker-ce-cli`
    - Docker 명령줄 인터페이스
  - `containerd.io`
    - 컨테이너 런타임

  - `containerd.io`
    - 컨테이너 런타임

- 특정 버전 설치
  ```bash
  # 사용 가능한 버전 확인
  apt-cache madison docker-ce
  
  # 특정 버전 설치
  sudo apt-get install docker-ce=<VERSION_STRING> \
      docker-ce-cli=<VERSION_STRING> \
      containerd.io
  ```

- 서비스 시작 및 부팅 시 자동 실행 (필수)
  ```bash
  sudo systemctl start docker
  sudo systemctl enable docker
  ```





### 설치 확인

- Hello World 이미지로 동작 테스트
  ```bash
  sudo docker run hello-world
  ```

  - 정상 설치 시 출력 메시지
    ```
    Hello from Docker!
    This message shows that your installation appears to be working correctly.
    ```

- Docker 버전 확인
  ```bash
  docker --version
  # 출력 예: Docker version 24.0.5, build ced0996
  ```

- Docker 상세 정보 확인
  ```bash
  docker info
  ```


<br/><br/>

## Docker Compose 설치


### Docker Compose V1 설치 (Legacy)

- Docker Compose 바이너리 다운로드
  ```bash
  sudo curl -L \
      "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" \
      -o /usr/local/bin/docker-compose
  ```

- 실행 권한 부여
  ```bash
  sudo chmod +x /usr/local/bin/docker-compose
  ```

- 설치 확인
  ```bash
  docker-compose --version
  # 출력 예: docker-compose version 1.29.2, build 5becea4c
  ```



### Docker Compose V2 설치 (권장)

- Docker Compose는 이제 Docker CLI 플러그인으로 제공
- 패키지 매니저를 통한 설치 권장 (자동 업데이트 지원)

```bash
# Docker Repository가 이미 등록되어 있어야 함 (위의 Docker Engine 설치 과정 참조)
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 설치 확인
docker compose version
# 출력 예: Docker Compose version v2.20.2
```

- 수동 설치 (대안)
  - 인터넷이 제한된 환경 등 패키지 사용이 어려울 때만 사용
  ```bash
  mkdir -p ~/.docker/cli-plugins/
  curl -SL https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
  chmod +x ~/.docker/cli-plugins/docker-compose
  ```


<br/><br/>

## 사용자 권한 설정 (선택)


### sudo 없이 Docker 사용하기

- Docker 그룹에 현재 사용자 추가
  ```bash
  # docker 그룹 생성 (보통 자동 생성됨)
  sudo groupadd docker
  
  # 현재 사용자를 docker 그룹에 추가
  sudo usermod -aG docker $USER
  
  # 그룹 변경 적용 (로그아웃 후 재로그인 또는 실행)
  newgrp docker
  ```

- 권한 확인
  ```bash
  # sudo 없이 실행 테스트
  docker run hello-world
  ```

> **보안 주의사항**
> - `docker` 그룹의 사용자는 root 권한과 동등한 접근 권한 보유
> - 프로덕션 환경에서는 최소 권한 원칙 적용 필요


<br/><br/>

## 설치 확인 체크리스트

| 항목 | 명령어 | 기대 결과 |
|------|--------|-----------|
| **Docker 버전** | `docker --version` | Docker version 정보 출력 |
| **Docker 실행** | `docker run hello-world` | 성공 메시지 출력 |
| **Docker Info** | `docker info` | 시스템 정보 출력 (컨테이너 수 등) |
| **Docker Compose V1** | `docker-compose --version` | Version 1.x 정보 출력 |
| **Docker Compose V2** | `docker compose version` | Version 2.x 정보 출력 |
| **권한 확인** | `docker ps` (sudo 없이) | 실행 중인 컨테이너 목록 출력 |


<br/><br/>

## 다음 단계

- Docker 기본 명령어 학습
  - 이미지 관리 (`pull`, `build`, `push`)
  - 컨테이너 관리 (`run`, `stop`, `rm`)
  - 로그 및 디버깅 (`logs`, `exec`)

- Docker Compose 사용법
  - `docker-compose.yml` 작성
  - 다중 컨테이너 애플리케이션 실행

- Dockerfile 작성
  - 커스텀 이미지 빌드
  - 멀티 스테이지 빌드


<br/><br/>

## Reference
- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Engine 설치 가이드](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [Docker Hub](https://hub.docker.com/)
