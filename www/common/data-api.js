/* Copyright 2017 Grzegorz Skorupa <g.skorupa at gmail.com>.
 * Licensed under the Apache License, Version 2.0 */
window.app = {
    user: {
        name: "",
        token: "",
        status: "logged-out",
        alerts: [],
        role: ""
    },
    config: {
        brand: "Cricket",
        copyright: "Cricket 2018"
    },
    navigation: {
        en: [
                {name:"Home", link:"#"},
                {name:"Language", id:"lang", options:[
                    {name: "English", link: "#en"},
                    {name: "French", link: "#fr"},
                    {name: "Polish", link: "#pl"}
                ]}
            ]
    },
    texts:{},
    offline: false,
    url: "http://localhost:8080",
    authAPI: "http://localhost:8080/api/auth",
    csAPI: "http://localhost:8080/api/cs",
    cmAPI: "http://localhost:8080/api/cm",
    userAPI: "http://localhost:8080/api/user",
    currentPage: "",
    language: "en",
    languages: ["en", "pl", "fr"],
    debug: false,
    requests: 0
}

function decodeDocument(doc){
  var result = doc  
  if (result.title) {
    try {
      result.title = decodeURIComponent(result.title)
    } catch (e) {
      result.title = unescape(result.title)
    }
  }
  if (result.summary) {
    try {
      result.summary = decodeURIComponent(result.summary)
    } catch (e) {
      result.summary = unescape(result.summary)
    }
  }
  if (result.content) {
    try {
      result.content = decodeURIComponent(result.content)
    } catch (e) {
      result.content = unescape(result.content)
    }
  }
  return result
}
// ucs-2 string to base64 encoded ascii
function utoa(str) {
  return window.btoa(unescape(encodeURIComponent(str)));
}
// base64 encoded ascii to ucs-2 string
function atou(str) {
  return decodeURIComponent(escape(window.atob(str)));
}

function getDataCallEventName(success, defaultName, status){
    var errorPrefix = 'err:';
    var successName = 'dataLoaded';
    var startName = 'sending';
    if(success===(undefined||null)){
        return startName;
    }
    if(success===true){
        return successName;
    }else{
        if(defaultName!==(undefined||null)){
            return defaultName;
        }else{
            return errorPrefix+status;
        }
    }
}

function getData(url, query, token, callback) {
    const oReq = new XMLHttpRequest();
    oReq.onerror = function (oEvent) {
        window.app.requests--;
    }
    oReq.onloadend = function(oEvent){
        window.app.requests--;
    }
    oReq.onabort = function(oEvent){
        window.app.requests--;
    }
    oReq.timeout = function(oEvent){
        window.app.requests--;
    }
    oReq.onreadystatechange = function () {
        if (this.readyState == 4) {
            callback(this.status, this.responseText);
        }
    };
    oReq.open("get", url, true);
    if (token != null) {
        oReq.withCredentials = true;
        oReq.setRequestHeader("Authentication", token);
    }
    window.app.requests++;
    oReq.send(query);
    return false;
}

function sendData(data, method, url, token, callback, eventListener, errName) {
    const urlEncodedData = "";
    const urlEncodedDataPairs = [];
    const oReq = new XMLHttpRequest();
    data.forEach((name)=>urlEncodedDataPairs.push(encodeURIComponent(name)+'='+encodeURIComponent(data[name])));
    //for (name in data) {
    //    urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
    //}
    urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
    oReq.onerror = function (oEvent) {
        app.requests--;
        eventListener.trigger(getDataCallEventName(false,errName,this.status));
    }
    oReq.onloadend = function(oEvent){
        app.requests--;
        eventListener.trigger(getDataCallEventName(true));
    }
    oReq.onabort = function(oEvent){
        app.requests--;
    }
    oReq.timeout = function(oEvent){
        app.requests--;
    }
    oReq.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status > 199 && this.status < 203) {
                app.log(JSON.parse(this.responseText));
                callback(this.responseText);
            }else if (this.status == 401 || this.status == 403) {
                eventListener.trigger(getDataCallEventName(false,null,this.status));
            } else{
            }
        } else {
        }
    }

    app.requests++;
    eventListener.trigger(getDataCallEventName(null));
    oReq.open(method, url);
    oReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    if (token != null) {
        oReq.withCredentials = true;
        oReq.setRequestHeader("Authentication", token);
    }
    oReq.send(urlEncodedData);
    return false;
}

