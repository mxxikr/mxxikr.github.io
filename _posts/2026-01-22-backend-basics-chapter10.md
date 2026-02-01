---
title: '[주니어 백엔드 개발자가 반드시 알아야 할 실무 지식] 10장 모르면 답답해지는 네트워크 기초'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-22 10:00:00 +0900
category: [Book, Backend]
tags: [backend, network, ip, domain, dns, nat, vpn, tcp, udp, quic, protocol, book-review]
math: false
mermaid: false
---

- **💡해당 게시글은 최범균님의 '주니어 백엔드 개발자가 반드시 알아야 할 실무 지식'을 개인 공부목적으로 메모하였습니다.**

<br/><br/>

## 10장에서 다루는 내용

- 네트워크 기초의 중요성
- 노드, 네트워크, 라우터
- IP 주소와 도메인
- 고정 IP와 동적 IP
- 공인 IP와 사설 IP
- NAT (네트워크 주소 변환)
- VPN (가상 사설 네트워크)
- 프로토콜과 TCP, UDP, QUIC

<br/><br/>

## 네트워크 기초를 모르면

### 네트워크 기초 지식 부족으로 인해 발생하는 대표적인 실수

- 인바운드 IP와 아웃바운드 IP 혼동
    - 외부에서 서버로 들어올 때 사용하는 IP (인바운드)
    - 서버에서 외부로 나갈 때 사용하는 IP (아웃바운드)
- 공인 IP와 사설 IP 구분 실패
- NAT 설정 미숙
- 방화벽 규칙 오해

### 왜 중요한가

- 서버 개발자가 네트워크 엔지니어만큼 깊은 지식은 불필요함
- 하지만 기초적인 네트워크 지식이 없으면 간단한 문제도 해결하기 어려움
- 빠른 문제 해결을 위해서는 네트워크 기본 개념 이해가 필수

<br/><br/>

## 노드, 네트워크, 라우터

### 핵심 개념

- **노드(Node)**
  - 데이터를 송수신하는 모든 장치
  - 휴대폰, 노트북, 서버 장비 등
- **네트워크(Network)**
  - 각 노드가 서로 데이터를 주고받기 위해 연결된 시스템

![네트워크 노드 구조](/assets/img/books/backend-basics-ch10/network-nodes.png)

### 패킷과 라우터

- **패킷(Packet)**
  - 노드가 네트워크를 통해 전송하는 데이터 단위
  - 헤더
    - 패킷의 목적지와 수신지 정보 포함
  - 페이로드
    - 데이터 본문

![패킷 라우팅](/assets/img/books/backend-basics-ch10/packet-routing.png)

### 네트워크 연결 방식

- 가정에서 사용하는 공유기에 연결된 장치들이 하나의 네트워크를 구성함
- 사무실에서 사용하는 컴퓨터들도 하나의 네트워크를 구성함
- 각 네트워크는 라우터를 통해 다른 네트워크와 연결됨

<br/><br/>

## IP 주소와 도메인

### IP 주소의 필요성

- 택배를 배달하기 위해 주소를 사용하는 것처럼 패킷 전송에도 주소가 필요함
- **IP 주소**
  - 네트워크에서 각 노드를 구분하기 위해 사용하는 주소

![IP 주소 지정](/assets/img/books/backend-basics-ch10/ip-addressing.png)

### IPv4 주소 체계

- 현재 일반적으로 사용하는 IP 주소는 IPv4
- IPv4 주소 형식
  - `192.0.2.1`과 같이 네 개의 숫자 블록으로 구성
  - 각 숫자 블록은 0부터 255까지의 값

- **IPv6 주소**
  - IPv4는 32비트로 약 43억 개의 고유 주소 존재
  - 1990년대 초부터 IP 주소 고갈 예측
  - IPv6는 128비트를 사용하여 훨씬 많은 주소 제공
  - 현재도 IPv4를 주로 사용하는 이유는 사설 IP와 NAT 덕분

### 도메인과 DNS

- **도메인의 개념**
  - **도메인(Domain Name)**
    - IP 주소를 기억하기 쉬운 이름으로 변환한 것
  - **DNS(Domain Name System)**
    - 도메인 이름을 IP 주소로 변환하는 체계
    - 인터넷 전화번호부와 같은 역할

