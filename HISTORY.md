### htmx 초기 세팅(1)

주어진 코드는 IIFE (Immediately Invoked Function Expression) 패턴을 사용하여 정의되어 있다.
IIFE는 함수를 정의하고 즉시 호출하는 패턴으로, 스크립트가 로드되자마자 실행됩니다. 코드의 마지막 부분에서는 return { version: "0.0.1" }을 통해 INCH 객체를 반환하고 있습니다.

따라서 해당 스크립트를 로드하면 IIFE가 즉시 실행되어 INCH 객체를 생성하고 반환합니다. 그리고 INCH 객체가 반환되어 INCH.version을 통해 해당 버전을 확인할 수 있게 됩니다.

실행 순서는 다음과 같습니다:

스크립트가 로드되면 IIFE가 실행됩니다.
processElement 함수는 document.body를 시작으로 DOM의 모든 자식 요소를 검사하며 hx-get 속성을 가진 요소에 대해 이벤트 리스너를 등록합니다.
ready 함수를 사용하여 DOM이 완전히 로드될 때까지 기다린 후, processElement 함수가 실행됩니다.
INCH 객체가 반환되어 전역 변수 INCH에 할당됩니다.
결과적으로 스크립트가 로드되면 IIFE가 즉시 실행되고, processElement 함수가 DOM을 탐색하여 이벤트 리스너를 등록하게 됩니다. 이후에는 사용자의 상호작용에 따라 해당 이벤트 리스너가 호출되어 API 요청이 발생할 것입니다.
