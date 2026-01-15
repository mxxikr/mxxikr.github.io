---
title: Linux 디스크 및 파티션 관리
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2022-10-31 22:55:00 +0900
category: [OS, Linux]
tags: [os, linux, mount, storage, lvm, partition, devops]
math: true
mermaid: true
---
<br/><br/>

## 디스크 장치 이름 체계


### Linux 장치 명명 규칙

- Linux는 모든 하드웨어를 파일로 취급
- 디스크 타입과 연결 방식에 따라 장치 이름 다름
- 모든 장치 파일은 `/dev` 디렉토리에 위치


### 디스크 타입별 장치명

![image](/assets/img/linux/disk-device-naming.png)


### 주요 디스크 타입

| 타입 | 장치명 예시 | 파티션 명명 | 특징 | 사용 환경 |
|------|-------------|-------------|------|-----------|
| **SATA/SCSI/SAS** | `/dev/sda`, `/dev/sdb` | `sda1`, `sda2` | 가장 일반적인 명명 규칙 | 대부분의 서버, 데스크톱 |
| **NVMe SSD** | `/dev/nvme0n1`, `/dev/nvme1n1` | `nvme0n1p1`, `nvme0n1p2` | 고속 SSD, p 접두사 사용 | 최신 서버, 고성능 시스템 |
| **가상 디스크 (KVM/Xen)** | `/dev/vda`, `/dev/vdb` | `vda1`, `vda2` | 가상화 환경 전용 | 클라우드, 가상 머신 |
| **IDE (레거시)** | `/dev/hda`, `/dev/hdb` | `hda1`, `hda2` | 거의 사용하지 않음 | 구형 시스템 |


### NVMe 장치명 구조

- **nvme0n1 구조 설명**
  - `nvme0`
    - 첫 번째 NVMe 컨트롤러
  - `n1`
    - 첫 번째 네임스페이스 (Namespace)
    - 보통 물리 디스크 1개 = 네임스페이스 1개
  - `p1`
    - 첫 번째 파티션 (Partition)

- 예시
  - `/dev/nvme0n1p1`
    - 첫 번째 NVMe 컨트롤러, 첫 번째 네임스페이스, 첫 번째 파티션


<br/><br/>

## 디스크 구조 및 타입


### 하드 디스크 물리 구조

- **Sector**
  - 하드 디스크의 가장 작은 저장 단위
  - 전통적으로 512 바이트

- **Boot Sector**
  - 각 파티션의 가장 첫 번째 섹터
  - 부팅 정보 포함

- **MBR (Master Boot Record)**
  - 디스크 전체의 가장 첫 번째 부트 섹터
  - 파티션 테이블 정보 보유
  - 최대 2TB 제한

- **Cylinder**
  - 하드 디스크 용량을 결정하는 단위
  - 여러 플래터(Platter)의 동일 위치 트랙 집합

![mermaid-diagram](/assets/img/linux/2022-10-31-disk-partition-diagram-1.png)



### 디스크 인터페이스 타입 비교

| 타입 | 전송 방식 | 속도 | 주요 특징 | 장치명 | 사용 환경 |
|------|-----------|------|-----------|--------|-----------|
| **IDE** | 병렬 (Parallel) | 느림 | 구형 규격, CPU 직접 관리 | `/dev/hda` | 거의 사용 안 함 |
| **SATA** | 직렬 (Serial) | 중간 | IDE 개선 버전, 핫플러그 지원 | `/dev/sda` | 일반 PC, 서버 |
| **SCSI** | 직렬 | 빠름 | 고속, 안정성 높음, 비쌈 | `/dev/sda` | 워크스테이션, 서버 |
| **SAS** | 직렬 | 매우 빠름 | SCSI 발전형, SATA 호환 | `/dev/sda` | 엔터프라이즈 서버 |
| **SSD** | - | 매우 빠름 | 반도체 기반, 기계 지연 없음 | `/dev/sda` | 모든 환경 |
| **NVMe SSD** | PCIe | 최고 | 최신 고속 인터페이스 | `/dev/nvme0n1` | 고성능 시스템 |


### 주요 디스크 타입 상세

