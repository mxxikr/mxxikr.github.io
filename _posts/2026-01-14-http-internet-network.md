---
title: "[모든 개발자를 위한 HTTP 웹 기본 지식] 인터넷 네트워크"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-14 16:11:00 +0900
category:
  - [Computer Science, Web]
tags: [http, network, ip, tcp, udp, port, dns, protocol]
math: false
mermaid: true
---

# 인터넷 네트워크

- 김영한님의 모든 개발자를 위한 HTTP 웹 기본 지식 강의를 통해 인터넷에서 클라이언트와 서버가 통신할 때 데이터가 전달되는 원리를 이해하기 위해 IP, TCP/UDP, PORT, DNS 프로토콜의 역할과 동작 방식을 정리함

<br/><br/>

## 인터넷 통신의 기초

### 인터넷 통신의 복잡성

- 인터넷에서 클라이언트와 서버가 통신할 때 메시지는 수많은 중간 노드(node)를 거쳐 전달됨

![인터넷 통신 흐름](/assets/img/posts/http-internet-network/01_internet_communication.png)

<br/><br/>

## IP (Internet Protocol)

### IP의 역할

- **IP 주소**
  - 인터넷 상의 고유한 주소
  - ex) 100.100.100.1, 200.200.200.2
- **주요 기능**
  - 지정한 IP 주소(IP Address)에 데이터 전달
  - **패킷(Packet)** 이라는 통신 단위로 데이터 전달

### IP 패킷 구조

![IP 패킷 구조](/assets/img/posts/http-internet-network/02_ip_packet_structure.png)

- **출발지 IP**
  - 메시지를 보내는 컴퓨터의 IP 주소
- **목적지 IP**
  - 메시지를 받을 컴퓨터의 IP 주소
- **기타 정보**
  - TTL, 프로토콜 타입 등
- **전송 데이터**
  - 실제 전송할 메시지

### IP 패킷 전달 과정

![IP 패킷 전달 과정](/assets/img/posts/http-internet-network/03_ip_packet_flow.png)

- 클라이언트가 서버로 패킷 전송
- 인터넷 노드들을 거쳐 서버에 도달
- 서버가 응답 패킷을 클라이언트로 전송
- 요청과 응답 경로가 다를 수 있음

### IP 프로토콜의 한계

| 문제점                   | 설명                                                     | 예시                            |
| ------------------------ | -------------------------------------------------------- | ------------------------------- |
| **비연결성**             | 패킷을 받을 대상이 없거나 서비스 불능 상태여도 패킷 전송 | 서버가 꺼져있어도 패킷 전송됨   |
| **비신뢰성 (패킷 소실)** | 중간에 패킷이 사라질 수 있음                             | 노드 장애로 패킷 소실           |
| **비신뢰성 (패킷 순서)** | 패킷이 순서대로 안 올 수 있음                            | 패킷1, 패킷3, 패킷2 순서로 도착 |
| **프로그램 구분**        | 같은 IP를 사용하는 서버에서 여러 애플리케이션 구분 불가  | 웹, 게임, 화상통화 동시 사용 시 |

![패킷 소실 예시](/assets/img/posts/http-internet-network/04_packet_loss.png)

<br/><br/>

## TCP와 UDP

### 인터넷 프로토콜 스택의 4계층

![인터넷 프로토콜 4계층](/assets/img/posts/http-internet-network/05_protocol_stack.png)

- **애플리케이션 계층 (HTTP, FTP)**
  - 사용자가 사용하는 서비스 제공
- **전송 계층 (TCP, UDP)**
  - 신뢰성 있는 데이터 전송 (PORT)
- **인터넷 계층 (IP)**
  - 목적지까지 패킷 전달 (IP 주소)
- **네트워크 인터페이스 계층 (LAN 드라이버, LAN 장비)**
  - 물리적 데이터 전송

### 프로토콜 계층 동작 과정

![프로토콜 계층 동작 과정](/assets/img/posts/http-internet-network/06_protocol_operation.png)

1. 프로그램이 "Hello, world!" 메시지 생성
2. SOCKET 라이브러리를 통해 전달
3. TCP 계층에서 TCP 정보 생성 (PORT, 순서, 검증 정보)
4. IP 계층에서 IP 패킷 생성
5. Ethernet 계층에서 LAN 카드를 통해 전송

### TCP/IP 패킷 구조

![TCP/IP 패킷 구조](/assets/img/posts/http-internet-network/07_tcpip_packet.png)

- **IP 패킷**
  - 출발지 IP
  - 목적지 IP
  - 기타 정보
- **TCP 세그먼트**
  - 출발지 PORT
  - 목적지 PORT
  - 전송 제어 정보
  - 순서 정보
  - 검증 정보
  - 전송 데이터

<br/><br/>

## TCP (Transmission Control Protocol)

### TCP 특징

- **전송 제어 프로토콜**
  - 신뢰할 수 있는 프로토콜

