---
title: "Ansible이란?"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-27 18:00:00 +0900
category:
  - Infrastructure
tags: [ansible, iac, devops, automation, backend]
math: true
---

## 앤서블 기초

### 정의 및 특징

- 서버의 설정을 자동화하는 도구(Configuration Management)임
- 수십, 수백 대의 서버에 접속해서 패키지 설치, 환경변수 설정 등의 작업을 자동화함
- 특징
  - Agentless (에이전트리스)
    - 관리 대상 서버에 별도의 프로그램을 설치할 필요가 없음
    - Control Node (Ansible 실행 서버)
      - Python 3.8+ 필수
      - Ansible 설치 필요
    - Managed Node (관리 대상 서버)
      - Python 2.7 또는 3.5+ (대부분 모듈)
      - Ansible 설치 불필요
      - SSH 서버 실행 중이어야 함
    - Agent 방식인 Puppet, Chef와 차별화됨

### 아키텍처 (Push 방식)

![Ansible Push Architecture](/assets/img/ansible/push_architecture.png)

<br/><br/>

## Playbook과 활용

### Playbook이란 (작업 지시서)

- 어떤 서버(Host)에 어떤 작업(Task)을 할지 정의한 YAML 파일임
- Terraform과의 차이
  - Terraform은 리소스 생성 (선언적, 상태 관리)
  - Ansible은 설정 적용 (절차적, 멱등성으로 처리)
- 멱등성 (Idempotency)
  - 여러 번 실행해도 결과가 동일함을 보장함
  - 이미 설치된 패키지는 건너뛰는 등 불필요한 작업을 수행하지 않음
  - 주의사항
    - `shell`이나 `command` 모듈은 기본적으로 멱등성을 보장하지 않음
    - `creates` 또는 `removes` 파라미터를 사용하여 수동으로 제어해야 함

### 예시

- 웹 서버 10대에 Nginx 설치하고 시작하기

```yaml
---
- name: 웹 서버 세팅하기 # Play의 이름
  hosts: webservers # 대상: inventory 파일에 정의된 'webservers' 그룹
  become: yes # sudo 권한 사용 (root)

  tasks: # 할 일 목록
    - name: 최신 버전으로 apt update # Task 1
      apt:
        update_cache: yes

    - name: Nginx 설치 # Task 2
      apt:
        name: nginx
        state: present # "설치된 상태여야 한다" (없으면 설치함)

    - name: Nginx 서비스 시작 # Task 3
      service:
        name: nginx
        state: started
        enabled: yes # 재부팅 시 자동 실행
```

<br/><br/>

### 언제 사용하면 좋을까

- 초기 서버 세팅 (Provisioning)
  - 테라폼으로 생성한 기본 서버에 JDK, Docker, Monitoring Agent 등을 일괄 설치할 때 유용함
- 보안 패치 및 유지보수
  - 다수의 운영 서버에 대해 특정 라이브러리 버전을 패치하거나 설정을 변경해야 할 때 사용함
- Docker 없는 환경 배포
  - K8s를 사용하지 않는 환경에서 단순 애플리케이션(JAR 등) 배포 및 서비스 재시작 자동화에 적합함

<br/><br/>

## 도입 전 고려사항

### 장단점 분석

- 장점
  - 구조
    - Agentless 방식으로 대상 서버에 대한 의존성이 낮음 (SSH만 있으면 됨)
  - 언어
    - YAML을 사용하여 가독성이 좋고 배우기 쉬움
  - 확장성
    - Python 기반으로 모듈 확장이 용이함
- 단점
  - 속도
    - SSH 연결 오버헤드로 인해 초대규모 환경에서는 Agent 방식보다 느릴 수 있음
    - 성능 최적화 방법
      - `pipelining = True` 설정 (가장 기본적이고 안전)
      - `forks` 값 증가 (기본 5 → 20~50)
      - 전략 변경: `strategy = free` (의존성 없는 작업 병렬 실행)
  - 복잡성
    - 로직이 복잡해질수록 YAML 파일 관리가 어려워질 수 있음
  - OS 지원
    - 윈도우 지원 현황 (2024년 기준)
      - WinRM을 통한 원격 관리 지원
      - `win_*` 모듈로 패키지 설치, 서비스 관리, 레지스트리 편집 가능
      - SSH는 Windows Server 2019+ (OpenSSH 필요)
      - Linux 모듈 대비 Windows 모듈이 적고 문서가 부족함

### 타 서비스 비교

| 특징   | Ansible               | Puppet / Chef         | Shell Script        |
| :----- | :-------------------- | :-------------------- | :------------------ |
| 방식   | Push (명령을 밈)      | Pull (설정을 당겨감)  | Imperative (명령형) |
| Agent  | 없음 (SSH)            | 필수 (설치 필요)      | 없음                |
| 언어   | YAML (선언적)         | Ruby 기반 DSL         | Bash/Sh             |
| 난이도 | 쉬움                  | 어려움                | 쉬우나 관리 어려움  |
| 적합성 | 중소~대규모, 클라우드 | 초대규모 엔터프라이즈 | 개인 서버, 1회성    |

