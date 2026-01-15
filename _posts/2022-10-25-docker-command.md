---
title: Docker 명령어 및 활용 가이드
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2022-10-25 05:55:00 +0900
category: [Infrastructure, Docker]
tags: [docker, docker-compose, devops, container]
math: true
mermaid: true
---
<br/><br/>

## Docker와 Docker Compose 차이점

### 핵심 비교

| 구분 | Docker (Engine) | Docker Compose |
|------|-----------------|----------------|
| **관리 단위** | 단일 컨테이너 | 다중 컨테이너 (Orchestration) |
| **설정 방식** | `Dockerfile`로 이미지 빌드 및 실행 | `docker-compose.yml`로 서비스 정의 |
| **주요 용도** | 개별 애플리케이션 패키징 | 앱 + DB + Redis 등 전체 스택 관리 |
| **명령어 복잡도** | `docker run` 옵션이 매우 길어짐 | `docker compose up` 간결한 명령어 |
| **네트워크 관리** | 수동으로 네트워크 생성 및 연결 | 자동으로 전용 네트워크 생성 및 서비스 간 연결 |
| **볼륨 관리** | 개별 볼륨 플래그로 설정 | YAML 파일에 통합 관리 |

### 비유로 이해하기

![image](/assets/img/docker/image.png)

- **Docker**
  - 벽돌(컨테이너) 한 장을 만드는 도구
  - 개별 애플리케이션 실행

- **Docker Compose**
  - 벽돌들을 조립해서 집(전체 시스템)을 짓는 설계도
  - 여러 서비스를 조합한 완전한 애플리케이션 구성

<br/><br/>

## Docker 개념

### Image와 Container

| 구분 | Docker Image | Docker Container |
|------|--------------|------------------|
| **정의** | 실행 불가능한 읽기 전용 템플릿 | 이미지를 실행한 프로세스 |
| **비유** | 붕어빵 틀 | 붕어빵 |
| **포함 내용** | 소스 코드, 라이브러리, 종속성 | 실행 중인 격리된 환경 |
| **상태** | 정적 (Immutable) | 동적 (Mutable) |
| **개수** | 한 개의 이미지 | 여러 개의 컨테이너 생성 가능 |

### Docker 워크플로우

![image](/assets/img/docker/image2.png)

<br/><br/>

## Docker 이미지 관리

### 이미지 빌드

- Dockerfile로 이미지 생성
  ```bash
  # 현재 디렉토리의 Dockerfile 사용하여 빌드
  docker build -t 이미지명:버전 ./
  
  # 태그 지정 예시
  docker build -t myapp:1.0 .
  docker build -t myapp:latest .
  
  # 특정 Dockerfile 지정
  docker build -f /path/to/Dockerfile -t myapp:1.0 .
  ```

- 필수 파일
  - `Dockerfile`
    - 이미지 빌드 명령어 정의
  - `entrypoint.sh` (선택)
    - 컨테이너 시작 시 실행 스크립트

### 이미지 조회 및 관리

- 로컬 이미지 목록 확인
  ```bash
  docker images
  # 또는
  docker image ls
  ```

  - 출력 예시
    ```
    REPOSITORY    TAG       IMAGE ID       CREATED         SIZE
    nginx         latest    605c77e624dd   2 weeks ago     141MB
    myapp         1.0       abc123def456   1 hour ago      200MB
    ```

- Docker Hub에서 이미지 다운로드
  ```bash
  # 최신 버전 다운로드
  docker pull nginx
  
  # 특정 버전 다운로드
  docker pull nginx:1.21
  docker pull mysql:8.0
  docker pull redis:6.2
  ```

- 이미지 삭제
  ```bash
  # 이미지 ID로 삭제
  docker rmi abc123def456
  
  # 이미지명:태그로 삭제
  docker rmi myapp:1.0
  
  # 강제 삭제 (-f 옵션)
  docker rmi -f 이미지명:버전
  ```

- 사용하지 않는 이미지 일괄 삭제
  ```bash
  # Dangling 이미지 삭제 (태그 없는 이미지)
  docker image prune
  
  # 사용하지 않는 모든 이미지 삭제
  docker image prune -a
  ```

<br/><br/>

