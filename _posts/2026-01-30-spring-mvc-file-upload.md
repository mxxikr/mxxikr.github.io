---
title: '[스프링 MVC 2편 백엔드 웹 개발 활용 기술] 파일 업로드'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-30 13:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, mvc, file-upload, multipart, servlet]
math: false
mermaid: true
---

# 파일 업로드

- 김영한님의 스프링 MVC 2편 강의를 통해 파일 업로드의 원리(`multipart/form-data`)를 이해하고, 서블릿과 스프링이 제공하는 각각의 업로드 처리 방식을 비교하며, 실제 웹 애플리케이션에서 파일 업로드와 다운로드를 구현하는 방법을 정리함

<br/><br/>

## 파일 업로드 소개

### HTML Form 전송 방식

- HTML Form을 통한 파일 업로드를 이해하려면 두 가지 전송 방식의 차이를 이해해야 함

    - `application/x-www-form-urlencoded`
    - `multipart/form-data`

### application/x-www-form-urlencoded 방식

- **개념**
    - HTML 폼 데이터를 서버로 전송하는 가장 기본적인 방법
    - Form 태그에 별도의 enctype 옵션이 없으면 기본값

- **HTTP 메시지 헤더**

    ```http
    Content-Type: application/x-www-form-urlencoded
    ```

- **HTTP Body**

    ```
    username=kim&age=20
    ```
- **특징**
    - 폼에 입력한 항목을 문자로 전송
    - `&`로 구분
    - URL 인코딩 처리

![HTML Form](/assets/img/html-form-upload.png)

- **파일 업로드의 문제점**
    - 파일은 문자가 아닌 **바이너리 데이터**임
    - 문자 전송 방식으로 파일 전송 어려움
    - 이름, 나이(문자) + 첨부파일(바이너리)을 동시에 전송해야 함
    - 문자와 바이너리를 동시에 전송 불가능함

### multipart/form-data 방식

- **개념**
    - 문자와 바이너리를 동시에 전송하기 위한 방식
    - 여러 종류의 파일과 폼 내용을 함께 전송 가능

- **Form 태그 설정**

    ```html
    <form enctype="multipart/form-data">
    ```

- **HTTP 메시지 구조**

    ```http
    POST /upload HTTP/1.1
    Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
    
    ------WebKitFormBoundary
    Content-Disposition: form-data; name="username"
    
    kim
    ------WebKitFormBoundary
    Content-Disposition: form-data; name="age"
    
    20
    ------WebKitFormBoundary
    Content-Disposition: form-data; name="file"; filename="test.png"
    Content-Type: image/png
    
    바이너리 데이터...
    ------WebKitFormBoundary--
    ```

- **구조 분석**
    - 각 항목이 `boundary`로 구분됨
    - 각 항목마다 `Content-Disposition` 헤더가 추가됨
    - 파일은 파일명과 `Content-Type`이 추가됨
    - 일반 데이터는 문자, 파일은 바이너리로 전송됨

![multipart/form-data](/assets/img/multipart-form-data.png)

### 두 방식 비교

| 구분 | application/x-www-form-urlencoded | multipart/form-data |
|------|-----------------------------------|---------------------|
| **용도** | 일반 폼 데이터 | 파일 업로드 + 폼 데이터 |
| **데이터 형식** | 문자만 가능 | 문자 + 바이너리 |
| **인코딩** | URL 인코딩 | Part별 인코딩 |
| **구분자** | & | boundary |
| **파일 업로드** | 불가능 | 가능 |
| **복잡도** | 단순 | 복잡 |

<br/><br/>

## 서블릿과 파일 업로드

### ServletUploadControllerV1

```java
@Slf4j
@Controller
@RequestMapping("/servlet/v1")
public class ServletUploadControllerV1 {
    
    @PostMapping("/upload")
    public String saveFileV1(HttpServletRequest request) 
            throws ServletException, IOException {
        log.info("request={}", request);
        
        String itemName = request.getParameter("itemName");
        log.info("itemName={}", itemName);
        
        Collection<Part> parts = request.getParts();
        log.info("parts={}", parts);
        
        return "upload-form";
    }
}
```
- [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/upload/src/main/java/hello/upload/controller/ServletUploadControllerV1.java)

