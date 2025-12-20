---
title: "전략 패턴(Strategy Pattern)"
date: 2025-11-24 00:00:00 +0900
category:
  - [Software Engineering, Design]
tags: [design-pattern, strategy-pattern, oop]
math: false
mermaid: true
---

## 개요

- 전략 패턴은 행위를 클래스로 추상화하여 런타임에 알고리즘을 자유롭게 교체할 수 있게 해주는 객체 지향 디자인 패턴임
- 동일한 문제에 대해 다양한 알고리즘이 적용될 수 있을 때 코드 구조를 유지하고 새로운 전략의 추가나 변환을 유연하게 처리할 수 있도록 설계됨


<br/><br/>

## 패턴의 목적과 개념

### 정의

- 전략 패턴은 행동을 별도의 전략 객체로 분리하여 컨텍스트 객체가 런타임에 전략을 바꿀 수 있도록 하는 패턴임

### 주요 목적

- 알고리즘을 사용하는 객체와 알고리즘을 분리하여 서로 독립적으로 변형 · 확장할 수 있게 함
- 알고리즘의 캡슐화를 통해 코드의 유연성과 재사용성을 높임

### 적용 시기

- 여러 유사한 클래스에 알고리즘이 다를 때
- 조건문이나 분기문이 많아질 때
- 알고리즘 교체와 추가가 잦을 때


<br/><br/>

## 구조

- 전략 패턴은 다음과 같은 구성요소로 이루어져 있음

### 구성 요소

- **Strategy**
  - 전략의 공통 인터페이스 또는 추상 클래스
- **ConcreteStrategy**
  - 실제 구체적인 알고리즘 클래스로 Strategy를 구현
- **Context**
  - 전략 객체를 포함하며, 클라이언트가 사용하는 핵심 클래스

### UML 구조

![image.png](/assets/img/design/2025-11-24-strategy-pattern/image.png)


<br/><br/>

## 전략 패턴의 기본 구조와 동작 방식
- 알고리즘 인터페이스(Strategy)
    ```java
    public interface Strategy {
        int calculate(int a, int b);
    }
    ```
- 구체 전략(ConcreteStrategy)
    ```java
    public class AddStrategy implements Strategy {
        public int calculate(int a, int b) {
            return a + b;
        }
    }

    public class MultiplyStrategy implements Strategy {
        public int calculate(int a, int b) {
            return a * b;
        }
    }
    ```
- Context 클래스
    ```java
    public class Calculator {
        private Strategy strategy;
        
        // 생성자를 통한 전략 주입
        public Calculator(Strategy strategy) {
            this.strategy = strategy;
        }
        
        // 또는 기본 전략 설정
        public Calculator() {
            this.strategy = new AddStrategy(); // 기본 전략
        }
        
        public void setStrategy(Strategy strategy) {
            this.strategy = strategy;
        }
        
        public int execute(int a, int b) {
            if (strategy == null) {
                throw new IllegalStateException("Strategy must be set before execution");
            }
            return strategy.calculate(a, b);
        }
    }
    ```
- 사용
    ```java
    Calculator calculator = new Calculator();
    calculator.setStrategy(new AddStrategy());
    System.out.println(calculator.execute(2, 3)); // 5

    calculator.setStrategy(new MultiplyStrategy());
    System.out.println(calculator.execute(2, 3)); // 6
    ```

### 동작 흐름

![image.png](/assets/img/design/2025-11-24-strategy-pattern/image1.png)


<br/><br/>

## 장점

- **유연성**
  - 알고리즘 추가나 변경 시 기존 코드를 수정하지 않아도 됨
- **오픈/클로즈드 원칙 준수**
  - 새로운 전략을 쉽게 확장할 수 있음
- **코드 가독성 향상**
  - 분기문 제거로 코드가 명확해짐
  - 책임 분리로 각 클래스의 역할이 명확해짐


<br/><br/>

## 단점

- 클래스 수 증가
  - 전략이 많아질수록 클래스나 객체 수가 많아질 수 있음
- 전략 변경의 주의점
  - 모든 전략이 동일한 인터페이스를 가져야 하므로 신중한 설계 필요
