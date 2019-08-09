// Singleton Class
var CalcUIUtils = {
    MakeNode : function (nodeName, id, cls, value) {
        'use strict';
        if (nodeName !== null && typeof nodeName !== "string") {
            throw "Please Input NodeName(String).";
        }
        var node = document.createElement(nodeName);
        if (id !== null) {
            node.setAttribute("id", id);
        }
        if (cls !== null) {
            node.setAttribute("class", cls);
        }
        if (value !== null) {
            node.value = value;
        }
        return node;
    },
    // Panel용 생성함수
    MakePanel : function (id, cls, value) {
        'use strict';
        return CalcUIUtils.MakeNode("div", id, cls, value);
    },
    // Text 용 노드 생성 함수
    MakeText : function (id, cls, value) {
        'use strict';
        var node = CalcUIUtils.MakeNode("input", id, cls, value);
        node.setAttribute("type", "text");
        node.disabled = true;
        return node;
    },
    // button 용 노드 생성함수
    MakeButton : function (id, cls, value, eventdispatcher) {
        'use strict';
        var node = CalcUIUtils.MakeNode("input", id, cls, value);
        node.setAttribute("type", "button");
        if (node.addEventListener) {
            node.addEventListener("click", eventdispatcher);
        } else { // < ie8
            node.attachEvent("onclick", eventdispatcher);
        }
        return node;
    }
};


// 공학용 UI 생성 함수 ... 미구현
var CalcAppEngineerUI = {
    MakeCalcUI : function (node, app, config, numbers, operators) {
        'use strict';
        console.warn("Please, Do implement this function.");
    }
};

// 일반용 UI 생성 함수
var CalcAppNormalUI = {
    // 요구사항 및 일반 계산기 UI 생성 함수 레이아웃 배치는 CSS 에서 처리하도록 하고 기본 배치만 정한다.
    MakeCalcUI : function (node, app, config, numbers, operators) {
        'use strict';

        var i, calcPanel, title, titleElm, stackNode, subPanel1, subPanel2, resultNode, numlen, operlen;
        // 단독으로 돌 때도 있고 다른 곳에 서브 프레임에서 타이틀이 불필요할 수 있기 때문에 옵션처리
        title = true;
        if (config && config.title && typeof config.title === "boolean") {
            title = config.title;
        }

        // 기본 패널
        calcPanel = CalcUIUtils.MakePanel(null, "calc_panel");
        if (title === true) {
            titleElm = document.createElement("div");
            titleElm.innerText = "계산기"; // i18n 적용하려면 리소스 관리 정책이 별도로 필요함.
            titleElm.setAttribute("class", "calc_title");
            calcPanel.appendChild(titleElm);
        }
        stackNode = CalcUIUtils.MakeText(null, "calc_text calc_stack");
        app.setStackNode(stackNode);
        calcPanel.appendChild(stackNode);

        // 숫자와 operations 패널을 나눈 이유는 요구사항 기본 디자인에서 기본적인 구획은 가지고 있어야
        // 레이아웃 처리가 쉬울 것으로 판단하여 나눈다.

        subPanel1 = CalcUIUtils.MakePanel(null, "calc_num_panel");
        resultNode = CalcUIUtils.MakeText(null, "calc_text calc_result");
        app.setResultNode(resultNode);
        subPanel1.appendChild(resultNode);
        numlen = numbers.length;
        for (i = 0; i < numlen; i++) {
            subPanel1.appendChild(CalcUIUtils.MakeButton(null, "calc_button calc_number", numbers[i], function (e) {
                app.eventDispatcher(e);
            }));
        }
        calcPanel.appendChild(subPanel1);

        subPanel2 = CalcUIUtils.MakePanel(null, "calc_oper_panel");
        operlen = operators.length;
        for (i = 0; i < operlen; i++) {
            subPanel2.appendChild(CalcUIUtils.MakeButton(null, "calc_button calc_operator", operators[i], function (e) {
                app.eventDispatcher(e);
            }));
        }
        calcPanel.appendChild(subPanel2);

        node.appendChild(calcPanel);
    }
};

