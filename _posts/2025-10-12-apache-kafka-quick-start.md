---
title: "Apache Kafka와 Spring Boot로 구축하는 실시간 데이터 처리 시스템"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-10-12 09:00:00 +0900
category:
  - [Messaging, Kafka]
tags:
  - [kafka, apache, monitoring, spring boot]
math: false
mermaid: true
---

## 시스템 개요
- 단일 서버 환경에서 Docker Compose를 사용하여 고가용성 Kafka 클러스터를 구축하는 전체 과정을 다룸

### 시나리오
- 시스템 목적
  - 스마트 팩토리 환경 모니터링 시스템
  - 제조 공정의 온습도를 실시간으로 수집/분석하여 품질 관리
  - 이상 상태 즉시 감지 및 알림으로 불량률 최소화

- 시스템 구성 요소
  1. 데이터 수집층
     - 공정별 온습도 센서 네트워크
     - 센서당 초당 1회 데이터 수집
     - 총 1000개 센서 (10개 공정 * 100개 측정 포인트)
  
  2. 데이터 처리층
     - Kafka 기반 실시간 스트리밍 처리
     - Active-Active 이중화 구성
     - 다중 컨슈머 그룹으로 용도별 처리
  
  3. 데이터 활용층
     - 실시간 모니터링 대시보드
     - 이상 징후 자동 감지 및 알림
     - 품질 분석을 위한 데이터 적재

### 시스템 요구사항 및 설계 원칙

- 성능 요구사항
  - 처리 성능
    - 초당 1000개 이상 메시지 처리
    - 10ms 이내 처리 지연
    - 데이터 손실률 0% (min.insync.replicas=2로 보장)

  - 가용성
    - 99.9% 이상 서비스 가용성
    - Active-Active 이중화로 단일 장애 대응
    - 자동 복구 및 재조정

  - 모니터링
    - 실시간 메트릭 수집 (15초 주기)
    - 텔레그램 즉시 알림
    - 시스템 자원 모니터링

- 기술 스택 선정
  - 애플리케이션: Spring Boot 3.5.6, Java 17
  - 메시징: Apache Kafka
  - 저장소: PostgreSQL
  - 모니터링: Prometheus, Grafana

### 시스템 아키텍처

{% raw %}
<div class="mermaid" markdown="0">
graph TB
    subgraph "데이터 생산"
        P1[Producer 1\n정상: 1000/s\n피크: 2000/s] -->|160B 데이터\n40B 헤더| T1
        P2[Producer 2\n정상: 1000/s\n피크: 2000/s] -->|160B 데이터\n40B 헤더| T1
        P3[Producer 3\n정상: 1000/s\n피크: 2000/s] -->|160B 데이터\n40B 헤더| T2
        
        subgraph "Spring Boot 프로듀서"
            P1
            P2
            P3
        end
    end
    
    subgraph "Kafka 클러스터"
        subgraph "토픽 구성"
            T1[Topic 1\n파티션: 6개\n복제팩터: 2\nISR: 2] -->|파티션 1-2\n실시간 처리\n500msg/sec| CG1
            T1 -->|파티션 3-4\nDB 저장\n500msg/sec| CG2
            T1 -->|파티션 5-6\n분석 처리\n500msg/sec| CG3
            T2[Topic 2\n파티션: 6개\n복제팩터: 2\nISR: 2] -->|백업 처리\n500msg/sec| CG4
        end
        
        subgraph "브로커 구성"
            B1[Broker 1\n16KB 배치\nmin.insync.replicas=2]
            B2[Broker 2\n16KB 배치\nmin.insync.replicas=2]
            ZK[ZooKeeper\n2181 포트\n메타데이터 관리]
            B1 <-->|Active-Active 복제| B2
            B1 <-->|리더 선출\n설정 관리| ZK
            B2 <-->|리더 선출\n설정 관리| ZK
        end
    end
    
    subgraph "데이터 소비"
        subgraph "컨슈머 그룹"
            CG1[Group 1\n실시간 처리\n배치: 100건/100ms\nSLA: 10ms]
            CG2[Group 2\nDB 저장\n배치: 500건/초\n트랜잭션 처리]
            CG3[Group 3\n분석\n배치: 1000건/5초\n비동기 처리]
            CG4[Group 4\n백업\n배치: 1000건/5초\n비동기 처리]
        end
        
        CG1 -->|실시간 처리| MC[메모리 캐시\n100ms 갱신]
        CG2 -->|저장| DB[(PostgreSQL\n배치: 500\n2차 캐시)]
        CG3 -->|5초 집계| AN[분석 서버]
        CG4 -->|백업| BK[백업 스토리지]
    end
    
    subgraph "모니터링"
        B1 & B2 -->|JMX 메트릭| JX[JMX Exporter\n브로커 상태]
        P1 & P2 & P3 -->|처리량/지연| AE[Actuator Endpoint]
        CG1 & CG2 & CG3 & CG4 -->|Lag/처리량| AE
        
        JX & AE -->|15초 수집| PR[Prometheus]
        PR -->|대시보드| GF[Grafana]
        PR -->|임계치 분석| AM[Alert Manager]
        AM -->|실시간 알림| TG[Telegram Bot]
        
        subgraph "메트릭 지표"
            MT1[브로커: 파티션수/리더수]
            MT2[성능: 처리량/지연]
            MT3[자원: CPU/메모리/디스크]
            MT4[컨슈머: Lag/커밋률]
        end
    end
