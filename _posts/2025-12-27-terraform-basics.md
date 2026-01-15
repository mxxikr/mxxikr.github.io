---
title: "Terraform이란?"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-27 18:20:00 +0900
category:
  - Infrastructure
tags: [terraform, azure, iac, devops, backend]
math: true
---

## 테라폼이란

- 정의
  - 코드로 인프라를 관리하는 도구 (Infrastructure as Code, IaC)임
  - GUI(Azure Portal)에서 클릭으로 서버를 만드는 대신 코드를 작성해서 인프라를 생성, 수정, 삭제함
- 철학
  - Declarative (선언적)
  - "VM을 하나 생성해"라고 명령(Imperative)하는 것이 아니라 "나는 VM 1개가 있는 상태를 원해"라고 선언(Declarative)함
  - 테라폼이 현재 상태와 목표 상태의 차이(Diff)를 계산해서 필요한 작업만 수행함
- 주요 컴포넌트

  - State (상태 파일) 관리
    - 현재 인프라의 상태를 JSON 형태로 저장함
    - 협업 시 동일한 리소스를 중복 생성하지 않도록 막아주는 기준점이 됨 (Locking)
  - Drift (상태 불일치) 감지

    - 실제 인프라가 코드 몰래 수정되었을 때 이를 감지함

      | 구분      | 오픈소스 Terraform       | Terraform Cloud            |
      | --------- | ------------------------ | -------------------------- |
      | 감지 방식 | 수동 (`terraform plan`)  | 자동 (12/24시간 주기 설정) |
      | 알림      | 없음 (직접 구현 필요)    | Email/Slack/Webhook        |
      | 교정      | 수동 (`terraform apply`) | 수동 승인 후 apply         |

    - 주의
      - Terraform은 Drift를 감지만 하며, 자동 교정하지 않음
      - 항상 사람의 승인이 필요함

  - 보안 주의사항

    | 저장 위치       | At-Rest 암호화 | In-Transit | State 내부 민감 정보    |
    | --------------- | -------------- | ---------- | ----------------------- |
    | 로컬 파일       | 없음           | N/A        | 평문                    |
    | Azure Storage   | SSE (기본)     | TLS        | 평문                    |
    | Terraform Cloud | AES-256        | TLS        | 암호화 가능 (추가 비용) |

    - `sensitive = true`는 **CLI 출력에서만 마스킹**되며, State 파일 내부에는 여전히 평문
    - 민감 정보는 State에 직접 저장하지 말고 Azure Key Vault 참조 권장
    - State 파일 접근 권한을 RBAC으로 엄격히 제한할 것

<br/><br/>

## 테라폼 워크플로우와 역할 비교

- 테라폼은 인프라의 "뼈대"를 만드는 역할에 집중함
- Terraform
  - Azure 구독, VNet, AKS 클러스터, Azure SQL Database 등 물리적/논리적 하드웨어를 생성함
- Ansible
  - 생성된 VM 안에 들어가서 Nginx 설치, 환경변수 설정 등 OS 내부 설정을 수행함
- Kubernetes
  - 준비된 인프라 위에서 Docker 컨테이너(애플리케이션)를 배포하고 관리함

![Terraform 워크플로우](/assets/img/terraform/workflow.png)

<br/><br/>

## 설정 방법

### 설치

```bash
# Mac (Homebrew)
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Linux (Ubuntu/Debian)
sudo apt-get update && sudo apt-get install terraform
```

### 코드 예시 (Azure)

- JSON과 비슷하지만 가독성이 훨씬 좋은 HCL (HashiCorp Configuration Language)을 사용함

```hcl
# Provider 설정 (Azure Resource Manager 사용 선언)
provider "azurerm" {
  features {}
}

# 리소스 그룹 생성 (Azure 인프라의 논리적 컨테이너)
resource "azurerm_resource_group" "main" {
  name     = "rg-backend-dev"
  location = "koreacentral" # 서울 리전
}

# 가상 네트워크 및 서브넷 정의
resource "azurerm_virtual_network" "vnet" {
  name                = "vnet-app"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_subnet" "subnet" {
  name                 = "snet-internal"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.2.0/24"]
}

# 네트워크 인터페이스 생성
resource "azurerm_network_interface" "nic" {
  name                = "nic-backend-api"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
  }
}

# 리눅스 가상 머신 생성
resource "azurerm_linux_virtual_machine" "app_server" {
  name                = "vm-backend-api"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  size                = "Standard_B2s"
  admin_username      = "adminuser"

  network_interface_ids = [
    azurerm_network_interface.nic.id,
  ]

  admin_ssh_key {
    username   = "adminuser"
    public_key = file("~/.ssh/id_rsa.pub")  # 또는 var.ssh_public_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "18.04-LTS"
    version   = "latest"
  }
}
```

