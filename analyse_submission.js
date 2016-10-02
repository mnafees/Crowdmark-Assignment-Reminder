if (document.getElementsByTagName("body")[0].innerText.indexOf("Not submitted") === -1) {
    chrome.runtime.sendMessage({
        "from": "analyse_submission",
        "url": location.href
    });
}