// UI 구성을 책임지는 property object
var CalcAppUIProperty = {
    Numbers : ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "="], // 숫자 sub panel에 들어갈 데이터 리스트
    Operators : ["R", "+", "-", "*", "/"], // Operation sub panel에 들어갈 데이터 리스트
    MakeCalcUI : function (node, app, config) {
        'use strict';
        var type = "normal";
        if (config && config.type && typeof config.type === "string") {
            type = config.type;
        }

        var adapter;
        switch(type) {
            case "engineer" :
                adapter = CalcAppEngineerUI;
                break;
            case "normal":
            default:
                adapter = CalcAppNormalUI;
                break;
        }
        adapter.MakeCalcUI(node, app, config, CalcAppUIProperty.Numbers, CalcAppUIProperty.Operators);
    }
};

// 정밀도 부분을 다른 곳에서 신경쓰지 않도록 NUMBER를 Wrapping 한 클래스 생성
// 추후 이것을 통해서
var CalcNumber = function(numberobj) {
    if(this._CalcNumber === null) {
        throw "Please use new CalcApp instance.";
    }
    this._CalcNumber(numberobj);
};

CalcNumber.isNumber = function(data) {
    return !isNaN(parseInt(data));
};

CalcNumber.PRECISION = 100000;
CalcNumber.MAX_INTEGER_LENGTH = 10;
CalcNumber.MAX_DECIMAL_LENGTH = 5;
CalcNumber.MAX_TOTAL_LENGTH = (CalcNumber.MAX_INTEGER_LENGTH + CalcNumber.MAX_DECIMAL_LENGTH);

CalcNumber.prototype._CalcNumber = function(numberobj) {
    if (numberobj != null && numberobj._CalcNumber != null) {
        this.initialize(numberobj.number, numberobj.pointIndex);
    } else {
        this.initialize();
    }
};

CalcNumber.prototype.initialize = function(number, pointIndex) {
    this.number = number || "";
    this.pointIndex = pointIndex || null;
};

CalcNumber.prototype.avaliable = function() {
    return CalcNumber.isNumber(this.number);
};

CalcNumber.prototype.insertNumber = function(numberString) {
    // number가 양수이며 1의 자리 숫자만 들어온다고 가장하고 있다.
    if (CalcNumber.isNumber(numberString)) {
        if (this.pointIndex == null) { // 소수점이 없는경우
            if (this.number.length < 10) { // 단일 입력은 정수는 최대 10자리 수만 가능하도록 한다.
                this.number += numberString;
            }
        } else {
            // 소수점이 있는 경우
            if (this.number.length - this.pointIndex < 5) {
                this.number += numberString;
            }
        }
    } else if (numberString == "." && this.pointIndex == null) {
        // number 에 포인터가 한번도 삽입된 적이 없는 경우 소수점 처리해준다.
        if (this.number.length == 0) {
            this.number = "0";
        }

        this.pointIndex = this.number.length;
    }

};

CalcNumber.prototype.getNumberByPrecision = function() {
    if (this.pointIndex != null) {
        var decimalExtra = CalcNumber.MAX_DECIMAL_LENGTH - (this.number.length - this.pointIndex);
        var precisionCollection = Math.pow(10, decimalExtra);
        return Number(this.number) * precisionCollection;
    } else {
        return Number(this.number) * CalcNumber.PRECISION;
    }
};

CalcNumber.prototype.setNumberByPrecision = function(number) {
    this.number = number.toString();
    this.pointIndex = this.number.length - CalcNumber.MAX_DECIMAL_LENGTH;
};

CalcNumber.prototype.getIntegerNumberStr = function() {
    var integerNumber;
    if (this.pointIndex != null) {
        integerNumber = Number(this.number.substring(0, this.pointIndex)).toLocaleString();
    } else {
        integerNumber = Number(this.number).toLocaleString();
    }

    if(integerNumber.indexOf(".") != -1) {
        integerNumber = integerNumber.split(".")[0]
    }

    return integerNumber;
};

