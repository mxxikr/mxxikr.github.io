---
title:  "disk와 partition"
author:
  name: mxxikr
  link: https://github.com/mxxikr"
date: 2022-10-31 22:55:00 +0900
category:
  - [OS, Linux]
tags:
  - [linux, disk, partition, fidisk, mkfs, mount]
math: true
mermaid: true
---
# 디스크 구조와 타입
---
### **디스크 구조**
* **하드 디스크 구조**  
![image](/assets/img/linux/disk-1.jpg)  
  * `sector`
    * 하드 디스크의 가장 작은 흐름 단위
  * `boot sector`
    * 가장 최초의 섹터(파티션마다 부트섹터가 있음)
  * `MBR (Master Boot Sector)`
    * 가장 최초의 부트 섹터           
  * `cylinder`
    * 하드 디스크 용량 결정 (용량 단위)

### **Disk Type**
* **IDE** 
  * 가장 오래된 규격
  * 40개의 핀으로 구성된 직사각형 포트
  * 데이터를 병렬로 전송(병렬 하드)
  * 컴퓨터와 디스크 구동 장치 간의 표준 인터페이스
  * CPU에서 직접 하드 관리
  * 부팅 중 장착 불가
  * 장치명 : `/dec/hda`, `/dec/hdb`, `/dec/hdc` 등

* **SATA**(Serial Advanced Technologly Attachment)
  * 최근에 나온 interface로 하드 디스크 드라이브의 속도와 연결 방식을 개선하기 위해 개발
  * 직렬 방식 interface(직렬 하드)
  * IDE 확장 버전
  * 장치명 : `/dec/sda`, `/dec/sdb`, `/dec/sdc` 등

* **SCSI**(Small Computer System Interface) 
  * 서버나 워크스테이션 등에 쓰이는 고속 인터페이스
  * 안정성이 높지만 가격이 비쌈
  * 별도의 확장 카드를 사용해야 함
  * 컴퓨터와 주변 장치들을 연결하는 인터페이스 규격
  * 하드 디스크 컨트롤러
  * 액세스 속도는 높으나 데이터 저장공간이 많지않음 (디스크 플래터 1장)
  * 초기 병렬 방식 → 직렬 방식 interface (직렬 하드)
  * 내부 SCISI chip에서 직접 하드 관리
  * 부팅 중 장착 가능
  * 장치명 : `/dec/sda`, `/dec/sdb`, `/dec/sdc` 등

* **SAS**(Serial Attached SCSI) 
  * SCSI 규격을 한단계 발전 시킨 disk 
  * 서버 등 대형 컴퓨터에 주로 사용 (서버 계의 SSD)
  * SATA 하드 디스크를 SAS 장치에 연결 가능, SAS 하드 디스크를 SATA interface에 연결 불가 
  * 직렬 방식 interface (직렬 하드)
  * 장치명 : `/dec/sda`, `/dec/sdb`, `/dec/sdc` 등

* **SSD**(Solid State Drive)
  * 하드 디스크 드라이브와 비슷하게 동작하면서도 반도체를 이용하여 정보를 저장
  * 고속으로 데이터 입출력 가능
  * 기계적 지연이나 실패율 적음
  * 장치명 : `/dec/sda`, `/dec/sdb`, `/dec/sdc`,등

### **Windows와 Linux의 하드 디스크 구조**      

|분류|Windows|Linux|
|:--:|:--:|:--:|
|**하드 이름**|disk|`/dev/sda,b,c,d,e` 등|
|**파티션명**|`C:`, `D:`, drive|`/dev/sdx1,2,3,4,5` 등, 1 ~ 4 physical 영역, 5 ~ logical 영역|
|**파티션 도구**|disk part, partition magic, fdisk (98이후 X)|fdisk, parted(2TB이상 하드)|
|**포맷**|windows 탐색기|mkfs(MaKe File System)|
|**FileSystem**|FAT시리즈, NTFS, REFS|UFS, EXT 시리즈|    

<br/><br/>

