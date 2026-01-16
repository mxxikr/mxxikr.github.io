---
title: LocalStack으로 AWS 서비스 로컬 개발하기
date: 2025-11-25 00:00:00 +0900
category: [Cloud, AWS]
tags: [localstack, aws, docker, local-development]
math: false
mermaid: false
---
## 개요

- LocalStack은 AWS 전체 클라우드 인프라를 에뮬레이션하는 소프트웨어임
- 단일 Docker 컨테이너로 실행되며 개발자 머신이나 CI 환경에서 AWS SDK와 AWS CLI를 그대로 사용하되 실제 AWS 서버 대신 로컬에서 모든 요청을 처리함
- 실제 AWS와 동일한 방식으로 개발하면서 비용 없이 로컬에서 테스트할 수 있음


<br/><br/>

## 개념

### 동작 원리

- LocalStack 컨테이너가 포트 4566에서 모든 AWS API 엔드포인트를 시뮬레이션함
- AWS CLI나 SDK가 정상적으로 HTTP 요청을 LocalStack에 전송함
- LocalStack이 AWS와 동일한 응답 포맷으로 반환함
- 개발자 코드는 실제 AWS와 동일하게 동작하지만 비용과 속도, 초기화가 모두 로컬에서 처리됨

### 기존 방식 vs LocalStack 방식

![image.png](/assets/img/cloud/aws/2025-11-25-localstack/image.png)


<br/><br/>

## 지원 서비스

### Community Edition

- 무료 버전으로 60개 이상의 AWS 서비스 지원
- 주요 지원 서비스
  - **S3** - 객체 저장소
  - **DynamoDB** - NoSQL 데이터베이스, DynamoDB Streams 포함
  - **Lambda** - 서버리스 컴퓨팅
  - **SQS, SNS** - 메시징 서비스
  - **API Gateway** - REST API 관리
  - **CloudFormation** - Infrastructure as Code
  - **IAM** - Identity & Access Management
  - **Kinesis, Firehose** - 스트리밍 데이터 처리
  - **EventBridge** - 이벤트 기반 아키텍처
  - **Route53** - DNS 서비스
  - **SecretsManager, KMS** - 보안 서비스
  - **CloudWatch, CloudWatch Logs** - 모니터링
  - **ElastiCache** - 캐싱 서비스
  - **Redshift** - 데이터 웨어하우스

### Pro Edition

- 유료 버전으로 월 15~40달러
- Community 모든 기능에 추가로 다음 서비스 지원
  - **RDS** - 관계형 데이터베이스
  - **EKS** - Kubernetes 관리
  - **ECR** - Docker 레지스트리
  - **ECS** - 컨테이너 오케스트레이션
  - **ElastiSearch Service** - 완전 지원
  - **IAM 정책 시뮬레이션** - 세밀한 권한 검증
  - **CloudTrail 로깅** - 감사 추적
  - **VPC, Subnets** - 네트워크 고급 기능
  - 성능 최적화 및 기술 지원

### Enterprise Edition

- Pro 전체 기능 포함
- 전사 라이선싱 및 엔터프라이즈 지원
- 커스텀 기능 개발 가능
- SLA 보장


<br/><br/>

## 설치 및 실행

### LocalStack CLI

- 가장 간단한 설치 방법

  ```bash
  # macOS / Linux Homebrew
  brew install localstack/tap/localstack-cli

  # 실행
  localstack start

  # 특정 서비스만 활성화
  SERVICES=s3,dynamodb localstack start
  ```

  - 장점
    - 설치가 간단함
    - 환경변수만 조정하면 됨
    - 최신 버전 자동 관리
  - 단점
    - 고급 설정이 어려움

### Docker Compose

