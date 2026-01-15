---
title: GCP Compute Engine 생성 및 설정
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2022-10-19 14:30:00 +0900
category: [Cloud, GCP]
tags: [compute-engine, gcp, devops, security]
math: true
mermaid: true
---
## Compute Engine 개요
- Google Cloud Platform의 IaaS(Infrastructure as a Service) 서비스
- 가상 머신(VM) 인스턴스를 생성하고 관리하는 컴퓨팅 서비스
- DevOps 워크플로우의 기본 인프라 구성 요소


<br/><br/>

## 인스턴스 생성 방법

### Console UI 기반 생성

![image](/assets/img/cloud/gcp/image1.png)

- 프로젝트 선택
- 탐색 메뉴 이동
  - **Compute Engine** → **VM 인스턴스** → **인스턴스 만들기**
    ![image](/assets/img/cloud/gcp/vm-1.jpg)
    ![image](/assets/img/cloud/gcp/vm-2.jpg)

- 인스턴스 구성 설정
    ![image](/assets/img/cloud/gcp/vm-3.jpg)
    ![image](/assets/img/cloud/gcp/vm-4.jpg)
  - 인스턴스명 설정
    - 프로젝트 내 고유한 이름
    - 소문자, 숫자, 하이픈(-) 사용
  - 리전(Region) 및 영역(Zone) 선택
    - 사용자와 가까운 리전 선택하여 레이턴시 최소화
    - 고가용성 필요 시 다중 영역 구성
  - 머신 유형 선택
    - 워크로드에 맞는 머신 패밀리 선택
  - 부팅 디스크 설정
    - OS 이미지 선택
    - 디스크 유형 및 크기 결정
  - 서비스 계정 설정
    - 인스턴스가 사용할 IAM 서비스 계정
  - 네트워크 태그 추가
    - 방화벽 규칙 적용을 위한 태그

- **만들기** 클릭하여 인스턴스 생성


<br/><br/>

### CLI 기반 생성 (권장)

- 자동화 및 재현 가능한 인프라 구축에 적합
- `gcloud` CLI 도구 사용

```bash
gcloud compute instances create my-web-server \
    --project=my-project-id \
    --zone=us-central1-a \
    --machine-type=e2-medium \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB \
    --boot-disk-type=pd-balanced \
    --tags=http-server,https-server \
    --metadata-from-file=startup-script=./startup.sh
```

- 주요 옵션 설명
  - `--project`
    - GCP 프로젝트 ID 지정
  - `--zone`
    - 인스턴스가 생성될 영역
  - `--machine-type`
    - 머신 유형 (CPU, 메모리 사양)
  - `--image-family`
    - OS 이미지 패밀리 (최신 LTS 버전 자동 선택)
  - `--image-project`
    - 이미지가 속한 프로젝트
  - `--boot-disk-size`
    - 부팅 디스크 크기 (GB 단위)
  - `--boot-disk-type`
    - 디스크 유형 (성능 및 비용 결정)
  - `--tags`
    - 방화벽 규칙 적용을 위한 네트워크 태그
  - `--metadata-from-file`
    - 시작 스크립트 파일 지정

> **권장 사항**: 프로덕션 환경에서는 보안을 위해 **`default` 네트워크 대신 사용자 정의(Custom) VPC를 생성**하여 권한을 격리하는 것이 강력히 권장됩니다.
> `default` 네트워크는 기본적으로 모든 방화벽이 열려있거나 관리가 어려울 수 있습니다.

<br/><br/>

## 머신 패밀리 선택 가이드

<br/><br/>

### 머신 패밀리 비교

| 패밀리 | 특징 | 주요 사용 사례 | 비용 |
|--------|------|----------------|------|
| **E2** | 비용 최적화, 가변 리소스 | 웹 서버, 개발/테스트 환경, 소규모 DB | 가장 저렴 |
| **N2** | 범용, 균형잡힌 성능 | 일반 프로덕션 워크로드, 애플리케이션 서버 | 중간 |
| **N2D** | AMD 기반 범용 | N2와 유사, 가격 대비 성능 우수 | 중간 |
| **C2** | 컴퓨팅 최적화, 고성능 CPU | 게임 서버, 비디오 인코딩, HPC | 높음 |
| **M2** | 메모리 최적화 | 대규모 인메모리 DB (SAP HANA, Redis) | 매우 높음 |
| **A2** | GPU 탑재 | ML 학습, 비디오 렌더링, 과학 시뮬레이션 | 매우 높음 |

| **A2** | GPU 탑재 | ML 학습, 비디오 렌더링, 과학 시뮬레이션 | 매우 높음 |

