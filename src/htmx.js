/**
 * 일단 IIFE 패턴으로 변수를 선언한다.
 */
var INCH = INCH || (function(){
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
                elt.innerHTML = resp;
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
    // DOM element processing
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