## Docker 컨테이너 관리

### 컨테이너 생성 및 실행

- 기본 실행
  ```bash
  # 이미지를 컨테이너로 실행
  docker run 이미지명:버전
  
  # 백그라운드 실행 (-d: detached)
  docker run -d nginx
  
  # 이름 지정하여 실행
  docker run -d --name my-nginx nginx
  ```

- 포트 매핑 및 볼륨 마운트
  ```bash
  # 포트 매핑: 호스트포트:컨테이너포트
  docker run -d -p 80:80 nginx
  docker run -d -p 8080:80 nginx  # 호스트 8080 -> 컨테이너 80
  
  # 볼륨 마운트: 호스트경로:컨테이너경로
  docker run -d -p 80:80 -v /home/user/html:/usr/share/nginx/html nginx
  
  # 복합 예시
  docker run -d \
      -p 8080:80 \
      -v $(pwd)/html:/usr/share/nginx/html \
      --name my-web \
      nginx:latest
  ```

- 환경 변수 설정
  ```bash
  # 단일 환경 변수
  docker run -d -e MYSQL_ROOT_PASSWORD=secret mysql:8.0
  
  # 여러 환경 변수
  docker run -d \
      -e MYSQL_ROOT_PASSWORD=secret \
      -e MYSQL_DATABASE=mydb \
      -e MYSQL_USER=user \
      -e MYSQL_PASSWORD=password \
      mysql:8.0
  ```

### 컨테이너 상태 확인

- 실행 중인 컨테이너 확인
  ```bash
  docker ps
  ```

  - 출력 예시
    ```
    CONTAINER ID   IMAGE     COMMAND                  CREATED         STATUS         PORTS                NAMES
    1a2b3c4d5e6f   nginx     "/docker-entrypoint.…"   5 minutes ago   Up 5 minutes   0.0.0.0:80->80/tcp   my-web
    ```

- 모든 컨테이너 확인 (정지된 것 포함)
  ```bash
  docker ps -a
  ```

- 컨테이너 상세 정보
  ```bash
  docker inspect 컨테이너ID또는이름
  ```

### 컨테이너 로그 및 디버깅

- 로그 확인
  ```bash
  # 로그 출력
  docker logs 컨테이너ID
  
  # 실시간 로그 모니터링 (-f: follow)
  docker logs -f 컨테이너ID
  
  # 최근 100줄만 확인
  docker logs --tail 100 컨테이너ID
  
  # 타임스탬프 포함
  docker logs -f --timestamps 컨테이너ID
  ```

- 실행 중인 컨테이너 내부 접속
  ```bash
  # Bash 쉘로 접속 (-it: interactive + tty)
  docker exec -it 컨테이너ID /bin/bash
  
  # Alpine Linux는 sh 사용
  docker exec -it 컨테이너ID /bin/sh
  # Tip: `bash`가 없는 Alpine Linux 기반 이미지의 경우 접속 실패 시 `/bin/sh`를 사용하세요.
  
  # 단일 명령어만 실행
  docker exec 컨테이너ID ls -la /app
  docker exec 컨테이너ID cat /etc/nginx/nginx.conf
  ```

- 컨테이너 리소스 사용량 모니터링
  ```bash
  # 실시간 리소스 사용량
  docker stats
  
  # 특정 컨테이너만 확인
  docker stats 컨테이너ID
  ```

### 컨테이너 제어

- 컨테이너 정지
  ```bash
  # 우아한 종료 (SIGTERM 전송)
  docker stop 컨테이너ID
  
  # 강제 종료 (SIGKILL 전송)
  docker stop -f 컨테이너ID
  # 또는
  docker kill 컨테이너ID
  ```

- 컨테이너 재시작
  ```bash
  docker restart 컨테이너ID
  ```

- 정지된 컨테이너 시작
  ```bash
  docker start 컨테이너ID
  ```

### 컨테이너 삭제

- 단일 컨테이너 삭제
  ```bash
  # 정지된 컨테이너 삭제
  docker rm 컨테이너ID
  
  # 실행 중인 컨테이너 강제 삭제
  docker rm -f 컨테이너ID
  ```