- 개발 환경에서 권장하는 방식

  ```yaml
  version: '3.8'

  services:
    localstack:
      container_name: localstack-main
      image: localstack/localstack:latest
      
      ports:
        - "4566:4566"  # 모든 AWS 서비스 통합 포트
      
      environment:
        # 사용할 서비스 (쉼표로 분리)
        - SERVICES=s3,dynamodb,lambda,sqs,sns
        
        # 디버그 활성화
        - DEBUG=1
        
        # 데이터 영속성 (LocalStack v3 이상 권장)
        - DATA_DIR=/tmp/localstack/data
        - PERSISTENCE=1
        
        # Lambda 실행 방식
        - LAMBDA_EXECUTOR=docker-reuse
        
        # Pro 버전 API 키 (있으면)
        - LOCALSTACK_API_KEY=${LOCALSTACK_API_KEY}
        
        # 지역 설정
        - DEFAULT_REGION=ap-northeast-2
        
        # IAM 정책 강제 여부
        - ENFORCE_IAM_POLICIES=false
      
      volumes:
        # 데이터 영속성
        - "./localstack/data:/tmp/localstack/data"
        
        # 초기화 스크립트
        - "./init-scripts:/docker-entrypoint-initaws.d"
        
        # Docker 소켓 마운트 (Lambda 실행에 필수)
        - "/var/run/docker.sock:/var/run/docker.sock"
      
      networks:
        - localstack-net

  networks:
    localstack-net:
      driver: bridge
  ```

- 실행

  ```bash
  # 시작
  docker-compose up -d

  # 로그 확인
  docker-compose logs -f localstack

  # 중지
  docker-compose down

  # 완전 제거 (데이터 포함)
  docker-compose down -v
  ```

### LocalStack Desktop

- 웹 기반 UI 제공
- Docker 자동 관리
- 초보자 친화적
- [다운로드](https://app.localstack.cloud/getting-started)


<br/><br/>

## 핵심 설정값

- **SERVICES**
  - 활성화할 AWS 서비스 목록 (쉼표 분리)
  - ex) `s3,dynamodb,lambda`
- **DEBUG**
  - 디버그 로그 출력 여부
  - `0` (기본) 또는 `1`
- **DATA_DIR**
  - 데이터 저장 경로 (영속성)
  - ex) `/tmp/localstack/data`
- **PERSISTENCE**
  - 영속성 활성화 여부 (LocalStack v3 이상 권장)
  - `1`로 설정 시 컨테이너 재시작 후에도 데이터 유지
  - `DATA_DIR`과 함께 사용 권장
- **LAMBDA_EXECUTOR**
  - Lambda 실행 엔진
  - `docker-reuse` 권장
- **DEFAULT_REGION**
  - AWS 리전 설정
  - ex) `ap-northeast-2`
- **LOCALSTACK_API_KEY**
  - Pro 버전 라이선스 키
- **ENFORCE_IAM_POLICIES**
  - IAM 정책 엄격 검증 여부
  - 테스트는 보통 `false`


<br/><br/>

## AWS CLI/SDK 사용

### AWS CLI

- 엔드포인트 지정 방식

  ```bash
  aws --endpoint-url=http://localhost:4566 s3 mb s3://my-bucket
  ```

- awslocal CLI 설치 (endpoint 자동 지정)

  ```bash
  pip install awscli-local
  ```

- S3 버킷 생성

  ```bash
  awslocal s3 mb s3://my-bucket
  ```

- DynamoDB 테이블 생성

  ```bash
  awslocal dynamodb create-table \
    --table-name Users \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
  ```

### AWS SDK (Java/Spring Boot)

- 호스트에서 실행하는 경우

  ```java
  AmazonS3 amazonS3 = AmazonS3ClientBuilder.standard()
      .withEndpointConfiguration(new EndpointConfiguration(
          "http://localhost:4566", "ap-northeast-2"
      ))
      .withCredentials(new AWSStaticCredentialsProvider(
          new BasicAWSCredentials("test", "test")
      ))
      .withPathStyleAccessEnabled(true)  // LocalStack S3 접근을 위해 필요
      .build();
  ```

- Docker 컨테이너 내부에서 실행하는 경우
  - 애플리케이션도 Docker 컨테이너로 실행할 경우 `localhost`가 아닌 Docker Network 서비스명 사용 필요
  - 같은 Docker Compose 네트워크에 있다면 서비스명 사용 가능

  ```java
  // Docker Compose 서비스명 사용
  AmazonS3 amazonS3 = AmazonS3ClientBuilder.standard()
      .withEndpointConfiguration(new EndpointConfiguration(
          "http://localstack:4566", "ap-northeast-2"  // localhost 대신 서비스명
      ))
      .withCredentials(new AWSStaticCredentialsProvider(
          new BasicAWSCredentials("test", "test")
      ))
      .withPathStyleAccessEnabled(true)
      .build();

  // 또는 host.docker.internal 사용 (Windows/Mac)
  // "http://host.docker.internal:4566"
  ```

