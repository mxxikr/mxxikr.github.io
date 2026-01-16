---
title: AWS S3 Presigned URL
date: 2025-11-25 00:00:00 +0900
category: [Cloud, AWS]
tags: [aws, s3, presigned-url, security]
math: false
mermaid: false
---
## 개요

- Presigned URL은 AWS 서명 V4 알고리즘으로 서명된 URL임
- 서버의 비밀 키로 생성된 보안 토큰으로 클라이언트가 직접 S3에 접근할 수 있게 해줌
- 서버 부하 없이 대용량 파일을 안전하게 업로드하거나 다운로드할 수 있음


<br/><br/>

## 개념

### Presigned URL의 본질

- AWS 서명 V4로 서명된 URL로 다음 요소들을 조합해 만든 보안 토큰임
  - 클라이언트 요청 정보 (HTTP 메서드, 버킷, 키, 헤더)
  - 서버의 비밀 키 (Secret Access Key)
  - 타임스탬프 및 만료 시간
  - 암호화 서명 (HMAC-SHA256)

### Presigned URL 구조
- Presigned URL = Base URL + Query Parameters (서명)

    ```
    https://mybucket.s3.amazonaws.com/myfile.jpg?
    X-Amz-Algorithm=AWS4-HMAC-SHA256
    &X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F...
    &X-Amz-Date=20240101T000000Z
    &X-Amz-Expires=3600
    &X-Amz-SignedHeaders=host
    &X-Amz-Signature=fe5f80f77d5fa3beca5917323676bcd2...
    ```

- S3가 요청을 받으면 서명을 검증하여 AWS 인증 정보를 가진 서버가 생성한 URL인지 확인함


<br/><br/>

## 요청-응답 흐름

### 전체 흐름

![image.png](/assets/img/cloud/aws/2025-11-25-presigned-url/image.png)

1. **클라이언트 → 서버**
   - Presigned URL 요청
2. **서버 내부 처리**
   - GeneratePresignedUrlRequest 생성
   - 버킷, 키, HTTP 메서드, 만료 시간 설정
   - AWS SDK로 URL 생성 (암호화 서명 포함)
3. **서버 → 클라이언트**
   - Presigned URL과 만료 시간 반환
4. **클라이언트 → S3**
   - Presigned URL로 직접 파일 업로드
5. **S3 검증 및 저장**
   - 서명 검증
   - 만료 시간 확인
   - 검증 통과 시 파일 저장

### 파라미터 의미

- **X-Amz-Algorithm**
  - 서명 알고리즘 (고정값: AWS4-HMAC-SHA256)
- **X-Amz-Credential**
  - 자격증명 (접근 키 + 날짜 + 리전)
- **X-Amz-Date**
  - 요청 생성 시각 (UTC)
- **X-Amz-Expires**
  - 유효 기간 (초 단위)
- **X-Amz-SignedHeaders**
  - 서명에 포함된 헤더들
- **X-Amz-Signature**
  - HMAC-SHA256 서명값


<br/><br/>

## 보안 메커니즘

### 서명 검증 과정

- S3가 요청을 받았을 때
  1. 요청에서 X-Amz-Signature 값 추출
  2. S3가 같은 정보로 서명 재계산
  3. 두 서명 비교
     - 일치: 요청 진행
     - 불일치: 403 Forbidden

### 서명에 포함되는 정보

- HTTP 메서드 (GET, PUT, DELETE)
- 요청 경로 (버킷 + 키)
- 요청 헤더 (Content-Type 등)
- 타임스탬프

- URL을 조금이라도 변조하면 서명이 일치하지 않아 접근이 거부됨

### 시간 기반 보안

- 서버에서 생성 시
  - 현재 시간 + 만료 시간 = 타임스탬프 저장
- S3에서 요청 받을 때
  - 현재 시간 > 요청 시간 + 만료 시간이면 거부
- ex)
  - 5분 유효 기간이라면 만료 시각 이후 요청은 무조건 실패함


<br/><br/>

## Spring Boot 구현

- 참고
    본 예제는 AWS SDK for Java v1 (`com.amazonaws.services.s3`)을 기준으로 작성됨
- AWS는 현재 SDK v2 (`software.amazon.awssdk`) 사용을 권장하지만 v1도 여전히 널리 사용되고 있음
- SDK v2의 경우 `S3Presigner` 클래스를 사용하며 API가 다소 상이함

### 기본 설정

```java
@Configuration
@Profile("local")
public class LocalStackS3Config {
    @Bean
    public AmazonS3 amazonS3(
        @Value("${aws.s3.endpoint}") String endpoint,
        @Value("${aws.s3.region}") String region,
        @Value("${aws.credentials.access-key}") String accessKey,
        @Value("${aws.credentials.secret-key}") String secretKey
    ) {
        AWSCredentials credentials = new BasicAWSCredentials(accessKey, secretKey);
        return AmazonS3ClientBuilder.standard()
            .withEndpointConfiguration(new EndpointConfiguration(endpoint, region))
            .withCredentials(new AWSStaticCredentialsProvider(credentials))
            .withPathStyleAccessEnabled(true)
            .build();
    }
}
```

