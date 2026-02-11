---
title: '[주니어 백엔드 개발자가 반드시 알아야 할 실무 지식] 8장 실무에서 꼭 필요한 보안 지식'
author: { name: mxxikr, link: 'https://github.com/mxxikr' }
date: 2026-01-16 10:45:00 +0900
category: [Book, Backend]
tags: [backend, security, authentication, authorization, encryption, hmac, firewall, audit-log, secure-coding, book-review]
math: false
mermaid: false
---

- **💡해당 게시글은 최범균님의 '주니어 백엔드 개발자가 반드시 알아야 할 실무 지식'을 개인 공부목적으로 메모하였습니다.**

<br/><br/>

## 8장에서 다루는 내용

- 중요한 보안
- 인증과 인가
- 암호화
- HMAC을 이용한 데이터 검증
- 방화벽으로 트래픽 제한
- 감사 로그(Audit Log) 남기기
- 데이터 노출 줄이기
- 비정상 접근 처리
- 시큐어 코딩
- 개인 보안

<br/><br/>

## 중요한 보안

### 보안 취약점의 공통 패턴

- 인증(Authentication)과 인가(Authorization)의 혼동
- 클라이언트에서 전달받은 값을 맹목적으로 신뢰
- 서버 측에서 적절한 권한 검증 로직 누락


<br/><br/>

## 인증과 인가

### 개념

- 서버 개발에서 가장 기본적인 보안은 인증과 인가임
- 인증(Authentication)
  - 사용자가 누구인지 확인하는 과정
- 인가(Authorization)
  - 사용자에게 자원에 접근할 수 있는 권한을 부여하는 것

![인증과 인가 프로세스](/assets/img/books/backend-basics-ch8/authentication-authorization.png)

### 로그인과 2단계 인증

- 아이디와 암호를 입력하는 로그인은 인증의 한 형태임
- 보안을 강화하기 위해 2단계 인증(Two-Factor Authentication)을 사용하기도 함
  - SMS 인증 코드
  - 이메일 인증 링크
  - OTP(One-Time Password) 앱
  - 생체 인증(지문, 안면 인식)

### 토큰 기반 인증
- 인증 성공 시
  - 서버는 클라이언트에게 토큰 발급
  - 클라이언트는 매 요청마다 토큰 전송
  - 서버는 토큰을 이용해 사용자 식별

![토큰 기반 인증](/assets/img/books/backend-basics-ch8/token-authentication.png)

### 토큰 저장 방식 (Stateful)

- **서버 저장소 활용 (DB/Redis)**
  - 동작 방식
    - 서버는 발급한 토큰과 사용자 매핑 정보를 DB/Redis에 저장
    - 클라이언트 요청 시 저장소를 조회하여 유효성 검증
  - 장점
    - 토큰 제어(무효화, 블랙리스트 등)가 용이함
  - 단점
    - 별도 저장소 운영 비용 발생
    - 트래픽 증가 시 저장소 부하 발생 가능

- **서버 메모리 (세션)**
  - 동작 방식
    - 톰캣 등 서블릿 컨테이너의 메모리(HttpSession)에 저장
  - 단점
    - 서버 재시작 시 데이터 소실
    - 메모리 크기 제한으로 인한 동시 접속자 수 제한
    - 멀티 서버 환경에서 **고정 세션(Sticky Session)** 설정 필요
  - 해결책
    - Spring Session 등을 이용해 세션 저장소를 외부(Redis 등)로 분리

### 토큰 자체에 정보 저장 (Stateless - JWT)

- 토큰 자체에 사용자 식별 정보와 유효성 검증 데이터를 포함함 (JWT)
- **동작 과정**
  1. 서버는 비밀 키로 서명한 토큰 생성 후 발급
  2. 클라이언트는 매 요청 시 헤더/쿠키로 토큰 전송
  3. 서버는 비밀 키로 서명 검증 및 파싱하여 사용자 식별

  ```java
  // JWT 파싱 및 검증
  try {
      Jws<Claims> jwt = Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
      String userId = jwt.getPayload().getSubject();
  } catch (JwtException e) {
      throw new AuthenticationException(e);
  }
  ```

- **장점**
  - 별도 저장소 조회 불필요 (Stateless)
  - 서버 확장성(Scale-out) 유리
- **단점**
  - 토큰 크기가 커질수록 네트워크 트래픽 증가
  - 이미 발급된 토큰의 강제 만료(제어)가 어려움

### 토큰 보안 고려사항

- **전송 방식**
  - Authorization 헤더 사용 (앱/API)
  - 쿠키 사용 (웹 사이트)
- **유효 시간 제한**
  - 탈취 피해 최소화
  - Access Token의 유효 시간을 짧게 설정
- **리프레시 토큰 (Refresh Token)**
  - 보안(짧은 만료)과 편의성(자동 갱신)을 동시에 만족
  - Access Token 만료 시 Refresh Token으로 재발급
- **보안 강화**
  - 토큰 생성 IP와 사용 IP 불일치 시 차단
  - 로그아웃된 토큰 등을 DB/Redis에 저장하여 접근 차단 (Stateless의 단점 보완)
### 인가와 접근 제어 모델

- **접근 제어의 기본**
  - 접근한 사용자를 토큰이나 세션으로 식별해야 함
  - API 요청 파라미터로 사용자 식별자를 받으면 보안에 취약함 (파라미터 변조 가능)

  ```java
  @GetMapping("/myinfo")
  public ResponseEntity<?> getMyInfo(@RequestHeader("token") String token) {
      String userId = getUserIdByToken(token); // 토큰에서 추출
  }
  ```

### 역할 기반 접근 제어 (RBAC)

- 사용자에게 역할(Role)을 부여하고, 역할에 권한(Permission)을 할당하는 방식
- **장점**
  - 권한 관리가 체계적이고 용이함 (역할만 변경하면 됨)
- **주의점**
  - 역할의 무분별한 생성 주의 (관리 복잡도 증가)

![RBAC 구조](/assets/img/books/backend-basics-ch8/rbac-structure.png)

### 사용자 기반 접근 제어 (User-Based Access Control)

- 역할 없이 사용자에게 개별적으로 권한을 직접 부여
- **특징**
  - 구현이 단순함
  - 시스템 규모가 작거나 역할 구분이 모호할 때 적합

### 속성 기반 접근 제어 (ABAC)

- 사용자의 속성(IP, 위치, 부서, 시간 등)을 기반으로 접근 제어
- **특징**
  - 매우 정교한 제어 가능
  - 구현 및 규칙 정의가 복잡함

<br/><br/>

## 암호화

- 암호화는 데이터를 특정한 규칙으로 변환하여 원본 유추를 어렵게 만드는 것
- 유출되면 가장 큰 피해로 이어질 수 있는 데이터 중 하나가 로그인 비밀번호임

![암호화 개념](/assets/img/books/backend-basics-ch8/encryption-concept.png)

### 단방향 암호화

- 암호화한 데이터를 복호화할 수 없는 암호화 방식
- 해시 함수를 사용해서 데이터를 해시 값으로 변환함
- 주요 사용처
  - 로그인 비밀번호 암호화
- 주요 알고리즘
  - SHA-256, SHA-512, MD5, BCrypt

![단방향 암호화](/assets/img/books/backend-basics-ch8/one-way-encryption.png)

- **해시 함수 동작 원리**
  - 원본 데이터가 조금만 달라도 완전히 다른 해시 값을 생성함
  - 바이트 데이터 기반으로 동작하며, 문자열은 바이트 배열로 변환하여 처리함 (UTF-8 등 캐릭터셋 사용)
  - 해시 결과를 저장할 때는 16진수 또는 Base64로 인코딩함

  ```java
  public static String encrypt(String input) {
      try {
          MessageDigest digest = MessageDigest.getInstance("SHA-256");
          byte[] hash = digest.digest(input.getBytes("UTF-8"));
          StringBuilder hexString = new StringBuilder();
          for (byte b : hash) {
              String hex = Integer.toHexString(0xff & b);
              if (hex.length() == 1) hexString.append('0');
              hexString.append(hex);
          }
          return hexString.toString();
      } catch (Exception e) {
          throw new RuntimeException(e);
      }
  }
  ```