</div>

### 상세 아키텍처 설계

1. 처리량 및 가용성 설계
   - 수집 데이터 분석
     - 정상 상태: 초당 1000개 센서 데이터
     - 순간 피크: 초당 2000개로 증가 가능
     - 메시지 크기: 200바이트
       - 온도/습도 데이터: 160바이트
       - 메시지 헤더: 40바이트

   - 브로커 구성 결정
     - 브로커 2대 운영
       - 한 대 장애 시에도 서비스 계속하기 위함
       - 부하 분산으로 안정성 확보
     
     - ZooKeeper 연동 필수
       - 브로커 메타데이터 관리
       - 리더 선출, 설정 관리
       - 브로커와 별도 서버로 운영

   - 파티션 및 데이터 관리 설계
     - 1단계: 기본 처리량 분석
       - 단일 파티션 처리량: 500 msg/s
       - 필요 파티션 수: 2000 ÷ 500 = 4개
       - 네트워크 대역폭: 2000 msg/s * 200B = 400KB/s
     
     - 2단계: Topic 1 컨슈머 그룹 고려
       - 실시간 처리용: 2개 파티션
       - DB 저장용: 2개 파티션
       - 분석용: 2개 파티션
       - 총 필요: 6개 파티션
     
     - 3단계: Topic 2 (백업) 파티션 설계
       - 처리량 요구사항: Topic 1과 동일
       - 파티션 수: 6개 (2000 msg/s 처리 위해)
       - 파티션 분배: 단일 컨슈머 그룹에서 전체 파티션 처리
       - 처리 방식: 비동기 배치 처리로 성능 최적화
     
     - 4단계: 데이터 보존 정책
       - Topic 1: 7일 보관 (실시간/분석 데이터)
       - Topic 2: 30일 보관 (백업 데이터)
       - 디스크 사용량 경고 임계치: 80%
     
     - 5단계: 고가용성 및 정합성 전략
       - 복제본 수: 2 (1 리더 + 1 팔로워)
       - ISR 설정: 2 (데이터 유실 방지)
       - Producer acks: all (모든 ISR 확인)
       - 리더 선출: preferred leader auto 활성화
       - 재시도 정책: 최대 3회, 지수 백오프

3. 컨슈머 그룹 설계
   - 실시간 처리
     - 파티션: 1-2번
     - 배치: 100건/100ms
     - SLA: 10ms 이내

   - 데이터베이스 저장
     - 파티션: 3-4번
     - 배치: 500건/1초
     - 트랜잭션 처리

   - 데이터 분석
     - 파티션: 5-6번
     - 배치: 1000건/5초
     - 비동기 처리


## 환경 구성

### Ubuntu 서버 준비

- 시스템 업데이트
  ```bash
  # 패키지 매니저 업데이트
  sudo apt update
  
  # 시스템 패키지 업그레이드
  sudo apt upgrade -y
  ```

### Java 개발 환경 설정
- JDK 17 설치
  ```bash
  # JDK 17 설치
  sudo apt install openjdk-17-jdk
  
  # JAVA_HOME 환경변수 설정
  echo "export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" >> ~/.bashrc
  echo "export PATH=\$PATH:\$JAVA_HOME/bin" >> ~/.bashrc
  source ~/.bashrc
  ```

- Gradle 설치
  ```bash
  # SDKMAN 설치
  curl -s "https://get.sdkman.io" | bash
  source "$HOME/.sdkman/bin/sdkman-init.sh"
  
  # Gradle 8.4 설치
  sdk install gradle 8.4
  ```

### Docker 설치
- Docker & Docker Compose 설치
  ```bash
  # Docker GPG 키 추가
  sudo apt install ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  
  # Docker 저장소 추가
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  
  # Docker 엔진 설치
  sudo apt update
  sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  
  # 사용자를 docker 그룹에 추가
  sudo usermod -aG docker $USER
  newgrp docker
  ```

## Kafka 클러스터 구성 

### 토픽 초기화 스크립트
- `scripts/kafka-init.sh` 파일 생성  

  ```bash
  #!/bin/bash
  
  # 토픽 생성 함수
  create_topic() {
    kafka-topics.sh --create \
      --if-not-exists \
      --bootstrap-server kafka1:9092,kafka2:9093 \
      --topic $1 \
      --partitions $2 \
      --replication-factor $3 \
      --config cleanup.policy=delete \
      --config retention.ms=$4
  }
  
  # sensor-data 토픽 생성 (7일 보존)
  create_topic "sensor-data" 6 2 604800000
  
  # sensor-data-backup 토픽 생성 (30일 보존)
  create_topic "sensor-data-backup" 6 2 2592000000
  
  echo "Kafka topics initialized successfully"
  ```

