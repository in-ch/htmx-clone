/**
 * 일단 IIFE 패턴으로 변수를 선언한다.
 */
var inchTMX = inchTMX || (function(){
    'use strict';

    var VERBS = ['get', 'post', 'put', 'delete', 'patch']

    /**
     * 문자열로 표현된 시간 간격 또는 지속 시간을 파싱한다.
     * @param {string} str 파싱할 입력 문자열
     * @description 이 함수는 밀리초(ms) 및 초(s)를 포함한 다양한 형식의 시간 간격을 처리
     *              입력 문자열이 "null," "false," 또는 빈 문자열인 경우 null을 반환
     * @returns {null | number} 파싱된 시간 간격(밀리초) 또는 입력이 잘못된 경우 null을 반환
     */
    function parseInterval(str) {
        if (str === "null" || str === "false" || str === "") {
            return null;
        } else if (str.lastIndexOf("ms") === str.length - 2) {
            return parseFloat(str.substr(0, str.length - 2));
        } else if (str.lastIndexOf("s") === str.length - 1) {
            return parseFloat(str.substr(0, str.length - 1)) * 1000;
        } else {
            return parseFloat(str);
        }
    }

    /**
     * @param {HTMLElement} elt element
     * @param {string} qualifiedName 찾으려는 속성명, 예를 들어 <div id="test" />라고 했을 때 qualifiedName는 id가 되고 속성값은 test가 되겠다.
     * @description data- 접두어를 쓰려고 추가한 메소드인 것 같다.
     * @returns {null | string} 속성값
     */
    function getAttributeValue(elt, qualifiedName) {
        return elt.getAttribute && (elt.getAttribute(qualifiedName) || elt.getAttribute("data-" + qualifiedName));
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
     * @param {string} elt 검사할 element
     * @param {string} selector 태그 이름
     * @description 태그가 일치하면 true, 일치하지 않으면 false
     * @return {boolean} 결과값
    */
    function matches(elt, selector) {
        return (elt != null) &&(elt.matches || elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector || elt.webkitMatchesSelector || elt.oMatchesSelector).call(elt, selector);
    }

    /**
     * @description 가장 가까운 selector를 찾는다.
    */
    function closest (elt, selector) {
        do if (elt == null || matches(elt, selector)) return elt;
        while (elt = elt && elt.parentElement);
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
     * @param {string} o [object Object] 인지 검사
     * @return {boolean} rawObject이면 true, 아니면 false 
     */
     function isRawObject(o){
        return Object.prototype.toString.call(o) === "[object Object]";
    }

    /**
     * @param {HTMLElement} elt 내부 데이터를 관리할 요소
     * @returns {Object} 요소에 연결된 내부 데이터 객체
     * @description 주어진 요소(elt)에 대한 내부 데이터를 관리하는 함수
     *              이 함수는 주어진 요소에 대한 내부 데이터를 가져오거나, 만약 데이터가 없다면 새로 생성하여 연결
     *              내부 데이터는 요소에 'hx-data-internal'라는 속성으로 저장되며, 해당 속성이 비어있거나 존재하지 않으면 빈 객체가 새로 생성되어 연결
     */
    function getInternalData(elt) {
        var dataProp = 'hx-data-internal';
        var data = elt[dataProp];
        if (!data) {
            data = elt[dataProp] = {};
        }
        return data;
    }

    /**
     * @description object를 array로 만든다.
    */
    function toArray(object) {
        var arr = [];
        for (var i = 0; i < object.length; i++) {
            arr.push(object[i])
        }
        return arr;
    }

    /**
     * @description 반복문 utility
    */
    function forEach(arr, func) {
        for (var i = 0; i < arr.length; i++) {
            func(arr[i]);
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
     * @param {HTMLElement} child 자식 엘리먼트
     * @description "ic-swap-direct"을 가졌다면 바로 swap을 해버린다.
     * @returns {boolean}
     */
    function directSwap(child) {
        if (getAttributeValue(child, 'ic-swap-direct')) {
            var target = document.getElementById(child.getAttribute('id'));
            if (target) {
                var newParent = target.parentElement;
                newParent.insertBefore(child, target);
                newParent.removeChild(target);
                return true;
            }
        }
        return false;
    }

    /**
     * @param {HTMLElement} parent 부모 엘리먼트
     * @param {string} text api 리스폰스 값 
     * @param {string} target hx-target의 타겟 엘리먼트 
     * @description node를 생성한다.
    */
     function processResponseNodes(parentNode, insertBefore, text, executeAfter) {
        var fragment = makeFragment(text);
        forEach(toArray(fragment.childNodes), function(child){
            if (!directSwap(child)) {
                parentNode.insertBefore(child, insertBefore);
            }
            if (child.nodeType !== Node.TEXT_NODE) {
                triggerEvent(child, 'load.hx', {parent:child.parentElement});
                processElement(child);
            }
        })
        if(executeAfter) {
            executeAfter.call();
        }
    }

    /**
     * @param {HTMLElement} elt 엘리먼트
     * @param {HTMLElement[]} possible match가 가능한 엘리먼트 배열
     * @return {HTMLElement[] | null} 
    */
    function findMatch(elt, possible) {
        for (var i = 0; i < possible.length; i++) {
            var candidate = possible[i];
            if (elt.hasAttribute("id") && elt.id === candidate.id) {
                return candidate;
            }
            if (!candidate.hasAttribute("id") && elt.tagName === candidate.tagName) {
                return candidate;
            }
        }
        return null;
    }

    /**
     * @param {HTMLElement} mergeTo 엘리먼트
     * @param {HTMLElement} mergeFrom 엘리먼트
     * @return {HTMLElement} 
    */
    function cloneAttributes(mergeTo, mergeFrom) {
        forEach(mergeTo.attributes, function (attr) {
            if (!mergeFrom.hasAttribute(attr.name)) {
                mergeTo.removeAttribute(attr.name)
            }
        });
        forEach(mergeFrom.attributes, function (attr) {
            mergeTo.setAttribute(attr.name, attr.value);
        });
    }

    function mergeChildren(mergeTo, mergeFrom) {
        var oldChildren = toArray(mergeTo.children);
        var marker = document.createElement("span");
        mergeTo.insertBefore(marker, mergeTo.firstChild);
        forEach(mergeFrom.childNodes, function (newChild) {
            var match = findMatch(newChild, oldChildren);
            if (match) {
                while (marker.nextSibling && marker.nextSibling !== match) {
                    mergeTo.removeChild(marker.nextSibling);
                }
                mergeTo.insertBefore(marker, match.nextSibling);
                mergeInto(match, newChild);
            } else {
                mergeTo.insertBefore(newChild, marker);
            }
        });
        while (marker.nextSibling) {
            mergeTo.removeChild(marker.nextSibling);
        }
        mergeTo.removeChild(marker);
    }

    function mergeInto(mergeTo, mergeFrom) {
        cloneAttributes(mergeTo, mergeFrom);
        mergeChildren(mergeTo, mergeFrom);
    }

    /**
     * @description 실제 merge를 실시한다.
    */
    function mergeResponse(target, resp) {
        var fragment = makeFragment(resp);
        mergeInto(target, fragment.firstElementChild);
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
        if (swapStyle === "merge") {
            mergeResponse(target, resp);
        } else if (swapStyle === "outerHTML") {
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
        return elt.dispatchEvent(event);
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
        forEach(values, function(value){
            var cssClass = "";
            var delay = 50;
            var trimmedValue = value.trim();
            if (trimmedValue.indexOf(":") > 0) {
                var split = trimmedValue.split(':');
                cssClass = split[0];
                delay = parseInterval(split[1]);
            } else {
                cssClass = trimmedValue;
            }
            setTimeout(function () {
                elt.classList[operation].call(elt.classList, cssClass);
            }, delay);
        });
    }

    /**
     * @param {HTMLElement} elt element 요소
     * @param {string} verb action들, get, post 등등 
     * @param {string} path api 주소
     * @description every trigger가 추가되었다. 지속적으로 polling을 실시한다. 
     */
    function processPolling(elt, verb, path) {
        var trigger = getTrigger(elt);
        var nodeData = getInternalData(elt);
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
                nodeData.timeout = timeout;
            }
        }
    }

    /**
     * @param {string} elt 바인딩된 element
     * @description hx-get 속성을 가진 모든 요소를 재귀 방식으로 싹다 api 호출할 수 있도록  api 호출 함수를 바인딩한다.
     */
    function processElement(elt) {
        var nodeData = getInternalData(elt);
        if (nodeData.processed) {
            return;
        } else {
            nodeData.processed = true;
        }

        forEach(VERBS, function(verb){
            var path = getAttributeValue(elt, 'hx-' + verb);
            if (path) {
                var trigger = getTrigger(elt);
                if (trigger === 'load') {
                    if (!nodeData.loaded) {
                        nodeData.loaded = true;
                        issueAjaxRequest(elt, verb, path);
                    }
                } else if (trigger.trim().indexOf('every ') === 0) {
                    nodeData.polling = true;
                    processPolling(elt, action, path);
                } else {
                    var eventListener = function (evt) {
                        var eventData = getInternalData(evt);
                        if (!eventData.handled) {
                            eventData.handled = true;
                            issueAjaxRequest(elt, verb, path, evt.target);
                        }
                    };
                    nodeData.trigger = trigger;
                    nodeData.eventListener = eventListener;
                    elt.addEventListener(trigger, eventListener);
                }
                return;
            }
        });
        if (getAttributeValue(elt, 'hx-add-class')) {
            processClassList(elt, getAttributeValue(elt, 'hx-add-class'), "add");
        }
        if (getAttributeValue(elt, 'hx-remove-class')) {
            processClassList(elt, getAttributeValue(elt, 'hx-remove-class'), "remove");
        }
        forEach(elt.children, function(child) { processElement(child) });
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
        forEach(indicators, function(ic) {
            ic.classList[action].call(ic.classList, "hx-show-indicator");
        });
    }

    /**
     * 주어진 요소(elt)가 이미 처리된 노드 목록(processed)에 있는지 확인
     * @param {Array<HTMLElement>} processed 처리된 요소 목록
     * @param {HTMLElement} elt 확인할 요소
     * @returns {boolean} 이미 처리된 경우 true, 그렇지 않은 경우 false를 반환
     */
    function haveSeenNode(processed, elt) {
        for (var i = 0; i < processed.length; i++) {
            var node = processed[i];
            if (node.isSameNode(elt)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {Array<HTMLElement>} processed 처리된 요소 목록
     * @param {Object} values 값 목록
     * @param {HTMLElement} elt 처리할 요소
     * @description 입력 값을 처리하고 처리된 노드와 값을 추적
     */
    function processInputValue(processed, values, elt) {
        if (elt == null || haveSeenNode(processed, elt)) {
            return;
        } else {
            processed.push(elt);
        }
        var name = elt.getAttribute("name");
        var value = elt.value;
        if (name && value) {
            var current = values[name];
            if(current) {
                if (Array.isArray(current)) {
                    current.push(value);
                } else {
                    values[name] = [current, value];
                }
            } else {
                values[name] = value;
            }
        }
        if (matches(elt, 'form')) {
            var inputs = elt.elements;
            for (var i = 0; i < inputs.length; i++) {
                processInputValue(processed, values, inputs[i]);
            }
        }
    }

    /**
     * @param {HTMLElement} elt 입력 값을 수집할 요소
     * @returns {Object | null} 수집된 입력 값 목록 또는 null (값이 없는 경우)
     * @description 주어진 요소(elt)와 관련된 입력 값을 수집
     */
    function getInputValues(elt) {
        var processed = [];
        var values = {};

        processInputValue(processed, values, elt);

        var includes = getAttributeValue(elt, "hx-include");
        if (includes) {
            var nodes = document.querySelectorAll(includes);
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                processInputValue(processed, values, node);
            }
        }

        processInputValue(processed, values, closest(elt, 'form'));
        return Object.keys(values).length == 0 ? null : values;
    }

    /**
     * @param {string} returnStr 현재까지의 URL 쿼리 문자열
     * @param {string} name 추가할 키
     * @param {string} realValue 추가할 값
     * @returns {string} 업데이트된 URL 쿼리 문자열
     * @description URL 쿼리 문자열에 키-값 쌍을 추가하는 유틸
     *              이 함수는 주어진 URL 쿼리 문자열에 새로운 키-값 쌍을 추가
     *              이미 문자열이 비어있지 않다면 '&'로 구분하여 기존 문자열에 새로운 쿼리를 연결하고,
     *              키와 값은 encodeURIComponent를 통해 인코딩되어 추가된다.
     */
    function appendParam(returnStr, name, realValue) {
        if (returnStr !== "") {
            returnStr += "&";
        }
        returnStr += encodeURIComponent(name) + "=" + encodeURIComponent(realValue);
        return returnStr;
    }

    /**
     * @param {Object} values 인코딩할 값들이 담긴 객체
     * @returns {string} URL 쿼리 문자열
     * @description 주어진 객체(values)를 URL 쿼리 문자열로 인코딩
     */
    function urlEncode(values) {
        var returnStr = "";
        for (var name in values) {
            if (values.hasOwnProperty(name)) {
                var value = values[name];
                if (Array.isArray(value)) {
                    for (var i = 0; i < value.length; i++) {
                        returnStr = appendParam(returnStr, name, value[i]);
                    }
                } else {
                    returnStr = appendParam(returnStr, name, value);
                }
            }
        }
        return returnStr;
    }

    /**
     * @param {XMLHttpRequest} xhr 헤더를 설정할 XMLHttpRequest 객체
     * @param {string} name 설정할 헤더의 이름
     * @param {string} value 설정할 헤더의 값
     * @param {boolean} noPrefix 헤더에 "X-HX-" 접두사를 추가할지 여부 (기본값: false)
     * @description XMLHttpRequest 객체의 헤더를 설정하는 함수
     *              XMLHttpRequest 객체의 헤더를 설정
     *              헤더 이름에 "X-HX-" 접두사를 추가하려면 `noPrefix` 매개변수를 false로 설정하면 된다.
     *              설정된 값이 없을 경우, 빈 문자열이 기본값으로 사용
    */
    function setHeader(xhr, name, value, noPrefix) {
        xhr.setRequestHeader((noPrefix ? "" : "X-HX-") + name, value || "");
    }

    /**
     * @param {string} elt 바인딩할 element 값
     * @param {string} verb get, post, put 등 등 rest api 메소드
     * @param {string} path api 주소
     * @description 실제 api 통신을 진행한다.
     */
    function issueAjaxRequest(elt, verb, path) {
        var eltData = getInternalData(elt);
            if (eltData.requestInFlight) {
                return;
            } else {
                eltData.requestInFlight = true;
            }
            var endRequestLock = function(){
                eltData.requestInFlight = false
            }
            var target = getTarget(elt);
            var promptQuestion = getClosestAttributeValue(elt, "hx-prompt");
            if (promptQuestion) {
                var prompt = prompt(promptQuestion);
                if(!triggerEvent(elt, 'prompt.hx', {prompt: prompt, target:target})) return endRequestLock();
            }

            var confirmQuestion = getClosestAttributeValue(elt, "hx-confirm");
            if (confirmQuestion) {
                if(!confirm(confirmQuestion)) return endRequestLock();
            }

            var xhr = new XMLHttpRequest();

            var inputVals = getInputValues(elt);
            if(!triggerEvent(elt, 'values.hx', {values: inputVals, target:target})) return endRequestLock();

            if (verb === 'get') {
                xhr.open('GET', path + (inputVals ? "?" + urlEncode(inputVals) : ""), true);
            } else {
                xhr.open('POST', path, true);
                setHeader(xhr,'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8', true);
                if (verb !== 'post') {
                    setHeader(xhr, 'X-HTTP-Method-Override', verb.toUpperCase(), true);
                }
            }

            xhr.overrideMimeType("text/html");

            setHeader(xhr, "Request", "true");
            setHeader(xhr,"Trigger-Id", elt.getAttribute("id"));
            setHeader(xhr,"Trigger-Name", elt.getAttribute("name"));
            setHeader(xhr,"Target-Id", target.getAttribute("id"));
            setHeader(xhr,"Current-URL", document.location.href);
            if (prompt) {
                setHeader(xhr,"Prompt", prompt);
            }
            if (eventTarget) {
                setHeader(xhr,"Event-Target", eventTarget.getAttribute("id"));
            }
            if (document.activeElement) {
                setHeader(xhr,"Active-Element", document.activeElement.getAttribute("id"));
                if (document.activeElement.value) {
                    setHeader(xhr,"Active-Element-Value", document.activeElement.value);
                }
            }

            xhr.onload = function () {
                try {
                    if(!triggerEvent(elt, 'beforeOnLoad.hx', {xhr:xhr, target:target})) return;
                    snapshotForCurrentHistoryEntry(elt, path);
                    var trigger = this.getResponseHeader("X-HX-Trigger");
                    handleTrigger(elt, trigger);
                    initNewHistoryEntry(elt, path);
                    if (this.status >= 200 && this.status < 400) {
                        // don't process 'No Content' response
                        if (this.status != 204) {
                            // Success!
                            var resp = this.response;
                            if(!triggerEvent(elt, 'beforeSwap.hx', {xhr:xhr, target:target})) return;
                            swapResponse(target, elt, resp, function(){
                                updateCurrentHistoryContent();
                                triggerEvent(elt, 'afterSwap.hx', {xhr:xhr, target:target});
                            });
                        }
                    } else {
                        triggerEvent(elt, 'errorResponse.hx', {xhr:xhr, response: xhr.response, status: xhr.status, target:target});
                    }
                } finally {
                    removeRequestIndicatorClasses(elt);
                    triggerEvent(elt, 'afterOnLoad.hx', {xhr:xhr, response: xhr.response, status: xhr.status, target:target});
                    endRequestLock();
                }
            };

            xhr.onerror = function () {
                removeRequestIndicatorClasses(elt);
                triggerEvent(elt, 'onError.hx', {xhr:xhr});
                endRequestLock();
            };

            if(!triggerEvent(elt, 'beforeRequest.hx', {xhr:xhr, values: inputVals, target:target})) return endRequestLock();
            addRequestIndicatorClasses(elt);
            xhr.send(verb === 'get' ? null : urlEncode(inputVals));
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