- 런타임 오버헤드
  - 전략 객체 생성과 교체에 따른 메모리와 성능 비용 발생 가능


<br/><br/>

## 단점 해결 방법

### Java 8 람다 표현식 활용

- 전략 인터페이스가 함수형 인터페이스(메서드가 하나인 인터페이스)라면 람다식으로 전략을 정의할 수 있음
- 별도의 클래스 파일 없이 인라인으로 전략 구현 가능
- 클래스 수 증가 문제 완화

- Strategy 인터페이스가 함수형 인터페이스인 경우
    ```java
    @FunctionalInterface
    public interface Strategy {
        int calculate(int a, int b);
    }
    ```

- 람다식으로 전략 즉시 구현
    ```java
    Calculator calculator = new Calculator((a, b) -> a + b); // 더하기 전략
    System.out.println(calculator.execute(5, 3)); // 8

    calculator.setStrategy((a, b) -> a - b); // 빼기 전략
    System.out.println(calculator.execute(5, 3)); // 2

    calculator.setStrategy((a, b) -> a * b); // 곱하기 전략
    System.out.println(calculator.execute(5, 3)); // 15
    ```

- 장점
  - 별도 클래스 파일 불필요
  - 코드 간결성 향상
  - 간단한 전략의 경우 람다가 더 적합
- 제한 사항
  - 복잡한 로직이 필요한 경우에는 여전히 별도 클래스가 유리함
  - 전략에 상태(state)가 필요한 경우 람다로는 구현 어려움


<br/><br/>

## 사용 예시

- **정렬 알고리즘 선택**
  - 상황별로 MergeSort, QuickSort 등 구현체를 바꿔 쓸 때
- **인증 방식 동적 전환**
  - OAuth, SAML, LDAP 등 인증 전략 선택
- **금액 계산 및 할인 정책**
  - 다양한 할인 정책을 동적으로 적용할 때
- **결제 수단 처리**
  - 신용카드, 계좌이체, 포인트 등 다양한 결제 방식 처리


<br/><br/>

## 전략 패턴 vs 다른 패턴

### State 패턴과의 차이

- **전략 패턴**
  - 업무의 교환과 추가에 유연하게 대응
  - 동일한 인터페이스로 여러 알고리즘 제공
  - 클라이언트가 전략을 선택하고 교체
- **State 패턴**
  - 상태에 따라 행동이 변하며 상태 객체를 교체함
  - 전략 패턴과 구조적 유사점이 있지만 목적이 다름
  - 상태 전이가 내부적으로 발생

### Template Method 패턴과의 차이

- **전략 패턴**
  - 알고리즘 전체를 교체
  - 컴포지션을 사용하여 런타임에 전략 변경 가능
- **Template Method 패턴**
  - 상위 클래스에서 알고리즘 골격 정의
  - 하위 클래스가 일부 단계만 재정의
  - 상속을 사용하여 컴파일 타임에 구조 고정


<br/><br/>

## 적용 예제

### 할인 정책 적용

- 전략 인터페이스
    ```java
    public interface DiscountStrategy {
        double calculateDiscount(double price);
    }
    ```

- 구체 전략들
    ```java
    public class RegularDiscountStrategy implements DiscountStrategy {
        public double calculateDiscount(double price) {
            return price * 0.1; // 10% 할인
        }
    }

    public class VIPDiscountStrategy implements DiscountStrategy {
        public double calculateDiscount(double price) {
            return price * 0.2; // 20% 할인
        }
    }

    public class SeasonalDiscountStrategy implements DiscountStrategy {
        public double calculateDiscount(double price) {
            return price * 0.15; // 15% 할인
        }
    }
    ```

- 컨텍스트
    ```java
    public class PriceCalculator {
        private DiscountStrategy discountStrategy;
        
        // 생성자를 통한 필수 전략 주입
        public PriceCalculator(DiscountStrategy strategy) {
            this.discountStrategy = strategy;
        }
        
        public void setDiscountStrategy(DiscountStrategy strategy) {
            this.discountStrategy = strategy;
        }
        
        public double calculateFinalPrice(double originalPrice) {
            if (discountStrategy == null) {
                throw new IllegalStateException("DiscountStrategy must be set");
            }
            double discount = discountStrategy.calculateDiscount(originalPrice);
            return originalPrice - discount;
        }
    }
    ```