### Presigned URL 생성 서비스

```java
@Service
@RequiredArgsConstructor
public class S3PresignedService {
    private final AmazonS3 amazonS3;
    
    @Value("${aws.s3.bucket}")
    private String bucketName;
    
    /**
     * PUT (업로드) Presigned URL 생성
     * 
     * 이 방식은 PUT 메서드를 사용하여 단일 파일을 덮어쓰거나 생성할 때 사용함
     * Presigned POST와는 다르며 PUT은 단일 파일 업로드에 최적화됨
     * 
     * @param fileName 저장될 파일명
     * @param expirationMinutes 유효 기간 (분)
     * @param contentType 파일 MIME 타입 (서명에 포함)
     * @return Presigned URL과 만료 시간을 포함한 결과 객체
     */
    public PresignedUrlResult generatePresignedUploadUrl(
        String fileName,
        int expirationMinutes,
        String contentType
    ) {
        Date expiration = new Date();
        long expirationTimeInMillis = 
            expiration.getTime() + (expirationMinutes * 60 * 1000L);
        expiration.setTime(expirationTimeInMillis);
        
        GeneratePresignedUrlRequest request = 
            new GeneratePresignedUrlRequest(bucketName, fileName)
                .withMethod(HttpMethod.PUT)
                .withExpiration(expiration)
                .withContentType(contentType);
        
        URL url = amazonS3.generatePresignedUrl(request);
        return new PresignedUrlResult(url.toString(), expirationTimeInMillis);
    }
    
    /**
     * Presigned URL 결과 객체
     */
    public record PresignedUrlResult(String url, long expiresAt) {}
    
    /**
     * GET (다운로드) Presigned URL 생성
     */
    public PresignedUrlResult generatePresignedDownloadUrl(
        String fileName,
        int expirationMinutes
    ) {
        Date expiration = new Date();
        long expirationTimeInMillis = 
            expiration.getTime() + (expirationMinutes * 60 * 1000L);
        expiration.setTime(expirationTimeInMillis);
        
        GeneratePresignedUrlRequest request = 
            new GeneratePresignedUrlRequest(bucketName, fileName)
                .withMethod(HttpMethod.GET)
                .withExpiration(expiration);
        
        URL url = amazonS3.generatePresignedUrl(request);
        return new PresignedUrlResult(url.toString(), expirationTimeInMillis);
    }
    
    /**
     * DELETE (삭제) Presigned URL 생성
     */
    public String generatePresignedDeleteUrl(
        String fileName,
        int expirationMinutes
    ) {
        Date expiration = new Date();
        long expirationTimeInMillis = 
            expiration.getTime() + (expirationMinutes * 60 * 1000L);
        expiration.setTime(expirationTimeInMillis);
        
        GeneratePresignedUrlRequest request = 
            new GeneratePresignedUrlRequest(bucketName, fileName)
                .withMethod(HttpMethod.DELETE)
                .withExpiration(expiration);
        
        URL url = amazonS3.generatePresignedUrl(request);
        return url.toString();
    }
}
```

### Controller 구현

```java
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FilePresignedController {
    private final S3PresignedService presignedService;
    
    @PostMapping("/presigned-upload-url")
    public ResponseEntity<PresignedUrlResponse> getUploadUrl(
        @RequestBody PresignedUrlRequest request
    ) {
        String fileName = generateUniqueFileName(request.fileName());
        
        S3PresignedService.PresignedUrlResult result = 
            presignedService.generatePresignedUploadUrl(
                fileName,
                5,
                request.contentType()
            );
        
        return ResponseEntity.ok(new PresignedUrlResponse(
            result.url(),
            fileName,
            result.expiresAt()
        ));
    }
    
    @GetMapping("/presigned-download-url")
    public ResponseEntity<PresignedUrlResponse> getDownloadUrl(
        @RequestParam String fileName
    ) {
        S3PresignedService.PresignedUrlResult result = 
            presignedService.generatePresignedDownloadUrl(fileName, 15);
        
        return ResponseEntity.ok(new PresignedUrlResponse(
            result.url(),
            fileName,
            result.expiresAt()
        ));
    }
    
    @PostMapping("/upload-complete")
    public ResponseEntity<Void> notifyUploadComplete(
        @RequestBody UploadCompleteRequest request
    ) {
        // 파일이 실제로 S3에 저장됐는지 확인
        // DB에 파일 메타데이터 저장
        return ResponseEntity.ok().build();
    }
    
    private String generateUniqueFileName(String originalFileName) {
        return System.currentTimeMillis() + "_" + originalFileName;
    }
}

// DTO
record PresignedUrlRequest(
    String fileName,
    String contentType
) {}

record PresignedUrlResponse(
    String presignedUrl,
    String fileName,
    long expiresAt
) {}

record UploadCompleteRequest(
    String fileName
) {}
```