CalcNumber.prototype.getDecimalNumberStr = function() {
    if (this.pointIndex != null) {
        var ret = this.number.substring(this.pointIndex, this.number.length);
        if (this.pointIndex < 0) {
            var negativeCount = Math.abs(this.pointIndex);
            for (var i = 0; i < negativeCount; i++) {
                ret = "0".concat(ret);
            }
        }
        return ret;
    } else {
        return null;
    }
};

CalcNumber.prototype.clone = function () {
    return new CalcNumber(this);
};

CalcNumber.prototype.toString = function () {
    var integerNumber = "";
    var decimalNumber = "";
    if (this.pointIndex != null) {
        integerNumber = this.getIntegerNumberStr();
        decimalNumber = this.getDecimalNumberStr();
        if (decimalNumber == null || Number(decimalNumber) == 0) {
            return integerNumber;
        } else {
            return integerNumber + "." + decimalNumber;
        }
    } else {
        return this.getIntegerNumberStr();
    }
};

// infixNotation/postfixNotation Array 용 자료구조 Obj
var CalcNotationArray = function() {
    if(this._CalcNotationArray == null) {
        throw "Please use new CalcNotationArray instance.";
    }
    this._CalcNotationArray();
};

CalcNotationArray.prototype._CalcNotationArray = function() {
    this.array = [];
};

CalcNotationArray.prototype.initialize = function () {
    this.array = [];
};

CalcNotationArray.prototype.size = function() {
    return this.array.length;
};

CalcNotationArray.prototype.last = function() {
    if (this.array.length > 0) {
        return this.array[this.array.length - 1];
    } else {
        return null;
    }
};

CalcNotationArray.prototype.isOperator = function(obj) {
    return (typeof obj == "string");
};

CalcNotationArray.prototype.replaceLastItem = function(obj) {
    this.array[this.array.length - 1] = obj;
};

CalcNotationArray.prototype.push = function(obj) {
    this.array.push(obj)
};

CalcNotationArray.prototype.pop = function() {
    return this.array.pop();
};

CalcNotationArray.prototype.pushArray = function(arr) {
    this.array = this.array.concat.apply(this.array, arr);
};

CalcNotationArray.prototype.insert = function(index, obj) {
    this.array.splice(index, 0, obj);
};

CalcNotationArray.prototype.insertArray = function(index, arr) {
    this.array.splice.apply(this.array, [index, 0].concat(arr));
};

CalcNotationArray.prototype.getAt = function(index) {
    return this.array[index];
};

CalcNotationArray.prototype.toString = function() {
    var ret = "";
    for(var i = 0; i < this.array.length; i++) {
        ret += this.array[i].toString();
        ret += " ";
    }
    return ret;
};

// stateless operation object
var CalcOperator = {
    add : function(num1, num2) {
        //console.log("add(" + num1.toString() + ", " + num2.toString() + ")");
        var result = num1.getNumberByPrecision() + num2.getNumberByPrecision();
        var newNumberObj = new CalcNumber();
        newNumberObj.setNumberByPrecision(result);
        return newNumberObj;
    },
    subtract : function(num1, num2) {
        //console.log("substract(" + num1.toString() + ", " + num2.toString() + ")");
        var result = num1.getNumberByPrecision() - num2.getNumberByPrecision();
        var newNumberObj = new CalcNumber();
        newNumberObj.setNumberByPrecision(result);
        return newNumberObj;
    },
    mul : function(num1, num2) {
        //console.log("mul(" + num1.toString() + ", " + num2.toString() + ")");
        var result = num1.getNumberByPrecision() * num2.getNumberByPrecision();
        var newNumberObj = new CalcNumber();
        newNumberObj.setNumberByPrecision(parseInt(result / CalcNumber.PRECISION));
        return newNumberObj;
    },
    div : function(num1, num2) {
        //console.log("div(" + num1.toString() + ", " + num2.toString() + ")");
        var result = num1.getNumberByPrecision() / num2.getNumberByPrecision();
        var newNumberObj = new CalcNumber();
        newNumberObj.setNumberByPrecision(parseInt(result * CalcNumber.PRECISION));
        return newNumberObj;
    }
};

// main app!!!!!!!!
var CalcApp = function() {
    if(this._CalcApp == null) {
        throw "Please use new CalcApp instance.";
    }
    this._CalcApp();
};