- **IDE (Integrated Drive Electronics)**
  - 40핀 직사각형 포트
  - 병렬 데이터 전송
  - CPU가 직접 관리
  - 부팅 중 장착 불가
  - 거의 사용하지 않음

- **SATA (Serial Advanced Technology Attachment)**
  - 직렬 데이터 전송
  - IDE의 개선 버전
  - 핫플러그 지원
  - 가장 일반적인 인터페이스

- **SCSI (Small Computer System Interface)**
  - 서버급 고속 인터페이스
  - 안정성 높지만 비쌈
  - 전용 컨트롤러 필요
  - 내장 칩에서 디스크 관리
  - 부팅 중 장착 가능

- **SAS (Serial Attached SCSI)**
  - SCSI의 직렬 버전
  - 서버 및 대형 컴퓨터용
  - SATA 디스크를 SAS 컨트롤러에 사용 가능 (역은 불가)
  - 엔터프라이즈급 성능

- **SSD (Solid State Drive)**
  - 반도체 기반 저장 장치
  - 기계적 지연 없음
  - 고속 입출력
  - 낮은 실패율


<br/><br/>

## 파티션 개념 및 구조


### 파티션 필요성

- 하드 디스크를 논리적으로 나눈 구역
- 각 파티션은 독립된 드라이브로 인식
- OS와 데이터 분리로 안정성 향상
- 다양한 파일 시스템 동시 사용 가능


### MBR 파티션 구조

![mermaid-diagram](/assets/img/linux/2022-10-31-disk-partition-diagram-2.png)

![image](/assets/img/linux/partition-structure.png)


### 파티션 타입

- **Primary 파티션 (주 파티션)**
  - 최대 3개까지 생성 가능 (Extended 사용 시)
  - 부팅 가능
  - 독립적인 파일 시스템

- **Extended 파티션 (확장 파티션)**
  - 최대 1개만 생성 가능
  - 직접 사용 불가 (컨테이너 역할)
  - 논리 파티션을 담는 공간
  - 부팅 불가

- **Logical 파티션 (논리 파티션)**
  - Extended 파티션 내부에 생성
  - 개수 제한 없음
  - 번호는 5번부터 시작
  - 데이터 저장용



### 파티션 조합 예시

| 구성 | Primary | Extended | Logical | 설명 |
|------|---------|----------|---------|------|
| **케이스 1** | 3개 | 0개 | 0개 | 모두 Primary로 구성 |
| **케이스 2** | 2개 | 1개 | 여러 개 | 일반적인 구성 |
| **케이스 3** | 1개 | 1개 | 여러 개 | OS 하나 + Extended |
| **케이스 4** | 3개 | 1개 | 여러 개 | MBR 최대 구성 |


<br/><br/>

## 파티셔닝 도구


### 도구 비교

| 도구 | 지원 파티션 타입 | 디스크 크기 제한 | 인터페이스 | 주요 용도 |
|------|------------------|------------------|------------|-----------|
| **fdisk** | MBR 최적화 w/ GPT Support | 2TB 이하 권장 | 대화형 | 간단한 파티션 작업, MBR 디스크 |
| **gdisk** | GPT 전용 | 2TB 이상 지원 | 대화형 | 대용량 디스크, 최신 시스템 |
| **parted** | MBR, GPT 모두 지원 | 제한 없음 | 대화형 + 스크립트 | 범용적 사용, 자동화 |


### fdisk 명령어

- MBR 파티션 테이블 관리 도구
- 2TB 이하 디스크 권장


#### 주요 옵션

- `-l`
  - 모든 디스크의 파티션 목록 표시

- 대화형 명령어 (fdisk /dev/sdb 실행 후)
  - `p`
    - 파티션 테이블 출력
  - `n`
    - 새 파티션 생성
  - `d`
    - 파티션 삭제
  - `t`
    - 파티션 타입 변경
  - `w`
    - 변경 사항 저장 후 종료
  - `q`
    - 저장하지 않고 종료
  - `m`
    - 도움말 표시

> **참고**: 최신 `fdisk` 버전은 **GPT 파티션 테이블을 지원**합니다. 과거에는 MBR 전용이었으나, 현재는 대화형 인터페이스로 GPT 디스크 관리도 가능합니다. 다만, 대용량 디스크 관리에는 `parted`나 `gdisk`가 여전히 많이 사용됩니다.