- 여러 컨테이너 한 번에 삭제
  ```bash
  # 모든 정지된 컨테이너 삭제
  docker container prune
  
  # 모든 컨테이너 강제 삭제
  docker rm $(docker ps -qa) -f
  ```

## Docker Compose 명령어

### docker-compose.yml 예시

```yaml
version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html
    depends_on:
      - db
    networks:
      - app-network

  db:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: example
      MYSQL_DATABASE: myapp
    volumes:
      - db-data:/var/lib/mysql
    networks:
      - app-network

volumes:
  db-data:

networks:
  app-network:
```

### 실행 및 관리

- 서비스 실행
  ```bash
  # 백그라운드로 실행
  docker compose up -d
  
  # 이미지 재빌드 후 실행
  docker compose up -d --build
  
  # 특정 서비스만 실행
  docker compose up -d web
  
  # 로그 출력하며 실행 (포그라운드)
  docker compose up
  ```

- 서비스 중지 및 삭제
  ```bash
  # 컨테이너와 네트워크 삭제
  docker compose down
  
  # 볼륨까지 삭제 (데이터 삭제 주의!)
  docker compose down -v
  
  # 이미지까지 삭제
  docker compose down --rmi all
  ```

- 로그 확인
  ```bash
  # 모든 서비스 로그
  docker compose logs -f
  
  # 특정 서비스 로그만
  docker compose logs -f web
  docker compose logs -f db
  
  # 최근 100줄만
  docker compose logs --tail 100 web
  ```

- 상태 확인
  ```bash
  # 실행 중인 서비스 목록
  docker compose ps
  
  # 모든 서비스 (정지된 것 포함)
  docker compose ps -a
  ```

- 서비스 재시작
  ```bash
  # 모든 서비스 재시작
  docker compose restart
  
  # 특정 서비스만 재시작
  docker compose restart web
  ```

- 서비스 스케일링
  ```bash
  # web 서비스를 3개로 확장
  docker compose up -d --scale web=3
  ```

### Docker Compose V1과 V2

| 명령어 (V1) | 명령어 (V2) | 차이점 |
|-------------|-------------|--------|
| `docker-compose up` | `docker compose up` | 하이픈 제거 |
| `docker-compose down` | `docker compose down` | CLI 플러그인 방식 |
| `docker-compose logs` | `docker compose logs` | 더 빠른 성능 |
| `docker-compose ps` | `docker compose ps` | 동일한 기능 |

- **권장 사항**
  - 새 프로젝트는 V2 (`docker compose`) 사용
  - V1은 레거시 지원용
  - **참고**: Docker Compose V1(`docker-compose`)은 2023년 6월부로 지원 종료(EOL)되었습니다. 최신 V2(`docker compose`) 사용을 권장합니다.

<br/><br/>

## 네트워크 관리

### Docker 네트워크 개념

![image](/assets/img/docker/image3.png)

- 컨테이너끼리 통신하기 위한 가상 네트워크
- Docker Compose는 자동으로 `[폴더명]_default` 네트워크 생성
- 같은 네트워크의 컨테이너는 **서비스 이름으로 통신 가능**

### 네트워크 명령어

- 네트워크 목록 확인
  ```bash
  docker network ls
  ```

- 사용자 정의 네트워크 생성
  ```bash
  # Bridge 네트워크 생성
  docker network create my-network
  
  # Subnet 지정하여 생성
  docker network create --subnet=172.20.0.0/16 my-network
  ```

- 컨테이너를 네트워크에 연결
  ```bash
  # 실행 시 네트워크 지정
  docker run -d --network my-network --name web nginx
  
  # 실행 중인 컨테이너에 네트워크 추가
  docker network connect my-network 컨테이너ID
  ```

- 네트워크에서 컨테이너 분리
  ```bash
  docker network disconnect my-network 컨테이너ID
  ```

- 네트워크 삭제
  ```bash
  docker network rm my-network
  
  # 사용하지 않는 네트워크 일괄 삭제
  docker network prune
  ```

- 네트워크 상세 정보
  ```bash
  docker network inspect my-network
  ```

### Docker Compose 네트워크 자동 생성 예시

- 폴더 구조
  ```
  myproject/
  ├── docker-compose.yml
  └── html/
  ```