<br/><br/>

## 클라이언트 코드

### JavaScript 기본 업로드

```javascript
// 올바른 방식
async function uploadWithPresignedUrl(file) {
    // 서버에서 Presigned URL 받기
    const response = await fetch('/api/files/presigned-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fileName: file.name,
            contentType: file.type
        })
    });
    
    const { presignedUrl, fileName, expiresAt } = await response.json();
    
    // 유효성 확인
    if (Date.now() > expiresAt) {
        console.error('URL 이미 만료됨');
        return;
    }
    
    // Presigned URL로 직접 S3 업로드
    const s3Response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type
        },
        body: file
    });
    
    if (!s3Response.ok) {
        console.error('S3 업로드 실패:', s3Response.status);
        return;
    }
    
    // 서버에 업로드 완료 알림
    await fetch('/api/files/upload-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
    });
    
    console.log('업로드 완료');
}
```

### React Hook

```jsx
import { useState } from 'react';

function FileUpload() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    
    const handleUpload = async (file) => {
        setLoading(true);
        
        try {
            // Presigned URL 요청
            const urlResponse = await fetch('/api/files/presigned-upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    contentType: file.type
                })
            });
            
            const { presignedUrl, fileName } = await urlResponse.json();
            
            // XMLHttpRequest로 진행률 추적
            await uploadToS3WithProgress(presignedUrl, file);
            
            // 완료 알림
            await fetch('/api/files/upload-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName })
            });
            
            console.log('업로드 성공');
        } catch (error) {
            console.error('업로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const uploadToS3WithProgress = (url, file) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (event) => {
                const percent = (event.loaded / event.total) * 100;
                setProgress(percent);
            });
            
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    resolve();
                } else {
                    reject(new Error(`HTTP ${xhr.status}`));
                }
            });
            
            xhr.addEventListener('error', () => reject(new Error('Upload failed')));
            xhr.open('PUT', url);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
        });
    };
    
    return (
        <div>
            <input
                type="file"
                onChange={(e) => handleUpload(e.target.files[0])}
                disabled={loading}
            />
            {loading && <p>진행률: {progress.toFixed(0)}%</p>}
        </div>
    );
}

export default FileUpload;
```


<br/><br/>

## 주의 사항

### Content-Type 서명 문제

- 가장 흔한 오류 중 하나임
- 서버에서 생성한 Presigned URL의 Content-Type과 클라이언트가 보내는 Content-Type이 일치해야 함

    ```java
    String contentType = "image/jpeg";
    GeneratePresignedUrlRequest request = 
        new GeneratePresignedUrlRequest(bucket, key)
            .withMethod(HttpMethod.PUT)
            .withContentType(contentType)
            .withExpiration(expiration);

    // 클라이언트는 같은 Content-Type 사용
    fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file
    });
    ```

    - Content-Type이 서명에 포함되지 않으면 클라이언트가 다른 Content-Type을 보낼 수 있어 보안 위험이 있음
    - Content-Type이 서명에 포함되면 반드시 일치해야 하므로 서명 검증 실패 시 403 Forbidden 발생

### 시간 동기화 문제

- S3와 서버의 시간이 다르면 만료 시간 검증이 실패할 수 있음
- 해결 방법
  - NTP로 시스템 시간 동기화
  - 만료 시간에 여유 두기 (10분 → 15분으로 설정)

### Path-style vs Virtual-hosted-style

- Path-style (LocalStack/호환 서비스)
    ```plaintext
    https://localhost:4566/mybucket/myfile.jpg
    ```
- Virtual-hosted-style (AWS 기본)
    ```plaintext
    https://mybucket.s3.amazonaws.com/myfile.jpg
    ```

- LocalStack은 Path-style만 지원하므로 반드시 `.withPathStyleAccessEnabled(true)` 설정 필요

### CORS (Cross-Origin Resource Sharing) 설정

- 가장 많이 겪는 오류 중 하나임
- 브라우저에서 S3로 직접 요청을 보낼 때, S3 버킷에 CORS 설정이 없으면 브라우저가 요청을 차단함
- 브라우저 콘솔에서 `Access to fetch at '...' from origin '...' has been blocked by CORS policy` 오류 발생

### AWS S3 CORS 설정

- AWS 콘솔에서 버킷 → 권한 → CORS 구성으로 설정 가능

    ```json
    [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["PUT", "GET", "DELETE"],
            "AllowedOrigins": ["http://localhost:3000", "https://example.com"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
    ```