### Docker Compose 설정
- `docker-compose.yml` 파일 생성  

  ```yaml
  version: '3.8'
  services:
    # ZooKeeper - 카프카 브로커 메타데이터 관리
    zookeeper:
      image: confluentinc/cp-zookeeper:7.5.1
      container_name: zookeeper
      ports:
        - "2181:2181"
      environment:
        ZOOKEEPER_CLIENT_PORT: 2181 # ZooKeeper 포트
        ZOOKEEPER_TICK_TIME: 2000   # 타임아웃 설정(ms)
      volumes:
        - ./data/zookeeper/data:/var/lib/zookeeper/data
        - ./data/zookeeper/log:/var/lib/zookeeper/log
    
    # Kafka Broker 1 - 첫 번째 브로커
    kafka1:
      image: confluentinc/cp-kafka:7.5.1
      container_name: kafka1
      ports:
        - "9092:9092"
        - "9991:9991"
      depends_on:
        - zookeeper
      volumes:
        - ./data/kafka1/data:/var/lib/kafka/data
      environment:
        # 기본 설정
        KAFKA_BROKER_ID: 1
        KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
        KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka1:9092
        
        # 복제 및 고가용성 설정
        KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 2
        KAFKA_DEFAULT_REPLICATION_FACTOR: 2
        KAFKA_MIN_INSYNC_REPLICAS: 2
        KAFKA_AUTO_LEADER_REBALANCE_ENABLE: "true"
        KAFKA_LEADER_IMBALANCE_CHECK_INTERVAL_SECONDS: 300
        
        # 데이터 처리 설정
        KAFKA_MESSAGE_MAX_BYTES: 1048576
        KAFKA_COMPRESSION_TYPE: producer
        KAFKA_NUM_PARTITIONS: 6
        
        # 데이터 보존 정책 - 전역 설정
        KAFKA_LOG_RETENTION_HOURS: 168                     # 기본 7일 보존
        KAFKA_LOG_SEGMENT_BYTES: 1073741824               # 세그먼트 크기 1GB
        KAFKA_LOG_RETENTION_CHECK_INTERVAL_MS: 300000      # 체크 주기 5분
        KAFKA_LOG_CLEANUP_POLICY: delete                   # 보존기간 초과시 삭제

        # 트랜잭션 관련 설정
        KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 2
        KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 2
        
        # 모니터링 설정
        KAFKA_AUTO_CREATE_TOPICS_ENABLE: "false"          # 토픽 자동 생성 비활성화
        KAFKA_AUTO_LEADER_REBALANCE_ENABLE: "true"       # 자동 리더 리밸런싱 활성화
        KAFKA_LEADER_IMBALANCE_CHECK_INTERVAL_SECONDS: 300 # 리더 밸런싱 체크 주기
        KAFKA_JMX_PORT: 9991                             # JMX 포트
        KAFKA_JMX_OPTS: -Dcom.sun.management.jmxremote -Dcom.sun.management.jmxremote.authenticate=false 
          -Dcom.sun.management.jmxremote.ssl=false -Djava.rmi.server.hostname=kafka1

      # 리소스 제한
      deploy:
        resources:
          limits:
            memory: 2G
          reservations:
            memory: 1G
      
      # 헬스체크
      healthcheck:
        test: ["CMD-SHELL", "kafka-topics.sh --bootstrap-server localhost:9092 --list"]
        interval: 30s
        timeout: 10s
        retries: 3
      
      # 로그 설정
      logging:
        driver: "json-file"
        options:
          max-size: "100m"
          max-file: "3"
    
    # Kafka Broker 2 - 두 번째 브로커  
    kafka2:
      image: confluentinc/cp-kafka:7.5.1 
      container_name: kafka2
      ports:
        - "9093:9093"
        - "9992:9992"
      depends_on:
        - zookeeper
      volumes:
        - ./data/kafka2/data:/var/lib/kafka/data
      environment:
        # 기본 설정
        KAFKA_BROKER_ID: 2
        KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
        KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka2:9093
        
        # 복제 및 고가용성 설정
        KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 2
        KAFKA_DEFAULT_REPLICATION_FACTOR: 2
        KAFKA_MIN_INSYNC_REPLICAS: 2
        KAFKA_AUTO_LEADER_REBALANCE_ENABLE: "true"
        KAFKA_LEADER_IMBALANCE_CHECK_INTERVAL_SECONDS: 300
        
        # 데이터 처리 설정
        KAFKA_MESSAGE_MAX_BYTES: 1048576
        KAFKA_COMPRESSION_TYPE: producer
        KAFKA_NUM_PARTITIONS: 6
        
        # 데이터 보존 정책 - 전역 설정
        KAFKA_LOG_RETENTION_HOURS: 168                     # 기본 7일 보존
        KAFKA_LOG_SEGMENT_BYTES: 1073741824               # 세그먼트 크기 1GB
        KAFKA_LOG_RETENTION_CHECK_INTERVAL_MS: 300000      # 체크 주기 5분
        KAFKA_LOG_CLEANUP_POLICY: delete                   # 보존기간 초과시 삭제

        # 트랜잭션 관련 설정
        KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 2
        KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 2
        
        # 모니터링 설정
        KAFKA_AUTO_CREATE_TOPICS_ENABLE: "false"          # 토픽 자동 생성 비활성화
        KAFKA_AUTO_LEADER_REBALANCE_ENABLE: "true"       # 자동 리더 리밸런싱 활성화
        KAFKA_LEADER_IMBALANCE_CHECK_INTERVAL_SECONDS: 300 # 리더 밸런싱 체크 주기
        KAFKA_JMX_PORT: 9992                             # JMX 포트
        KAFKA_JMX_OPTS: -Dcom.sun.management.jmxremote -Dcom.sun.management.jmxremote.authenticate=false 
          -Dcom.sun.management.jmxremote.ssl=false -Djava.rmi.server.hostname=kafka2
          
      # 리소스 제한
      deploy:
        resources:
          limits:
            memory: 2G
          reservations:
            memory: 1G
      
      # 헬스체크
      healthcheck:
        test: ["CMD-SHELL", "kafka-topics.sh --bootstrap-server localhost:9093 --list"]
        interval: 30s
        timeout: 10s
        retries: 3
      
      # 로그 설정
      logging:
        driver: "json-file"
        options:
          max-size: "100m"
          max-file: "3"

    # Prometheus - 메트릭 수집
    prometheus:
      image: prom/prometheus:v2.48.0
      container_name: prometheus
      ports:
        - "9090:9090"
      volumes:
        - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
        - ./data/prometheus:/prometheus
      command:
        - '--config.file=/etc/prometheus/prometheus.yml'
        - '--storage.tsdb.path=/prometheus'
        - '--storage.tsdb.retention.time=30d'
    
    # Grafana - 대시보드 시각화
    grafana:
      image: grafana/grafana:10.2.0
      container_name: grafana
      ports:
        - "3000:3000"
      environment:
        - GF_SECURITY_ADMIN_USER=admin
        - GF_SECURITY_ADMIN_PASSWORD=admin
      volumes:
        - ./data/grafana:/var/lib/grafana
      depends_on:
        - prometheus
    
    # Alert Manager - 알림 발송
    alertmanager:
      image: prom/alertmanager:v0.26.0
      container_name: alertmanager
      ports:
        - "9094:9093"  # 호스트의 9094 포트를 컨테이너의 9093 포트에 매핑
      volumes:
        - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      command:
        - '--config.file=/etc/alertmanager/alertmanager.yml'

    # Kafka 토픽 초기화
    kafka-init:
      image: confluentinc/cp-kafka:7.5.1
      depends_on:
        kafka1:
          condition: service_healthy # 실제로 서비스가 동작하는 상태
        kafka2:
          condition: service_healthy
      volumes:
        - ./scripts/kafka-init.sh:/scripts/kafka-init.sh
      command: >
        bash -c "
          echo 'Waiting for Kafka to be ready...' &&
          cub kafka-ready -b kafka1:9092,kafka2:9093 2 60 &&
          echo 'Initializing Kafka topics...' &&
          /scripts/kafka-init.sh"
  ```

