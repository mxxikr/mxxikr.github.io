---
title: 'LocalStack으로 AWS 서비스 로컬 개발하기'
date: 2026-03-11 00:00:00 +0900
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

### 기존 방식과 LocalStack 방식 차이

![image.png](/assets/img/cloud/aws/2026-03-11-localstack/image.png)


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
        
        # 데이터 영속성
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
        - "./localstack/data:/var/lib/localstack"
        
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

## 설정값

- **SERVICES**
  - 활성화할 AWS 서비스 목록 (쉼표 분리)
  - ex) `s3,dynamodb,lambda`
- **DEBUG**
  - 디버그 로그 출력 여부
  - `0` (기본) 또는 `1`
- **DATA_DIR**
  - `/var/lib/localstack` 디렉터리에 데이터가 기본 저장됨
- **PERSISTENCE**
  - 영속성 활성화 여부
  - `1`로 설정 시 컨테이너 재시작 후에도 데이터 유지
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

## 주의 사항 및 트러블 슈팅

### Connection refused localhost:4566
  - 원인
    - LocalStack 미실행
  - 해결
    - `docker-compose up -d` 실행
### docker.sock not found
  - 원인
    - Docker 소켓 경로 오류
  - 해결
    - `docker.sock` 마운트 확인
### S3 DNS 오류 또는 Connection refused
  - 원인
    - S3 Path Style Access 미설정
  - 증상
    - `UnknownHostException` 또는 `The bucket you are attempting to access must be addressed using the specified endpoint`
  - 해결
    - AWS SDK 설정에 `.withPathStyleAccessEnabled(true)` 필수 추가
    - LocalStack은 Virtual Host Style을 지원하지 않으므로 Path Style이 필수임
### Lambda 함수 실행 실패
  - 원인
    - Docker-in-Docker 문제
  - 해결
    - `LAMBDA_EXECUTOR=docker-reuse` 설정
### 데이터 손실
  - 원인
    - 영속성 미설정
  - 해결
    - `volumes`에 `/var/lib/localstack` 마운트, `PERSISTENCE=1` 환경변수 설정 필요
    - `PERSISTENCE=1`을 명시적으로 설정하는 것이 권장됨


<br/><br/>

## 개발 워크플로우

![image.png](/assets/img/cloud/aws/2026-03-11-localstack/image1.png)

<br/><br/>

## 결론

- LocalStack은 AWS 서비스를 로컬에서 개발하고 테스트할 수 있게 해주는 도구임
- 실제 AWS와 동일한 방식으로 개발하면서 비용 없이 테스트할 수 있음
- CI/CD 파이프라인에 통합하여 자동화된 테스트 환경을 구축할 수 있음
- S3, DynamoDB, Lambda 등 여러 AWS 서비스를 함께 사용하는 프로젝트에서 특히 유용함