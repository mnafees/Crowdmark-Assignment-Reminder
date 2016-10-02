if (window.chrome) {

    // Global constants
    var extName = "Crowdmark Assignment Reminder";

    var millisecondsIn24Hours = 86400000;
    var millisecondsIn12Hours = millisecondsIn24Hours / 2;
    var millisecondsIn6Hours = millisecondsIn12Hours / 2;
    var millisecondsIn2Hours = 7200000;

    // Listeners

    chrome.tabs.onCreated.addListener(function(tab) {
        activatePageAction(tab);
    });
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        activatePageAction(tab);
    });
    chrome.pageAction.onClicked.addListener(function(tab) {
        if (assignmentStored(tab.url)) {
            // Assignment already stored in local storage
            showAlreadyAddedNotif();
        } else {
            chrome.tabs.executeScript(tab.id, {file: "fetch_date.js"});
        }
    });
    chrome.alarms.onAlarm.addListener(function(alarm) {
        var assignment = getAssignmentWithKey(alarm.name);
        chrome.notifications.create(null, {
            title: extName,
            message: "Your assignment \"" + assignment.assignmentName + "\" is due. Click here to submit it for evaluation.",
            type: "basic",
            iconUrl: "favicon.png",
            isClickable: true
        }, function(notificationId) {
            chrome.notifications.onClicked.addListener(function(id) {
                if (id === notificationId) {
                    chrome.tabs.create({ url: assignment.url });
                }
            });
        });
        setAlarmFor(alarm.name);
    });

    // Receive messages from the content script

    chrome.runtime.onMessage.addListener(function (msg, sender) {
        if (msg.from === "fetch_date") {
            storeNewAssignment(msg);
        } else if (msg.from === "analyse_submission") {
            var key = msg.url.split("/")[4];
            localStorage.removeItem(key);
        }
    });

    // Defined functions

    function activatePageAction(tab) {
        if (tab.url.indexOf("crowdmark.com/assignments") !== -1) {
            // This is a Crowdmark assignment webpage!
            chrome.pageAction.show(tab.id);

            if (tab.url.indexOf("/submission") !== -1) {
                // It's a submission page, let's analyse it!
                chrome.tabs.executeScript(tab.id, {
                    file: "analyse_submission.js",
                    runAt: "document_end"
                });
            }
        } else {
            chrome.pageAction.hide(tab.id);
        }
    }

    function assignmentStored(url) {
        var key = url.split("/")[4];
        var found;
        if (localStorage.getItem(key)) {
            found = true;
        } else {
            found = false;
        }
        return found;
    }

    function storeNewAssignment(msg) {
        var key = msg.url.split("/")[4];
        var dateTimeEpoch = moment(msg.dateTime).format("x");
        localStorage.setItem(key, JSON.stringify({
            "assignmentName": msg.assignmentName,
            "dateTime": dateTimeEpoch,
            "url": msg.url
        }));
        showReminderActivatedNotif();
        setAlarmFor(key);
    }

    function showReminderActivatedNotif() {
        chrome.notifications.create(null, {
            title: extName,
            message: "The reminder for this assignment has been activated.",
            type: "basic",
            iconUrl: "favicon.png"
        });
    }

    function showAlreadyAddedNotif() {
        chrome.notifications.create(null, {
            title: extName,
            message: "The reminder is already active for this assignment",
            type: "basic",
            iconUrl: "favicon.png"
        });
    }

    function getAssignmentWithKey(key) {
        return JSON.parse(localStorage.getItem(key));
    }

    function setAlarmFor(key) {
        var assignment = getAssignmentWithKey(key);
        var dateTimeEpoch = assignment.dateTime;

        var alarmTime = dateTimeEpoch - millisecondsIn24Hours;
        if (alarmTime < Date.now()) {
            // set the 12 hours alarm
            alarmTime = dateTimeEpoch - millisecondsIn12Hours;
        }
        if (alarmTime < Date.now()) {
            // set the 6 hours alarm
            alarmTime = dateTimeEpoch - millisecondsIn6Hours;
        }
        if (alarmTime < Date.now()) {
            // set the 2 hours alarm
            alarmTime = dateTimeEpoch - millisecondsIn2Hours;
        }
        chrome.alarms.create(key, {
            when: alarmTime
        });
    }

} else {
    console.error("Please run as a Chrome extension");
}