### 실행 (CLI 명령어)

- terraform init
  - 필요한 플러그인(azurerm)을 다운로드함
- terraform plan
  - 프로덕션 환경에서 특히 중요함
  - 실제로 만들기 전에 무엇이 변경될지 미리 보여줌 (Dry Run)
  - `az login`을 통해 Azure에 인증된 상태여야 함
- terraform apply
  - plan 내용을 확인 후 승인하면 실제로 인프라를 생성함

<br/><br/>

## 프로비저닝 워크플로우

![Terraform Provisioning Workflow](/assets/img/terraform/provisioning_workflow.png)

<br/><br/>

## 설계 방법

### 디렉토리 구조 (모듈화)

- 모든 코드를 main.tf 하나에 넣지 말고 재사용 가능한 단위(Module)로 쪼개야 함

```text
my-infra-project/
├── modules/                 # 재사용 가능한 부품들 (함수 개념)
│   ├── aks-cluster/         # AKS 클러스터 생성 모듈
│   └── networking/          # VNet, NSG 설정 모듈
├── environments/            # 실제 배포 환경
│   ├── dev/                 # 개발 환경
│   │   ├── main.tf          # modules를 가져다 씀
│   │   └── backend.tf       # dev용 state 저장소 설정
│   └── prod/                # 운영 환경
│       ├── main.tf
│       └── backend.tf
```

### 변수와 출력 (Variables & Outputs)

- 변수 (Variables)
  - 값을 하드코딩하지 않고 외부에서 주입받아 재사용성을 높임
  - `variables.tf` 파일에 타입과 기본값을 정의함
- 출력 (Outputs)
  - 인프라 생성 완료 후 중요한 정보(IP 주소, DB 엔드포인트)를 화면에 출력함
  - 다른 모듈에서 이 값을 참조하여 사용할 수 있음

### State 관리 (Remote Backend)

- terraform.tfstate 파일을 로컬 노트북에 두면 안 됨
- Remote Backend
  - State 파일을 Azure Storage Account의 Blob Container에 저장함
  - State 파일 암호화 및 접근 권한 제어를 통해 보안성을 높여야 함
- Locking
  - 누군가 apply를 실행 중이면 Lease(Lock)를 걸어 다른 사람이 동시에 수정하지 못하게 막음
- 암시적 의존성 (Implicit Dependency)
  - 리소스 간의 참조(Reference)를 통해 테라폼이 생성 순서를 자동으로 파악함
  - 내부적으로 DAG(Directed Acyclic Graph)를 구성하여 병렬 처리가 가능한 부분은 동시에 생성하여 속도를 높임
- 명시적 의존성 (Explicit Dependency)
  - `depends_on` 메타 인수를 사용하여 강제로 생성 순서를 지정함
  - 테라폼이 자동으로 추론할 수 없는 순서 관계를 정의할 때 사용함

```hcl
# backend.tf 예시
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "sttfstatebackmxxikr"
    container_name       = "tfstate"
    key                  = "dev.terraform.tfstate"
  }
}
```

### Git 관리 주의사항

- .gitignore 필수 설정

  ```gitignore
  # 절대 커밋하지 말 것
  *.tfstate
  *.tfstate.*
  .terraform/

  # 민감 정보
  *.tfvars
  backend.conf
  ```

- 환경변수 활용

  ```bash
  # 민감한 변수는 환경변수로
  export TF_VAR_db_password="secret"
  terraform apply
  ```

### State Lock 문제 해결

- 증상
  - `Error acquiring the state lock` 발생
- 원인
  - 이전 `terraform apply`가 비정상 종료
  - 네트워크 끊김으로 Lock 해제 실패
- 해결

  ```bash
  # Lock ID 확인 후
  terraform force-unlock <LOCK_ID>

  # 확인 후 다시 실행
  terraform apply
  ```

### 비용 관리