- Docker Compose 실행 시
  - 자동으로 `myproject_default` 네트워크 생성
  - `web` 서비스에서 `db` 서비스 접속 시
    ```
    host: db
    port: 3306
    ```

<br/><br/>

## 볼륨 관리 (데이터 영구 저장)

### 볼륨 개념

![image](/assets/img/docker/image4.png)

- 컨테이너 삭제 시 내부 데이터도 삭제됨
- **볼륨 사용 시 데이터 영구 보존**
  - 데이터베이스 데이터
  - 로그 파일
  - 업로드된 파일


### 볼륨 유형

| 유형 | 설명 | 사용 예시 | 명령어 예시 |
|------|------|-----------|-------------|
| **Bind Mount** | 호스트 특정 경로를 컨테이너와 공유 | 개발 중인 소스 코드, 설정 파일 | `-v /host/path:/container/path` |
| **Docker Volume** | Docker가 관리하는 저장소 | DB 데이터, 프로덕션 데이터 | `-v volume-name:/container/path` |
| **tmpfs** | 메모리에만 저장 (임시) | 민감한 임시 데이터 | `--tmpfs /container/path` |

#### 환경별 권장 설정
- **Development (개발)**
  - **Bind Mount** 추천: 소스 코드를 실시간으로 수정하고 반영해야 하기 때문
- **Production (운영)**
  - **Named Volume** 추천: 데이터 무결성 보장, 보안, 백업 및 마이그레이션 용이성 때문

### Bind Mount 사용법

- 호스트 디렉토리를 컨테이너에 마운트
  ```bash
  # 절대 경로 사용
  docker run -d -v /home/user/data:/var/lib/mysql mysql:8.0
  
  # 현재 디렉토리 사용
  docker run -d -v $(pwd)/html:/usr/share/nginx/html nginx
  
  # 읽기 전용으로 마운트
  docker run -d -v /home/user/config:/etc/app:ro myapp
  ```

### Docker Volume 사용법

- 볼륨 생성
  ```bash
  docker volume create my-vol
  ```

- 볼륨 목록 확인
  ```bash
  docker volume ls
  ```

- 볼륨 사용하여 컨테이너 실행
  ```bash
  docker run -d -v my-vol:/var/lib/mysql mysql:8.0
  ```

- 볼륨 상세 정보
  ```bash
  docker volume inspect my-vol
  ```

- 볼륨 삭제
  ```bash
  # 특정 볼륨 삭제
  docker volume rm my-vol
  
  # 사용하지 않는 볼륨 일괄 삭제
  docker volume prune
  ```

### Docker Compose 볼륨 설정

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    volumes:
      # Named Volume (Docker 관리)
      - db-data:/var/lib/mysql
      # Bind Mount (호스트 경로)
      - ./config/my.cnf:/etc/mysql/my.cnf:ro
    environment:
      MYSQL_ROOT_PASSWORD: secret

  app:
    image: myapp:latest
    volumes:
      # 개발 시 소스 코드 마운트
      - ./src:/app

volumes:
  db-data:  # Named Volume 정의