CalcApp.IsNumber = 0;
CalcApp.IsOperation = 1;
CalcApp.IsRefresh = 2;
CalcApp.IsEnter = 3;
CalcApp.IsPoint = 4;
CalcApp.IsNotSupportedSymbol = 4;

CalcApp.prototype._CalcApp = function() {
    // 초기화
    this.currentNumber = new CalcNumber();
    this.infixNotationArray = new CalcNotationArray(); // 중위 표기법 array;
    this.resultNode = null;
    this.result = "0";
    this.stackNode = null;
    this.lastOperator = null;
    this.lastNumber = null;
};

CalcApp.prototype.install = function(node, config) {
    CalcAppUIProperty.MakeCalcUI(node, this, config);
    this.update();
}

CalcApp.prototype.eventDispatcher = function(e) {
    var ret;

    if(e.type == "click") {
        var target = e.target || e.srcElement;
        ret = this.getType(target.value);
    } else if (e.type == "keydown") {
       console.log("Not Yet!");
    }

    switch(ret.type) {
        case CalcApp.IsNumber:
            this.insertNumber(ret.value);
            break;
        case CalcApp.IsOperation:
            this.operator(ret.value);
            break;
        case CalcApp.IsRefresh:
            this.refresh();
            break;
        case CalcApp.IsEnter:
            this.enter();
            break;
        case CalcApp.IsPoint:
            this.insertNumber(ret.value);
            break;
        case CalcApp.IsNotSupportedSymbol:
        default:
            console.log("Not Supported Symbol : " + ret.value);
            break;
    }

    this.update();
};

CalcApp.prototype.getType = function(data) {
    var isNum = CalcNumber.isNumber(data);
    if (isNum) {
        return { type : CalcApp.IsNumber, value : data};
    } else {
        switch(data) {
            case "R":
                return { type : CalcApp.IsRefresh, value : data};
            case "+":
            case "-":
            case "*":
            case "/":
                return { type : CalcApp.IsOperation, value : data};
            case "=":
                return { type : CalcApp.IsEnter, value : data};
            case ".":
                return { type : CalcApp.IsPoint, value : data};
            default:
                return { type : CalcApp.IsNotSupportedSymbol, value : data};
        }
    }
};

CalcApp.prototype.insertNumber = function(number) {
     if (this.infixNotationArray.size() > 0 && this.infixNotationArray.last()._CalcNumber && this.operator != null) {
        this.infixNotationArray.push(this.lastOperator);
    }
    this.currentNumber.insertNumber(number);
    this.result = this.currentNumber.toString();
};

CalcApp.prototype.initNumberString = function() {
    this.currentNumber.initialize();
};

CalcApp.prototype.initNotationArray = function() {
    this.infixNotationArray.initialize();
};

CalcApp.prototype.operator = function(operator) {
    if (this.currentNumber.avaliable()) {
        this.lastNumber = this.currentNumber.clone();
        this.infixNotationArray.push(this.lastNumber);
        this.initNumberString();
    } else if (this.infixNotationArray.size() == 0) {
        var zeroNumber = new CalcNumber();
        zeroNumber.insertNumber(0);
        this.infixNotationArray.push(zeroNumber);
    }

    this.lastOperator = operator;
    if (this.infixNotationArray.isOperator(this.infixNotationArray.last())) {
        this.infixNotationArray.replaceLastItem(this.lastOperator);
    } else {
        this.infixNotationArray.push(this.lastOperator);
    }

    this.doCalc();
};

CalcApp.prototype.refresh = function() {
    this.initNumberString();
    this.initNotationArray();
    this.lastOperator = null;
    this.lastNumber = null;
    this.result = "0";
};

CalcApp.prototype.enter = function() {
    if (this.currentNumber.avaliable()) {
        // 숫자를 입력 중 이였던 상태임.
        this.lastNumber = this.currentNumber.clone();
        this.infixNotationArray.push(this.lastNumber);
        this.initNumberString();
    } else {
        if (this.lastOperator == null || this.lastNumber == null) {
            throw "Not Support Operation! 0x00001";
        }
        if (CalcNumber.isNumber(this.infixNotationArray.last())) {
            this.infixNotationArray.push(this.lastOperator);
        } else {
            this.infixNotationArray.replaceLastItem(this.lastOperator);
        }
        this.infixNotationArray.push(this.lastNumber.clone());
    }

    this.doCalc();
};