### 환경변수 설정

- AWS 액세스 키 설정

  ```bash
  export AWS_ACCESS_KEY_ID=test
  ```

- AWS 시크릿 키 설정

  ```bash
  export AWS_SECRET_ACCESS_KEY=test
  ```

- AWS 기본 리전 설정

  ```bash
  export AWS_DEFAULT_REGION=ap-northeast-2
  ```

- AWS CLI 사용

  ```bash
  aws --endpoint-url=http://localhost:4566 s3 ls
  ```


<br/><br/>

## 초기화 스크립트

- Docker Compose 시작 시 자동으로 S3 버킷, DynamoDB 테이블 등을 생성할 수 있음


- `init-scripts/init-resources.sh`

- 스크립트 시작

  ```bash
  #!/bin/bash

  echo "LocalStack 초기화 시작..."
  ```

- S3 버킷 생성

  ```bash
  awslocal s3 mb s3://dev-bucket
  ```

  ```bash
  awslocal s3 mb s3://test-bucket
  ```

- DynamoDB 테이블 생성

  ```bash
  awslocal dynamodb create-table \
    --table-name Users \
    --attribute-definitions AttributeName=userId,AttributeType=S \
    --key-schema AttributeName=userId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
  ```

- SQS 큐 생성

  ```bash
  awslocal sqs create-queue --queue-name my-queue
  ```

- 초기화 완료

  ```bash
  echo "초기화 완료!"
  ```

- `docker-compose.yml`에 볼륨 마운트 추가

  ```yaml
  volumes:
    - "./init-scripts:/docker-entrypoint-initaws.d"  # 시작 시 자동 실행
  ```


<br/><br/>

## 데이터 영속성

### 영속성 설정

- 개발 및 테스트 환경에서 데이터를 유지하고 싶을 때 사용

  ```yaml
  volumes:
    - "./localstack/data:/tmp/localstack/data"

  environment:
    - DATA_DIR=/tmp/localstack/data
    # LocalStack v3 이상에서는 PERSISTENCE=1도 권장됨
    - PERSISTENCE=1
  ```

- 효과
  - 컨테이너 재시작해도 데이터 유지
  - CI/CD 파이프라인에서도 테스트 데이터 누적 가능
- 참고
  - `DATA_DIR` 방식과 `PERSISTENCE=1` 환경변수 모두 유효함
  - 최신 LocalStack 이미지 사용 시 공식 문서의 권장 설정 확인 권장

### 휘발성 설정

- 각 테스트마다 초기화하고 싶을 때 사용

  ```yaml
  # volumes 없음 (또는 /dev/null로 마운트)
  environment:
    - DATA_DIR=/tmp/localstack  # 임시 폴더
  ```

- 효과
  - `docker-compose down && docker-compose up`하면 데이터 초기화
  - 각 테스트가 깨끗한 상태에서 시작


<br/><br/>

## 성능 팁

### 리소스 제한

```yaml
deploy:
  resources:
    limits:
      memory: 2G
    reservations:
      memory: 1G
```

### Lambda 실행 성능

```yaml
environment:
  - LAMBDA_EXECUTOR=docker-reuse  # 추천 - 컨테이너 재사용
  # - LAMBDA_EXECUTOR=docker      # 느림- 매번 새 컨테이너 생성
```

### 성능 비교

- LocalStack이 실제 AWS보다 빠른 경우가 많음
- 로컬 네트워크와 컨테이너 오버헤드 최소화로 인한 성능 향상
- S3 업로드, DynamoDB 쿼리, Lambda 실행 모두 로컬에서 더 빠르게 처리됨


<br/><br/>

## 활용 시나리오

### 로컬 개발

- 호스트에서 실행하는 경우

  - LocalStack 시작

    ```bash
    docker-compose up -d
    ```

  - Spring Boot 앱 실행 (호스트에서)

    ```bash
    ./gradlew bootRun --args='--spring.profiles.active=local'
    ```

  - 로컬에서 S3 업로드 테스트

    ```bash
    curl -X POST http://localhost:8080/api/files/upload -F "file=@test.jpg"
    ```

  - LocalStack에 저장됐는지 확인

    ```bash
    awslocal s3 ls s3://dev-bucket
    ```