- **충돌 저항성**
  - 해시 함수는 원본 데이터에 상관없이 일정한 길이의 해시 값을 생성함
  - 서로 다른 데이터가 동일한 해시 값을 가질 수 있으나, 찾기 어려울수록 충돌 저항성이 높음
  - 해시 길이가 길수록 충돌 가능성이 낮음
    - SHA-256: 256비트(32바이트)
    - SHA-512: 512비트(64바이트) - 충돌 가능성 더 낮음

- **비밀번호 검증**
  - 사용자 입력 비밀번호를 해시화하여 DB에 저장된 해시 값과 비교함

  ```java
  String inputPwdHash = encodePassword(inputPwd);
  String dbPwdHash = selectDbPwd(userId);
  if (inputPwdHash.equals(dbPwdHash)) {
      // 인증 성공
  }
  ```

- **Salt를 이용한 보안 강화**
  - 같은 입력값에 대해 항상 같은 해시가 생성되는 것을 방지함
  - Salt(임의 값)를 추가하여 같은 원본 데이터라도 다른 해시 값을 생성하게 함

  ![Salt 사용](/assets/img/books/backend-basics-ch8/salt-usage.png)

  ```java
  public static String encryptWithSalt(String input, String salt) {
      try {
          MessageDigest digest = MessageDigest.getInstance("SHA-256");
          digest.update(salt.getBytes());
          byte[] hash = digest.digest(input.getBytes("UTF-8"));
          StringBuilder hexString = new StringBuilder();
          for (byte b : hash) {
              String hex = Integer.toHexString(0xff & b);
              if (hex.length() == 1) hexString.append("0");
              hexString.append(hex);
          }
          return hexString.toString();
      } catch (Exception e) {
          throw new RuntimeException(e);
      }
  }
  ```

### 양방향 암호화

- 암호화와 복호화가 모두 가능한 방식
- 키(Key)를 사용하며, 키에 따라 암호화 결과가 달라짐
- 주요 사용처
  - SSH, HTTPS 등 보안이 중요한 데이터 송수신
- 주요 알고리즘
  - 대칭 키
    - AES
  - 비대칭 키
    - RSA

![양방향 암호화](/assets/img/books/backend-basics-ch8/two-way-encryption.png)

- **대칭 키 암호화**
  - 암호화와 복호화에 동일한 키를 사용함
  - 키를 공유해야 하므로 키 유출 시 보안에 취약함

- **비대칭 키 암호화**
  - 암호화와 복호화에 서로 다른 키를 사용함
  - 공개 키(Public Key)
    - 누구에게나 공개 가능, 암호화에 사용
  - 개인 키(Private Key)
    - 소유자만 접근 가능, 복호화에 사용
  - 공개 키로 암호화한 데이터는 개인 키로만 복호화 가능하므로 대칭 키보다 안전함

### AES 대칭 키 암호화

- AES는 키(Key)와 IV(Initialization Vector)를 사용함
- 키는 128/192/256비트(16/24/32바이트) 중 하나를 무작위로 생성함
- IV는 같은 키로 암호화 시 매번 다른 결과를 생성하여 패턴 노출을 방지함 (16바이트)

  ```java
  // 키 생성 (256비트)
  public static byte[] generateSecretKey() throws Exception {
      KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
      keyGenerator.init(256);
      SecretKey secretKey = keyGenerator.generateKey();
      return secretKey.getEncoded();
  }

  // IV 생성
  public static byte[] generateIV() {
      byte[] iv = new byte[16];
      new SecureRandom().nextBytes(iv);
      return iv;
  }

  // 바이트 배열로부터 SecretKey 생성 (저장된 키 재사용)
  SecretKey key = new SecretKeySpec(bytes, "AES");
  ```

- **AES 암호화/복호화**
  - `AES/CBC/PKCS5Padding`
    - 알고리즘/모드/패딩 방식

  ```java
  // 암호화
  public static String encrypt(String plain, SecretKey key, byte[] iv) throws Exception {
      Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
      IvParameterSpec parameterSpec = new IvParameterSpec(iv);
      cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec);
      byte[] encrypted = cipher.doFinal(plain.getBytes("UTF-8"));
      return Base64.getEncoder().encodeToString(encrypted);
  }

  // 복호화
  public static String decrypt(String encrypted, SecretKey key, byte[] iv) throws Exception {
      Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
      IvParameterSpec parameterSpec = new IvParameterSpec(iv);
      cipher.init(Cipher.DECRYPT_MODE, key, parameterSpec);
      byte[] decoded = Base64.getDecoder().decode(encrypted);
      byte[] decrypted = cipher.doFinal(decoded);
      return new String(decrypted, "UTF-8");
  }
  ```

### RSA 비대칭 키 암호화

- 공개 키와 개인 키 쌍을 생성하여 공개 키를 공유함
- 키 크기는 일반적으로 2048비트를 사용함

![비대칭 키 암호화](/assets/img/books/backend-basics-ch8/asymmetric-encryption.png)

```java
// 키 쌍 생성
KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
keyGen.initialize(2048);
KeyPair keyPair = keyGen.generateKeyPair();
PublicKey publicKey = keyPair.getPublic();
PrivateKey privateKey = keyPair.getPrivate();

// 키를 Base64 또는 바이너리 파일로 저장 후 재사용 시 변환
public static KeyPair getKeyPairFromBytes(byte[] publicKeyBytes, byte[] privateKeyBytes) 
    throws NoSuchAlgorithmException, InvalidKeySpecException {
    KeyFactory keyFactory = KeyFactory.getInstance("RSA");
    PublicKey publicKey = keyFactory.generatePublic(new X509EncodedKeySpec(publicKeyBytes));
    PrivateKey privateKey = keyFactory.generatePrivate(new PKCS8EncodedKeySpec(privateKeyBytes));
    return new KeyPair(publicKey, privateKey);
}
```

- **RSA 암호화/복호화**

  ```java
  // 공개키로 암호화
  public static String encrypt(String plain, PublicKey publicKey) {
      Cipher cipher = Cipher.getInstance("RSA");
      cipher.init(Cipher.ENCRYPT_MODE, publicKey);
      byte[] encryptedBytes = cipher.doFinal(plain.getBytes("UTF-8"));
      return Base64.getEncoder().encodeToString(encryptedBytes);
  }

  // 개인키로 복호화
  public static String decrypt(String encrypted, PrivateKey privateKey) {
      Cipher cipher = Cipher.getInstance("RSA");
      cipher.init(Cipher.DECRYPT_MODE, privateKey);
      byte[] decodedBytes = Base64.getDecoder().decode(encrypted);
      byte[] decryptedBytes = cipher.doFinal(decodedBytes);
      return new String(decryptedBytes, "UTF-8");
  }
  ```

  - **개인 키를 이용한 인증**
    - 개인 키로 암호화하고 공개 키로 복호화하는 방식
    - 신원 확인이나 서명 등 인증 목적으로 사용됨 (예: SSH 인증)
    - SSH는 서버에 공개 키를 등록하고 클라이언트가 개인 키로 인증함
      1. 클라이언트가 키 ID 전송
      2. 서버가 공개 키로 임의 숫자 암호화하여 전송
      3. 클라이언트가 개인 키로 복호화
      4. 복호화한 값과 세션 키를 결합한 해시로 인증

<br/><br/>

## HMAC을 이용한 데이터 검증

- HMAC(Hash-based Message Authentication Code)은 메시지의 무결성과 인증을 보장하는 암호화 기술
- API 통신 시 데이터 위변조를 방지하기 위해 사용됨

![HMAC 프로세스](/assets/img/books/backend-basics-ch8/hmac-process.png)

- **동작 방식**
  - 발신자와 수신자는 비밀 키(Secret Key)를 공유함 (외부 노출 금지)
  - 발신자는 메시지와 비밀 키로 MAC(Message Authentication Code)을 생성하여 메시지와 함께 전송함
  - 수신자는 받은 메시지와 비밀 키로 MAC을 재생성한 뒤 발신자가 보낸 MAC과 비교함
  - 두 값이 일치하면 메시지 무결성 보장, 불일치하면 위변조로 판단함

- **주요 용도**
  - 메시지 무결성 검증 (중간 위변조 방지)
  - 발신자 인증 (비밀 키 보유자만 유효한 MAC 생성 가능)

- **구현 예제**

  ```java
  public static class HMAC {
      private String secretKey;

      public HMAC(String secretKey) {
          this.secretKey = secretKey;
      }

      public String hmac(String message) {
          try {
              Mac mac = Mac.getInstance("HmacSHA256");
              SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(), "HmacSHA256");
              mac.init(secretKeySpec);
              byte[] hash = mac.doFinal(message.getBytes("UTF-8"));
              return Base64.getEncoder().encodeToString(hash);
          } catch (Exception e) {
              throw new RuntimeException(e);
          }
      }
  }
  ```

- **장점**
  - 단순하고 효율적임 (비밀 키만 공유하면 구현 가능)
  - 낮은 비용으로 인증 보안 구현 가능
  - 사용하는 해시 알고리즘에 따라 보안성 향상

- **단점**
  - 비밀 키가 유출되면 보안에 취약함
  - 비밀 키 교체가 까다로울 수 있음

<br/><br/>

## 방화벽으로 트래픽 제한

### 방화벽의 필요성

- 서버가 외부에 노출되기 시작하면 포트 스캔부터 다양한 공격이 들어옴
- 가장 기본적인 네트워크 접근 제한은 기본적으로 외부에서 내부로 유입되는 것을 차단하는 것

![방화벽](/assets/img/books/backend-basics-ch8/firewall.png)

### 트래픽 방향 제어

- 방화벽은 네트워크 통신을 두 방향으로 제어함
  - 인바운드 트래픽
    - 외부에서 내부로 유입되는 것
  - 아웃바운드 트래픽
    - 내부에서 외부로 유출되는 것

![인바운드 아웃바운드](/assets/img/books/backend-basics-ch8/inbound-outbound.png)

<br/><br/>

## 감사 로그(Audit Log) 남기기

### 감사 로그란?

- 특정 작업, 절차, 사건 또는 장치에 영향을 주는 활동의 순서를 입증하는 보안 관련 기록

![감사 로그](/assets/img/books/backend-basics-ch8/audit-log.png)

### 대표적인 감사 로그 기록 대상

- 사용자의 로그인/로그아웃 내역
- 암호 초기화 등 설정 변경 내역
- 회사 기밀문서 조회와 같은 중요한 정보 조회 이력
- 계산서의 수정 이력

### 감사 로그와 일반 로그의 차이

- 일반 로그
  - 개발자나 운영자가 문제를 해결하거나 문제 등 파악을 위한 목적
- 감사 로그
  - 컴플라이언스나 정책을 지키기 위한 활동 내역을 기록
  - 위변조 방지가 더 중요하므로 보안성이 높은 곳에 저장해야 함
  - 인증을 통과한 뒤에야 접근할 수 있도록 해야 함
  - 로그 메시지에 대한 변경 권한을 제한할 수 있어야 함

<br/><br/>

## 데이터 노출 줄이기

### 데이터 노출의 위험성

- 서비스 운영자는 백오피스에서 다양한 고객 정보를 조회할 수 있음
- 고객 이름, 휴대폰 번호, 배송 주소 등 고객을 특정할 수 있는 민감 정보가 노출됨

- 주의사항
  - 개인 정보가 많이 표시될수록 고객 정보를 쉽게 취득할 수 있음
  - 페이지당 표시되는 정보의 양이 많을수록 대량 유출 위험이 증가함
    - 목록 화면에서 개인정보가 노출되면 스크린샷 하나로 다수의 정보 취득 가능

![데이터 노출](/assets/img/books/backend-basics-ch8/data-exposure.png)

### 데이터 노출 최소화 전략

1. 고객 데이터를 마스킹하여 표시해야 함
2. API 응답은 원본 데이터가 보이지 않도록 서버에서 마스킹해야 함
3. 프런트 코드에서만 마스킹하면 개발자 도구로 원본 데이터를 알아낼 수 있음

### 고객 정보 조회 제한