# 파티션 구조
---
### **파티션 (partition)**  
* 하드 디스크를 논리적으로 나눈 구역  
* 하나의 디스크를 여러개의 파티션으로 나누면 각 파티션마다 하나의 드라이브로 인식  
* 하나의 하드 디스크에는 <span style="color:#F26C6C">**최대 3개의 primary**와 **1개의 extended 파티션** 생성 가능</span>   
  ![image](/assets/img/linux/disk-2.jpg)    
      * **<span style="color:#F26C6C">primary 파티션 1</span>**, extended 파티션 0 (logical 파티션 0)
      * **<span style="color:#F26C6C">primary 파티션 2</span>**, extended 파티션 0 (logical 파티션 0)
      * **<span style="color:#F26C6C">primary 파티션 3</span>**, extended 파티션 0 (logical 파티션 0)
      * **<span style="color:#F26C6C">primary 파티션 3</span>**, **<span style="color:#F26C6C">extended 파티션 1</span>** (<span style="color:#F26C6C">**logical 파티션 2**</span>)
      * **<span style="color:#F26C6C">primary 파티션 3</span>**, **<span style="color:#F26C6C">extended 파티션 1</span>** (<span style="color:#F26C6C">**logical 파티션 5**</span>)      

### **primary 파티션**
* 기본 파티션
* 주파티션
* 부팅 파티션 사용
* **최대 3개**  

### **extended 파티션**
* 확장 파티션
* 여러 개의 논리(logical) 드라이브로 나뉨
* 논리 영역 공간
* 부팅 하드 X
* **최대 1개**

<br/><br/>

# Linux Disk와 Filesystem
---
### **File System**
* 파일 다루거나 조작 할 때 관리하기 편하게 파일이 운용되는 방식(틀) 
* `ufs`
  * 유닉스 파일 시스템
* `ext2`
  * 속도 UP
* `ext3`
  * 속도 UP
  * 저널링 기능
  * 안정성 UP
* `ext4`
  * 속도 UP
  * 저널링 기능 대폭 향상
  * 안정성 UP
  * 가장 효율적
* `xfs`
  * 2TB 이하에서는 비효율 (대용량 파일 시스템)

### **Linux Disk 관련 명령어**
* `fdisk` (**f**ixed **disk**)
  * **<span style="color:#F26C6C">하드 디스크 분할, 파일 시스템 지정, 새 하드 디스크 포맷이 가능한 상태</span>**로 만드는 프로그램
  * **<span style="color:#F26C6C">linux의 disk 파티션을 생성, 수정, 삭제</span>** 할 수 있는 유틸리티
  * 주로 파티션 나눌 때 사용하는 명령어 
  * `/dev/하드 장치명`
    * 하드 파티션 구성하기
  * `-a`
    * 부트 가능한 flag로 변경
  * `-b`
    * bsd 디스크 레이블을 편집
  * `-c`
    * DOS 호환 flag로 변경
  * `-d`
    * 파티션 삭제
  * `-l`
    * 하드 디스크 전체 list 보기
  * `-m`
    * 메뉴얼
    * `--help`와 동일
  * `-n`
    * 파티션 생성
  * `-p`
    * 파티션 상태 보기
    * 파티션 테이블 출력
  * `-q`
    * 파티션 변경 저장하지 않고 종료
  * `-w`
    * 파티션 저장 후 종료
    * 디스크에 테이블을 기록하고 나가기
  * `-t`
    * 파티션의 시스템 ID를 변경
    * 파티션 속성 변경
* `mkfs` (**M**a**K**e **F**ile**S**ystem)
  ```bash
  mkfs -t {파일 시스템 형식} {디바이스 명}  
  ```
  ```bash
  mkfs.{파일 시스템 형식} {디바이스 명}
  ```
    * **<span style="color:#F26C6C">파티션 작업을 한 하드 디스크 포맷</span>**할 때 사용 
    * extended 파티션은 포맷 불가능
    * `-t`
      * 파일 시스템의 형식을 지정(`ext2`, `ext3`, `ext4` 등)
* `mount`
  ```bash
  mount -t {파일 시스템 형식} -o {옵션} {디바이스 명} {mount point}
  ```
    * **<span style="color:#F26C6C">Directory에 파티션을 나누고 포맷 통해 드라이브 연결</span>**하는 개념
    * Linux는 디스크를 파티션으로 나누고 포맷 한 후에 mount 해야 함
    * **<span style="color:#F26C6C">포맷이 완료된 파티션 및 장치를 사용자가 읽고 쓸 수 있도록 디렉토리에 연결하는 것</span>** (장치 연결)
    * mount point로 할 directory 생성해야 함
    * mount point 외의 장소에서 mount 해야 함
    * `-t`
      * 파일 시스템의 형식을 지정(`ext2`, `ext3`, `ext4` 등)
    * `-o`
      * 옵션 (`rw`, `suid`, `exec`, `auto`, `nouser`, `async` 등)
