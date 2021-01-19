"use strict";

chrome.runtime.onInstalled.addListener(function () {});

chrome.storage.sync.get("color", (items) => {
  console.log("colors:", items);
  if (items.length == 0) {
    chrome.storage.sync.set({ color: "#3aa757" }, function () {
      console.log("The color init'ed to green.");
    });
  }
});

/**
 * list of hostnames or suffixes of hostnames (e.g. www.google.com, or youtube.com)
 * used to compare when new tabs are created. It's used to compare the suffixes, that is
 * google.com will block both www.google.com and maps.google.com.
 */
var blocked_hostnames = [];

/**
 * an object where key is an tab id (integers) and value is count down period in seconds.
 * The tabs urls are in the above blocked_hostnames but are allowed
 * to navigate for a certain period of time.
 */
var tabs_in_countdown = {};

chrome.storage.sync.get("blocked_hostnames", (host_suffixes) => {
  console.log("time locked urls", host_suffixes);
  // read into blocked_hostnames
  blocked_hostnames = host_suffixes.blocked_hostnames || [];
});

function is_hostname_blocked(url, tabId) {
  if (tabs_in_countdown.hasOwnProperty(tabId)) {
    return false;
  }
  var hostname = new URL(url).hostname;
  for (var suffix of blocked_hostnames) {
    // skip empty strings
    if (!suffix) {
      continue;
    }

    if (hostname.endsWith(suffix)) {
      // block this record
      return true;
    }
  }
  return false;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo && changeInfo.status && changeInfo.status == "complete") {
    // check if this is one of the blocked url

    if (is_hostname_blocked(tab.url, tab.id)) {
      console.log(tabId, changeInfo, tab, "sending overlay html");
      // here passing the overlay html, don't think it's the best practice

      chrome.tabs.executeScript(tab.id, {
        file: "overlay/overlay.js",
      });
      return;
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message == "refresh block url") {
    // came from save action on options page
    chrome.storage.sync.get("blocked_hostnames", (host_suffixes) => {
      console.log("time locked urls", host_suffixes);
      // read into blocked_hostnames
      blocked_hostnames = host_suffixes.blocked_hostnames || [];
    });
  } else if (message == "close") {
    // came from close action on overlay page
    chrome.tabs.remove(sender.tab.id);
  } else {
    // came from the overlay page, either 5, 15, or 30 minutes
    chrome.tabs.sendMessage(sender.tab.id, "hide");
    if (message == "5") {
      tabs_in_countdown[sender.tab.id] = 5 * 60; // 5 minutes
    } else if (message == "15") {
      tabs_in_countdown[sender.tab.id] = 15 * 60; // 15 minutes
    } else if (message == "30") {
      tabs_in_countdown[sender.tab.id] = 30 * 60; // 30 minutes
    }
  }
});

const LOOP_SEC = 1;
const LOOP_MSEC = LOOP_SEC * 1000;
setInterval(() => {
  // if (Object.keys(tabs_in_countdown).length > 0) {
  //   console.log("tabs_in_countdown", tabs_in_countdown);
  // }

  for (var tabId in tabs_in_countdown) {
    tabs_in_countdown[tabId] -= LOOP_SEC;
    if (tabs_in_countdown[tabId] <= 0) {
      console.log("tabId", tabId, "has expired the time");
      delete tabs_in_countdown[tabId];

      // check if they are still being blocked, because one can change the options
      chrome.tabs.get(Number(tabId), (tab) => {
        if (!is_hostname_blocked(tab.url, tab.id)) {
          console.log(
            "tabId",
            tab.id,
            "url",
            tab.url,
            "was blocked and expired the time, but now it's not blocked anymore, so skip blocking"
          );
          return;
        }

        // the tab has expired the time, show overlay again to block content
        console.log(tab.id, "showing overlay");
        chrome.tabs.sendMessage(tab.id, "show");
      });
    } else {
      console.log("tabId", tabId, "has not expired the time yet");
    }
  }
}, LOOP_MSEC); // for every 5 seconds