![mermaid-diagram](/assets/img/cloud/gcp/2022-10-19-vm-instance-diagram-1.png)

<br/><br/>

### 머신 유형 선택 플로우

![image](/assets/img/cloud/gcp/image2.png)

<br/><br/>

## 부팅 디스크 설정

<br/><br/>

### OS 이미지 선택
- **Ubuntu**
  - 가장 널리 사용되는 Linux 배포판
  - LTS(Long Term Support) 버전 권장
  - `ubuntu-2204-lts` (22.04), `ubuntu-2004-lts` (20.04)

- **Debian**
  - 안정성 중시
  - 서버 환경에 최적화

- **CentOS / Rocky Linux**
  - RHEL 호환 배포판
  - 엔터프라이즈 환경

<br/><br/>

### 디스크 유형 선택

| 디스크 유형 | IOPS | 처리량 | 비용 | 사용 사례 |
|-------------|------|--------|------|-----------|
| **Standard Persistent Disk** | 낮음 | 낮음 | 가장 저렴 | 개발/테스트, 백업 데이터 |
| **Balanced Persistent Disk** | 중간 | 중간 | 중간 | 일반 웹 서버, 애플리케이션 서버 |
| **SSD Persistent Disk** | 높음 | 높음 | 높음 | 데이터베이스, 고성능 I/O |
| **Extreme Persistent Disk** | 매우 높음 | 매우 높음 | 매우 높음 | 미션 크리티컬 DB, 고성능 분석 |

![mermaid-diagram](/assets/img/cloud/gcp/2022-10-19-vm-instance-diagram-2.png)

- 성능과 비용 트레이드오프
  - 대부분의 경우 **Balanced Persistent Disk** 권장
  - DB 서버는 **SSD Persistent Disk** 고려


<br/><br/>

## 초기 설정 및 자동화

<br/><br/>

### Startup Script 활용

- VM 부팅 시 자동 실행되는 스크립트
- 패키지 설치, 설정 적용, 서비스 시작 등 자동화
- 일관된 환경 구성 보장

<br/><br/>

### Startup Script 예시

```bash
#!/bin/bash
# 시스템 업데이트 및 Nginx 설치
apt-get update
apt-get install -y nginx

# 커스텀 홈페이지 설정
echo "Hello from GCP Compute Engine!" > /var/www/html/index.html

# Nginx 서비스 시작 및 부팅 시 자동 시작 설정
systemctl start nginx
systemctl enable nginx

# Cloud Ops Agent 설치 (로깅 및 모니터링)
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install
```

<br/><br/>

### Metadata 활용

- VM 메타데이터는 인스턴스 내부에서 동적으로 조회 가능
- 환경변수처럼 사용하여 유연한 설정 구현

```bash
# VM 내부에서 메타데이터 조회
curl "http://metadata.google.internal/computeMetadata/v1/instance/attributes/my-key" \
    -H "Metadata-Flavor: Google"

# 프로젝트 ID 조회
PROJECT_ID=$(curl -s "http://metadata.google.internal/computeMetadata/v1/project/project-id" \
    -H "Metadata-Flavor: Google")

# 인스턴스 이름 조회
INSTANCE_NAME=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/name" \
    -H "Metadata-Flavor: Google")
```


<br/><br/>

## SSH 접속 설정

<br/><br/>

### 접속 방법 비교

![image](/assets/img/cloud/gcp/image3.png)

<br/><br/>

### Console 웹 SSH 접속

- GCP Console에서 우측 **SSH** 버튼 클릭
- 브라우저 기반 터미널 즉시 실행
- 별도 설정 없이 빠른 접속 가능

- 초기 설정 예시
  ```bash
  # root 비밀번호 설정
  sudo passwd
  
  # root 계정으로 전환
  su -
  
  # OS 버전 확인
  cat /etc/*-release
  ```


<br/><br/>

### gcloud CLI SSH 접속 (권장)

- SSH 키 자동 생성 및 관리
- 로컬 터미널 환경 사용 가능
- 가장 편리하고 안전한 방식

```bash
# 기본 접속
gcloud compute ssh my-web-server --zone=us-central1-a

# 특정 사용자로 접속
gcloud compute ssh username@my-web-server --zone=us-central1-a

# 프로젝트 지정
gcloud compute ssh my-web-server \
    --zone=us-central1-a \
    --project=my-project-id
```


<br/><br/>

### 수동 SSH 키 등록

- 전통적인 SSH 키 기반 인증 방식
- 팀원 간 키 공유 시 유용

<br/><br/>

#### SSH 키 생성