function sendFormData(formData, method, url, token, callback, eventListener, errName) {
    var oReq = new XMLHttpRequest();
    oReq.onerror = function (oEvent) {
        app.requests--;
        eventListener.trigger(getDataCallEventName(false,errName,this.status));
    }
    oReq.onloadend = function(oEvent){
        app.requests--;
        eventListener.trigger(getDataCallEventName(true), oEvent);
    }
    oReq.onabort = function(oEvent){
        app.requests--;
    }
    oReq.timeout = function(oEvent){
        app.requests--;
    }   
    oReq.onreadystatechange = function () {
        if (this.readyState == 4 && (this.status == 200 || this.status == 201)) {
            if (callback != null) {
                callback(this.responseText);
            } else {
                eventListener.trigger(getDataCallEventName(true));
            }
        }else if (this.readyState == 4 && (this.status >= 400)) {
            eventListener.trigger(getDataCallEventName(false,null,this.status)+' '+this.responseText);
        }
    };
    app.requests++;
    eventListener.trigger(getDataCallEventName(null));
    oReq.open(method, url);
    if (token != null) {
        oReq.withCredentials = true;
        oReq.setRequestHeader("Authentication", token);
    }
    oReq.send(formData);
    return false;
}

function deleteData(url, token, callback, eventListener, successEventName, errorEventName, debug, appEventBus) {
    var oReq = new XMLHttpRequest();
    oReq.onerror = function (oEvent) {
        app.requests--;
        eventListener.trigger(getDataCallEventName(false,errName,this.status));
    }
    oReq.onloadend = function(oEvent){
        app.requests--;
        eventListener.trigger(getDataCallEventName(true));
    }
    oReq.onabort = function(oEvent){
        app.requests--;
    }
    oReq.timeout = function(oEvent){
        app.requests--;
    }
    oReq.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            app.log(JSON.parse(this.responseText));
            if (callback != null) {
                callback(this.responseText);
            } else {
                eventListener.trigger(getDataCallEventName(true));
            }
        }else if (this.status == 401 || this.status == 403) {
            eventListener.trigger(getDataCallEventName(false,null,this.status));
        }
    };
    app.requests++;
    eventListener.trigger(getDataCallEventName(null));
    oReq.open("DELETE", url, true);
    if (token != null) {
        oReq.withCredentials = true;
        oReq.setRequestHeader("Authentication", token);
    }
    oReq.send(null);
    return false;
}

function afterLogin(newKey, name) {
    var key = newKey.trim();
    if (key == "") {
        app.log('Login failed');
    } else {
        app.offline = false;
        app.user.token = key;
        app.user.name = name;
        app.user.status = "logged-in";
    }
}

function afterLoginError(){
    app.user.status = "logged-out";
}

function loginSubmit(oFormElement, eventListener, successEventName, errName) {
    var login;
    var password;
    var oField = "";
    var sEncoded;
    for (var nItem = 0; nItem < oFormElement.elements.length; nItem++) {
        oField = oFormElement.elements[nItem];
        if (!oField.hasAttribute("name")) {
            continue;
        }
        if (oField.name === "login") {
            login = oField.value;
        } else if (oField.name === "password") {
            password = oField.value;
        }
    }
    var oReq = new XMLHttpRequest();
    oReq.onerror = function (oEvent) {
        app.requests--;
        eventListener.trigger(getDataCallEventName(false,errName,this.status));
    }
    oReq.onloadend = function(oEvent){
        app.requests--;
        eventListener.trigger(getDataCallEventName(true));
    }
    oReq.onabort = function(oEvent){
        app.requests--;
    }
    oReq.timeout = function(oEvent){
        app.requests--;
    }
    oReq.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            afterLogin(oReq.responseText, login);
            eventListener.trigger(successEventName);
        } else if (this.readyState == 4 && this.status > 400) {
            afterLoginError();
            eventListener.trigger(getDataCallEventName(false,errName,this.status));
        }
    };
    sEncoded = utoa(login + ":" + password);
    app.requests++;
    eventListener.trigger(getDataCallEventName(null));
    oReq.open("post", app.authAPI);
    oReq.withCredentials = true;
    oReq.setRequestHeader("Authentication", "Basic " + sEncoded);
    oReq.setRequestHeader("Accept", "text/plain");
    oReq.send("action=login");
    return false;
}