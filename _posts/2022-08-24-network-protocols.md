---
title: "Network Protocol (TCP/UDP)과 Port"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2022-08-24 02:00:00 +0900
category:
  - Network
tags:
  - [network, tcp, udp, port]
math: true
mermaid: true
---

## 개요

- **Protocol**
  - 통신 규약으로 컴퓨터끼리 소통하기 위한 약속임
- **Port**
  - 서비스마다 구분시켜주는 논리적 할당 주소임
- TCP/UDP의 차이점, 플래그(Flags), 핸드쉐이크(Handshake) 과정, 그리고 포트(Port)의 종류와 역할을 정리함

<br/><br/>

## Protocol (프로토콜)

### 정의

- **통신 규약**
  - 네트워크 상에서 데이터를 주고받기 위한 표준화된 통신 방법

<br/><br/>

## TCP (Transmission Control Protocol)

### 특징

- **연결 지향**
  - 연결 설정 → 연결 유지 → 연결 종료의 과정을 거침
- **신뢰성 보장**
  - 확인 응답(ACK)을 통해 정확한 전송을 보장함
  - 유실 시 재전송 요청함
- **상호 양방향 통신**
  - 서버와 클라이언트가 서로 데이터를 주고받음
- **속도**
  - 확인 절차가 있어 UDP보다 상대적으로 느림

- 데이터의 정확성이 중요한 서비스에서 사용
  - ex) 이메일, 웹 서핑, 파일 전송 등

### TCP Header Flags (상태 비트)

- **SYN (Synchronization)**
  - 시퀀스 번호 전송 및 연결 요청
- **ACK (Acknowledgement)**
  - 응답 확인
- **FIN (Finish)**
  - 연결 종료 요청
- **RST (Reset)**
  - 연결 재시작(강제 초기화)
- **PSH (Push)**
  - 버퍼링 없이 지연된 내용을 즉시 처리
- **URG (Urgent)**
  - 긴급 패킷 우선 처리

### TCP Handshake (연결 제어)

#### 3-Way Handshake (연결 설정)

- 데이터를 본격적으로 전송하기 전에 **논리적인 연결을 수립**하는 과정
- 서로 질의 응답을 통해 통신 준비를 확인함

![image](/assets/img/network/image4.png)

#### 4-Way Handshake (연결 종료)

- 통신을 마친 후 **안전하게 연결을 해제**하는 과정
- 남아있는 데이터가 모두 전송될 때까지 대기(Time Wait) 후 종료함

![image](/assets/img/network/image5.png)

<br/><br/>

## UDP (User Datagram Protocol)

### 특징

- **비연결형 (Connectionless)**
  - 연결 설정 없이 데이터를 일방적으로 전송함
- **비신뢰성 (Unreliable)**
  - 질의 응답(ACK)이나 재전송 과정이 없음
- **속도**
  - 오버헤드가 적어(헤더 8byte) 속도가 매우 빠름
- **사용 사례**
  - 끊기면 안 되는 스트리밍, 속도가 중요한 온라인 게임, DNS 등
- **일방 통신 (단방향)**
  - 단순히 데이터를 던지는 방식

<br/><br/>

## Port (포트)

### 정의

- 서비스마다 구분시켜주는 **논리적 값**임
- 직접 데이터를 전달하는 전용 통신 회선 역할을 함
- **개수**
  - 16비트 (2^16 = 65535개)

### Port 범위

1. **Well-Known Port (0 ~ 1023)**
   - 공공의 목적으로 사용하는 포트 (IANA 관리)
   - 자주 쓰는 서비스로 예약된 주소 (Root 권한 필요)
   - ex) HTTP(80), FTP(20/21)

2. **Registered Port (1024 ~ 49151)**
   - 충돌 방지를 위해 등록된 포트
   - 응용 프로그램의 통신을 위해 할당됨
   - 상용 목적 포트 포함 (ex: Tomcat 8080, Oracle 1521)

3. **Dynamic Port (49152 ~ 65535)**
   - 임의 포트 (Private Port)
   - 개발자가 임의대로 사용 가능한 주소

### 중요 Port 리스트

| Port Number | Protocol | Description | Type |
|:---:|:---:|---|:---:|
| 20 | FTP | 실제 Data 전송 | TCP |
| 21 | FTP | 인증, 명령어 인식, 제어 | TCP |
| 22 | SSH | 원격 통신, 암호화 | TCP |
| 23 | Telnet | 평문 원격 통신 (보안 취약) | TCP |
| 25 | SMTP | 메일 전송(송신) | TCP |
| 53 | DNS | IP 주소를 도메인으로 변환 | TCP/UDP |
| 67/68 | DHCP | IP 주소를 동적으로 할당 | UDP |
| 69 | TFTP | Router 전용 단순 파일 전송 | UDP |
| 80 | HTTP | 웹서비스 제공 | TCP |
| 110 | POP3 | 메일 수신 (로컬 저장) | TCP |
| 138 | NetBios | 윈도우 파일 공유 | TCP |
| 143 | IMAP | 메일 수신 (서버 저장) | TCP |
| 161 | SNMP | 네트워크 정보 관리 및 모니터링 | UDP |
| 443 | HTTPS | 암호화된 웹 전송 (SSL/TLS) | TCP |

<br/><br/>

## Reference

- [RFC 793 (TCP)](https://datatracker.ietf.org/doc/html/rfc793)
- [RFC 768 (UDP)](https://datatracker.ietf.org/doc/html/rfc768)
- [IANA Port Numbers](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml)