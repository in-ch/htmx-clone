/**
 * 일단 IIFE 패턴으로 변수를 선언한다.
 */
var inchTMX = inchTMX || (function(){
    'use strict';

    var VERBS = ['get', 'post', 'put', 'delete', 'patch']

    function parseInterval(str) {
        if (str === "null" || str === "false" || str === "") {
            return null;
        } else if (str.lastIndexOf("ms") === str.length - 2) {
            return parseFloat(str.substr(0, str.length - 2));
        } else if (str.lastIndexOf("s") === str.length - 1) {
            return parseFloat(str.substr(0, str.length - 1)) * 1000;
        } else {
            return 1000;
        }
    }

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
     * @param {HTMLElement} parent 부모 엘리먼트
     * @param {string} text api 리스폰스 값 
     * @param {string} target hx-target의 타겟 엘리먼트 
     * @description node를 생성한다.
    */
    function processResponseNodes(parent, target, text) {
        var fragment = makeFragment(text);
        for (var i = fragment.childNodes.length - 1; i >= 0; i--) {
            var child = fragment.childNodes[i];
            parent.insertBefore(child, target);
            if (child.nodeType != Node.TEXT_NODE) {
                processElement(child);
            }
        }
    }

    /**
     * @param {HTMLElement} target 스왑을 진행할 element, 부모 element가 될 수도 있고 자식 element가 될 수도 있다.
     * @param {HTMLElement} elt 스왑을 진행할 element, 부모 element가 될 수도 있고 자식 element가 될 수도 있다.
     * @param {HTMLElement} resp 스왑을 통해 바뀔 HTMLElement
     * @param {HTMLElement} after after 후에 실행될 function
     * @description 실제 swap을 진행한다.
     */
    function swapResponse(target, elt, resp, after) {
        var swapStyle = getClosestAttributeValue(elt, "hx-swap");
        if (swapStyle === "outerHTML") {
            processResponseNodes(target.parentElement, target, resp, after);
            target.parentElement.removeChild(target);
        } else if (swapStyle === "prepend") {
            processResponseNodes(target, target.firstChild, resp, after);
        } else if (swapStyle === "prependBefore") {
            processResponseNodes(target.parentElement, target, resp, after);
        } else if (swapStyle === "append") {
            processResponseNodes(target, null, resp, after);
        } else if (swapStyle === "appendAfter") {
            processResponseNodes(target.parentElement, target.nextSibling, resp, after);
        } else {
            target.innerHTML = "";
            processResponseNodes(target, null, resp, after);
        }
    }

    /**
     * @param {string} elt element 이름 
     * @param {string} eventName 이벤트 이름
     * @param {CustomEventInit<any> | undefined} CustomEvent 객체의 detail 인자값
    */
    function triggerEvent(elt, eventName, details) {
        details["elt"] = elt;
        if (window.CustomEvent && typeof window.CustomEvent === 'function') {
            var event = new CustomEvent(eventName, {detail: details});
        } else {
            var event = document.createEvent('CustomEvent');
            event.initCustomEvent(eventName, true, true, details);
        }
        elt.dispatchEvent(event);
    }

    /**
     * @param {string} o [object Object] 인지 검사
     * @return {boolean} rawObject이면 true, 아니면 false 
    */
    function isRawObject(o){
        return Object.prototype.toString.call(o) === "[object Object]";
    }

    /**
     * @param {string} elt element 이름 
     * @param {string} trigger X-HX-Trigger
     * @description X-HX-Trigger가 있다면 가져와서 이벤트를 실행
    */
    function handleTrigger(elt, trigger) {
        if (trigger) {
            if (trigger.indexOf("{") === 0) {
                var triggers = JSON.parse(trigger);
                for (var eventName in triggers) {
                    if (triggers.hasOwnProperty(eventName)) {
                        var details = triggers[eventName];
                        if (!isRawObject(details)) {
                            details = {"value": details}
                        }
                        triggerEvent(elt, eventName, details);
                    }
                }
            } else {
                triggerEvent(elt, trigger, []);
            }
        }
    }


    function makeHistoryId() {
        return Math.random().toString(36).substr(3, 9);
    }

    function getHistoryElement() {
        var historyElt = document.getElementsByClassName('hx-history-element');
        if (historyElt.length > 0) {
            return historyElt[0];
        } else {
            return document.body;
        }
    }

    function saveLocalHistoryData(historyData) {
        localStorage.setItem('hx-history', JSON.stringify(historyData));
    }

    function getLocalHistoryData() {
        var historyEntry = localStorage.getItem('hx-history');
        if (historyEntry) {
            var historyData = JSON.parse(historyEntry);
        } else {
            var initialId = makeHistoryId();
            var historyData = {"current": initialId, "slots": [initialId]};
            saveLocalHistoryData(historyData);
        }
        return historyData;
    }

    function newHistoryData() {
        var historyData = getLocalHistoryData();
        var newId = makeHistoryId();
        var slots = historyData.slots;
        if (slots.length > 20) {
            var toEvict = slots.shift();
            localStorage.removeItem('hx-history-' + toEvict);
        }
        slots.push(newId);
        historyData.current = newId;
        saveLocalHistoryData(historyData);
    }

    function updateCurrentHistoryContent() {
        var elt = getHistoryElement();
        var historyData = getLocalHistoryData();
        history.replaceState({"hx-history-key": historyData.current}, document.title, window.location.href);
        localStorage.setItem('hx-history-' + historyData.current, elt.innerHTML);
    }

    function restoreHistory(data) {
        var historyKey = data['hx-history-key'];
        var content = localStorage.getItem('hx-history-' + historyKey);
        var elt = getHistoryElement();
        elt.innerHTML = "";
        processResponseNodes(elt, null, content);
    }

    function snapshotForCurrentHistoryEntry(elt) {
        if (getClosestAttributeValue(elt, "hx-push-url") === "true") {
            // TODO event to allow deinitialization of HTML elements in target
            updateCurrentHistoryContent();
        }
    }

    function initNewHistoryEntry(elt, url) {
        if (getClosestAttributeValue(elt, "hx-push-url") === "true") {
            newHistoryData();
            history.pushState({}, "", url);
            updateCurrentHistoryContent();
        }
    }

    /**
     * @param {HTMLElement} elt 엘리먼트
     * @description indicator를 추가한다.
    */
    function addRequestIndicatorClasses(elt) {
        mutateRequestIndicatorClasses(elt, "add");
    }

    /**
     * @param {HTMLElement} elt 엘리먼트
     * @description indicator를 제거한다.
    */
    function removeRequestIndicatorClasses(elt) {
        mutateRequestIndicatorClasses(elt, "remove");
    }

    /**
     * @param {HTMLElement} elt 엘리먼트
     * @param {string} action add, remove 등 액션
     * @description indicator를 추가하거나 제거한다.
    */
    function mutateRequestIndicatorClasses(elt, action) {
        var indicator = getClosestAttributeValue(elt, 'hx-indicator');
        if (indicator) {
            var indicators = document.querySelectorAll(indicator);
        } else {
            indicators = [elt];
        }
        for (var i = 0; i < indicators.length; i++) {
            indicators[i].classList[action].call(indicators[i].classList, "hx-show-indicator");
        }
    }

    /**
     * @param {string} elt 바인딩할 element 값
     * @param {string} verb get, post, put 등 등 rest api 메소드
     * @param {string} path api 주소
     * @description 실제 api 통신을 진행한다.
     */
    function issueAjaxRequest(elt, verb, path) {
        var target = getTarget(elt);
            if (getClosestAttributeValue(elt, "hx-prompt")) {
                var prompt = prompt(getClosestAttributeValue(elt, "hx-prompt"));
            }

            var xhr = new XMLHttpRequest();
            if (verb === 'get') {
                xhr.open('GET', path, true);
            } else {
                xhr.open('POST', path, true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                if (verb !== 'post') {
                    xhr.setRequestHeader('X-HTTP-Method-Override', verb.toUpperCase());
                }
            }
            xhr.overrideMimeType("text/html");

            // request headers
            xhr.setRequestHeader("X-HX-Request", "true");
            xhr.setRequestHeader("X-HX-Trigger-Id", elt.getAttribute("id") || "");
            xhr.setRequestHeader("X-HX-Trigger-Name", elt.getAttribute("name") || "");
            xhr.setRequestHeader("X-HX-Target-Id", target.getAttribute("id") || "");
            xhr.setRequestHeader("X-HX-Current-URL", document.location.href);
            if (prompt) {
                xhr.setRequestHeader("X-HX-Prompt", prompt);
            }

            xhr.onload = function () {
                snapshotForCurrentHistoryEntry(elt, url);
                var trigger = this.getResponseHeader("X-HX-Trigger");
                handleTrigger(elt, trigger);
                initNewHistoryEntry(elt, url);
                if (this.status >= 200 && this.status < 400) {
                    // don't process 'No Content' response
                    if (this.status != 204) {
                        // Success!
                        var resp = this.response;
                        swapResponse(target, elt, resp, function(){
                            updateCurrentHistoryContent();
                        });
                    }
                } else {
                    // TODO error handling
                    elt.innerHTML = "ERROR";
                }
                removeRequestIndicatorClasses(elt);
            };
            xhr.onerror = function () {
                removeIndicatorClasses(elt);
                elt.innerHTML = "ERROR";
            };
            addRequestIndicatorClasses(elt);
            xhr.send();
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
     * @param {HTMLElement} elt element 요소
     * @param {string} verb action들, get, post 등등 
     * @param {string} path api 주소
     * @description every trigger가 추가되었다. 지속적으로 polling을 실시한다. 
     */
    function processPolling(elt, verb, path) {
        var trigger = getTrigger(elt);
        if (trigger.trim().indexOf("every ") === 0) {
            var args = trigger.split(/\s+/);
            var intervalStr = args[1];
            if (intervalStr) {
                var interval = parseInterval(intervalStr);
                // TODO store for cancelling
                var timeout = setTimeout(function () {
                    if (document.body.contains(elt)) {
                        issueAjaxRequest(elt, verb, path);
                        processPolling(elt, verb, getAttributeValue(etl, "hx-" + verb));
                    }
                }, interval);
            }
        }
    }

    /**
     * @param {string} elt 바인딩된 element
     * @description hx-get 속성을 가진 모든 요소를 재귀 방식으로 싹다 api 호출할 수 있도록  api 호출 함수를 바인딩한다.
     */
    function processElement(elt) {
        for (var i = 0; i < VERBS.length; i++) {
            var verb = VERBS[i];
            var path = getAttributeValue(elt, 'hx-' + verb);
            if (path) {
                var trigger = getTrigger(elt);
                if (trigger === 'load') {
                    issueAjaxRequest(elt, verb, path);
                } else if (trigger.trim().indexOf('every ') === 0) {
                    processPolling(elt, action);
                } else {
                    elt.addEventListener(trigger, function (evt) {
                        issueAjaxRequest(elt, verb, path);
                        evt.stopPropagation();
                    });
                }
                break;
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

    ready(function () {
        processElement(document.body);
        window.onpopstate = function (event) {
            restoreHistory(event.state);
        };
    })

    function internalEval(str){
        return eval(str);
    }
    
    // Public API
    return {
        processElement : processElement,
        version: "0.0.1",
        _:internalEval
    }
})();