### 모니터링 설정
- Prometheus 설정 (`prometheus/prometheus.yml`)  

  ```yaml
  global:
    scrape_interval: 15s     # 메트릭 수집 주기
    evaluation_interval: 15s  # 규칙 평가 주기
  
  rule_files:
    - 'rules/*.yml'          # 알림 규칙 파일
  
  alerting:
    alertmanagers:
      - static_configs:
          - targets: ['alertmanager:9093']
  
  scrape_configs:
    - job_name: 'kafka'
      static_configs:
        - targets:
          - 'kafka1:9991'    # Kafka 브로커 1 JMX
          - 'kafka2:9992'    # Kafka 브로커 2 JMX
          
    - job_name: 'spring-actuator'
      metrics_path: '/actuator/prometheus'
      scrape_interval: 5s
      static_configs:
        - targets:
          - 'host.docker.internal:8080' # Spring Boot 애플리케이션
          
    - job_name: 'node-exporter'
      static_configs:
        - targets:
          - 'node-exporter:9100'  # 시스템 메트릭
  ```

- Alert Manager 설정 (`alertmanager/alertmanager.yml`)  

  ```yaml
  global:
    resolve_timeout: 5m

  route:
    receiver: 'telegram'
    group_by: ['alertname', 'severity', 'consumer_group']
    group_wait: 10s
    group_interval: 10s
    repeat_interval: 1h
    
    routes:
      - match:
          severity: critical
        group_wait: 0s
        repeat_interval: 5m
      - match:
          severity: warning
        group_wait: 30s
        repeat_interval: 15m
  
  receivers:
    - name: 'telegram'
      telegram_configs:
        - bot_token: 'YOUR_BOT_TOKEN'
          chat_id: YOUR_CHAT_ID
          parse_mode: 'HTML'
          api_url: 'https://api.telegram.org'
          message: |-
            🚨 <b>{% raw %}{{ .GroupLabels.alertname }}{% endraw %}</b>
            심각도: {% raw %}{{ .Labels.severity }}{% endraw %}
            컨슈머 그룹: {% raw %}{{ .Labels.consumer_group }}{% endraw %}
            {% raw %}{{ .Annotations.description }}{% endraw %}
  ```