CalcApp.prototype.setResultNode = function(node) {
    this.resultNode = node;
};

CalcApp.prototype.setStackNode = function(node) {
    this.stackNode = node;
};

CalcApp.prototype.doCalc = function() {
    var postNotationArray = this.infixToPostfix(this.infixNotationArray);
    //console.log(postNotationArray.toString());
    this.result = this.doCalcPostfix(postNotationArray);
};

// 화면 갱신
CalcApp.prototype.update = function() {
    if (this.resultNode) {
        this.resultNode.value = this.result;
    }

    if (this.stackNode) {
        this.stackNode.value = this.infixNotationArray.toString();
    }
};

// operator 우선순위를 판단할 수 있도록 weight 반환
CalcApp.prototype.getPrOper = function(operator){
    switch(operator){
        case "*":
        case "/":
            return 2;
        case "+":
        case "-":
            return 1;
        default:
            return 0;
    }
};

CalcApp.prototype.isOperator = function(operator){
    switch(operator){
        case "*":
        case "/":
        case "+":
        case "-":
            return true;
        default:
            return false;
    }
};

CalcApp.prototype.getOperatorFunc = function(operator) {
    switch(operator) {
        case "*":
            return CalcOperator.mul;
        case "/":
            return CalcOperator.div;
        case "+":
            return CalcOperator.add;
        case "-":
            return CalcOperator.subtract;
        default:
            return null;
    }
};

// infix notation 을 postfix notation으로 변경해주는 함수
CalcApp.prototype.infixToPostfix = function(infixNotationArray) {
    var postfixNotationArray = new CalcNotationArray();
    var operatorStack = [];
    var infixSize = infixNotationArray.size();
    if (infixSize != 0 && infixSize % 2 == 0) {
        infixSize -= 1; // 완성되지 않은 중위 표기법에 대한 예외 처리
    }
	for(var i=0; i < infixSize; i++){
		var c = infixNotationArray.getAt(i);
		if(CalcNumber.isNumber(c)){ // 숫자면
			postfixNotationArray.push(c);
		} else if(c === "+" || c==="-" || c === "*" || c==="/") {
		    var li = operatorStack.length - 1;
		    while(operatorStack.length != 0 && this.getPrOper(c) <= this.getPrOper(operatorStack[li])) {
		        postfixNotationArray.push(operatorStack.pop());
		        li = operatorStack.length - 1;
		    }
		    operatorStack.push(c);
		} else {
		    console.warn("Not support symbol!");
		}
	}

    // 남아있는 operator stack flush
	while(operatorStack.length != 0) {
        postfixNotationArray.push(operatorStack.pop());
    }
    return postfixNotationArray;
};

CalcApp.prototype.doCalcPostfix = function(postfixNotationArray) {
    if (postfixNotationArray.size() == 0) {
        console.log("0")
        return 0;
    }

    var numberStack = [];
    var postfixLength = postfixNotationArray.size();
    for (var i = 0; i < postfixLength; i++) {
        var c = postfixNotationArray.getAt(i);
        if (CalcNumber.isNumber(c)) {
            numberStack.push(c);
        } else if(this.isOperator(c)) {
            var num2 = numberStack.pop();
            var num1 = numberStack.pop();
            var func = this.getOperatorFunc(c);
            if (func != null && typeof func == "function") {
                numberStack.push(func(num1, num2));
            }
        } else {
            console.warn("Unsupport Simbol!");
        }
    }

    return numberStack.pop().toString();
};

// Install 함수
function IntallCalcAppAtNode (targetNode, config) {
    'use strict';
    if (targetNode === null && targetNode.nodeName === null) {
        throw "Could not install calculation app!";
    }
    var calcApp = new CalcApp();
    calcApp.install(targetNode, config);
    targetNode.calcapp = calcApp;
}