### parted 사용법

- MBR과 GPT 모두 지원하는 범용 도구
- 스크립팅 가능

```bash
# parted 실행
sudo parted /dev/sdb

# GPT 레이블 설정 (2TB 이상 디스크)
(parted) mklabel gpt

# 파티션 생성 (전체 용량 사용)
(parted) mkpart primary ext4 0% 100%

# 파티션 테이블 확인
(parted) print

# 종료
(parted) quit
```


### gdisk 사용법

- GPT 파티션 전용 도구
- 2TB 이상 디스크 필수
- fdisk와 유사한 인터페이스

```bash
# gdisk 실행
sudo gdisk /dev/sdb

# 대화형 명령어
p  # 파티션 테이블 출력
n  # 새 파티션 생성
d  # 파티션 삭제
w  # 저장 후 종료
q  # 저장하지 않고 종료
```


<br/><br/>

## 파일 시스템


### 파일 시스템 비교

| 파일 시스템 | 특징 | 장점 | 단점 | 권장 용도 |
|-------------|------|------|------|-----------|
| **ext4** | Linux 표준 | 안정적, 호환성 우수, 성숙한 기술 | 대용량 파일 성능 | 일반 서버, OS 루트 파티션 |
| **XFS** | 대용량 최적화 | 대용량 파일 처리 우수, 확장성 | 2TB 이하 비효율적 | DB 서버, 대용량 로그/데이터 (RHEL 기본) |
| **Btrfs** | 차세대 파일 시스템 | 스냅샷, 압축, 데이터 무결성 | 아직 성숙도 낮음 | 백업 시스템, 컨테이너 스토리지 |
| **ext2** | 저널링 없음 | 빠름 | 안정성 낮음 | USB, 임시 저장소 |
| **ext3** | ext2 + 저널링 | 안정성 향상 | ext4보다 성능 낮음 | 구형 시스템 호환 |


### 파일 시스템 포맷

- **mkfs 명령어**
  - MaKe FileSystem의 약자
  - 파티션에 파일 시스템 생성

```bash
# ext4 포맷
sudo mkfs.ext4 /dev/sdb1

# XFS 포맷
sudo mkfs.xfs /dev/sdb1

# ext4 포맷 (옵션 지정)
sudo mkfs -t ext4 /dev/sdb1

# Btrfs 포맷
sudo mkfs.btrfs /dev/sdb1
```

- **포맷 시 주의사항**
  - Extended 파티션은 포맷 불가 (논리 파티션만 포맷)
  - 포맷 시 기존 데이터 모두 삭제
  - 반드시 올바른 장치 확인 후 실행


<br/><br/>

## LVM (Logical Volume Manager)


### LVM 개념

- 물리 디스크를 유연하게 관리하기 위한 추상화 계층
- **운영 환경에서 가장 많이 사용하는 스토리지 관리 방식**
- 온라인 상태에서 용량 확장/축소 가능


### LVM 구조

![mermaid-diagram](/assets/img/linux/2022-10-31-disk-partition-diagram-3.png)


### LVM 주요 구성 요소

- **PV (Physical Volume)**
  - 실제 물리 디스크 파티션
  - LVM에서 사용할 수 있도록 초기화된 파티션
  - 예시: `/dev/sdb1`, `/dev/sdc1`

- **VG (Volume Group)**
  - 여러 PV를 묶은 스토리지 풀
  - 하나의 거대한 가상 디스크처럼 동작
  - 예시: `my_vg`, `data_vg`

- **LV (Logical Volume)**
  - VG에서 할당받은 가상 파티션
  - 사용자가 실제로 포맷하고 마운트하여 사용
  - 크기 조정 가능
  - 예시: `/dev/my_vg/my_lv`


### LVM 구축 및 확장 예시

