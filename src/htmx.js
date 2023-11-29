/**
 * 일단 IIFE 패턴으로 변수를 선언한다.
 */
var inchTMX = inchTMX || (function(){
    /**
     * @param {HTMLElement} elt element
     * @param {string} qualifiedName 찾으려는 속성명, 예를 들어 <div id="test" />라고 했을 때 qualifiedName는 id가 되고 속성값은 test가 되겠다.
     * @description data- 접두어를 쓰려고 추가한 메소드인 것 같다.
     * @returns {null | string} 속성값
     */
    function getAttributeValue(elt, qualifiedName) {
        return elt.getAttribute(qualifiedName) || elt.getAttribute("data-" + qualifiedName);
    }

    /**
     * @param {HTMLElement} elt element
     * @param {string} attributeName 찾으려는 속성명
     * @description 인자로 받은 element에서 인자로 받은 속성을 가진 가장 가까운 element의 해당 속성의 값을 리턴한다.
     *              재귀 형식으로 자식 엘리먼트까지 탐색을 진행한다.
     * @returns {null | string} 속성값
     */
    function getClosestAttributeValue(elt, attributeName)
    {
        var attribute = getAttributeValue(elt, attributeName);
        if(attribute)
        {
            return attribute;
        }
        else if (elt.parentElement)
        {
            return getClosestAttributeValue(elt.parentElement, attributeName);
        }
        else
        {
            return null;
        }
    }

    /**
     * @param {HTMLElement} elt 엘리먼트
     * @description "hx-target"을 가진 가장 가까운 엘리먼트를 리턴한다.
     * @returns {HTMLElement} 찾은 HTMLElement
     */
    function getTarget(elt) {
        var targetVal = getClosestAttributeValue(elt, "hx-target");
        if (targetVal) {
            return document.querySelector(targetVal);
        } else {
            return elt;
        }
    }

    /**
     * @param {string} resp 문자열
     * @description createRange() 메소드를 통해 Range 객체를 생성한다. 그 후, createContextualFragment 메서드를 통해
     *              새로운 DOM 노드를 반환한다.
     * @returns {DocumentFragment | HTMLElement} 반환되는 DOM 노드, DocumentFragment는 일반적으로 동적으로 생성된 컨텐츠나 여러 요소를 일괄적으로 삽입할 때 사용된다. 즉, node의 집합(여러 HTML 요소를 담고 있다.)
     */
    function makeFragment(resp) {
        var range = document.createRange();
        return range.createContextualFragment(resp);
    }

    /**
     * @param {HTMLElement} elt 스왑을 진행할 element, 부모 element가 될 수도 있고 자식 element가 될 수도 있다.
     * @param {HTMLElement} resp 스왑을 통해 바뀔 HTMLElement
     * @description 실제 swap을 진행한다.
     */
    function swapResponse(elt, resp) {
        var target = getTarget(elt);
        var swapStyle = getClosestAttributeValue(elt, "hx-swap");
        if (swapStyle === "outerHTML") {
            var fragment = makeFragment(resp);
            for (var i = fragment.children.length - 1; i >= 0; i--) {
                const child = fragment.children[i];
                processElement(child);
                target.parentElement.insertBefore(child, target.firstChild);
            }
            target.parentElement.removeChild(target);
        } else if (swapStyle === "prepend") {
            var fragment = makeFragment(resp);
            for (var i = fragment.children.length - 1; i >= 0; i--) {
                const child = fragment.children[i];
                processElement(child);
                target.insertBefore(child, target.firstChild);
            }
        } else if (swapStyle === "append") {
            var fragment = makeFragment(resp);
            for (var i = 0; i < fragment.children.length; i++) {
                const child = fragment.children[i];
                processElement(child);
                target.appendChild(child);
            }
        } else {
            target.innerHTML = resp;
            for (var i = 0; i < target.children.length; i++) {
                const child = target.children[i];
                processElement(child);
            }
        }
    }

    /**
     * @param {string} elt 바인딩할 element 값
     * @param {string} url api 주소
     * @description 실제 api 통신을 진행한다.
     */
    function issueAjaxRequest(elt, url) {
        // XMLHttpRequest 객체는 서버로부터 XML 데이터를 전송받아 처리하는 데 사용됩니다.
        var request = new XMLHttpRequest();
        // open() 메소드의 세 번째 인수로 true를 전달함으로써 비동기식으로 요청을 보낸다.
        request.open('GET', url, true);
        request.onload = function() {
            if(this.status >= 200 && this.status < 400) {
                if (this.status != 204) {
                    // 통신 Success
                    var resp = this.response;
                    swapResponse(elt, resp);
                }
            } else {
                elt.innerHTML = "ERROR";
            }
        };
        request.onerror = function () {
            // There was a connection error of some sort
        };
        // 이제 실제로 데이터를 보낸다..!
        request.send();
    }

    /**
     * @param {string} elt 검사할 element
     * @param {string} selector 태그 이름
     * @description 태그가 일치하면 true, 일치하지 않으면 false
     * @return {boolean} 결과값
    */
    function matches(el, selector) {
        return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
    }

    /**
     * @param {string} elt 트리거를 발생시킬 element
     * @description 트리거를 click만에서 click, submit, change 등등 트리거들을 추가한다.
     */
    function getTrigger(elt) {
        var explicitTrigger = getClosestAttributeValue(elt, 'hx-trigger');
        if (explicitTrigger) {
            return explicitTrigger;
        } else {
            if (matches(elt, 'button')) {
                return 'click';
            } else if (matches(elt, 'form')) {
                return 'submit';
            } else if (matches(elt, 'input, textarea, select')) {
                return 'change';
            } else {
                return 'click';
            }
        }
    }

    /**
     * @param {string} classInfo
     * @param {string} element 정보
     * @param {string} operation 여러 명령어 일단, remove, add만 있다.
     * @description 클래스를 추가한다.
     */ 
     function processClassList(elt, classList, operation) {
        var values = classList.split(",");
        for (var i = 0; i < values.length; i++) {
            var cssClass = "";
            var delay = 50;
            if (values[i].trim().indexOf(":") > 0) {
                var split = values[i].trim().split(':');
                cssClass = split[0];
                delay = parseInterval(split[1]);
            } else {
                cssClass = values[i].trim();
            }
            setTimeout(function () {
                elt.classList[operation].call(elt.classList, cssClass);
            }, delay);
        }
    }

    /**
     * @param {string} elt 바인딩된 element
     * @description hx-get 속성을 가진 모든 요소를 재귀 방식으로 싹다 api 호출할 수 있도록  api 호출 함수를 바인딩한다.
     */
    function processElement(elt) {
        if(elt.getAttributeValue('hx-get')) {
            var trigger = getTrigger(elt);
            if (trigger === 'load') {
                issueAjaxRequest(elt, getAttributeValue(elt, 'hx-get'));
            } else {
                elt.addEventListener(trigger, function(evt){
                    issueAjaxRequest(elt, getAttributeValue(elt, 'hx-get'));
                    evt.stopPropagation();
                });
            }
        }
        if (getAttributeValue(elt, 'hx-add-class')) {
            processClassList(elt, getAttributeValue(elt,'hx-add-class'), "add");
        }
        if (getAttributeValue(elt, 'hx-remove-class')) {
            processClassList(elt, getAttributeValue(elt,'hx-remove-class'), "remove");
        }
        for (var i = 0; i < elt.children.length; i++) {
            const child = elt.children[i];
            processElement(child);
        }
    }

    function ready(fn) {
        if(document.readyState != 'loading'){
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    ready(function() {
        processElement(document.body);
    });

    // Public API
    return {
        processElement : processElement,
        version: "0.0.1"
    }
})();