---
title: "Git Push 실패: RPC failed HTTP 400 에러 해결하기"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-19 14:03:00 +0900
category:
  - [Version Control, Git]
tags: [git, vscode, troubleshooting]
math: false
mermaid: false
---

## 문제 상황

- VSCode에서 Git 커밋 후 "Sync Changes" 버튼을 클릭했을 때 다음과 같은 에러가 발생하였음

    ```bash
    Git: RPC failed; HTTP 400 curl 22 The requested URL returned error: 400
    ```

<br/><br/>

## 에러 원인

### HTTP Buffer 크기 제한 초과

- Git의 기본 HTTP buffer 크기가 작아서 큰 데이터를 푸시할 때 실패함
- 이미지나 바이너리 파일이 포함된 경우 더 자주 발생함
- GitHub의 요청 크기 제한에 걸리는 경우가 있음

### HTTP POST Buffer란?

- Git이 HTTP/HTTPS 프로토콜로 데이터를 전송할 때 사용하는 메모리 버퍼임
- 푸시할 데이터를 이 버퍼에 임시로 저장한 후 서버로 전송함
- 기본값은 1MB (1048576 bytes)로 설정되어 있음
- 전송하려는 데이터가 버퍼 크기를 초과하면 HTTP 400 에러가 발생함


### 일반적인 발생 시나리오

- 대용량 파일을 커밋했을 때
- 이미지 파일을 다수 추가했을 때
- 여러 변경사항을 한 번에 푸시할 때

<br/><br/>

## 해결 방법

### HTTP Buffer 크기 증가

- Git의 HTTP POST buffer 크기를 증가시켜 문제를 해결할 수 있음

    ```bash
    git config --global http.postBuffer 524288000
    ```

    - `524288000`은 약 500MB를 의미함
    - `--global` 옵션으로 전역 설정함
    - 이후 모든 Git 저장소에 적용됨

<br/><br/>

### 큰 파일 확인 (선택사항)

- 어떤 파일이 큰지 확인하고 싶다면 다음 명령어를 사용함

    ```bash
    git ls-files -s | sort -k4 -n -r | head -20
    ```

<br/><br/>

### 푸시 재시도

- 설정 변경 후 다시 푸시를 시도함

    ```bash
    git push origin master
    ```

- 정상적으로 푸시가 완료됨

    ```bash
    To https://github.com/username/repository.git
    287662a..641bc20  master -> master
    ```

<br/><br/>

## 대안 방법

### SSH 프로토콜 사용

- 위 방법으로 해결되지 않는다면 HTTPS 대신 SSH를 사용함

    ```bash
    git remote set-url origin git@github.com:username/repository.git
    ```

### 작은 단위로 나눠서 푸시

- 특정 커밋만 푸시하여 크기를 줄임

    ```bash
    git push origin <commit-hash>:master
    ```

### Git LFS 사용

- 큰 파일을 자주 다룬다면 Git Large File Storage(LFS) 사용을 고려함

### Git LFS란?

- Git Large File Storage(LFS)는 대용량 파일을 효율적으로 관리하기 위한 Git 확장 기능임
- 큰 파일의 실제 내용은 별도 서버에 저장하고, Git 저장소에는 포인터(참조)만 저장함
- 이미지, 비디오, 데이터셋 등 큰 바이너리 파일을 다룰 때 유용함
- HTTP buffer 문제를 근본적으로 해결하고 저장소 크기도 줄일 수 있음

    ```bash
    # Git LFS 설치 및 설정
    git lfs install
    git lfs track "*.png"
    git lfs track "*.jpg"
    ```

<br/><br/>

## 정리

- 원인
  - HTTP buffer 크기 제한 초과로 인한 푸시 실패
- 해결
  - `git config --global http.postBuffer 524288000` 설정으로 buffer 크기 증가
- 예방
  - 큰 파일은 Git LFS 사용 고려
  - 이 설정은 한 번만 해주면 이후 동일한 문제가 발생하지 않음

<br/><br/>

## Reference

- [Git Documentation - http.postBuffer](https://git-scm.com/docs/git-config#Documentation/git-config.txt-httppostBuffer)