### 클러스터 실행
- 도커 컴포즈로 시작  

  ```bash
  # 컨테이너 실행
  docker-compose up -d
  
  # 컨테이너 상태 확인
  docker-compose ps
  
  # 로그 확인
  docker-compose logs -f
  ```

## Spring Boot 애플리케이션 개발

### Gradle 의존성
- `build.gradle` 설정  

  ```groovy
  plugins {
      id 'java'
      id 'org.springframework.boot' version '3.5.6'
      id 'io.spring.dependency-management' version '1.1.4'
  }

  group = 'com.example'
  version = '1.0.0'
  sourceCompatibility = '17'

  repositories {
      mavenCentral()
  }

  dependencies {
      // Spring Boot
      implementation 'org.springframework.boot:spring-boot-starter'
      implementation 'org.springframework.boot:spring-boot-starter-web'
      implementation 'org.springframework.kafka:spring-kafka'
      
      // Database & Caching
      implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
      implementation 'org.postgresql:postgresql'
      implementation 'org.hibernate.orm:hibernate-jcache'
      implementation 'org.ehcache:ehcache:3.10.8'
      
      // Observability
      implementation 'org.springframework.boot:spring-boot-starter-actuator'
      implementation 'io.micrometer:micrometer-registry-prometheus'
      
      // lombok
      compileOnly 'org.projectlombok:lombok'
      annotationProcessor 'org.projectlombok:lombok'
      
      // 테스트
      testImplementation 'org.springframework.boot:spring-boot-starter-test'
      testImplementation 'org.springframework.kafka:spring-kafka-test'
  }
  ```

  ### 애플리케이션 설정
  - `application.yml` 설정

  ```yaml
  spring:
    # Kafka 설정
    kafka:
      bootstrap-servers: localhost:9092,localhost:9093
      producer:
        key-serializer: org.apache.kafka.common.serialization.StringSerializer
        value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
        acks: all                    # 모든 ISR 확인
        retries: 3                   # 재시도 정책: 최대 3회
        retry-backoff-ms: 1000       # 지수 백오프 시작값
        batch-size: 16384            # 배치 크기 16KB
        buffer-memory: 33554432      # 버퍼 메모리
        compression-type: lz4        # 메시지 압축
        max-request-size: 1048576    # 최대 요청 크기 1MB

      # 공통 컨슈머 설정
      consumer:
        key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
        value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
        enable-auto-commit: false    # 수동 커밋
        auto-offset-reset: earliest  # 오프셋 초기화
        heartbeat-interval: 3000     # 하트비트 간격
        session-timeout-ms: 45000    # 세션 타임아웃

      # 실시간 처리 컨슈머 설정
      consumer-realtime:
        group-id: realtime-processor
        max-poll-records: 100        # 100건/100ms
        fetch-max-wait: 100          # 100ms
        fetch-min-bytes: 1           # 최소 페치 크기
        max-partition-fetch-bytes: 1048576

      # 데이터베이스 저장 컨슈머 설정
      consumer-database:
        group-id: database-processor
        max-poll-records: 500        # 500건/1초
        fetch-max-wait: 1000         # 1초
        isolation-level: read_committed  # 트랜잭션 처리
        fetch-min-bytes: 1024
        max-partition-fetch-bytes: 1048576

      # 데이터 분석 컨슈머 설정
      consumer-analytics:
        group-id: analytics-processor
        max-poll-records: 1000       # 1000건/5초
        fetch-max-wait: 5000         # 5초
        fetch-min-bytes: 2048
        max-partition-fetch-bytes: 1048576
    
    # Database 설정
    datasource:
      url: jdbc:postgresql://localhost:5432/kafka_stream
      username: postgres
      password: postgres
      driver-class-name: org.postgresql.Driver
      hikari:
        maximum-pool-size: 10
        minimum-idle: 5
    
    # JPA 설정
    jpa:
      hibernate:
        ddl-auto: update
      properties:
        hibernate:
          dialect: org.hibernate.dialect.PostgreSQLDialect
          format_sql: true
          show_sql: true
          generate_statistics: true
          cache:
            use_second_level_cache: true
            region.factory_class: org.hibernate.cache.jcache.JCacheRegionFactory
            provider_configuration_file_path: ehcache.xml
          jdbc:
            batch_size: 500
            batch_versioned_data: true
            order_inserts: true
            order_updates: true
    
    # 액추에이터 설정
    management:
      endpoints:
        web:
          exposure:
            include: health,metrics,prometheus
      metrics:
        tags:
          application: ${spring.application.name}
  ```

