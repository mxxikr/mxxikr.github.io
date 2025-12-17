---
title:  "Docker, Docker-Compose 설치"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2022-10-25 05:50:00 +0900
category:
  - [Infrastructure, Docker]
tags:
  - [docker, docker-compose]
math: true
mermaid: true
---
# Docker와 Docker Compose
---
### **Docker**
- 애플리케이션 개발 및 실행을 위한 오픈 소스 플랫폼
- os 수준에서 다른 환경을 세팅 할 수 있게 해주는 가상화 기술
- application을 신속하게 구축, 테스트 및 배포를 할 수 있는 소프트웨어 플랫폼
- host 하나만 존재, 그 위에 Docker 엔진이 컨테이너로 격리해서 실행 관리
    ![image](/assets/img/docker/docker-1.jpg)
- vm에 비해서 훨씬 가벼움
- 컨테이너 단위로 실행
- vm과 달리 host OS와 완전히 다른 OS를 설치하는 것 불가
- 도커 이미지로 도커 컨테이너를 실행 시 새로운 서버 쉽게 배포 가능
    ![image](/assets/img/docker/docker-2.jpg)
    1. dockerfile 빌드 시 dockerimage 생성
    2. dockerimage 실행 시 컨테이너 생성
    3. docker container 실행

### **Docker Container**
- 독립적으로 격리된 Docker Image 실행 공간을 의미

### **Docker Hub**
- [Docker Hub](https://hub.docker.com/)
- 여러 application들의 image나 dockerfile을 제공하는 사이트
- 원하는 버전의 docker file 다운받아 docker 실행 가능
- 실행 환경에서도 검색 가능
    ![image](/assets/img/docker/docker-3.jpg)
    - 가장 위에 있는 official 이미지 다운받아 컨테이너로 실행 가능
    - 검색된 이미지 사용 시 애플리케이션을 설치하고 다시 이미지로 만드는 과정 불필요

### **Docker Image**
- 환경 세팅 정보를 모아놓은 틀
- 이미지 실행 시 container 단위로 실행
- 이미지 하나로 여러 컨테이너 실행 가능 

### **Docker File**
- docker 이미지를 구성하는 것을 도와주는 파일
- docker file 빌드 시 docker 이미지 생성
    ```bash
    docker build -f /home/mxxikr/Dockerfile .
    ```
    ```bash
    docker build .
    ```

### **Docker Compose**
- 다중 컨테이너 도커 애플리케이션을 정의하고 관리 및 실행하기 위한 도구
- YAML 파일 사용해 애플리케이션의 서비스 설정하고 하나의 명령어로 여러 개의 도커 컨테이너들 사용 가능
- 프로덕션, 스테이징, 개발, 테스트 등 모든 환경에서 작업 구성  
- 여러 종류의 이미지를 동시에 다른 docker container로 실행하려 할 때 필요
- docker compose 파일에서도 이미지마다 docker file 설정 및 volume, port 설정 가능  
    <span style="color:rgb(203, 171, 237)">ex) Docker Compose 샘플 파일</span>     

    ```yaml
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

    backend:
        image: awesome/database
        volumes:
        - db-data:/etc/data
        networks:
        - back-tier

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
    # The presence of these objects is sufficient to define them
    front-tier: {}
    back-tier: {}
    ```  
<br/><br/>

# Docker 및 Docker Compose 설치
---
### **Docker 설치 및 repository 설정**
1. 기존 버전 도커 삭제
    ```bash
    sudo apt-get remove docker docker-engine docker.io containerd runc
    ```
2. apt 패키지 업데이트 및 설치
    ```bash
    sudo apt-get update
    sudo apt-get -y install \
    		apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    ```
    - `sudo apt-get update`
        - apt package index 업데이트
    - `sudo apt-get -y install ca-certificates curl gnupg lsb-release`
        - HTTPS 통해 repository 이용하기 위해 pakcage 설치
3. 도커 공식 GPG key 추가  
    ```bash
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    ```
4. stable repository 등록  
    ```bash
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    ```
    ```powershell
    echo \
      "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    ```
5. 도커 최신 버전 엔진 설치    
    ```bash
    sudo apt-get update
    sudo apt-get install docker-ce docker-ce-cli containerd.io
    ```
    - 특정 버전 도커 엔진 설치  
        ```bash
        apt-cache madison docker-ce
        sudo apt-get install docker-ce=<VERSION_STRING> docker-ce-cli=<VERSION_STRING> containerd.io
        ```
6. hello-world 이미지 실행해 도커 엔진 설치 확인  
    ```bash
    sudo docker run hello-world
    ```
7. 도커 버전 확인  
    ```bash
    docker --version
    ```

### **Docker Compose 설치 및 확인**
1. docker compose 설치  
    ```bash
    sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    ```
2. 실행 할 수 있는 권한 부여  
    ```bash
    sudo chmod +x /usr/local/bin/docker-compose
    ```      
3. 설치 확인
    
    ```bash
    docker-compose --version
    ```

<br/><br/>

## **Reference**
* [Docker docs](https://docs.docker.com/engine/install/ubuntu/)