- 소수 인원에게만 고객 목록 조회 권한을 부여함
- 권한이 없는 나머지 사용자는 고객의 이메일 또는 휴대폰 번호나 이름을 사용해서 고객 정보를 조회할 수 있게 함
- 자동화를 의심할 수 있는 경우 도구를 사용해서 개인 정보를 수집하는 것을 막을 수 있음
  - 고객 목록 기능을 짧은 시간 동안 빈번하게 실행한 경우
  - 고객 상세 정보를 짧은 시간 간격으로 조회하는 사용자가 있는 경우
  - 비정상 사용으로 인지하고 접근을 차단

<br/><br/>

## 비정상 접근 처리

### 비정상 접근이란?

- 사용자가 평소와 다른 행동 패턴을 보이면 비정상 접근으로 판단하고 사용자에게 해당 내용을 알려주는 시나리오가 있음

- 비정상 접근의 예
  - 평소와 다른 장소에서 로그인함
  - 평소와 다른 기기에서 로그인함
  - 로그인에 여러 차례 실패함

![비정상 접근](/assets/img/books/backend-basics-ch8/abnormal-access.png)

### 비정상 접근 대응 방법

- 계정 관련 확인을 사용자에게만 맡기지 않고 시스템적으로 보안을 강화함
- 이를 통해 사용자는 예상치 못한 계정 탈취 상황에 대처할 수 있게 됨
- 사용자에게 알리는 것을 넘어 계정 사용 중지와 같은 정책을 적용할 수도 있음
  - 일정 횟수 이상 로그인 실패 시 임시적으로 계정을 잠금
  - 이를 통해 Brute Force 공격에 대응함
  - 이메일이나 SMS로 계정 활동 알림 전송

### Brute Force 공격

- 특정한 암호를 풀기 위해 가능한 모든 값을 대입하는 것을 의미함
  - 모든 가능한 조합을 시도하는 방식으로 암호를 찾음
- 대부분의 암호화 방식은 이론적으로 Brute Force 공격에 대해 안전하지 못하며, 충분한 시간이 존재한다면 암호화된 정보를 해독할 수 있음
- 일정 패턴을 탐지하여 만든 사전을 활용해서 공격하는 방식도 있음

<br/><br/>

## 시큐어 코딩

### SQL 인젝션 취약점

```java
// 사용자 입력값을 직접 SQL 쿼리에 결합 - 위험
String id = request.getParameter("id");
String query = "select id, name from member where id = '" + id + "'";
ResultSet rs = stmt.executeQuery(query); // SQL 인젝션 취약점
```

- 이 코드는 사용자가 입력한 값을 이용해서 SQL을 실행함
- 사용자가 입력한 문자열이 `abcd`이면 다음 쿼리로 실행됨

```sql
select id, name from member where id = 'abcd'
```

### 악의적인 입력값

- 문제는 정상적이지 않은 값을 입력하는 사용자도 있다는 데에 있음

```sql
' or 1=1 or id = '
```

- 이 값을 입력하면 실제로 실행되는 쿼리는 다음과 같아짐

```sql
select id, name from member where id = '' or 1=1 or id = ''
```

- 이 코드의 where 절은 각 조건이 or로 연결되어 있고, 중간에 항상 참인 `1=1` 조건이 있음
- 따라서 where 절은 항상 참이 되고, 결과적으로 member 테이블에 있는 모든 id와 name을 조회함

![SQL 인젝션](/assets/img/books/backend-basics-ch8/sql-injection.png)

### Prepared Statement 사용

- Prepared Statement를 사용하면 입력된 특수 문자를 안전하게 방어할 수 있음

```java
// Prepared Statement를 사용한 안전한 방법
String id = request.getParameter("id");
String query = "select id, name from member where id = ? "; // 파라미터 플레이스홀더 사용
PreparedStatement pstmt = connection.prepareStatement(query);
pstmt.setString(1, id); // 파라미터 바인딩 - 자동으로 특수문자 이스케이프
ResultSet rs = pstmt.executeQuery(); // 안전한 쿼리 실행
```

### 시큐어 코딩의 다양한 취약점

- 입력 값 검증
  - 클라이언트가 전송한 값이 올바른지 검증하고 만약 모든 값을 검증하지 않으면 안 됨