### 데이터 모델
- `SensorDataRepository.java` - 센서 데이터 레포지토리  

  ```java
  /**
   * 센서 데이터 영속성을 관리하는 리포지토리 인터페이스
  * JpaRepository를 상속하여 기본적인 CRUD 작업과 페이징 기능을 제공
  */
  @Repository 
  public interface SensorDataRepository extends JpaRepository<SensorData, Long> {
  }
  ```

- `SensorData.java` - 센서 데이터 모델   

  ```java
  @Data
  @Entity
  @Table(name = "sensor_data")
  @Cacheable
  @org.hibernate.annotations.Cache(usage = org.hibernate.annotations.CacheConcurrencyStrategy.READ_WRITE)
  public class SensorData {
      @Id
      @GeneratedValue(strategy = GenerationType.IDENTITY)
      private Long id;
      
      @Column(name = "sensor_id", nullable = false)
      @Index(name = "idx_sensor_id")    // 조회 성능 향상을 위한 인덱스 생성
      private String sensorId;
      
    
      @Column(nullable = false)
      private Double temperature;   // 온도 데이터 컬럼
      
      @Column(nullable = false)
      private Double humidity;  // 습도 데이터 컬럼
      
      @Column(nullable = false) 
      @Index(name = "idx_timestamp")    // 시간 기반 조회를 위한 인덱스
      private LocalDateTime timestamp;  // 측정 시간 컬럼
      
      // 낙관적 락을 위한 버전 관리
      // 동시성 제어: 여러 트랜잭션이 동시에 같은 데이터를 수정하는 것을 방지
      @Version
      private Long version;
  }
  ```

### 메시지 생산자
- `KafkaProducerConfig.java` - 생산자 설정  

  ```java
  /**
   * Kafka 프로듀서 관련 설정을 담당하는 설정 클래스
  * 메시지 직렬화, 브로커 연결 등 프로듀서의 핵심 설정을 정의
  */
  @Configuration  // 스프링 설정 클래스임을 표시
  public class KafkaProducerConfig {
      
      /**
       * Kafka 프로듀서 팩토리 빈 생성
       * 프로듀서의 기본 설정을 구성하고 인스턴스를 생성하는 팩토리 제공
       *
       * @return 설정이 완료된 프로듀서 팩토리
       */
      @Bean
      public ProducerFactory<String, SensorData> producerFactory() {
          Map<String, Object> config = new HashMap<>();
          // 브로커 서버 리스트 설정
          config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092,localhost:9093");
          // 메시지 키의 직렬화 방식 설정
          config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
          // 메시지 값의 직렬화 방식 설정 (JSON 형식)
          config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
          return new DefaultKafkaProducerFactory<>(config);
      }
      
      /**
       * Kafka 템플릿 빈 생성
       *
       * @return 설정된 Kafka 템플릿
       */
      @Bean
      public KafkaTemplate<String, SensorData> kafkaTemplate() {
          return new KafkaTemplate<>(producerFactory());
      }
  }
  ```

- `SensorDataProducer.java` - 센서 데이터 생산   

  ```java
  /**
   * 센서 데이터를 생성하고 Kafka로 전송하는 서비스 클래스
  * 실시간으로 센서 데이터를 시뮬레이션하고 Kafka 토픽으로 전송
  */
  @Service 
  @Slf4j 
  @RequiredArgsConstructor
  public class SensorDataProducer {
      
      // Kafka로 메시지를 전송하기 위한 템플릿
      private final KafkaTemplate<String, SensorData> kafkaTemplate;
      // 센서 데이터가 전송될 Kafka 토픽 이름
      private static final String TOPIC = "sensor-data";
      
      /**
       * 센서 데이터 생성 및 전송 메서드
       * 매 밀리초마다 실행되어 임의의 센서 데이터를 생성하고 Kafka로 전송
       */
      @Scheduled(fixedRate = 1)  // 1ms 간격으로 실행
      public void generateData() {
          SensorData data = new SensorData();
          data.setSensorId("SENSOR-" + ThreadLocalRandom.current().nextInt(1, 1001)); // 1부터 1000까지의 센서 ID 임의 생성
          data.setTemperature(20.0 + ThreadLocalRandom.current().nextDouble() * 10); // 20-30도 사이의 임의 온도 생성
          data.setHumidity(40.0 + ThreadLocalRandom.current().nextDouble() * 20); // 40-60% 사이의 임의 습도 생성
          data.setTimestamp(LocalDateTime.now()); // 현재 시간 기록
          
          // CompletableFuture를 사용한 비동기 전송
          kafkaTemplate.send(TOPIC, data.getSensorId(), data)
              .whenComplete((result, ex) -> {
                  if (ex == null) {
                      log.info("Sent data: {} with offset: {}", 
                          data, result.getRecordMetadata().offset());
                  } else {
                      log.error("Unable to send data: {} due to: {}", 
                          data, ex.getMessage());
                  }
          });
      }
  }
  ```