- **도메인 구조**
  - 도메인 이름은 계층 구조를 가짐
  - 점(.)으로 구분하며 오른쪽이 상위 계층
  - 최상위 계층 종류
    - 일반 최상위 도메인
      - com, org, net, gov, app, biz, tech 등
    - 국가 최상위 도메인
      - kr, jp, au 등
  - **일반 최상위 도메인 예시**
    - 2차 도메인
      - `example.com`, `company.com`
    - 3차 도메인
      - `blog.example.com`, `www.company.com`
  - **국가 최상위 도메인 예시**
    - `ac.kr`
      - 대학 같은 교육 기관 용도
    - `co.kr`
      - 기업 용도
    - `example.co.kr`
      - 세 번째 계층이 도메인의 주요 이름

- **DNS 동작 방식**

  ![DNS 동작 방식](/assets/img/books/backend-basics-ch10/dns-operation.png)

  - 브라우저에 `www.example.com`을 입력하면
    1. DNS 서버에 IP 주소를 문의
    2. DNS 서버가 IP 주소를 응답
    3. 해당 IP 주소에 패킷 전송

- **localhost**
  - 로컬 서버 접속 시 사용하는 특별한 주소
  - `localhost`의 IP 주소는 `127.0.0.1`
  - **루프백(loopback) 주소**
    - 자기 자신을 참조할 때 사용하는 IP 주소
  - **hosts 파일**
    - 각 컴퓨터가 갖고 있는 호스트 이름과 IP 주소 매핑 파일
    - 리눅스
      - `/etc/hosts`
    - 윈도우
      - `C:\Windows\System32\drivers\etc\hosts`
    - localhost에 대한 IP 매핑이 이 파일에 정의되어 있음

- **도메인과 부하 분산**
  - 하나의 도메인 이름에 여러 IP 주소 매핑 가능

  ```bash
  $ nslookup www.example.com
  Name:    www.example.com
  Address: 93.184.216.34
  Name:    www.example.com
  Address: 93.184.216.35
  ```

  - DNS 서버는 등록된 IP를 번갈아 제공함
  - 이를 통해 여러 서버에 트래픽을 분산함

<br/><br/>

## 고정 IP와 동적 IP

### IP 주소 할당 방식

- **고정 IP(Static IP)**
  - 노드가 고정된 IP를 가짐
  - 서버가 대표적
  - IP 주소를 직접 지정함

- **동적 IP(Dynamic IP)**
  - 노드가 네트워크에 연결할 때마다 IP를 할당받음
  - DHCP 서버를 통해 제공받음

### DHCP

- **DHCP(Dynamic Host Configuration Protocol)**
  - 동적 IP를 제공하는 서버
  - 제공하는 정보
    - IP 주소
    - 게이트웨이 주소
    - 서브넷 마스크
    - DNS 서버 주소
  - 가정에서 사용하는 공유기가 주로 DHCP 서버 역할 수행

- **주의사항**
  - 동적 IP를 사용한다고 매번 IP가 바뀌는 것은 아님
  - DHCP 서버 설정에 따라 일정 시간 동안 동일한 IP를 할당하기도 함
  - 보안이 중요한 곳은 노드마다 IP를 고정해서 할당하기도 함

<br/><br/>

## 공인 IP와 사설 IP

### IP 주소 대역 분류

- **공인(Public) IP 주소**
  - 인터넷에서 접근 가능한 IP 주소
  - 인터넷에서 공식적으로 인정하는 공개 IP 주소
  - 서로 같은 주소를 가질 수 없음

- **사설(Private) IP**
  - 네트워크 내부에서만 사용하는 IP 주소
  - 네트워크가 다르면 같은 주소를 가질 수 있음
  - 네트워크 내부에서만 고유하면 됨

### 사설 IP 주소 범위

- 사설 IP로 사용할 수 있는 주소 범위는 세 대역으로 제한됨

    - `192.168.x.x`
    - `10.x.x.x`
    - `172.16.x.x ~ 172.31.x.x`

- 무선 공유기는 주로 `192.168` 대역 사용
- `ifconfig`(리눅스) 또는 `ipconfig`(윈도우) 명령어로 확인 가능

### 사설 IP의 장점

![사설 IP 네트워크](/assets/img/books/backend-basics-ch10/private-ip.png)

- 사설 IP 사용으로 IPv4 주소 고갈 방지
- 공인 IP는 외부 서비스 제공이 필요한 곳에서만 사용

<br/><br/>

## NAT

### NAT의 필요성