```bash
# 1. PV 생성 (물리 디스크 초기화)
sudo pvcreate /dev/sdb1

# PV 목록 확인
sudo pvs
sudo pvdisplay

# 2. VG 생성 (스토리지 풀 만들기)
sudo vgcreate my_vg /dev/sdb1

# 추가 디스크를 같은 VG에 추가
sudo vgextend my_vg /dev/sdc1

# VG 상태 확인
sudo vgs
sudo vgdisplay

# 3. LV 생성 (가상 파티션 할당)
sudo lvcreate -L 10G -n my_lv my_vg

# 또는 VG 전체 용량 사용
sudo lvcreate -l 100%FREE -n my_lv my_vg

# LV 목록 확인
sudo lvs
sudo lvdisplay

# 4. 포맷 및 마운트
sudo mkfs.ext4 /dev/my_vg/my_lv
sudo mkdir -p /mnt/data
sudo mount /dev/my_vg/my_lv /mnt/data

# 5. 용량 확장 (온라인 상태에서 가능!)
# Step 1: LV 크기 증가
sudo lvextend -L +5G /dev/my_vg/my_lv

# Step 2: 파일 시스템 크기 조정
# ext4의 경우
sudo resize2fs /dev/my_vg/my_lv

# XFS의 경우
sudo xfs_growfs /mnt/data
```


### LVM 장점

  - 온라인 상태에서 LV 크기 조정 가능
  - 여러 디스크를 하나의 볼륨으로 통합
  - **주의**: **XFS 파일 시스템은 축소(Shrink)가 불가능**합니다. 확장만 가능하므로 용량 계획 시 주의가 필요합니다. (ext4는 축소 가능)

- **스냅샷 기능**
  - 특정 시점의 데이터 상태 저장
  - 백업 및 복구 용이

- **확장성**
  - 나중에 디스크 추가 시 기존 VG에 쉽게 확장
  - 다운타임 최소화


<br/><br/>

## 마운트 (Mount)


### 마운트 개념

- 포맷된 디스크 파티션을 디렉토리 트리에 연결하는 작업
- Linux는 모든 파일 시스템을 단일 트리 구조로 통합
- 마운트 포인트: 파티션이 연결될 디렉토리


### 마운트 프로세스

![mermaid-diagram](/assets/img/linux/2022-10-31-disk-partition-diagram-4.png)

![image](/assets/img/linux/mount-process.png)

### 일회성 마운트

- 재부팅 시 마운트 해제됨
- 임시 테스트용으로 적합

```bash
# 기본 마운트
sudo mount /dev/sdb1 /mnt/data

# 파일 시스템 타입 지정
sudo mount -t ext4 /dev/sdb1 /mnt/data

# 옵션 지정
sudo mount -t ext4 -o rw,noexec /dev/sdb1 /mnt/data

# 마운트 상태 확인
df -h
mount | grep sdb1

# 마운트 해제
sudo umount /mnt/data
# 또는
sudo umount /dev/sdb1
```


### 마운트 옵션

| 옵션 | 설명 | 사용 예시 |
|------|------|-----------|
| **defaults** | `rw`, `suid`, `exec`, `auto`, `nouser`, `async` 모두 적용 | 일반적인 경우 |
| **rw** | 읽기/쓰기 허용 | 데이터 파티션 |
| **ro** | 읽기 전용 | 백업 디스크, 보호 필요 데이터 |
| **noexec** | 실행 파일 실행 금지 | 데이터 전용 파티션 |
| **nosuid** | SetUID/SetGID 비활성화 | 보안 강화 |
| **auto** | 부팅 시 자동 마운트 | 일반 파티션 |
| **noauto** | 부팅 시 자동 마운트 안 함 | 외장 드라이브 |
| **user** | 일반 사용자 마운트 허용 | USB 드라이브 |
| **nouser** | root만 마운트 가능 | 시스템 파티션 |


<br/><br/>

## 자동 마운트 (/etc/fstab)


### /etc/fstab 개요

- 부팅 시 자동으로 마운트할 파일 시스템 정의
- 시스템 재부팅 후에도 마운트 유지
- 오류 시 부팅 실패 가능하므로 신중하게 편집


### UUID 확인

- **장치명 대신 UUID 사용 권장**
  - 장치명(`/dev/sdb1`)은 부팅 순서나 하드웨어 변경 시 바뀔 수 있음
  - UUID는 파티션의 고유 식별자로 변하지 않음

```bash
# UUID 확인
sudo blkid /dev/sdb1

# 출력 예시
/dev/sdb1: UUID="eba229d1-9333-4b9a-9058-1c4b63f869c6" TYPE="ext4"

# 모든 블록 장치 UUID 확인
sudo blkid
```