```bash
# RSA 키 생성 (권장 4096 비트)
ssh-keygen -t rsa -f ~/.ssh/gcp-instance -C "user@example.com" -b 4096

# ED25519 키 생성 (최신, 더 안전)
ssh-keygen -t ed25519 -f ~/.ssh/gcp-instance -C "user@example.com"
```

- 옵션 설명
  - `-t`
    - 키 생성 타입 선택 (rsa, ed25519 등)
  - `-f`
    - 생성할 키 파일명
  - `-C`
    - 주석 (GCP 계정 이메일 권장)
  - `-b`
    - 키 비트 수 (RSA의 경우 4096 권장)


<br/><br/>

#### SSH 키 메타데이터 등록

- GCP Console 이동
  - **Compute Engine** → **메타데이터** → **SSH 키 탭**
    ![image](/assets/img/cloud/gcp/vm-5.jpg)
  - **수정** → **항목 추가**
  - Public Key 내용 복사 후 입력
    - `~/.ssh/gcp-instance.pub` 파일 내용
  - **저장**

- Private 키로 접속
  ```bash
  ssh -i ~/.ssh/gcp-instance username@EXTERNAL_IP
  ```


<br/><br/>

### OS Login 설정 (엔터프라이즈 권장)

- IAM 기반 접근 제어
- 개별 SSH 키 관리 불필요
- 조직 수준 보안 정책 적용 가능

- 조직 수준 보안 정책 적용 가능

![mermaid-diagram](/assets/img/cloud/gcp/2022-10-19-vm-instance-diagram-3.png)

<br/><br/>

#### OS Login 활성화

```bash
# 프로젝트 전체에 OS Login 활성화
gcloud compute project-info add-metadata \
    --metadata enable-oslogin=TRUE

# 특정 인스턴스에만 활성화
gcloud compute instances add-metadata my-web-server \
    --zone=us-central1-a \
    --metadata enable-oslogin=TRUE
```

<br/><br/>

#### IAM 역할 부여

| 역할 | 권한 | 사용 시나리오 |
|------|------|---------------|
| **Compute OS Login** | 기본 SSH 접속 | 일반 개발자 |
| **Compute OS Admin Login** | sudo 권한 SSH 접속 | 시스템 관리자 |

```bash
# OS Login 권한 부여
gcloud projects add-iam-policy-binding my-project-id \
    --member=user:dev@example.com \
    --role=roles/compute.osLogin

# OS Admin Login 권한 부여
gcloud projects add-iam-policy-binding my-project-id \
    --member=user:admin@example.com \
    --role=roles/compute.osAdminLogin
```


<br/><br/>

## 방화벽 및 네트워크 보안

<br/><br/>

### 방화벽 규칙 생성


![image](/assets/img/cloud/gcp/image4.png)

<br/><br/>

### Console에서 방화벽 규칙 생성

- 탐색 메뉴 이동
  - **VPC 네트워크** → **방화벽**
    ![image](/assets/img/cloud/gcp/vm-6.jpg)
  - **방화벽 규칙 만들기** 클릭
    ![image](/assets/img/cloud/gcp/vm-7.jpg)

- 방화벽 규칙 설정
  - 이름
    - 규칙을 식별할 수 있는 이름 (예: allow-http-https)
  - 네트워크
    - 규칙이 적용될 VPC 네트워크 선택
  - 트래픽 방향
    - **수신(Ingress)**: 외부 → VM
    - **송신(Egress)**: VM → 외부
  - 대상
    - **대상 태그**: 특정 태그를 가진 인스턴스에만 적용
    - **모든 인스턴스**: VPC의 모든 인스턴스에 적용
  - 소스 IP 범위
    - `0.0.0.0/0`: 전 세계 모든 IP 허용 (주의 필요)
    - 특정 IP/CIDR: 제한된 접근
  - 프로토콜 및 포트
    - TCP 80 (HTTP)
    - TCP 443 (HTTPS)
    - TCP 22 (SSH)
    - TCP 8080 (커스텀 애플리케이션)


    - TCP 8080 (커스텀 애플리케이션)

![mermaid-diagram](/assets/img/cloud/gcp/2022-10-19-vm-instance-diagram-4.png)

<br/><br/>

### CLI로 방화벽 규칙 생성

```bash
# HTTP/HTTPS 허용
gcloud compute firewall-rules create allow-web-traffic \
    --network=default \
    --direction=INGRESS \
    --action=ALLOW \
    --rules=tcp:80,tcp:443 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=http-server,https-server

# SSH 접속 제한 (특정 IP만 허용)
gcloud compute firewall-rules create allow-ssh-restricted \
    --network=default \
    --direction=INGRESS \
    --action=ALLOW \
    --rules=tcp:22 \
    --source-ranges=123.456.789.0/24 \
    --target-tags=ssh-restricted

# 애플리케이션 포트 허용
gcloud compute firewall-rules create allow-app-port \
    --network=default \
    --direction=INGRESS \
    --action=ALLOW \
    --rules=tcp:8080 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=app-server
```