```

<br/><br/>

## 시스템 정리 (Cleanup)

### 디스크 공간 확보

- 모든 미사용 리소스 삭제 (주의!)
  ```bash
  # 정지된 컨테이너, 미사용 네트워크, Dangling 이미지 삭제
  docker system prune
  
  # 모든 미사용 이미지까지 삭제 (-a 옵션)
  docker system prune -a
  
  # 볼륨까지 삭제 (데이터 삭제 주의!)
  docker system prune -a --volumes
  ```

- 디스크 사용량 확인
  ```bash
  docker system df
  ```

  - 출력 예시
    ```
    TYPE                TOTAL     ACTIVE    SIZE      RECLAIMABLE
    Images              10        5         2.5GB     1.2GB (48%)
    Containers          8         3         500MB     200MB (40%)
    Local Volumes       5         2         1GB       500MB (50%)
    Build Cache         0         0         0B        0B
    ```


### 선택적 정리

| 명령어 | 삭제 대상 | 주의사항 |
|--------|-----------|----------|
| `docker container prune` | 정지된 컨테이너 | 안전 |
| `docker image prune` | Dangling 이미지 (태그 없음) | 안전 |
| `docker image prune -a` | 사용하지 않는 모든 이미지 | 재다운로드 필요할 수 있음 |
| `docker volume prune` | 사용하지 않는 볼륨 | **데이터 삭제 주의!** |
| `docker network prune` | 사용하지 않는 네트워크 | 안전 |
| `docker system prune -a --volumes` | 모든 미사용 리소스 + 볼륨 | **매우 주의!** |


<br/><br/>

## 권장 사항

### 개발 워크플로우

![image](/assets/img/docker/image5.png)

### 체크리스트

- **단일 앱 테스트**
  - `docker run`으로 빠르게 확인
  - 임시 실험 및 검증용

- **프로젝트 및 협업**
  - 무조건 `docker-compose.yml` 작성
  - 긴 `docker run` 명령어 공유 금지
  - 버전 관리 시스템에 포함

- **데이터 보존**
  - DB 같은 stateful 서비스는 꼭 볼륨 연결
  - Named Volume 사용 권장
  - 백업 전략 수립

- **정기적인 청소**
  - 디스크가 꽉 차면 `docker system prune` 실행
  - 주기적으로 미사용 이미지/컨테이너 정리
  - 볼륨 삭제 시 데이터 백업 확인

- **네트워크 관리**
  - Docker Compose 사용 시 자동 네트워크 활용
  - 서비스 이름으로 통신 (IP 하드코딩 금지)
  - 보안이 필요한 경우 Custom Network 사용


<br/><br/>

## 자주 사용하는 명령어 요약

### 이미지 관리

```bash
docker build -t myapp:1.0 .          # 이미지 빌드
docker images                        # 이미지 목록
docker pull nginx                    # 이미지 다운로드
docker rmi 이미지ID                   # 이미지 삭제
docker image prune -a                # 미사용 이미지 삭제
```


### 컨테이너 관리

```bash
docker run -d -p 80:80 --name web nginx  # 컨테이너 실행
docker ps                                # 실행 중인 컨테이너
docker ps -a                             # 모든 컨테이너
docker logs -f 컨테이너ID                 # 로그 확인
docker exec -it 컨테이너ID /bin/bash      # 컨테이너 접속
docker stop 컨테이너ID                    # 컨테이너 정지
docker rm 컨테이너ID                      # 컨테이너 삭제
docker restart 컨테이너ID                 # 컨테이너 재시작
```



### Docker Compose

```bash
docker compose up -d                     # 서비스 시작
docker compose up -d --build             # 재빌드 후 시작
docker compose down                      # 서비스 중지 및 삭제
docker compose down -v                   # 볼륨까지 삭제
docker compose logs -f                   # 로그 확인
docker compose ps                        # 서비스 상태
docker compose restart                   # 서비스 재시작
```



### 네트워크 및 볼륨

```bash
docker network ls                        # 네트워크 목록
docker network create my-net             # 네트워크 생성
docker volume ls                         # 볼륨 목록
docker volume create my-vol              # 볼륨 생성
docker volume prune                      # 미사용 볼륨 삭제
```



### 시스템 정리

```bash
docker system df                         # 디스크 사용량
docker system prune                      # 미사용 리소스 삭제
docker system prune -a --volumes         # 모든 미사용 리소스 삭제
```


<br/><br/>

## 트러블슈팅


### 일반적인 문제 및 해결

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| **포트 충돌** | 호스트 포트 이미 사용 중 | 다른 포트 사용 `-p 8080:80` |
| **Volume 권한 오류** | 컨테이너 내부 사용자 권한 | `chown` 또는 `USER` 지시문 조정 |
| **네트워크 통신 안 됨** | 다른 네트워크에 있음 | 같은 네트워크로 연결 |
| **디스크 공간 부족** | 미사용 이미지/컨테이너 누적 | `docker system prune -a` |
| **컨테이너 즉시 종료** | 실행할 프로세스 없음 | `docker logs`로 원인 확인 |


<br/><br/>

## Reference
- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [Docker Hub](https://hub.docker.com/)
- [Docker CLI Reference](https://docs.docker.com/engine/reference/commandline/cli/)