- 실수 방지 체크리스트
  - `terraform plan`에서 리소스 타입/크기 확인
  - Azure Cost Management 예산 알림 설정
  - Infracost 등 비용 예측 도구 통합
  - 태그로 리소스 추적 (`Environment`, `Owner`, `Project`)

<br/><br/>

## 타 서비스 분석 및 비교

### 테라폼의 현재 지위

- 2024년 기준 IaC 시장 점유율 1위이지만 경쟁 심화 단계임
- IBM의 HashiCorp 인수 (2024년 12월 완료)
  - 거대 IT 기업의 인수로 인한 생태계 변화 가능성이 존재함
- 가장 큰 위협 요소
  - 2023년 8월 라이센싱을 Open-source (MPL)에서 BSL (Business Source License)로 변경함
  - BSL은 상용 경쟁 제품을 만들 수 없음 (특정 수익 규모 이상 제한)
  - 이로 인해 OpenTofu 포크 및 기업들의 이탈을 초래함

### 타 서비스 분석

- OpenTofu (테라폼의 오픈소스 포크)
  - 특징
    - 라이센싱이 MPL 2.0으로 완전한 자유 사용 가능함
    - Linux Foundation / CNCF Sandbox 프로젝트로 커뮤니티가 로드맵을 주도함
  - 장점
    - 테라폼과 완전히 호환 가능하며 State 암호화 등 보안 기능이 강화됨
  - 추천
    - 규제 산업(금융, 의료)이나 BSL이 문제되는 엔터프라이즈
- CloudFormation (AWS 최적화)
  - 특징
    - JSON 또는 YAML을 사용하며 AWS가 State를 자동 관리함
  - 장점
    - 최신 AWS 기능을 가장 빠르게 지원하며 Drift Detection 기능이 강력함
  - 단점
    - AWS에만 종속되며 문법이 장황함
  - 추천
    - 100% AWS 환경, Serverless 아키텍처
- AWS CDK (개발자 친화적)
  - 특징
    - TypeScript, Python 등 프로그래밍 언어를 사용하여 인프라를 정의함
    - CloudFormation을 백엔드로 사용함
  - 장점
    - 익숙한 프로그래밍 언어의 OOP 개념을 활용하여 생산성이 높음
  - 추천
    - AWS 전용, 백엔드 개발자가 주도하는 마이크로서비스 아키텍처
- Bicep (Azure 최적화)
  - 특징
    - ARM Templates를 대체하는 Azure 전용 DSL임
  - 장점
    - 문법이 쉽고 Azure와 완벽하게 통합됨
  - 추천
    - Azure 스타트업
- Pulumi (프로그래밍 언어 중심)
  - 특징
    - Python, TypeScript 등으로 프로그래밍하며 테스트 프레임워크 사용이 가능함
  - 장점
    - 강력한 재사용성과 Automation API를 통한 동적 프로비저닝이 가능함
  - 추천
    - 개발자 주도 조직, 복잡한 비즈니스 로직이 있는 인프라

### 선택 가이드

| 상황                   | 추천 도구          | 이유                                                             |
| :--------------------- | :----------------- | :--------------------------------------------------------------- |
| GCP + AWS 멀티클라우드 | **Terraform**      | 가장 성숙한 멀티클라우드 지원과 방대한 커뮤니티                  |
| AWS 전용, 개발자 팀    | **AWS CDK**        | TypeScript/Python으로 인프라 패턴 구현 가능하며 학습 곡선이 낮음 |
| AWS 전용, 운영 팀      | **CloudFormation** | 최신 AWS 기능 최우선 지원 및 강력한 Drift Detection              |
| Azure 전용             | **Bicep**          | Azure에 완전히 최적화되어 있고 문법이 간단함                     |
| 오픈소스/금융규제      | **OpenTofu**       | State 암호화 및 오픈소스 거버넌스 지원                           |
| 복잡한 비즈니스 로직   | **Pulumi**         | 일반 프로그래밍 언어로 복잡한 패턴 구현 및 강력한 테스트 가능    |

<br/><br/>

## 요약 정리

- 멀티클라우드 전략이라면 Terraform (장기적으로 OpenTofu 고려 가능)
- 단일 클라우드라면 네이티브 도구 (AWS CDK 등) 사용을 추천함

<br/><br/>

## Reference

- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)
- [OpenTofu Documentation](https://opentofu.org/docs/)