### /etc/fstab 형식

```
<파일 시스템>  <마운트 포인트>  <타입>  <옵션>  <덤프>  <무결성 검사>
```


### 필드 설명

| 필드 | 설명 | 예시 |
|------|------|------|
| **파일 시스템** | UUID 또는 장치명 | `UUID=eba229d1-9333-4b9a-9058-1c4b63f869c6` |
| **마운트 포인트** | 마운트할 디렉토리 경로 | `/mnt/data` |
| **타입** | 파일 시스템 종류 | `ext4`, `xfs`, `btrfs` |
| **옵션** | 마운트 옵션 (쉼표로 구분) | `defaults`, `rw,noexec` |
| **덤프** | 백업 여부 (0=안함, 1=함) | `0` |
| **무결성 검사** | fsck 검사 순서 (0=안함, 1=최우선, 2=차순위) | `0` |


### /etc/fstab 설정 예시

```bash
# /etc/fstab 편집
sudo vi /etc/fstab

# 기본 예시
UUID=eba229d1-9333-4b9a-9058-1c4b63f869c6 /mnt/data ext4 defaults 0 0

# XFS 파일 시스템
UUID=abcd-1234-efgh-5678 /var/log xfs defaults 0 0

# 읽기 전용 마운트
UUID=1234-5678 /mnt/backup ext4 ro,noexec 0 2

# LVM 볼륨
/dev/mapper/my_vg-my_lv /data ext4 defaults 0 2

# NFS 원격 마운트
192.168.1.100:/share /mnt/nfs nfs defaults 0 0
```


### fstab 테스트 및 적용

```bash
# 1. 편집 후 문법 검사
sudo mount -a

# 오류가 없으면 정상
# 오류가 있으면 즉시 수정 (부팅 실패 방지)

# 2. 현재 마운트 확인
df -h

# 3. 재부팅 후 자동 마운트 테스트
sudo reboot

# 재부팅 후 확인
df -h
```


### fstab 주의사항

- **오타 주의**
  - fstab 오류 시 부팅 실패 가능
  - 복구 모드로 진입하여 수정 필요

- **UUID 사용 권장**
  - 장치명은 변경될 수 있음
  - UUID는 영구 불변

- **백업**
  - 편집 전 백업 필수
  ```bash
  sudo cp /etc/fstab /etc/fstab.backup
  ```

- **테스트**
  - `mount -a`로 반드시 테스트
  - 재부팅 전 오류 확인


<br/><br/>

## 디스크 확장 실습


### 디스크 추가 및 마운트 전체 프로세스

![image](/assets/img/linux/disk-expansion-workflow.png)


### 수동 마운트 (LVM 없이)

```bash
# 1. 디스크 재부팅 없이 인식 (가상 머신 / Hot-plug 환경)
# VMware, KVM 등에서 디스크 추가 후 재부팅 없이 인식시킬 때 사용
# find /sys -name scan
echo "- - -" > /sys/class/scsi_host/host0/scan  # 환경에 따라 host0, host1 등 변경 필요

# 2. 디스크 확인
lsblk
fdisk -l

# 3. 파티션 생성
sudo fdisk /dev/sdb

# fdisk 대화형 명령
p  # 파티션 테이블 출력
n  # 새 파티션 생성
p  # primary 파티션
1  # 파티션 번호 1
   # (Enter - 기본 시작 섹터)
   # (Enter - 기본 종료 섹터, 전체 사용)
p  # 생성 확인
w  # 저장 후 종료

# 4. 파티션 포맷
sudo mkfs.ext4 /dev/sdb1

# 5. 마운트 포인트 생성
sudo mkdir -p /mnt/data

# 6. 마운트
sudo mount /dev/sdb1 /mnt/data

# 7. 확인
df -h
ls -la /mnt/data

# 8. 테스트 파일 생성
sudo touch /mnt/data/test.txt
ls -l /mnt/data

# 9. 마운트 해제 테스트
cd ~  # 마운트 포인트 밖으로 이동
sudo umount /mnt/data
ls -l /mnt/data  # test.txt 안 보임 (마운트 해제됨)

# 10. 다시 마운트
sudo mount /dev/sdb1 /mnt/data
ls -l /mnt/data  # test.txt 다시 보임
```