### 테라폼과 함께 쓰는 패턴 (경계는 유동적)

- Terraform
  - AWS/GCP에 VM, VPC, Security Group 등 인프라 리소스를 생성함
- Ansible
  - 생성된 VM에 접속하여 Docker 설치 및 환경 설정을 주입함
- Docker/K8s
  - 실제 애플리케이션 컨테이너를 배포하고 실행함

**실무에서는**

- Terraform의 `provisioner`로 Ansible 자동 실행 가능
- Ansible로 Docker 컨테이너까지 관리하는 경우도 있음
- 팀/프로젝트 특성에 따라 경계 조정 가능

<br/><br/>

## 활용 가이드

### Jinja2 템플릿 활용

- 단순 패키지 설치를 넘어 동적인 설정 파일 생성이 가능함
- 변수 치환을 통해 환경별(Dev, Prod) 설정 관리가 용이함
- 예시
  ```bash
  # nginx.conf.j2
  worker_processes {{ worker_count }};
  listen {{ port_number }};
  ```

### Roles 구조화

- 디렉토리 구조 제안
  - Playbook의 가독성과 재사용성을 극대화하기 위한 표준 구조임
  ```text
  site.yml                # 전체 실행용 메인 플레이북
  webservers.yml          # 특정 그룹용 플레이북
  roles/
    common/               # 모든 서버 공통 설정 (유저 생성, 패키지 업데이트 등)
    nginx/                # Nginx 설치 및 설정 전문 롤
      tasks/
        main.yml          # 실제 수행할 작업 정의
      templates/
        nginx.conf.j2     # Jinja2 설정 템플릿
      vars/
        main.yml          # 롤 전용 변수
      handlers/
        main.yml          # 설정 변경 시 서비스 재시작 로직
  ```
- Handlers 개념

  - 설정 파일이 변경되었을 때만 서비스를 재시작함
  - 여러 작업이 설정을 변경해도 재시작은 마지막에 한 번만 실행됨
  - 예시

    ```yaml
    # tasks/main.yml
    - name: Nginx 설정 복사
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: restart nginx

    # handlers/main.yml
    - name: restart nginx
      service:
        name: nginx
        state: restarted
    ```

- 계층형 구조의 이점
  - 유지보수 효율성
    - 특정 기능(예: Nginx) 수정 시 해당 디렉토리의 파일만 확인하면 됨
  - 코드 재사용
    - 동일한 롤을 여러 프로젝트나 다양한 서버 그룹에서 공유 가능함

### Ansible Vault (보안 적용)

- 보안 데이터 관리 절차
  - 협업 환경에서 암호화된 상태로 코드를 공유하기 위한 필수 단계임
- 1단계 비밀 파일 생성
  - 아래 명령어를 통해 암호화된 변수 파일을 생성함
  ```bash
  ansible-vault create roles/nginx/vars/secrets.yml
  ```
- 2단계 민감 정보 작성
  - 에디터가 열리면 아래와 같이 변수를 정의함 (파일 내용은 자동으로 암호화되어 저장됨)
  ```yaml
  db_password: "super-secret-password-1234"
  api_key: "abc-123-def-456"
  ```
- 3단계 플레이북 실행

  - 실행 시 암호를 입력받거나 패스워드 파일을 참조하여 복호화 후 실행함

  ```bash
  # 암호 직접 입력 방식
  ansible-playbook site.yml --ask-vault-pass

  # 파일 참조 방식 (CI/CD 자동화 환경 추천)
  ansible-playbook site.yml --vault-password-file .vault_pass
  ```

**Vault 보안 모범 사례**

- `.vault_pass` 파일을 Git에 커밋하면 암호화가 무의미해짐
- `.gitignore`에 추가 필수
  ```gitignore
  .vault_pass
  *.vault
  ```
- 파일 권한 제한
  ```bash
  chmod 600 .vault_pass
  ```

### 성능 최적화 설정

- ansible.cfg 환경 설정
  - 대규모 환경에서 실행 속도를 높이기 위한 최적화 옵션임
  ```ini
  [ssh_connection]
  pipelining = True  # SSH 연결 수를 줄여 전송 속도 개선
  ```
- 주의사항 및 제약
  - Managed Node의 sudo 설정
    - `/etc/sudoers` 파일 내 `requiretty` 옵션이 켜져 있으면 pipelining 작동이 차단됨
    - 원활한 가속을 위해 해당 옵션 비활성화 확인이 필요함

<br/><br/>

## 요약 정리

- 서버 관리가 필요하지만 쉘 스크립트의 관리가 부담스러운 경우 Ansible이 가장 적합함

<br/><br/>

## Reference

- [Ansible Documentation](https://docs.ansible.com/)