### 메시지 소비자
- `KafkaConsumerConfig.java` - 소비자 설정  

  ```java
  /**
   * Kafka 컨슈머 관련 설정을 담당하는 설정 클래스
  * 메시지 역직렬화, 컨슈머 그룹, 배치 처리 등 컨슈머의 핵심 설정을 정의
  */
  @Configuration 
  public class KafkaConsumerConfig {
      
      /**
       * Kafka 컨슈머 팩토리 빈 생성
       * 컨슈머의 기본 설정을 구성하고 인스턴스를 생성
       *
       * @return 설정이 완료된 컨슈머 팩토리
       */
      @Bean
      public ConsumerFactory<String, SensorData> consumerFactory() {
          Map<String, Object> config = new HashMap<>();
          // 브로커 서버 리스트 설정
          config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092,localhost:9093");
          // 컨슈머 그룹 ID 설정
          config.put(ConsumerConfig.GROUP_ID_CONFIG, "sensor-group");
          // 메시지 키의 역직렬화 방식 설정
          config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
          // 메시지 값의 역직렬화 방식 설정 (JSON 형식)
          config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
          return new DefaultKafkaConsumerFactory<>(config);
      }
      
      /**
       * Kafka 리스너 컨테이너 팩토리 빈 생성
       *
       * @return 설정된 리스너 컨테이너 팩토리
       */
      @Bean
      public ConcurrentKafkaListenerContainerFactory<String, SensorData> kafkaListenerContainerFactory() {
          ConcurrentKafkaListenerContainerFactory<String, SensorData> factory = 
              new ConcurrentKafkaListenerContainerFactory<>();
          factory.setConsumerFactory(consumerFactory());
          factory.setBatchListener(true);                  // 배치 처리 모드 활성화
          factory.setConcurrency(3);                       // 병렬 처리를 위한 컨슈머 스레드 수 설정
          factory.getContainerProperties().setPollTimeout(3000); // 폴링 대기 시간 설정(ms)
          return factory;
      }
  }
  ```

- `SensorDataConsumer.java` - 센서 데이터 소비  

  ```java
  /**
   * 센서 데이터를 소비하고 처리하는 서비스 클래스
  * Kafka에서 메시지를 배치로 수신하여 데이터베이스에 저장하고 이상 징후를 모니터링
  */
  @Service 
  @Slf4j
  @RequiredArgsConstructor 
  public class SensorDataConsumer {
      
      private final SensorDataRepository sensorDataRepository; // 센서 데이터 저장을 위한 리포지토리
      
      /**
       * Kafka 토픽으로부터 센서 데이터를 배치로 수신하고 처리하는 메서드
       * 데이터베이스에 배치 저장하고 온도 이상 징후를 모니터링
       *
       * @param dataList   수신된 센서 데이터 목록
       * @param partitions 메시지가 수신된 파티션 번호 목록
       * @param offsets    메시지의 오프셋 목록
       * @throws RuntimeException 배치 처리 실패 시 발생
       */
      @KafkaListener(
          topics = "sensor-data",          // 구독할 토픽
          groupId = "db-saver-group",      // 컨슈머 그룹 ID
          containerFactory = "kafkaListenerContainerFactory"  // 컨테이너 팩토리
      )
      @Transactional  // 트랜잭션 처리를 위한 어노테이션
      public void consume(@Payload List<SensorData> dataList) {
          
          log.info("Received batch of {} records", dataList.size());
          
          try {
              // JPA를 사용하여 데이터를 배치로 저장
              sensorDataRepository.saveAll(dataList);
              
              // 고온 경고를 위한 메트릭 기록 및 모니터링
              for (SensorData data : dataList) {
                  if (data.getTemperature() > 25.0) {
                      log.warn("High temperature alert: {}", data);
                  }
              }
          } catch (Exception e) {
              log.error("Error processing batch: {}", e.getMessage());
              throw new RuntimeException("Failed to process batch", e);
          }
      }
  }
  ```

## 모니터링 대시보드

### Grafana 대시보드
- 핵심 메트릭
  - 브로커 상태: 활성 파티션 수, 리더 수
  - 메시지 처리량: 초당 메시지 수, 바이트 처리량
  - 성능 지표: 요청 처리 시간, 실패율
  - 컨슈머 상태: Lag, 오프셋 커밋 성공률
  - 리소스 사용: CPU/메모리 사용률, 디스크 I/O

