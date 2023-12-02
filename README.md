# README 겸 commit 상세 changelog

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

<hr />

### htmx 초기 세팅(2)

- commit: 71cfdaa8ef444cda42ec57f517c8612e39fcece3

1. <code>hx-target</code>이 추가되었다.

2. <code>hx-swap-style</code>이 추가되었다.
   현재는 outerHTML, append만 지원하는 거 같다.

3. 현재는 <code>hx-get</code> 기능만 있어 get 메소드만 지원하나
   추후 다른 메소드까지 지원할 수 있도록 하려는 것 같다.

<hr />

### htmx 초기 세팅(3)

- commit: f0a199b4a6601d22766a799507ceaa0f034572c5

1. <code>hx-swap-style</code>의 속성 값으로 prepend가 추가되었다.
2. <code>makeNode</code>의 함수명이 <code>makeFragment</code>로 변경되었다.
   <details>
      <summary>node와 fragment의 차이점</summary>
      - node
         DOM에서 모든 노드의 기본 인터페이스를 나타낸다. 단순한 Text도 하나의 node이다.
         `<p>이것은 <strong>텍스트</strong>입니다.</p>`에서 `텍스트`,`입니다.`가 Text 노드이다.
         즉, 좀 더 포괄적인 의미가 된다.
      - fragment
         fragment는 HTMLElement의 집합이다.

   즉, 해당 함수명을 좀 더 명시적으로 fragment를 만든다는 의미를 내포하기 위해 변경한 것이다.
   </details>

3. 204 status code는 no content이다. api response가 성공을 해도 204는 swap이 일어나지 않도록 제외시켰는데, 아마 컨텐츠가 없는데 스왑이 일어나니깐 버그가 발생해서 추가한 것 같다.

<hr />

### htmx 초기 세팅(4)

- commit: 897f5134aaaaf6e960060252e540cc703df020e0

1. 드디어 <code>hx-swap-style</code>이 <code>hx-swap</code>으로 변경됐다.
2. click 이벤트 리스너에 이벤트 버블링이 발생했던 거 같다. <code>e.stopPropagation()</code> 함수가 추가됐다.
3. 테스트를 할 수 있는 index.html이 추가돼었다.
4. <code>getAttribute</code> 함수가 추가돼었다. data- 접두어에 대응하기 위해 추가되었다.

### htmx 초기 세팅(5)

- commit: 6f86acdc762ecaf5fa4011c4f9523d320f819430

1. <code>getAttribute</code>의 이름이 <code>getAttributeValue</code> 함수로 이름이 바뀌었다.
2. 기존 click 트리거만 지원하는 거에서 change, submit 등등 다양한 트리거를 지원하게끔 기능이 추가되었다.
3. trigger의 load 기능이 추가되었다. 
4. 변수 선언 방식이 let에서 var로 변경되었다. -> es6를 지원하지 않는 환경에서만 지원되도록 하기 위함인 것 같다. 
5. [classes-tool](https://htmx.org/extensions/class-tools/) 이 기능이 추가되었다. hx-add-class라는 속성과 hx-remove-class(나중에 약어로 classes로 변경되는 것 같다.)을 통해서 클래스를 추가하거나 제거할 수 있도록 한다.

### htmx 초기 세팅(6)

- commit: 499747ef8c36faa1091323c4587eec2dbb55303e

1. header를 지원하기 위한 기능들이 추가되었다. -> 추후에 삭제된다.
2. history 기능이 추가되었다. -> 추후에 삭제된다.
3. <code>swapResponse</code>에 중복코드가 많아 <code>processResponseNodes</code>를 추가

### htmx 초기 세팅(7)

- commit: 

1. <code>hx-trigger</code>의 <code>every</code> 기능이 추가되었고 
   이를 지원하기 위해 <code>processPolling</code> 함수가 추가되었다. 재귀식으로 지속적으로 호출한다.
2. <code>hx-indicator</code> 기능이 추가되었다.
3. 다양한 get, post, put 등 등 method 등이 지원하도록 기능이 추가되었다.