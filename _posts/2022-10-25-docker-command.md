---
title:  "Docker 명령어"
author:
  name: mxxikr
  link: https://github.com/mxxikr"
date: 2022-10-25 05:55:00 +0900
category:
  - [Open Source, Docker]
tags:
  - [docker, docker-compose, linux, docker build, docker image, docker container, docker file, docker hub]
math: true
mermaid: true
---
# Docker 명령어
---
### **Docker 실행 프로세스**
1. docker file 빌드   
    ```bash
    docker build -t 이미지명:버전 ./
    ```
    - **docker 빌드 시 필요한 필수 파일**
        - Dockerfile
        - [entrypoint.sh](http://entrypoint.sh/)
2. 생성된 docker image 실행하여 docker container 생성
    ```bash
    docker run -d -p 들어가는포트:내부포트 -v 로컬위치:내부위치 이미지명:버전
    ```
3. 생성된 docker container 상태 확인
    ```bash
    docker ps -a
    ```

### **Docker 로그 및 프로세스 확인**
- docker container 로그 확인
    ```bash
    docker logs 컨테이너ID
    ```
- docker 프로세스 중지
    ```bash
    docker stop 컨테이너ID -f
    ```
- docker 프로세스 재시작
    ```bash
    docker restart 컨테이너ID
    ```
- docker container 삭제
    ```bash
    docker rm 컨테이너ID
    ```
- docker container 여러 개 한번에 삭제
    ```bash
    docker rm $(docker ps -qa) -f
    ```
- docker image 삭제
    ```bash
    docker rmi 이미지명:버전 -f
    ```

<br/><br/>

## **Reference**
* [Docker docs](https://docs.docker.com/engine/install/ubuntu/)