* `umount`
  ```bash
  umount {장치명}
  umount {mount point}
  ```
    * **<span style="color:#F26C6C">마운트 해제</span>** 명령어
    * mount point 외의 장소에서 umount 해야함
* `fuser`
  ```bash
  fuser {mount point}
  ```
    * **<span style="color:#F26C6C">directory 내 process 확인</span>**
    * 특정 파일이나 directory를 사용하는 process 정보나 사용자 정보 확인 가능
      * `-u`
        * process와 사용자 정보 출력
      * `-v`
        * process와 사용자의 상세 정보 출력
      * `-k`
        * process를 모두 종료
      * `-mk`
        * 디렉토리 내 프로세스 모두 종료 (긴급)
* `df`
  * **<span style="color:#F26C6C">하드 디스크 여유 공간 확인</span>** 명령어
  * `-h`
    * **<span style="color:#F26C6C">mount 확인</span>**
  * `-Th`
    * **<span style="color:#F26C6C">file system 정보와 mount 확인</span>**
* `du`
  * **<span style="color:#F26C6C">하드 디스크 사용 공간 확인</span>** 명령어
* `blkid`
  * **<span style="color:#F26C6C">포맷한 파일 시스템 확인</span>** 명령어

### **​fsck 에러 코드**  

|Error Code|Error Type|Description|
|:--:|:--:|:--:|
|<span style="color:#F26C6C">**0**</span>|clean|에러 X|
|<span style="color:#F26C6C">**1**</span>|fix|파일 시스템 에러 고쳐짐|
|<span style="color:#F26C6C">**2**</span>|reboot|리부팅 필요|
|<span style="color:#F26C6C">**4**</span>|save|파일 시스템 에러 고치지 않고 그대로 둠|
|<span style="color:#F26C6C">**8**</span>|exe error|실행 에러|
|<span style="color:#F26C6C">**16**</span>|use error|사용법 또는 문법 에러|
|<span style="color:#F26C6C">**128**</span>|lib error|공유 라이브러리 에러|  

<br/><br/>

# Linux Mount
---
### **Linux Disk 수동 Mount**
* **<span style="color:#F26C6C">하드 디스크 추가 → 파티션 생성 → 포맷 → mount</span>**   

1. 하드 디스크 재부팅 없이 인식
  ```bash
  find /sys -name scan  # 가장 마지막 host 내용 드래그
  echo "- - -" > /sys/device/~~  # 마지막 host 내용 붙이기
  ```
2. 새 디스크 장착
  * VMware Virtual Machine Settings → Hardware → HDD 추가
3. 디스크에 파티션 나누기
  ```bash
  fdisk -l  # 추가한 HDD list 확인
  fdisk /dev/sdb  # 추가한 /dev/sdb를 fdisk 명령어를 이용하여 실행
    p  # 파티션 테이블 출력(현재 파티션 정보 확인)
    n  # 새로운 파티션 추가
    p  # primary 파티션 생성
    1  # 파티션 넘버 1 선택
    # Enter
    # Enter
    p  # 파티션 생성 확인
    w  # 파티션 정보 저장
  ```
4. 파티션에 파일 시스템 생성 (포맷)
  ```bash
  blkid  # 파일 시스템 타입 구성 확인 (sdb1 fs 확인)
  mkfs.ext4 /dev/sdb1  # /dev/sdb1 파티션을 포맷 
  done  # 저널공간 생성 확인
  ```
5. 디스크 마운트 및 마운트 해제
  ```bash
  df -h  # mount 정보 출력, sdb1은 mount 되지않은 상태 확인 
  mkdir /mount  # mount point로 지정할 directory 생성
  cd /mount  # mp directory로 이동
  pwd  # 현재 위치 확인
  ls -l                                   
  mount -t ext4 /dev/sdb1 /mount  # ext 4 파일 시스템 형식으로 /dev/sdb1을 /mount 디렉토리에 mount (mount할때는 mp밖에서)
  df -h  # mount 정보 출력 (/dev/sdb1이 /mount에 마운트된 것 확인)
  touch 1.txt  # 1.txt 파일 생성
  ls -l  # mount 후에 1.txt 존재하는 것 확인
  umount /mount  # 마운트 해제 (umount할 때는 mp밖에서)
  df -Th  # mount 정보 출력 (-T : filesystem type 출력)
  ls -l  # umount 후에는 1.txt 존재하지 않는 것 확인                                 
  ```
    * lost+found 디렉토리  
      * mount 되는 파일 시스템에 존재하는 fsck 등에 의해서 발견된 결함이 있는 파일에 대한 정보가 보관되는 디렉토리