- `request.getParts()`
    - multipart/form-data 전송 방식에서 각각 나누어진 부분을 받아서 확인함

### 멀티파트 설정 옵션

- **업로드 사이즈 제한**

    ```properties
    spring.servlet.multipart.max-file-size=1MB
    spring.servlet.multipart.max-request-size=10MB
    ```
    - `max-file-size`
        - 파일 하나의 최대 사이즈 (기본 1MB)
    - `max-request-size`
        - 멀티파트 요청 하나에 여러 파일 업로드 시 전체 합 (기본 10MB)
    - 사이즈 초과 시 `SizeLimitExceededException` 발생

- **멀티파트 기능 끄기**

    ```properties
    spring.servlet.multipart.enabled=false
    ```
    - 서블릿 컨테이너가 멀티파트 처리를 하지 않음
    - `request.getParameter("itemName")` -> null
    - `request.getParts()` -> 빈 배열

- **멀티파트 기능 켜기 (기본값)**

    ```properties
    spring.servlet.multipart.enabled=true
    ```

    - `HttpServletRequest` -> `StandardMultipartHttpServletRequest`로 변경됨
    - 복잡한 멀티파트 요청을 처리해서 제공함

        ![DispatcherServlet Flow](/assets/img/dispatcher-servlet-flow.png)

### MultipartResolver

- **동작 원리**
    1. `spring.servlet.multipart.enabled=true` 설정
    2. `DispatcherServlet`에서 `MultipartResolver` 실행
    3. 멀티파트 요청인 경우 `HttpServletRequest`를 `MultipartHttpServletRequest`로 변환

### 파일 저장과 Part 주요 메서드

- **Part 주요 메서드**
    - `part.getSubmittedFileName()`
        -  클라이언트가 전달한 파일명
    - `part.getInputStream()`
        - Part의 전송 데이터를 읽을 수 있음
    - `part.write(...)`
        - Part를 통해 전송된 데이터를 저장
    - `part.getName()`
        - 파트 이름
    - `part.getHeaderNames()`
        - 헤더 이름들
    - `part.getSize()`
        - Part body 사이즈

<br/><br/>

## 스프링과 파일 업로드

### MultipartFile 인터페이스

- **특징**
    - 스프링이 제공하는 멀티파트 파일 지원 인터페이스
    - 서블릿의 `Part`보다 훨씬 편리하게 사용 가능

### SpringUploadController

```java
@Slf4j
@Controller
@RequestMapping("/spring")
public class SpringUploadController {
    
    @Value("${file.dir}")
    private String fileDir;
    
    @PostMapping("/upload")
    public String saveFile(@RequestParam String itemName,
                            @RequestParam MultipartFile file,
                            HttpServletRequest request) throws IOException {
        
        if (!file.isEmpty()) {
            String fullPath = fileDir + file.getOriginalFilename();
            file.transferTo(new File(fullPath));
        }
        
        return "upload-form";
    }
}
```
- [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/upload/src/main/java/hello/upload/controller/SpringUploadController.java)

- `@RequestParam MultipartFile file`
- HTML Form의 name에 맞춰 `@RequestParam`을 적용하면 됨
- `@ModelAttribute`에서도 동일하게 사용 가능함

### MultipartFile 주요 메서드

| 메서드 | 설명 |
|--------|------|
| `file.getOriginalFilename()` | 업로드 파일명 |
| `file.transferTo(...)` | 파일 저장 |
| `file.isEmpty()` | 파일이 비어있는지 확인 |
| `file.getSize()` | 파일 크기 |
| `file.getBytes()` | 파일 내용을 byte[]로 반환 |
| `file.getInputStream()` | 파일 내용을 InputStream으로 반환 |

<br/><br/>

## 예제로 구현하는 파일 업로드, 다운로드

### 요구사항

- **상품 관리**
    - 상품 이름
    - 첨부파일 하나
    - 이미지 파일 여러 개

- **기능**
    - 첨부파일 업로드/다운로드
    - 업로드한 이미지를 웹 브라우저에서 확인

### 구현