<br/><br/>

### 인스턴스에 방화벽 연결

- 탐색 메뉴 이동
  - **Compute Engine** → **VM 인스턴스**
    ![image](/assets/img/cloud/gcp/vm-8.jpg)
  - 대상 인스턴스 선택 → **수정**
    ![image](/assets/img/cloud/gcp/vm-9.jpg)

- 네트워크 태그 추가
  - 방화벽 규칙에서 정의한 태그 입력
  - 예: `http-server`, `https-server`, `app-server`
    ![image](/assets/img/cloud/gcp/vm-10.jpg)
  - **저장**


<br/><br/>

### 보안 권장 사항

| 항목 | 위험한 설정 | 안전한 설정 |
|------|---------------|---------------|
| **SSH 접근** | Source: 0.0.0.0/0 | Source: 회사 IP/Bastion Host만 허용 |
| **External IP** | 모든 VM에 공인 IP 할당 | 필요한 경우만 할당, 나머지는 Private IP |
| **방화벽 규칙** | 모든 포트 열림 | 필요한 포트만 최소 권한 원칙 |
| **SSH 키 관리** | 수동 키 관리, 키 공유 | OS Login 사용, IAM 기반 제어 |
| **서비스 계정** | 기본 서비스 계정 사용 | 커스텀 서비스 계정, 최소 권한 부여 |


<br/><br/>

## IAM 및 접근 제어

<br/><br/>

### 주요 IAM 역할

| 역할 | 권한 범위 | 사용 대상 |
|------|-----------|-----------|
| **Compute Instance Admin (v1)** | 인스턴스 전체 제어 (생성/삭제/수정) | 인프라 관리자 |
| **Compute Viewer** | 인스턴스 조회만 가능 | 읽기 전용 사용자 |
| **Compute OS Login** | SSH 접속 (일반 사용자) | 개발자 |
| **Compute OS Admin Login** | SSH 접속 (sudo 권한) | 시스템 관리자 |
| **Service Account User** | 서비스 계정으로 작업 수행 | CI/CD 파이프라인 |

<br/><br/>

### 서비스 계정 설정

- VM에 할당된 서비스 계정은 해당 VM이 다른 GCP 리소스에 접근할 때 사용
- 기본 Compute Engine 서비스 계정은 과도한 권한 보유
- **권장: 커스텀 서비스 계정 생성 및 최소 권한 부여**

```bash
# 커스텀 서비스 계정 생성
gcloud iam service-accounts create my-vm-sa \
    --display-name="My VM Service Account"

# 필요한 역할만 부여 (예: Cloud Storage 읽기)
gcloud projects add-iam-policy-binding my-project-id \
    --member="serviceAccount:my-vm-sa@my-project-id.iam.gserviceaccount.com" \
    --role="roles/storage.objectViewer"

# 인스턴스 생성 시 서비스 계정 지정
gcloud compute instances create my-secure-vm \
    --zone=us-central1-a \
    --machine-type=e2-medium \
    --service-account=my-vm-sa@my-project-id.iam.gserviceaccount.com \
    --scopes=https://www.googleapis.com/auth/cloud-platform
```


<br/><br/>

## 비용 최적화 및 운영 팁

<br/><br/>

### 비용 절감 전략


![image](/assets/img/cloud/gcp/image5.png)

<br/><br/>

### 운영 체크리스트

- **개발/테스트 환경**
  - E2 시리즈 사용하여 비용 절감
  - Spot VM(구 Preemptible VM) 고려
    - 최대 91% 할당 가능
    - 24시간 내 종료될 수 있음
    - 배치 작업, 빅데이터 처리에 적합

- **프로덕션 환경**
  - 적절한 머신 패밀리 선택
  - Committed Use Discounts 검토
    - 1년 약정: 37% 할인
    - 3년 약정: 57% 할인
  - 고가용성 구성
    - 다중 영역(Multi-zone) 배포
    - Load Balancer + Managed Instance Group

- **네트워크 보안**
  - Private IP 우선 사용
    - 외부 접속 불필요한 DB/내부 서버는 External IP 비할당
    - Cloud NAT로 아웃바운드 트래픽만 허용
  - SSH 접속은 Bastion Host 또는 IAP(Identity-Aware Proxy) 사용
  - 최소 권한 원칙 적용

