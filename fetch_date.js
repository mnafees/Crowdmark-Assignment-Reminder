var assignmentName = document.getElementsByClassName("main-header")[0].getElementsByTagName("h1")[0].innerText;
var dateTime = document.getElementsByTagName("time")[0].innerText;
if (dateTime) {
    chrome.runtime.sendMessage({
        "from": "fetch_date",
        "assignmentName": assignmentName,
        "dateTime": dateTime,
        "url": location.href
    });
}