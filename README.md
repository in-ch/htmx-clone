### htmx 초기 세팅(1)

- commit: bef4e112882abac9e37570c16193a7e540b3df37

주어진 코드는 IIFE (Immediately Invoked Function Expression) 패턴을 사용하여 정의되어 있다.
IIFE는 함수를 정의하고 즉시 호출하는 패턴으로, 스크립트가 로드되자마자 실행.
코드의 마지막 부분에서는 return { version: "0.0.1" }을 통해 INCH 객체를 반환

따라서 해당 스크립트를 로드하면 IIFE가 즉시 실행되어 INCH 객체를 생성하고 반환한다. 그리고 INCH 객체가 반환되어 INCH.version을 통해 해당 버전을 확인할 수 있다.

실행 순서:

스크립트가 로드되면 IIFE가 실행.
<code>processElement</code> 함수는 <code>document.body</code>를 시작으로 DOM의 모든 자식 요소를 검사하며 <code>hx-get</code> 속성을 가진 요소에 대해 이벤트 리스너를 등록한다.
<code>ready</code> 함수를 사용하여 DOM이 완전히 로드될 때까지 기다린 후, <code>processElement</code> 함수가 실행
INCH 객체가 반환되어 전역 변수 INCH에 할당
결과적으로 스크립트가 로드되면 IIFE가 즉시 실행되고, <code>processElement</code> 함수가 DOM을 탐색하여 이벤트 리스너를 등록하게 된다. 이후에는 사용자의 상호작용에 따라 해당 이벤트 리스너가 호출되어 API 요청이 발생할 것이다.

### htmx 초기 세팅(2)

1. hx-target이 추가되었다.

2. hx-swap-style이 추가되었다.
   현재는 outerHTML, append만 지원하는 거 같다.

3. 현재는 hx-get 기능만 있어 get 메소드만 지원하나
   추후 다른 메소드까지 지원할 수 있도록 하려는 것 같다.