### 자동 마운트 설정

```bash
# 1. UUID 확인
sudo blkid /dev/sdb1

# 출력 예시
/dev/sdb1: UUID="eba229d1-9333-4b9a-9058-1c4b63f869c6" TYPE="ext4"

# 2. fstab 백업
sudo cp /etc/fstab /etc/fstab.backup

# 3. fstab 편집
sudo vi /etc/fstab

# 4. 추가 내용
UUID=eba229d1-9333-4b9a-9058-1c4b63f869c6 /mnt/data ext4 defaults 0 0

# 5. 테스트 (중요!)
sudo mount -a

# 6. 확인
df -h

# 7. 재부팅 테스트
sudo reboot

# 재부팅 후 자동 마운트 확인
df -h
```


<br/><br/>

## 유용한 디스크 관리 명령어


### 디스크 및 마운트 확인

- **lsblk**
  - 블록 장치를 트리 구조로 표시
  - 가장 보기 편한 명령어
  ```bash
  lsblk
  
  # 파일 시스템 정보 포함
  lsblk -f
  ```

- **df**
  - 마운트된 파일 시스템의 사용량 확인
  ```bash
  df -h           # 사람이 읽기 쉬운 형식
  df -Th          # 파일 시스템 타입 포함
  ```

- **du**
  - 디렉토리 및 파일의 디스크 사용량
  ```bash
  du -sh /var/log      # 디렉토리 전체 크기
  du -h --max-depth=1  # 1단계 하위까지
  ```

- **blkid**
  - 블록 장치의 UUID 및 파일 시스템 타입 확인
  ```bash
  sudo blkid
  sudo blkid /dev/sdb1
  ```


### 마운트 관련

- **mount**
  - 현재 마운트된 파일 시스템 목록
  ```bash
  mount
  mount | grep sdb
  ```

- **umount**
  - 마운트 해제
  ```bash
  sudo umount /mnt/data
  
  # 강제 해제 (주의!)
  sudo umount -f /mnt/data
  
  # lazy 해제 (사용 중이어도 나중에 해제)
  sudo umount -l /mnt/data
  ```

- **fuser**
  - 파일 시스템을 사용 중인 프로세스 확인
  ```bash
  fuser /mnt/data
  
  # 프로세스 및 사용자 정보 표시
  fuser -uv /mnt/data
  
  # 모든 프로세스 종료 (위험!)
  fuser -mk /mnt/data
  ```


<br/><br/>

## fsck 오류 코드


### fsck (File System ChecK)

- 파일 시스템 무결성 검사 및 복구 도구
- 마운트되지 않은 파일 시스템에서만 실행
- **lost+found 디렉토리**: `fsck` 실행 중 발견된, 연결이 끊어진(결함 있는) 파일 조각들이 저장되는 곳


### 오류 코드

| 코드 | 타입 | 설명 | 조치 |
|:--:|:--:|:--:|:--:|
| **0** | Clean | 오류 없음 | 정상 |
| **1** | Fix | 파일 시스템 오류가 수정됨 | 재부팅 권장 |
| **2** | Reboot | 리부팅 필요 | 즉시 재부팅 |
| **4** | Save | 오류가 수정되지 않고 남음 | 수동 복구 필요 |
| **8** | Exe Error | 실행 오류 | 명령어 확인 |
| **16** | Use Error | 사용법 또는 문법 오류 | 옵션 확인 |
| **128** | Lib Error | 공유 라이브러리 오류 | 시스템 점검 필요 |


<br/><br/>

## 디스크 관리 권장 사항


### 디스크 추가 체크리스트

- **계획 단계**
  - 용량 요구사항 확인
  - 향후 확장 가능성 고려
  - LVM 사용 여부 결정
    - 확장 가능성 있으면 LVM 권장

- **파티셔닝**
  - 2TB 초과 시 GPT 파티션 사용 (parted 또는 gdisk)
  - 2TB 이하면 MBR도 가능 (fdisk)

- **파일 시스템 선택**
  - 일반 용도
    - ext4 권장
  - 대용량 데이터
    - XFS 권장
  - 백업 및 스냅샷 필요
    - Btrfs 고려

- **마운트 설정**
  - /etc/fstab에 UUID 사용 필수
  - `mount -a`로 반드시 테스트
  - 백업 필수