- **모니터링 및 로깅**
  - Cloud Ops Agent 설치
    - Startup Script에 자동 설치 스크립트 포함
    - Cloud Logging 및 Cloud Monitoring 자동 연동
  - 알림 정책 설정
    - CPU/메모리 사용률
    - 디스크 I/O
    - 네트워크 트래픽

- **자동화**
  - Startup Script 활용
  - Infrastructure as Code (Terraform, Deployment Manager)
  - CI/CD 파이프라인 구축


<br/><br/>

### Spot VM 활용

```bash
# Spot VM 생성
gcloud compute instances create my-spot-vm \
    --zone=us-central1-a \
    --machine-type=e2-medium \
    --provisioning-model=SPOT \
    --instance-termination-action=DELETE \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud

# Spot VM 상태 확인
gcloud compute instances describe my-spot-vm \
    --zone=us-central1-a \
    --format="get(scheduling.provisioningModel)"
```

- 특징
  - 최대 91% 비용 절감
  - 24시간 내 종료 가능
  - GCP가 리소스 필요 시 언제든 회수

- 적합한 워크로드
  - 배치 처리
  - 데이터 분석
  - CI/CD 빌드 서버
  - 렌더링 작업

- 부적합한 워크로드
  - 프로덕션 웹 서버
  - 데이터베이스
  - 실시간 서비스


<br/><br/>

## 고급 기능

<br/><br/>

### Instance Template 및 Managed Instance Group

- 동일한 구성의 인스턴스 여러 개 생성 시 유용
- 자동 확장(Auto-scaling) 구성 가능

```bash
# Instance Template 생성
gcloud compute instance-templates create web-server-template \
    --machine-type=e2-medium \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --tags=http-server \
    --metadata-from-file=startup-script=./startup.sh

# Managed Instance Group 생성 (자동 확장)
gcloud compute instance-groups managed create web-server-group \
    --base-instance-name=web-server \
    --template=web-server-template \
    --size=3 \
    --zone=us-central1-a

# Auto-scaling 설정
gcloud compute instance-groups managed set-autoscaling web-server-group \
    --zone=us-central1-a \
    --max-num-replicas=10 \
    --min-num-replicas=2 \
    --target-cpu-utilization=0.75
```


<br/><br/>

### Cloud Ops Agent 설치

```bash
#!/bin/bash
# Startup Script에 포함

# Cloud Ops Agent 설치 (Logging + Monitoring)
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install

# 설치 확인
sudo systemctl status google-cloud-ops-agent
```


<br/><br/>

## 트러블슈팅

<br/><br/>

### 일반적인 문제 및 해결

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| **SSH 접속 실패** | 방화벽 규칙 누락 | TCP:22 허용 규칙 추가 |
| **웹 서버 접속 불가** | 방화벽 규칙 또는 네트워크 태그 미적용 | 인스턴스에 올바른 태그 추가 |
| **디스크 용량 부족** | 부팅 디스크 크기 부족 | 디스크 확장 또는 추가 디스크 연결 |
| **성능 저하** | 부적절한 머신 타입 | 더 높은 머신 타입으로 변경 |
| **External IP 없음** | Ephemeral IP 미할당 | Static IP 예약 및 할당 |

<br/><br/>

### 디버깅 명령어

```bash
# 인스턴스 상태 확인
gcloud compute instances describe my-web-server \
    --zone=us-central1-a

# 시리얼 포트 로그 확인 (부팅 문제 디버깅)
gcloud compute instances get-serial-port-output my-web-server \
    --zone=us-central1-a

# 방화벽 규칙 확인
gcloud compute firewall-rules list

# 네트워크 연결 테스트
gcloud compute ssh my-web-server \
    --zone=us-central1-a \
    --command="curl -I https://www.google.com"
```


<br/><br/>

## 보안 강화 체크리스트

![image](/assets/img/cloud/gcp/image6.png)


<br/><br/>

## Reference
- [Google Cloud Compute Engine 공식 문서](https://cloud.google.com/compute/docs)
- [Compute Engine 머신 패밀리](https://cloud.google.com/compute/docs/machine-types)
- [VPC 방화벽 규칙](https://cloud.google.com/vpc/docs/firewalls)
- [OS Login 설정](https://cloud.google.com/compute/docs/oslogin)
- [Spot VM 가이드](https://cloud.google.com/compute/docs/instances/spot)
- [Instance Templates](https://cloud.google.com/compute/docs/instance-templates)
- [Cloud Ops Agent](https://cloud.google.com/stackdriver/docs/solutions/agents/ops-agent)