- **Item - 상품 도메인**

    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/upload/src/main/java/hello/upload/domain/Item.java)

- **ItemRepository - 상품 저장소**

    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/upload/src/main/java/hello/upload/domain/ItemRepository.java)

- **UploadFile - 업로드 파일 정보**

    ```java
    @Data
    public class UploadFile {
        private String uploadFileName;  // 고객이 업로드한 파일명
        private String storeFileName;   // 서버 내부에서 관리하는 파일명
        
        public UploadFile(String uploadFileName, String storeFileName) {
            this.uploadFileName = uploadFileName;
            this.storeFileName = storeFileName;
        }
    }
    ```
    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/upload/src/main/java/hello/upload/domain/UploadFile.java)

    - **파일명 분리 이유**
        - 고객이 업로드한 파일명으로 서버에 저장하면 충돌이 발생할 수 있음
        - 서버에서는 UUID 등을 사용하여 유일한 이름으로 저장해야 함

        ![파일명 분리](/assets/img/file-name-separation.png)

- **FileStore - 파일 저장 처리**

    ```java
    @Component
    public class FileStore {
        
        @Value("${file.dir}")
        private String fileDir;
        
        public String getFullPath(String filename) {
            return fileDir + filename;
        }
        
        public UploadFile storeFile(MultipartFile multipartFile) throws IOException {
            if (multipartFile.isEmpty()) {
                return null;
            }
            
            String originalFilename = multipartFile.getOriginalFilename();
            String storeFileName = createStoreFileName(originalFilename);
            multipartFile.transferTo(new File(getFullPath(storeFileName)));
            
            return new UploadFile(originalFilename, storeFileName);
        }
        
        // UUID로 서버 내부 파일명 생성 (확장자 유지)
        private String createStoreFileName(String originalFilename) {
            String ext = extractExt(originalFilename);
            String uuid = UUID.randomUUID().toString();
            return uuid + "." + ext;
        }
        
        private String extractExt(String originalFilename) {
            int pos = originalFilename.lastIndexOf(".");
            return originalFilename.substring(pos + 1);
        }
    }
    ```
    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/upload/src/main/java/hello/upload/file/FileStore.java)

    - `storeFile()`
        - 업로드된 파일을 서버에 저장하고 업로드 파일 정보를 반환함
    - `createStoreFileName()`
        - 서버 내부에서 관리하는 파일명은 유일한 이름을 사용할 수 있도록 UUID를 사용해서 저장함
    - `extractExt()`
        - 확장자를 별도로 추출해서 서버 내부에서 관리하는 파일명에도 붙여줌

- **ItemForm - 상품 저장용 폼**

    ```java
    @Data
    public class ItemForm {
        private Long itemId;
        private String itemName;
        private List<MultipartFile> imageFiles;  // 다중 업로드
        private MultipartFile attachFile;
    }
    ```
    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/upload/src/main/java/hello/upload/controller/ItemForm.java)

    - `List<MultipartFile> imageFiles`
        - 이미지 다중 업로드
    - `MultipartFile attachFile`
        - 단일 첨부파일
    - `@ModelAttribute`에서 사용 가능

- **ItemController - 다운로드 처리**

    ```java
    @GetMapping("/attach/{itemId}")
    public ResponseEntity<Resource> downloadAttach(@PathVariable Long itemId) 
            throws MalformedURLException {
        
        Item item = itemRepository.findById(itemId);
        String storeFileName = item.getAttachFile().getStoreFileName();
        String uploadFileName = item.getAttachFile().getUploadFileName();
        
        UrlResource resource = new UrlResource("file:" + fileStore.getFullPath(storeFileName));
        
        // 한글 파일명 깨짐 방지
        String encodedUploadFileName = UriUtils.encode(uploadFileName, StandardCharsets.UTF_8);
            
        // 다운로드를 위한 헤더 설정
        String contentDisposition = "attachment; filename=\"" + 
        encodedUploadFileName + "\"";
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .body(resource);
    }
    ```
    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/upload/src/main/java/hello/upload/controller/ItemController.java)

    - **Content-Disposition 헤더**
        - 이 헤더가 없으면 브라우저는 파일을 다운로드하지 않고 내용을 보여줌 (이미지 등)
        - `attachment; filename="..."` 설정을 통해 다운로드 창이 뜨도록 할 수 있음