- **보안**
  - 데이터 파티션에 `noexec`, `nosuid` 옵션 고려
  - 민감한 데이터는 별도 파티션 분리



### 용량 확장 시나리오

- **LVM 사용 시 (권장)**
  - 새 디스크 추가
  - PV 생성
  - VG에 추가
  - LV 확장
  - 파일 시스템 확장
  - 온라인 작업 가능 (다운타임 없음)

- **LVM 미사용 시**
  - 새 디스크 추가
  - 파티션 생성 및 포맷
  - 새 마운트 포인트로 마운트
  - 데이터 마이그레이션 필요
  - 다운타임 발생



### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| **부팅 실패 (fstab 오류)** | /etc/fstab 오타 또는 장치 없음 | 복구 모드 진입 후 fstab 수정 |
| **umount 실패 (busy)** | 프로세스가 파일 시스템 사용 중 | `fuser -mk` 또는 프로세스 종료 후 재시도 |
| **UUID 변경됨** | 파티션 재생성 또는 포맷 | blkid로 새 UUID 확인 후 fstab 업데이트 |
| **LV 확장 안 됨** | VG에 여유 공간 부족 | 새 PV 추가 후 VG 확장 |
| **파일 시스템 손상** | 비정상 종료, 하드웨어 오류 | `fsck`로 복구 시도 |


<br/><br/>

## 요약 및 핵심 포인트


### 빠른 참조 가이드

| 작업 | 명령어 | 비고 |
|------|--------|------|
| **디스크 확인** | `lsblk`, `fdisk -l` | lsblk가 가장 보기 편함 |
| **파티션 생성** | `fdisk` (MBR), `gdisk` (GPT), `parted` (범용) | 2TB 초과 시 GPT 필수 |
| **포맷** | `mkfs.ext4 /dev/sdb1` | XFS는 `mkfs.xfs` |
| **UUID 확인** | `blkid` | fstab에 UUID 사용 권장 |
| **마운트** | `mount /dev/sdb1 /mnt/data` | 일회성 마운트 |
| **자동 마운트** | `/etc/fstab` 편집 | `mount -a`로 테스트 필수 |
| **LVM PV 생성** | `pvcreate /dev/sdb1` | LVM 첫 단계 |
| **LVM VG 생성** | `vgcreate my_vg /dev/sdb1` | 스토리지 풀 |
| **LVM LV 생성** | `lvcreate -L 10G -n my_lv my_vg` | 가상 파티션 |
| **LV 확장** | `lvextend -L +5G /dev/my_vg/my_lv` | 온라인 확장 가능 |
| **파일 시스템 확장** | `resize2fs` (ext4), `xfs_growfs` (XFS) | LV 확장 후 실행 |


### 핵심 기억 사항

- **디스크 장치 이름**
  - SATA/SCSI: `/dev/sda`
  - NVMe: `/dev/nvme0n1`
  - 파티션: `sda1`, `nvme0n1p1`

- **파티셔닝**
  - 2TB 넘으면 GPT 파티션 (parted, gdisk)
  - MBR은 Primary 최대 3개 + Extended 1개

- **파일 시스템**
  - 일반 용도: ext4
  - 대용량: XFS
  - 스냅샷 필요: Btrfs

- **LVM 필수**
  - 나중에 확장 가능성 있으면 무조건 LVM
  - 온라인 확장 가능
  - 유연한 용량 관리

- **자동 마운트**
  - /etc/fstab에 UUID 사용
  - `mount -a`로 테스트 필수
  - 오타 시 부팅 실패


<br/><br/>

## Reference
- [Red Hat LVM 가이드](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/8/html-single/configuring_and_managing_logical_volumes/index)
- [DigitalOcean LVM 튜토리얼](https://www.digitalocean.com/community/tutorials/an-introduction-to-lvm-concepts-terminology-and-operations)
- [Linux Filesystem Comparison](https://www.networkworld.com/article/3631604/linux-filesystems-ext4-btrfs-xfs-zfs-and-more.html)
- [fstab 가이드](https://www.baeldung.com/linux/network-drive-etc-fstab)
- [fdisk vs parted 비교](https://www.baeldung.com/linux/fdisk-vs-parted)