- 개인 정보/민감 정보 암호화
  - 로그인 암호뿐만 아니라 주민 번호, 운전 면허, 이름 같은 고유 식별 정보도 암호화해야 함
- 에러 메시지 시스템 정보 노출 방지
  - 에러 메시지에 내부 IP나 DB IP와 같은 시스템 정보가 노출되지 않도록 함
- 보안 통신
  - HTTPS처럼 데이터를 암호화해서 데이터 유출을 방지함
- CORS(Cross Origin Resource Sharing) 설정
  - 허용된 도메인만 서버 자원에 접근할 수 있도록 제한함
- CSRF(Cross-Site Request Forgery) 대응
  - 주요 기능은 타 사이트에서 위조 공격이 들어오는 것을 방지하기 위해 CSRF 토큰, SameSite 쿠키, 검사 등을 사용함

<br/><br/>

## 개인 보안

### 개발자 PC 보안의 중요성

- 개발자는 다양한 서버에 연결할 수 있음
- 권한에 따라 DB에 접속해서 다양한 쿼리도 실행할 수 있음
- 개발자가 접근할 수 있는 시스템이 많은 만큼 개발자 PC가 해킹 당하면 큰 사고로 이어짐

![개발자 PC 보안](/assets/img/books/backend-basics-ch8/developer-security.png)

### 개발자 보안 수칙

- 개발자 PC가 해킹당할 수 있는 주요 경로
  - 출처가 불분명한 파일을 다운받거나 실행하는 경우
  - 의심스러운 이메일의 첨부 파일을 열거나 링크를 클릭하는 경우
  - 신뢰할 수 없는 소프트웨어나 브라우저 확장 프로그램 설치
  - 공개 Wi-Fi에서 중요한 작업 수행

### 보안 사고 사례

- **악성 코드 감염을 통한 정보 유출**

  - 개발자 PC에 악성 코드가 설치되면 DB 접속 정보, API 키 등이 탈취될 수 있음
  - 해커는 탈취한 인증 정보로 시스템에 무단 접근하여 중요 데이터를 유출함
  - 방지 방법
    - 백신 프로그램 최신 유지
    - 의심스러운 파일 실행 금지
    - 접속 정보 암호화 저장

- **랜섬웨어 공격**
  - 랜섬웨어는 시스템의 데이터를 암호화하여 사용 불가 상태로 만들고 복구 대가를 요구함
  - 서버 및 백업 데이터까지 암호화되면 서비스 중단과 막대한 복구 비용 발생
  - 방지 방법
    - 정기적인 백업
    - 백업 데이터 격리
    - 의심스러운 메일 첨부파일 주의

### 물리적 보안

- 물리적 보안 수칙
  - 자리를 비울 때는 반드시 화면을 잠금 (Windows: `Win + L`, macOS: `Cmd + Ctrl + Q`)
  - 중요 사이트에 로그인한 상태에서는 자리를 비우지 않음
  - 불가피하게 자리를 비울 경우 세션 로그아웃 처리
- 화면 엿보기 방지
  - 개인정보나 중요 코드 작업 시 모니터 보안 필름 사용 고려
  - 공용 장소에서 작업 시 주변 환경에 주의

<br/><br/>

## 배운 점

- 가장 기본적인 보안은 사용자 개인정보와 같은 민감한 정보에 대한 적절한 접근 제어임
- 인증과 인가는 서버 개발에서 가장 기본적인 보안 개념임
- 암호화는 단방향(해시)와 양방향(AES, RSA)으로 나뉘며 각각 사용 목적이 다름
- HMAC을 통해 메시지의 무결성과 인증을 보장할 수 있음
- 감사 로그는 위변조 방지가 중요하므로 일반 로그와 분리된 저장소에 보관해야 함
- SQL 인젝션 등 시큐어 코딩 취약점은 Prepared Statement 등으로 방어할 수 있음
- 개발자 PC 보안이 소홀하면 전체 시스템의 보안이 위협받을 수 있음

<br/><br/>

## Reference

- [주니어 백엔드 개발자가 반드시 알아야 할 실무 지식](http://www.yes24.com/Product/Goods/125306759)
