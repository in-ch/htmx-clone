/**
 * 일단 IIFE 패턴으로 변수를 선언한다.
 */
var INCH = INCH || (function(){
    /**
     * @param {HTMLElement} elt element ex) 엘리먼트
     * @param {string} attributeName 찾으려는 속성명
     * @description 인자로 받은 element에서 인자로 받은 속성을 가진 가장 가까운 element의 해당 속성의 값을 리턴한다.
     *              재귀 형식으로 자식 엘리먼트까지 탐색을 진행한다.
     * @returns {null | string} 속성값
     */
    function getClosestAttributeValue(elt, attributeName)
    {
        let attribute = elt.getAttribute(attributeName);
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
        let targetVal = getClosestAttributeValue(elt, "hx-target");
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
    function makeNode(resp) {
        let range = document.createRange();
        return range.createContextualFragment(resp);
    }

    /**
     * @param {HTMLElement} elt 스왑을 진행할 element, 부모 element가 될 수도 있고 자식 element가 될 수도 있다.
     * @param {HTMLElement} resp 스왑을 통해 바뀔 HTMLElement
     * @description 실제 swap을 진행한다.
     */
    function swapResponse(elt, resp) {
        let target = getTarget(elt);
        let swapStyle = getClosestAttributeValue(elt, "hx-swap-style");
        if (swapStyle === "outerHTML") {
            target.outerHTML = resp;
            processElement(target);
        } else if (swapStyle === "append") {
            let newChild = makeNode(resp);
            processElement(elt);
            target.appendChild(newChild)
        } else {
            target.innerHTML = resp;
            for (let i = 0; i < target.children.length; i++) {
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
                // 통신 Success
                var resp = this.response;
                swapResponse(elt, resp);
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
     * @param {string} elt 바인딩된 element
     * @description hx-get 속성을 가진 모든 요소를 재귀 방식으로 싹다 api 호출할 수 있도록  api 호출 함수를 바인딩한다.
     */
    function processElement(elt) {
        if(elt.getAttribute('hx-get')) {
            elt.addEventListener("click", function(){
                issueAjaxRequest(elt, elt.getAttribute('hx-get'))
            });
        }
        for (let i = 0; i < elt.children.length; i++) {
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

    return {
        version: "0.0.1"
    }
})();