- **NAT(Network Address Translation, 네트워크 주소 변환)**
  - 네트워크 주소를 변환하는 기술
  - 사설 IP와 공인 IP 간의 변환을 담당함
  - 인터넷에 연결하려면 이 변환이 필요함

### SNAT (Source NAT)

- 내부 네트워크에서 나가는 패킷의 사설 IP를 공인 IP로 변환

![SNAT 동작](/assets/img/books/backend-basics-ch10/snat.png)

- 소스 IP의 주소를 변환함
- 주로 라우터나 네트워크 장비가 담당함

### DNAT (Destination NAT)

- 공인 IP로 들어온 패킷의 목적지를 사설 IP로 변환

![DNAT 동작](/assets/img/books/backend-basics-ch10/dnat.png)

- 목적지 IP의 주소를 변환함
- 서버 구성 시 주로 사용됨
- 서버 노드는 보안과 이중화를 고려해 사설 IP 주소를 가짐
- 네트워크 장비(라우터, 방화벽 등)가 공인 IP를 할당받음
- DNAT를 이용해 공인 IP로 들어온 패킷을 사설 IP를 가진 서버로 전송

### 공인 IP 확인 방법

- SNAT로 변환된 공인 IP 주소는 어떻게 알 수 있을까?
  - `https://ifconfig.me` 사이트 접속
  - 웹 브라우저에서 현재 사용하는 공인 IP 주소 확인 가능
  - 리눅스
    - `curl ifconfig.me` 명령어로 확인 가능

<br/><br/>

## VPN

### VPN의 필요성

- 백엔드 서버 개발 및 운영 시 필요한 작업
  - 서버 노드에 SSH로 접속해서 프로세스 확인
  - OS 설정 변경
  - DB에 접속해서 SQL 실행

### 보안 문제

![VPN 보안 문제](/assets/img/books/backend-basics-ch10/vpn-security.png)

- 서버 네트워크의 노드는 사설 IP를 사용함
- 외부 네트워크에서는 사설 IP에 직접 접근할 수 없음
- NAT로 접근 가능하지만 문제점
  - 모든 사설 IP마다 공인 IP 매핑이 어려움
  - 보안 문제 발생 가능
  - 서버 네트워크의 모든 노드가 공인 IP로 노출됨

### VPN 솔루션

- **VPN(Virtual Private Network, 가상 사설 네트워크)**
  - 인터넷과 같은 공용 네트워크에서 서로 다른 네트워크 간에 암호화된 연결 제공
  - 두 네트워크가 마치 하나의 사설 네트워크에 존재하는 것처럼 연결
  - 개발자가 안전하게 서버 네트워크에 접근할 수 있음

- **네트워크 간 VPN 연결**

  ![VPN 네트워크 연결](/assets/img/books/backend-basics-ch10/vpn-network.png)

- **VPN 클라이언트 연결**

  ![VPN 클라이언트 연결](/assets/img/books/backend-basics-ch10/vpn-client.png)

  - 개발자는 VPN 클라이언트를 통해 VPN에 접근함
  - 집이나 카페 같은 외부 공간에서 서버 네트워크에 접근할 때 사용함

<br/><br/>

## 프로토콜과 TCP, UDP, QUIC

### 프로토콜의 개념

- **프로토콜(Protocol)**
  - 네트워크 상에서 두 노드가 데이터를 주고받기 위해 정의한 규칙
  - 네트워크는 여러 계층으로 구성되며 각 계층마다 프로토콜 존재

### TCP/IP 모델

![TCP/IP 모델](/assets/img/books/backend-basics-ch10/tcpip-model.png)

- TCP/IP 모델은 4개 또는 5개 계층으로 표현함
- 개발자는 주로 전송 계층과 애플리케이션 계층 프로토콜 사용

### TCP (Transmission Control Protocol)

- **TCP의 특징**
  - **연결 기반 프로토콜**
    - 전화 통화처럼 먼저 연결을 맺어야 통신 가능
    - 두 노드 간에 연결을 맺은 뒤 데이터 송수신

- **3-Way Handshake**

  ![TCP 3-Way Handshake](/assets/img/books/backend-basics-ch10/tcp-handshake.png)

  - 3단계 과정을 거쳐 연결 수립
  - 연결 완료 후 데이터를 주고받음

