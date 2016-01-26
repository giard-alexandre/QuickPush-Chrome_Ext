/// <reference path="chrome-api-vsdoc.js" />
function encodeData(data) {
    var urlEncodedDataPairs = [];
    for (var name in data) {
        if (data[name] instanceof Array) {
            for (var i = 0, len = data[name].length; i < len; i++) {
                urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name][i]));
            }
        } else {
            urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
        }

    }
    return urlEncodedDataPairs.join('&').replace(/%20/g, '+');
}

function getAccessToken(code) {
    var uriData = {
        "client_id": "336587574421-5o1j4p1i8uig5hc6q0n80uj6n4n6phi4.apps.googleusercontent.com",
        "client_secret": "6T4UpY-ut4FNNVZUfiteh_9b",
        "redirect_uri": "urn:ietf:wg:oauth:2.0:oob:auto",
        "grant_type": "authorization_code",
        "code": code
    };
    var result = false;
    var xhr = new XMLHttpRequest();
    encodedData = encodeData(uriData);
    xhr.open("POST", "https://accounts.google.com/o/oauth2/token", true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function (e) {
        if (xhr.status == 200) {
            data = JSON.parse(xhr.responseText);
            chrome.storage.sync.set({ 'GoogleAccess': data.access_token });
            chrome.storage.sync.set({ 'GoogleRefresh': data.refresh_token });
            chrome.storage.sync.set({ 'GoogleType': data.token_type });
            chrome.storage.sync.set({ 'GoogleExpireAt': (new Date() / 1000) + data.expires_in });
            result = data.access_token;
        } else {
            console.error(xhr.statusText + ' ' + xhr.responseText);
        }
    };
    xhr.send(encodedData);
    return result;
};

chrome.runtime.onInstalled.addListener(function (details) {
    var uriData = {
        "access_type": "offline",
        "redirect_uri": "urn:ietf:wg:oauth:2.0:oob:auto",
        "response_type": "code",
        "client_id": "336587574421-5o1j4p1i8uig5hc6q0n80uj6n4n6phi4.apps.googleusercontent.com",
        "approval_prompt": "auto",
        "scope": "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/plus.login https://mail.google.com"
    };
    var encodedData = encodeData(uriData);
    chrome.tabs.create({ url: 'https://accounts.google.com/o/oauth2/auth?' + encodedData }); //Create new tab and call Google Oauth

    chrome.tabs.onUpdated.addListener(function googleAuth(tabId, changeInfo, tab) { //Check for auth token on the page.
        if ((changeInfo.status == "complete") && (tab.title.match("Success code="))) {
            var authToken = tab.title.slice(13);
            chrome.storage.sync.set({ 'GoogleAuth': authToken });
            chrome.tabs.onUpdated.removeListener(googleAuth);

            //get access token
            getAccessToken(authToken);
            chrome.tabs.remove(tab.id);
        }
    });

    /* uriData = {
         "access_type": "offline",
         "redirect_uri": "urn:ietf:wg:oauth:2.0:oob:auto",
         "response_type": "code",
         "client_id": "336587574421-5o1j4p1i8uig5hc6q0n80uj6n4n6phi4.apps.googleusercontent.com",
         "approval_prompt": "auto",
         "scope": "https://www.googleapis.com/auth/plus.me",
         "include_granted_scopes":true
     };
     encodedData = encodeData(uriData);
     chrome.tabs.create({ url: 'https://accounts.google.com/o/oauth2/auth?'+encodedData }); //Create new tab and call Google Oauth
 
     chrome.tabs.onUpdated.addListener(function googleAuth(tabId, changeInfo, tab) { //Check for auth token on the page.
         if ((changeInfo.status == "complete") && (tab.title.match("Success code="))) {
             var authToken = tab.title.slice(13);
             chrome.storage.sync.set({'GoogleAuth': authToken});
             chrome.tabs.onUpdated.removeListener(googleAuth);
 
             //get access token
             getAccessToken(authToken);
         }
     });*/


});

chrome.browserAction.onClicked.addListener(function (activeTab) {
    chrome.tabs.sendMessage(activeTab.id, { action: "forceUpdate" }); // Send a message to content_scipt
});