- 참고
  - 위 예제는 전략 패턴의 구조를 설명하기 위해 `double` 타입을 사용했으나 실제 금융이나 결제 시스템에서는 부동소수점 오차를 방지하기 위해 `BigDecimal` 사용을 권장함
  - 실무에서는 정확한 금액 계산을 위해 `BigDecimal`을 사용하는 것이 원칙임
  - 실무에서는 `Context` 생성자에서 기본 전략을 설정하거나 생성자를 통해 필수적으로 전략을 주입받게 강제하여 `NullPointerException`을 방지하는 것이 좋음


<br/><br/>

## Spring 프레임워크에서의 활용

### Map을 이용한 전략 선택

- Spring Boot 환경에서는 전략 빈들을 `Map`으로 주입받아 키 값으로 전략을 선택하는 방식이 일반적임
- `if-else` 분기 없이 깔끔한 코드 구조 가능

- 전략 인터페이스
    ```java
    public interface PaymentStrategy {
        void processPayment(BigDecimal amount);
        String getStrategyName(); // 전략 식별자
    }
    ```

- 구체 전략들
    ```java
    @Component
    public class CreditCardStrategy implements PaymentStrategy {
        @Override
        public void processPayment(BigDecimal amount) {
            // 신용카드 결제 로직
        }
        
        @Override
        public String getStrategyName() {
            return "CREDIT_CARD";
        }
    }

    @Component
    public class BankTransferStrategy implements PaymentStrategy {
        @Override
        public void processPayment(BigDecimal amount) {
            // 계좌이체 로직
        }
        
        @Override
        public String getStrategyName() {
            return "BANK_TRANSFER";
        }
    }
    ```

- 컨텍스트 (서비스)
    ```java
    @Service
    public class PaymentService {
        private final Map<String, PaymentStrategy> strategies;
        
        // Spring이 모든 PaymentStrategy 구현체를 Map으로 자동 주입
        public PaymentService(List<PaymentStrategy> strategyList) {
            this.strategies = strategyList.stream()
                .collect(Collectors.toMap(
                    PaymentStrategy::getStrategyName,
                    Function.identity()
                ));
        }
        
        public void processPayment(String paymentType, BigDecimal amount) {
            PaymentStrategy strategy = strategies.get(paymentType);
            if (strategy == null) {
                throw new IllegalArgumentException("Unsupported payment type: " + paymentType);
            }
            strategy.processPayment(amount);
        }
    }
    ```

- 장점
  - `if-else` 분기 제거
  - 새로운 전략 추가 시 컨텍스트 코드 수정 불필요
  - Spring의 의존성 주입 활용
  - 전략 선택 로직이 명확함

### List를 이용한 전략 선택

- 전략 선택 기준이 복잡한 경우 `List`로 주입받아 조건에 맞는 전략을 찾는 방식도 사용됨

    ```java
    @Service
    public class DiscountService {
        private final List<DiscountStrategy> strategies;
        
        public DiscountService(List<DiscountStrategy> strategies) {
            this.strategies = strategies;
        }
        
        public BigDecimal calculateDiscount(String userType, BigDecimal price) {
            return strategies.stream()
                .filter(strategy -> strategy.supports(userType))
                .findFirst()
                .map(strategy -> strategy.calculateDiscount(price))
                .orElse(BigDecimal.ZERO);
        }
    }
    ```


<br/><br/>

## 결론

- 전략 패턴은 동적인 행위 변경이 필요하고 변화를 유연하게 확장하고 싶을 때 유용한 패턴임
- 잘 활용하면 코드의 유지보수성과 확장성, 가독성을 높일 수 있음
- 남발하면 오히려 코드 복잡도를 높일 수 있으므로 트레이드오프를 고려해 사용해야 함
- 알고리즘이 자주 변경되거나 여러 알고리즘을 동적으로 선택해야 하는 상황에서 특히 효과적임