- **TCP의 장점**
  - **신뢰성**
    - 패킷 순서 보장
    - 패킷 유실 시 재전송
    - 안정적인 데이터 전송
  - HTTP, SMTP 등 많은 프로토콜이 TCP 기반으로 동작

- **TCP의 단점**
  - 전송 보장을 위한 추가 처리로 속도가 상대적으로 느림
    - 시퀀스 번호
    - 확인 응답
    - 재전송
  - **HOL 블로킹(Head-of-Line Blocking)**
    - 일부 패킷 유실 시 재전송될 때까지 대기
    - 전체 전송 속도 저하

### UDP (User Datagram Protocol)

- **UDP의 특징**
  - **비연결 프로토콜**
    - 연결 수립 과정 없이 바로 데이터 전송
    - 데이터 전송 보장하지 않음
    - 빠른 전송 속도에 초점

- **UDP의 장점**
  - TCP 대비 빠른 전송 속도
  - 확인 응답이나 패킷 정렬 과정 없음

- **UDP 사용 사례**
  - 속도가 중요한 통신
    - DNS
    - VoIP
    - 온라인 게임
  - 일부 데이터 유실이 문제되지 않는 경우
    - 실시간 스트리밍

### QUIC 프로토콜

- **QUIC의 탄생 배경**
  - TCP는 신뢰성 있지만 느림
  - UDP는 빠르지만 신뢰성 없음
  - 빠르면서도 신뢰성 있는 프로토콜 필요
  - **QUIC**
    - Quick UDP Internet Connections
    - UDP 기반으로 개발됨
    - TCP의 연결 관리 기능을 프로토콜 수준에서 제공

- **QUIC의 특징**
  - **연결 ID 관리**
    - 데이터에 연결 ID를 포함
    - 연결 ID로 두 노드 간의 연결 유지
  - **신뢰성 제공**
    - 흐름 제어
    - 패킷 유실 복구
    - QUIC 프로토콜 수준에서 제어
  - **TLS 통합**
    - Transport Layer Security 통합
    - QUIC 패킷은 기본적으로 암호화됨
    - 연결 수립 과정 단축
      - TCP
        - 3-Way Handshake + TLS Handshake
      - QUIC
        - TLS 통합으로 과정 단축

- **HTTP/3과 QUIC**

  ![HTTP/3과 QUIC](/assets/img/books/backend-basics-ch10/http3-quic.png)

  - HTTP/3 프로토콜은 QUIC 기반으로 동작
  - 기존 HTTP/2, HTTP/1.1은 TCP 기반

- **QUIC의 멀티플렉싱**
  - 한 연결에서 여러 스트림을 동시에 처리
  - 한 스트림에 HOL 블로킹 발생해도 다른 스트림에 영향 없음
  - **HTTP/2의 멀티플렉싱 차이점**
    - HTTP/2도 멀티플렉싱 지원
    - TCP 자체의 HOL 블로킹 문제는 피할 수 없음
    - QUIC은 스트림 수준에서 독립적으로 처리

- **브라우저에서 확인**
  - 브라우저 개발자 도구의 Network 탭에서 Protocol 확인 가능
    - `h2`
      - HTTP/2
    - `h3`
      - HTTP/3 (QUIC 사용)

### TCP 연결 개수 제한

- **오해**
  - 포트 번호는 16비트 숫자
  - 최대 65,535개
  - TCP 연결 개수도 65,535개로 제한?

- **실제**
  - TCP 연결은 (로컬IP, 로컬포트, 원격IP, 원격포트)로 구별됨
  - 이론적 최대 연결 개수
    - $2^{16}$ (로컬포트) × $2^{32}$ (원격IP) × $2^{16}$ (원격포트)
    - = $2^{64}$ (약 1,844조)
  - 실제로는 OS 설정에 따라 제한됨
    - 파일 디스크립터 개수
    - 포트 범위 설정
    - 메모리 용량 등

<br/><br/>

## 배운 점

- 네트워크 기초 지식 부족으로 간단한 문제도 오래 헤맬 수 있음
- IP 주소의 종류와 용도를 이해하면 네트워크 문제 해결에 도움이 됨
- NAT와 VPN은 서버 개발 및 운영에 필수적인 기술
- TCP, UDP, QUIC의 차이를 이해하면 적절한 프로토콜 선택 가능

<br/><br/>

## Reference

- [주니어 백엔드 개발자가 반드시 알아야 할 실무 지식](http://www.yes24.com/Product/Goods/125306759)