### **Linux Disk 자동 Mount**
* **<span style="color:#F26C6C">컴퓨터 재부팅 시 mount 했던 설정들은 초기화 됨</span>**   

1. 파일 시스템 타입 구성 확인
  ```bash
  blkid    # 파일 시스템 타입 구성 확인 
  ```
  * 영구 mount할 디바이스 UUID 드래그  
    <span style="color:rgb(203, 171, 237)">ex) `/dev/sdb1: UUID="eba229d1-9333-4b9a-9058-1c4b63f869c6" TYPE="ext4"`</span>
2. /etc/fstab 파일 수정
  ```bash
  vi /etc/fstab    # 리눅스 부팅시 mount(자동 mount) 정보 들어있는 파일
  # UUID=파일 시스템 장치명  mout point   filesystem type  mount option  로그 기록 여부  오류체크
  ```  
  * `/etc/fstab`
    * mount 설정을 영구적으로 할 수 있도록 존재하는 설정 파일
    * 리눅스 부팅 시 mount (자동 mount) 정보 들어있는 파일   
    * `UUID=파일 시스템 장치명  mount point   filesystem type  mount option  로그 기록 여부  오류체크`    
    <span style="color:rgb(203, 171, 237)">ex) `UUID=eba229d1-9333-4b9a-9058-1c4b63f869c6 /mount ext4 defaults 0 0`</span>
    * `파일 시스템 장치명`(File System Device Name)
      * 파티션들의 위치
      * `fdisk -l` 쳤을때 나오는 주소
    * `mount point`
      * 등록할 파티션을 어디에 위치한 디렉토리에 연결할 것인지 설정하는 필드
      * 마운트할 디렉토리 경로
    * `filesystem type`
      * 파일 다루거나 조작 할 때 관리하기 편하게 파일이 운용되는 방식(틀) 
      * `ext` 
        * 초기 리눅스에서 사용했던 종류, 현재 사용 X
      * `ext2`   
        * 긴 파일 시스템 이름을 지원
      * `ext3`   
        * 저널링 파일 시스템
      * `ext4`   
        * 더 큰 용량을 지원, 파일 복구, 파일 시스템 점검속도가 빨라짐
      * `ufs` 
        * Unix File System에서 표준 파일 시스템으로 사용
      * `nfs` 
        * Network File System, 원격 서버에서 파일 시스템 마운트할 때 사용하는 시스템
      * `swap`  
        * 스왚 파일 시스템, 스왚 공간으로 사용되는 파일 시스템
      * `vfat` 
        * window 95/98등등 ntfs를 지원하기 위한 파일 시스템
      * `ramdisk`
        * RAM을 지원하기 위한 파일 시스템에 사용
    * `mount option`
      * 파일 시스템에 맞게 사용되는 옵션을 설정하는 필드
      * `default`
        * `rw`, `nouser`, `auto`, `exec`, `suid` 속성을 모두 설정
      * `auto`
        * 부팅시 자동 mount
      * `noauto`
        * 부팅시 자동 mount 하지 않음
      * `exec`
        * 실행파일이 실행되는 것을 허용
      * `noexec`
        * 실행 파일이 실행되는 것을 허용하지 않음
      * `suid` 
        * SetUID, SetGID 사용을 허용
      * `nosuid` 
        * SetUID, SetGID 사용을 허용하지 않음
      * `ro`     
        * 읽기 전용의 파일 시스템으로 설정
      * `rw`    
        * 읽기/쓰기 전용의 파일 시스템으로 설정
      * `user` 
        * 일반 사용자 mount 가능
      * `nouser` 
        * 일반 사용자 mount 불가능, 관리자만 가능
      * `quota`   
        * Quota 설정이 가능
      * `noquota`
        * Quota 설정이 불가능
    * `로그 기록 여부`
      * 로그 (Dump) 기록 여부를 설정하는 필드
        * `0` : 기록 X
        * `1` : 기록 O
    * `오류 체크` (FSCK)
      * File Sequence Check Option에 의한 무결성 검사 우선 순위를 정하는 옵션
        * `0` : 무결성 검사 체크 X
        * `1` : 우선순위 1위부터 체크
        * `2` : 차순 체크