| 특징                 | 설명                                |
| -------------------- | ----------------------------------- |
| **연결지향**         | TCP 3 way handshake (가상 연결)     |
| **데이터 전달 보증** | 데이터 수신 확인 응답               |
| **순서 보장**        | 패킷 순서가 잘못되면 재전송 요청    |
| **신뢰성**           | 현재 대부분의 애플리케이션에서 사용 |

### TCP 3 Way Handshake

![TCP 3 Way Handshake](/assets/img/posts/http-internet-network/08_tcp_handshake.png)

1. **SYN (접속 요청)**
   - 클라이언트가 서버에 연결 요청
   - SYN(Synchronize)
2. **SYN + ACK (요청 수락)**
   - 서버가 요청을 수락하고 응답
   - ACK(Acknowledgment)
3. **ACK (수락 확인)**
   - 클라이언트가 수락 확인
   - 3번과 함께 데이터 전송 가능
4. **데이터 전송**
   - 연결 수립 완료 후 데이터 전송

### TCP 데이터 전달 보증

![TCP 데이터 전달 보증](/assets/img/posts/http-internet-network/09_tcp_delivery.png)

1. 클라이언트가 데이터 전송
2. 서버가 데이터 잘 받았음 (ACK) 응답

- 전송 성공 확인 가능

### TCP 순서 보장

![TCP 순서 보장](/assets/img/posts/http-internet-network/10_tcp_order.png)

1. 클라이언트가 패킷1, 패킷2, 패킷3 전송
2. 서버에 패킷1, 패킷3, 패킷2 순서로 도착
3. 서버가 패킷2부터 다시 보내라고 요청
4. 클라이언트가 패킷2, 패킷3 재전송

- 순서 오류 감지 및 복구 가능

<br/><br/>

## UDP (User Datagram Protocol)

### UDP 특징

- **사용자 데이터그램 프로토콜**

| 특징                   | TCP와 비교                     |
| ---------------------- | ------------------------------ |
| **연결지향 X**         | 3 way handshake 없음           |
| **데이터 전달 보증 X** | 수신 확인 없음                 |
| **순서 보장 X**        | 패킷 순서 관리 안 함           |
| **단순하고 빠름**      | 신뢰성은 낮지만 속도가 빠름    |
| **구성**               | IP + PORT + 체크섬 정도만 추가 |

### UDP의 용도

- **장점**
  - 속도가 빠름 (연결 수립 과정 없음)
  - 애플리케이션에서 추가 작업 가능 (커스터마이징)
- **사용 사례**
  - 실시간 스트리밍 (YouTube, Netflix)
  - 온라인 게임
  - DNS
  - VoIP (인터넷 전화)

### TCP와 UDP 비교

![TCP vs UDP 비교](/assets/img/posts/http-internet-network/11_tcp_udp_comparison.png)

- **TCP - 신뢰성 우선**
  - 연결 수립 필요
  - 데이터 전달 보증
  - 순서 보장
  - 느리지만 안정적
- **UDP - 속도 우선**
  - 연결 수립 불필요
  - 전달 보증 없음
  - 순서 보장 없음
  - 빠르지만 불안정

<br/><br/>

## Port

![PORT 사용 예시](/assets/img/posts/http-internet-network/12_port_usage.png)

### PORT란?

- **PORT**
  - 같은 IP 내에서 동작하는 애플리케이션을 구분하는 번호

### PORT 번호 체계

![PORT 번호 체계](/assets/img/posts/http-internet-network/13_port_range.png)

- **0 ~ 1023 - 잘 알려진 포트**
  - 사용하지 않는 것이 좋음
  - FTP - 20, 21
  - TELNET - 23
  - HTTP - 80
  - HTTPS - 443
- **1024 ~ 49151 - 등록된 포트**
  - 일반적으로 사용 가능
- **49152 ~ 65535 - 동적 포트**
  - 임시 포트로 사용

### 주요 PORT 번호

| PORT       | 프로토콜   | 용도           |
| ---------- | ---------- | -------------- |
| **20, 21** | FTP        | 파일 전송      |
| **23**     | TELNET     | 원격 접속      |
| **80**     | HTTP       | 웹 서비스      |
| **443**    | HTTPS      | 보안 웹 서비스 |
| **3306**   | MySQL      | 데이터베이스   |
| **5432**   | PostgreSQL | 데이터베이스   |
| **27017**  | MongoDB    | NoSQL DB       |

<br/><br/>

## DNS (Domain Name System)

### IP 주소의 문제점

- **기억하기 어렵다**
  - 200.200.200.2를 외워야 함
- **IP는 변경될 수 있다**
  - 모든 사용자가 새 IP를 알아야 함

### DNS란?

- **도메인 네임 시스템 (Domain Name System)**
  - 전화번호부와 같은 역할
  - 도메인 명을 IP 주소로 변환
  - 사람이 기억하기 쉬운 이름 사용

### DNS 동작 과정