### 알림 규칙
- `rules/kafka_alerts.yml` 설정   
  
  ```yaml
  groups:
    - name: kafka_system_alerts # 브로커 및 시스템 상태 모니터링
      rules:
        - alert: KafkaBrokerDown
          expr: up{job="kafka"} == 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "Kafka 브로커 다운"
            description: "브로커 {% raw %}{{ $labels.instance }}{% endraw %}가 응답하지 않습니다"
            
        - alert: KafkaUnderReplicatedPartitions
          expr: kafka_server_replicamanager_underreplicated_partitions > 0
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "복제 파티션 부족"
            description: "브로커 {% raw %}{{ $labels.instance }}{% endraw %}에 복제가 부족한 파티션이 있습니다"
            
        - alert: KafkaHighCPU
          expr: rate(process_cpu_seconds_total[5m]) > 0.8
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "높은 CPU 사용률"
            description: "인스턴스 {% raw %}{{ $labels.instance }}{% endraw %}의 CPU 사용률이 80%를 초과했습니다"

    - name: kafka_consumer_alerts # 컨슈머 그룹별 처리 지연 모니터링
      rules:
        # 실시간 처리 그룹
        - alert: KafkaRealtimeProcessorLag
          expr: kafka_consumergroup_lag{group="realtime-processor"} > 200
          for: 1m
          labels:
            severity: critical
            consumer_group: realtime-processor
          annotations:
            summary: "실시간 처리 지연 발생"
            description: |
              실시간 처리 그룹에서 처리 지연이 발생했습니다.
              - 컨슈머 그룹: {% raw %}{{ $labels.group }}{% endraw %}
              - 토픽: {% raw %}{{ $labels.topic }}{% endraw %}
              - 현재 Lag: {% raw %}{{ $value | printf "%.0f" }}{% endraw %}건
              
        # DB 저장 그룹 (일반 처리)
        - alert: KafkaDatabaseProcessorLag
          expr: kafka_consumergroup_lag{group="database-processor"} > 1000
          for: 5m
          labels:
            severity: warning
            consumer_group: database-processor
          annotations:
            summary: "DB 저장 처리 지연 발생"
            description: |
              DB 저장 그룹에서 처리 지연이 발생했습니다.
              - 컨슈머 그룹: {% raw %}{{ $labels.group }}{% endraw %}
              - 토픽: {% raw %}{{ $labels.topic }}{% endraw %}
              - 현재 Lag: {% raw %}{{ $value | printf "%.0f" }}{% endraw %}건
              
        # 분석 처리 그룹 (배치 처리)
        - alert: KafkaAnalyticsProcessorLag
          expr: kafka_consumergroup_lag{group="analytics-processor"} > 5000
          for: 10m
          labels:
            severity: info
            consumer_group: analytics-processor
          annotations:
            summary: "분석 처리 지연 발생"
            description: |
              분석 처리 그룹에서 배치 처리 지연이 발생했습니다.
              - 컨슈머 그룹: {% raw %}{{ $labels.group }}{% endraw %}
              - 토픽: {% raw %}{{ $labels.topic }}{% endraw %}
              - 현재 Lag: {% raw %}{{ $value | printf "%.0f" }}{% endraw %}건
  ```

## 테스트 및 운영

### 성능 테스트
- `KafkaLoadTest.java` - 부하 테스트  
  ```java
  @SpringBootTest
  public class KafkaLoadTest {
      @Autowired
      private KafkaTemplate<String, SensorData> kafkaTemplate;
      
      @Test
      public void loadTest() throws InterruptedException {
          int messageCount = 100000;
          CountDownLatch latch = new CountDownLatch(messageCount);
          List<Long> latencies = new ArrayList<>();
          
          long start = System.currentTimeMillis();
          
          // 병렬 메시지 전송
          IntStream.range(0, messageCount)
              .parallel()
              .forEach(i -> {
                  SensorData data = new SensorData();
                  data.setSensorId("TEST-" + i);
                  data.setTemperature(20.0 + Math.random() * 10);
                  data.setHumidity(40.0 + Math.random() * 20);
                  data.setTimestamp(LocalDateTime.now());
                  
                  long sendTime = System.nanoTime();
                  kafkaTemplate.send("sensor-data", data.getSensorId(), data)
                      .whenComplete((result, ex) -> {
                          if (ex == null) {
                              // 지연 시간 측정 (마이크로초 단위)
                              long latency = (System.nanoTime() - sendTime) / 1000;
                              synchronized(latencies) {
                                  latencies.add(latency);
                              }
                              latch.countDown();
                          } else {
                              log.error("Failed to send message", ex);
                          }
                      });
              });
          
          // 최대 1분간 대기
          boolean completed = latch.await(1, TimeUnit.MINUTES);
          long end = System.currentTimeMillis();
          
          // 성능 지표 계산
          double duration = (end - start) / 1000.0;
          double throughput = messageCount / duration;
          
          // 지연 시간 통계
          DoubleSummaryStatistics stats = latencies.stream()
              .mapToDouble(Long::doubleValue)
              .summaryStatistics();
          
          // 결과 출력
          log.info("성능 테스트 결과:");
          log.info("- 총 메시지: {} (성공: {})", messageCount, latencies.size());
          log.info("- 처리 시간: {:.2f}초", duration);
          log.info("- 처리율: {:.0f} msg/sec", throughput);
          log.info("- 평균 지연: {:.2f}µs", stats.getAverage());
          log.info("- 최대 지연: {:.2f}µs", stats.getMax());
          log.info("- 최소 지연: {:.2f}µs", stats.getMin());
      }
  }
  ```

## Reference

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Spring for Apache Kafka](https://docs.spring.io/spring-kafka/docs/current/reference/html/)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
- [Kafka Monitoring](https://docs.confluent.io/platform/current/kafka/monitoring.html)
- [Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)