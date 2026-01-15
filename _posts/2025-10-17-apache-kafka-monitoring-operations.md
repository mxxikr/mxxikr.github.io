---
title: Apache Kafka 모니터링과 운영 - Prometheus & Grafana
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2025-10-17 01:00:00 +0900
category: [Messaging, Kafka]
tags: [kafka, monitoring, prometheus, grafana, operations]
math: false
mermaid: true
---
> **Apache Kafka 시리즈**
>
> 1. [Apache Kafka 기본 개념 - 메시징 시스템의 이해](/posts/apache-kafka-basic-concepts)
> 2. [Apache Kafka 파티션과 컨슈머 그룹](/posts/apache-kafka-partitions-consumer-groups)
> 3. [Apache Kafka 복제와 고가용성 - 데이터 안정성 보장](/posts/apache-kafka-replication-high-availability)
> 4. [Apache Kafka 성능 튜닝과 운영 - 최적화](/posts/apache-kafka-performance-tuning)
> 5. [Spring Boot와 KRaft를 활용한 Apache Kafka 개발](/posts/apache-kafka-spring-boot-kraft-guide)
> 6. **Apache Kafka 모니터링과 운영 - Prometheus & Grafana** ← 현재 글

<br/><br/>

## 개요

- **Prometheus**와 **Grafana**를 활용한 Kafka 클러스터 모니터링 구축과 **Alert Manager**를 통한 실시간 알림 설정 방법을 설명함
- 브로커, 프로듀서, 컨슈머의 핵심 메트릭 지표 분석과 운영 중 발생할 수 있는 주요 이슈 대응 방안을 다룸

<br/><br/>

## 모니터링 환경 구성

- Kafka JMX 메트릭은 Prometheus가 직접 수집 불가
- **Kafka Exporter**를 사이드카 패턴으로 배치하여 Prometheus 호환 포맷으로 변환 필요

### Docker Compose 설정

- `docker-compose.yml`에 **kafka-exporter** 서비스 추가

```yaml
# docker-compose.yml

# ... 기존 kafka 서비스들 ...

# Kafka Exporter (추가)
# Kafka 클러스터 상태를 Prometheus가 이해할 수 있는 포맷으로 변환
kafka-exporter:
  image: danielqsj/kafka-exporter
  container_name: kafka-exporter
  command:
    - --kafka.server=kafka1:29092
    - --kafka.server=kafka2:29093
    - --kafka.server=kafka3:29094
  ports:
    - "9308:9308"
  depends_on:
    - kafka1
    - kafka2
    - kafka3
```

### Prometheus 설정

- `prometheus/prometheus.yml`에 수집 대상(Exporter, Actuator) 등록

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  # Kafka 클러스터 메트릭 (Kafka Exporter)
  - job_name: "kafka-cluster"
    static_configs:
      - targets: ["kafka-exporter:9308"]

  # Spring Boot 애플리케이션 메트릭 (Actuator)
  - job_name: "spring-boot-app"
    metrics_path: "/actuator/prometheus"
    scrape_interval: 5s
    static_configs:
      # macOS/Windows Docker Desktop
      - targets: ["host.docker.internal:8080"]
```

- Linux 환경 설정 (아래 둘 중 하나 선택)
  - 옵션 1
    - `docker-compose.yml`의 prometheus 서비스에 `extra_hosts` 추가
      ```yaml
      extra_hosts:
        - "host.docker.internal:host-gateway"
      ```
  - 옵션 2
    - 호스트 IP 직접 지정 (Docker 기본 브리지 게이트웨이)
      ```yaml
      - targets: ["172.17.0.1:8080"]
      ```

<br/><br/>

## Grafana 시각화 구축

### 데이터 소스 연결

1. 브라우저 접속

- `http://localhost:3000` (admin/admin)

2. **Connections** -> **Data Sources** -> **Add data source**
3. **Prometheus** 선택
4. Connection URL

- `http://prometheus:9090` (Docker 컨테이너명)

5. **Save & test** 클릭 (성공 메시지 확인)

### 대시보드 가져오기 (Import)

- 커뮤니티 검증 대시보드 활용 권장

1. **Dashboards** -> **New** -> **Import**
2. 추천 대시보드 ID 입력
   - **ID: 7589** (Kafka Exporter Overview)
   - **ID: 11378** (JVM Micrometer)
3. **Load** 클릭 후 Data Source로 **Prometheus** 선택
4. **Import** 완료

<br/><br/>

## 모니터링 대시보드

### Grafana 대시보드

- 핵심 메트릭
- 브로커 상태
  - 활성 파티션 수
  - 리더 수
- 메시지 처리량
  - 초당 메시지 수
  - 바이트 처리량
- 성능 지표
  - 요청 처리 시간
  - 실패율
- 컨슈머 상태
  - Lag
  - 오프셋 커밋 성공률
- 리소스 사용
  - CPU/메모리 사용률
  - 디스크 I/O

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

<br/><br/>

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

          // 병렬 메시지 전송
          int threadCount = 32; // 32개 스레드로 부하 생성 (가상 사용자 32명)

          ExecutorService executor = Executors.newFixedThreadPool(threadCount);
          CountDownLatch latch = new CountDownLatch(messageCount);
          // 동시성 처리를 위해 Thread-Safe 리스트 사용
          List<Long> latencies = Collections.synchronizedList(new ArrayList<>());

          long start = System.currentTimeMillis();

          // 병렬 메시지 전송
          for (int i = 0; i < messageCount; i++) {
              final int index = i;
              executor.submit(() -> {
                  SensorData data = new SensorData();
                  data.setSensorId("TEST-" + index);
                  data.setTemperature(20.0 + Math.random() * 10);
                  data.setHumidity(40.0 + Math.random() * 20);
                  data.setTimestamp(LocalDateTime.now());

                  long sendTime = System.nanoTime();
                  kafkaTemplate.send("sensor-data", data.getSensorId(), data)
                      .whenComplete((result, ex) -> {
                          if (ex == null) {
                              // 지연 시간 측정 (마이크로초 단위)
                              long latency = (System.nanoTime() - sendTime) / 1000;
                              latencies.add(latency);
                              latch.countDown();
                          } else {
                              log.error("Failed to send message", ex);
                              latch.countDown(); // 에러 발생 시에도 카운트 감소
                          }
                      });
              });
          }

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

<br/><br/>

## Reference

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Spring for Apache Kafka](https://docs.spring.io/spring-kafka/docs/current/reference/html/)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
- [Kafka Monitoring](https://docs.confluent.io/platform/current/kafka/monitoring.html)
- [Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