### LocalStack CORS 설정

- AWS CLI 또는 초기화 스크립트로 설정 가능

    ```bash
    # AWS CLI로 CORS 설정
    awslocal s3api put-bucket-cors \
        --bucket my-bucket \
        --cors-configuration file://cors-config.json

    # cors-config.json
    {
        "CORSRules": [
            {
                "AllowedHeaders": ["*"],
                "AllowedMethods": ["PUT", "GET", "DELETE"],
                "AllowedOrigins": ["*"],
                "ExposeHeaders": ["ETag"]
            }
        ]
    }
    ```

- 또는 초기화 스크립트에 포함

    ```bash
    #!/bin/bash
    # init-scripts/setup-cors.sh

    awslocal s3api put-bucket-cors \
        --bucket my-bucket \
        --cors-configuration '{
            "CORSRules": [{
                "AllowedHeaders": ["*"],
                "AllowedMethods": ["PUT", "GET", "DELETE"],
                "AllowedOrigins": ["*"],
                "ExposeHeaders": ["ETag"]
            }]
        }'
    ```

- 주의 사항
  - `AllowedOrigins`에 `"*"`를 사용하면 모든 도메인에서 접근 가능하므로 프로덕션 환경에서는 특정 도메인만 명시하는 것이 보안상 안전함
  - `AllowedMethods`에는 실제로 사용하는 HTTP 메서드만 포함하는 것이 좋음
  - `ExposeHeaders`는 클라이언트에서 읽을 수 있는 응답 헤더를 지정함


<br/><br/>

## 성능 최적화

### URL 재사용 vs 매번 생성

- 매번 생성하는 방식은 불필요한 오버헤드가 발생함
- URL 캐싱을 통해 성능 개선 가능

    ```java
    @Service
    public class S3CachedPresignedService {
        private final S3PresignedService presignedService;
        private final Map<String, CachedUrl> urlCache = new ConcurrentHashMap<>();
        
        public String getOrGenerateUrl(String key, int expirationMinutes) {
            CachedUrl cached = urlCache.get(key);
            
            // 캐시된 URL이 아직 유효한가?
            if (cached != null && cached.expiresAt > System.currentTimeMillis()) {
                return cached.url;
            }
            
            // 새로 생성
            S3PresignedService.PresignedUrlResult result = 
                presignedService.generatePresignedUploadUrl(
                    key, expirationMinutes, "image/jpeg"
                );
            
            urlCache.put(key, new CachedUrl(
                result.url(),
                result.expiresAt()
            ));
            
            return result.url();
        }
        
        record CachedUrl(String url, long expiresAt) {}
    }
    ```

### 배치 URL 생성

- 여러 파일에 대한 Presigned URL을 한 번에 생성할 때 병렬 처리 고려

    ```java
    @PostMapping("/batch-presigned-urls")
    public ResponseEntity<Map<String, String>> getBatchUrls(
        @RequestBody List<String> fileNames
    ) {
        Map<String, String> urls = fileNames.parallelStream()
            .collect(Collectors.toMap(
                fileName -> fileName,
                fileName -> presignedService.generatePresignedUploadUrl(
                    fileName, 5, "image/jpeg"
                ).url()
            ));
        
        return ResponseEntity.ok(urls);
    }
    ```


<br/><br/>

## LocalStack에서의 Presigned URL

- LocalStack도 동일한 방식으로 동작함
- 시간 기반 검증을 완전히 지원함

    ```yaml
    # docker-compose.yml
    services:
    localstack:
        environment:
        - SERVICES=s3
        - AWS_ACCESS_KEY_ID=test
        - AWS_SECRET_ACCESS_KEY=test
    ```

    ```java
    @Bean
    public AmazonS3 amazonS3() {
        return AmazonS3ClientBuilder.standard()
            .withEndpointConfiguration(new EndpointConfiguration(
                "http://localhost:4566", "us-east-1"
            ))
            .withCredentials(new AWSStaticCredentialsProvider(
                new BasicAWSCredentials("test", "test")
            ))
            .withPathStyleAccessEnabled(true)
            .build();
    }
    ```

    - 생성된 URL
        - `http://localhost:4566/mybucket/file.jpg?X-Amz-Signature=...`


<br/><br/>

## 결론

- Presigned URL은 서버 부하 없이 대용량 파일을 안전하게 처리할 수 있는 기능임
- AWS 서명 V4 알고리즘을 통해 보안을 보장하며 시간 기반 만료로 추가 보안을 제공함
- 서버와 클라이언트 간 Content-Type 일치가 중요하며 시간 동기화도 주의해야 함
- LocalStack에서도 동일하게 동작하므로 로컬 개발 환경에서도 테스트 가능함
- 올바르게 사용하면 성능을 크게 향상시킬 수 있음