![DNS 동작 과정](/assets/img/posts/http-internet-network/14_dns_operation.png)

1. 클라이언트가 DNS 서버에 google.com의 IP 주소 요청
2. DNS 서버가 200.200.200.2 응답
3. 클라이언트가 200.200.200.2로 접속

- 연결 성공

### DNS 계층 구조

![DNS 계층 구조](/assets/img/posts/http-internet-network/15_dns_hierarchy.png)

- **Root DNS (.)**
  - 최상위 DNS 서버
- **TLD DNS (.com, .net, .org)**
  - Top Level Domain
- **Authoritative DNS (google.com, naver.com)**
  - 실제 도메인의 IP 주소를 가지고 있음

### DNS의 장점

| 장점              | 설명                                |
| ----------------- | ----------------------------------- |
| **기억하기 쉬움** | 200.200.200.2 → google.com          |
| **유연성**        | IP 변경 시 DNS만 업데이트하면 됨    |
| **부하 분산**     | 하나의 도메인을 여러 IP로 연결 가능 |
| **관리 용이**     | 중앙 집중식 관리                    |

<br/><br/>

## 전체 통신 흐름

### 웹 브라우저에서 google.com 접속 시

![웹 브라우저에서 google.com 접속 시](/assets/img/posts/http-internet-network/16_complete_flow.png)

1. 사용자가 google.com 입력
2. 웹 브라우저가 DNS 서버에 IP 주소 요청
3. DNS 서버가 142.250.196.14 응답
4. TCP 연결 수립 (SYN, SYN+ACK, ACK)
5. HTTP 통신 (GET / PORT 80)
6. 서버가 HTML 응답
7. 브라우저가 화면 렌더링

### 계층별 데이터 흐름

![계층별 데이터 흐름](/assets/img/posts/http-internet-network/17_layer_flow.png)

- **클라이언트**
  - Application (HTTP) → Transport (TCP) → Internet (IP) → Network (Ethernet)
- **인터넷**
  - 중간 노드들을 거쳐 전달
- **서버**
  - Network (Ethernet) → Internet (IP) → Transport (TCP) → Application (HTTP)

<br/><br/>

## 연습 문제

1. 웹이나 HTTP를 배우기 전에 인터넷 네트워크 기본 지식이 왜 중요할까요?

   a. 웹과 HTTP가 네트워크 기반 위에서 작동하기 때문

   - 웹과 HTTP는 결국 인터넷 네트워크 위에서 작동하므로, 기초 네트워크 지식이 작동 원리 이해에 필수적임

2. IP 프로토콜이 데이터를 보낼 때, 상대방(수신자)의 받을 준비가 되었는지 확인하지 않고 패킷을 보낸다는 특징을 무엇이라고 부르나요?

   a. 비연결성

   - IP는 상대방의 상태를 확인하지 않고 패킷을 전송하는 비연결성 특징을 가짐

3. 데이터 전송의 신뢰성과 순서 보장이 꼭 필요한 통신에 주로 사용되는 프로토콜은 무엇일까요?

   a. TCP

   - TCP는 IP의 한계를 보완하여 데이터의 도착 보장과 순서 유지를 해주는 신뢰할 수 있는 프로토콜

4. IP 주소가 특정 컴퓨터(서버)를 식별한다면, 그 컴퓨터 안에서 실행되는 여러 애플리케이션(예 - 웹 서버, 게임 서버)을 구분하는 역할은 무엇이 할까요?

   a. Port

   - 하나의 IP 주소 아래서 여러 애플리케이션이 통신할 때, 패킷이 어느 애플리케이션으로 가야 할지 구분해 주는 것이 포트의 역할

5. 사용자가 'google.com'과 같은 이름을 쉽게 기억하고 사용할 수 있게 해주는 동시에, 서버의 IP 주소가 바뀌더라도 해당 서버에 접속할 수 있도록 돕는 시스템은 무엇인가요?

   a. DNS

   - DNS는 사람이 기억하기 어려운 IP 주소 대신 도메인 이름을 사용하여 서버에 쉽게 접속할 수 있도록 도와주는 시스템

<br/><br/>

## 요약 정리

![인터넷 네트워크 5대 개념](/assets/img/posts/http-internet-network/18_mindmap.png)

### 계층별 역할

| 계층                    | 프로토콜  | 주요 역할                      |
| ----------------------- | --------- | ------------------------------ |
| **애플리케이션**        | HTTP, FTP | 사용자가 사용하는 서비스 제공  |
| **전송**                | TCP, UDP  | 신뢰성 있는 데이터 전송 (PORT) |
| **인터넷**              | IP        | 목적지까지 패킷 전달 (IP 주소) |
| **네트워크 인터페이스** | Ethernet  | 물리적 데이터 전송             |

<br/><br/>

## Reference

- [모든 개발자를 위한 HTTP 웹 기본 지식](https://www.inflearn.com/course/http-%EC%9B%B9-%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC)