<br/><br/>

## 연습 문제

1. 일반적인 HTML 폼 전송 방식('x-www-form-urlencoded')과 파일 업로드 시 사용하는 방식('multipart/form-data')의 주요 차이점은 무엇일까요?

   a. 전자는 텍스트만, 후자는 바이너리 데이터를 포함할 수 있습니다.

   - `x-www-form-urlencoded`는 텍스트 기반 키-값 형식으로 전송하지만, `multipart/form-data`는 여러 파트로 나누어 텍스트와 바이너리 데이터를 함께 보낼 수 있기 때문임

2. HTML 폼을 통해 파일을 업로드하려면 `<form>` 태그의 `enctype` 속성을 무엇으로 지정해야 할까요?

   a. `multipart/form-data`

   - 파일을 포함한 폼 데이터를 전송하기 위해 HTTP 명세에서 정의한 표준 방식이 바로 `multipart/form-data`이기 때문임
   - 다른 옵션들은 파일 전송에 적합하지 않음

3. Spring Boot 서블릿 환경에서 `spring.servlet.multipart.enabled` 설정을 `false`로 했을 때 발생하는 주요 결과는 무엇인가요?

   a. 멀티파트 요청 처리가 비활성화됩니다.

   - 이 설정을 `false`로 하면 서블릿 컨테이너가 멀티파트 요청을 처리하지 않도록 설정됨
   - 따라서 파일 데이터 등을 정상적으로 받을 수 없게 됨

4. 스프링에서 파일 업로드를 처리할 때, 컨트롤러 메서드의 파라미터로 업로드된 파일을 편리하게 받기 위해 주로 어떤 인터페이스를 사용할까요?

   a. `org.springframework.web.multipart.MultipartFile`

   - 스프링은 개발자가 파일 업로드를 쉽게 다룰 수 있도록 `MultipartFile` 인터페이스를 제공함
   - 파일 정보와 내용을 편리하게 얻을 수 있음

5. 사용자가 업로드한 파일을 서버에 저장할 때, 원본 파일 이름 대신 서버에서 생성한 고유한 이름으로 저장하는 주된 이유는 무엇일까요?

   a. 같은 이름의 파일 충돌을 방지하기 위해

   - 사용자들이 같은 이름의 파일을 올릴 때 서로 덮어쓰거나 예상치 못한 문제가 생길 수 있음
   - 고유한 이름은 충돌을 막아줌

<br/><br/>

## 요약 정리

- **파일 전송 방식 비교**
    - `application/x-www-form-urlencoded`
        - 문자와 바이너리 동시 전송 불가능
    - `multipart/form-data`
        - Boundary를 사용하여 문자와 바이너리를 구분해 동시 전송 가능

- **서블릿과 스프링 파일 업로드 비교**
    - **서블릿**
        - `HttpServletRequest`의 `getParts()`를 사용하여 각 Part를 수동으로 처리해야 함
    - **스프링**
        - `MultipartFile` 인터페이스를 제공하여 매우 편리하게 파일 업로드 처리 가능

- **멀티파트 리졸버 (MultipartResolver)**
    - `DispatcherServlet`에서 멀티파트 요청을 감지하고 `MultipartHttpServletRequest`로 변환하여 처리를 지원함

- **파일 저장**
    - **파일명 분리**
        - 고객이 업로드한 파일명과 서버에 저장할 파일명을 분리해야 함
    - **UUID 사용**
        - 파일명 충돌 방지를 위해 서버 저장 파일명은 UUID를 사용

- **파일 다운로드**
    - **Content-Disposition 헤더**
        - `attachment; filename="..."` 설정을 통해 브라우저가 파일을 다운로드하도록 지정
    - **파일명 인코딩**
        - 한글 등비영어권 파일명 깨짐 방지를 위해 `UriUtils.encode` 사용 필수

<br/><br/>

## Reference

- [스프링 MVC 2편 - 백엔드 웹 개발 활용 기술](https://www.inflearn.com/course/스프링-mvc-2)