- Docker 컨테이너로 실행하는 경우
  - 애플리케이션도 Docker 컨테이너로 실행할 경우 `localhost` 대신 Docker Network 서비스명 사용 필요

    ```yaml
    # docker-compose.yml에 애플리케이션 추가
    services:
      localstack:
        # ... 기존 설정
      
      app:
        build: .
        environment:
          - AWS_ENDPOINT=http://localstack:4566  # localhost 대신 서비스명 사용
        depends_on:
          - localstack
        networks:
          - localstack-net
    ```

    - 또는 `host.docker.internal` 사용 가능 (Windows/Mac)
      - `http://host.docker.internal:4566`

### CI/CD 통합 테스트

- `.github/workflows/test.yml`

  ```yaml
  name: Integration Tests

  on: [push, pull_request]

  jobs:
    test:
      runs-on: ubuntu-latest
      
      services:
        localstack:
          image: localstack/localstack:latest
          ports:
            - 4566:4566
          env:
            SERVICES: s3,dynamodb
      
      steps:
        - uses: actions/checkout@v3
        
        - name: Run tests
          run: |
            export AWS_ENDPOINT=http://localhost:4566
            ./gradlew test
  ```



<br/><br/>

## 주의 사항 및 트러블 슈팅

### 일반적인 문제

- **Connection refused localhost:4566**
  - 원인
    - LocalStack 미실행
  - 해결
    - `docker-compose up -d` 실행
- **docker.sock not found**
  - 원인
    - Docker 소켓 경로 오류
  - 해결
    - `docker.sock` 마운트 확인
- **S3 DNS 오류 또는 Connection refused**
  - 원인
    - S3 Path Style Access 미설정
  - 증상
    - `UnknownHostException` 또는 `The bucket you are attempting to access must be addressed using the specified endpoint`
  - 해결
    - AWS SDK 설정에 `.withPathStyleAccessEnabled(true)` 필수 추가
    - LocalStack은 Virtual Host Style을 지원하지 않으므로 Path Style이 필수임
- **Lambda 함수 실행 실패**
  - 원인
    - Docker-in-Docker 문제
  - 해결
    - `LAMBDA_EXECUTOR=docker-reuse` 설정
- **데이터 손실**
  - 원인
    - 영속성 미설정
  - 해결
    - `volumes` 마운트, `DATA_DIR` 환경변수, `PERSISTENCE=1` 환경변수 모두 설정 필요
    - LocalStack v3 이상에서는 `PERSISTENCE=1`을 명시적으로 설정하는 것이 권장됨
- **Windows WSL 느림**
  - 원인
    - 파일시스템 이슈
  - 해결
    - 데이터를 Linux 경로에 저장


<br/><br/>

## LocalStack vs 다른 선택지

### 비교

- **LocalStack**
  - 장점
    - 60개 이상 AWS 서비스 지원
    - 무료 버전 제공
    - 실제 AWS와 호환
  - 단점
    - Community 버전 일부 기능 미지원
- **Moto**
  - 장점
    - Python 단위 테스트에 최적
  - 단점
    - AWS SDK 호환성 일부 부족
    - Python 전용
- **MinIO**
  - 장점
    - S3 전용
    - 가벼움
  - 단점
    - 다른 AWS 서비스 불가
- **실제 AWS**
  - 장점
    - 완벽 호환
    - 프로덕션 동일
  - 단점
    - 높은 비용
    - 느린 개발 사이클


<br/><br/>

## 개발 워크플로우

![image.png](/assets/img/cloud/aws/2025-11-25-localstack/image1.png)

- LocalStack을 사용하면 개발 속도를 크게 향상시킬 수 있음
- 로컬에서 마음껏 실험하고 DB 상태도 원할 때마다 초기화할 수 있음
- 코드 수정 없이 배포 시에만 실제 AWS를 지정하면 됨


<br/><br/>

## 결론

- LocalStack은 AWS 서비스를 로컬에서 개발하고 테스트할 수 있게 해주는 도구임
- 실제 AWS와 동일한 방식으로 개발하면서 비용 없이 테스트할 수 있음
- CI/CD 파이프라인에 통합하여 자동화된 테스트 환경을 구축할 수 있음
- S3, DynamoDB, Lambda 등 여러 AWS 서비스를 함께 사용하는 프로젝트에서 특히 유용함