'use strict';

chrome.runtime.onInstalled.addListener(function () {

})

chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
  chrome.declarativeContent.onPageChanged.addRules([{
    conditions: [new chrome.declarativeContent.PageStateMatcher({
      pageUrl: { hostContains: '.google.com' },
    })],
    actions: [new chrome.declarativeContent.ShowPageAction()]
  }])
})

chrome.storage.sync.get("color", items => {
  console.log("colors:", items)
  if (items.length == 0) {
    chrome.storage.sync.set({ color: '#3aa757' }, function () {
      console.log("The color init'ed to green.")
    })
  }
})

/**
 * list of hostnames or suffixes of hostnames (e.g. www.google.com, or youtube.com)
 * used to compare when new tabs are created. It's used to compare the suffixes, that is
 * google.com will block both www.google.com and maps.google.com.
 */
var blocked_hostnames = []

/**
 * an object where key is an tab id (integers) and value is count down period in seconds.
 * The tabs urls are in the above blocked_hostnames but are allowed
 * to navigate for a certain period of time.
 */
var tabs_in_countdown = {}

chrome.storage.sync.get("blocked_hostnames", host_suffixes => {
  console.log("time locked urls", host_suffixes)
  // read into blocked_hostnames
  blocked_hostnames = host_suffixes.blocked_hostnames

  // TODO: remove bilibili, meant for temp test
  chrome.storage.sync.set({ blocked_hostnames: ["bilibili.com"] }, () => {
    console.log("set to bilibili")
    blocked_hostnames[0] = "bilibili.com"
  })
})

function is_hostname_blocked(url, tabId) {
  if (tabs_in_countdown.hasOwnProperty(tabId)) {
    return false
  }
  var hostname = new URL(url).hostname
  for (var suffix of blocked_hostnames) {
    if (hostname.endsWith(suffix)) { // block this record
      return true
    }
  }
  return false
}


chrome.tabs.onCreated.addListener(function (tab) {
  // console.log(tab.id)
  // chrome.tabs.sendMessage(tab.id, "hello world");
})




chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo && changeInfo.status && changeInfo.status == "complete") {
    // check if this is one of the blocked url

    if (is_hostname_blocked(tab.url, tab.id)) {
      console.log(tabId, changeInfo, tab, "sending overlay html")
      fetch(chrome.runtime.getURL("overlay/overlay.html"))
        .then(response => response.text())
        .then(data => chrome.tabs.sendMessage(tab.id, data))
      return
    }
  }
})

chrome.webRequest.onBeforeRequest.addListener(
  // callback, returns webRequest.BlockingResponse
  detail => {
    // for blocked pages, allows load the main frame only, so chrome doesn't show an error page instead
    if (detail.type != "main_frame" && is_hostname_blocked(detail.url, detail.tabId)) {
      return { cancel: true }
    }
    return { cancel: false }
  },
  // webRequest.RequestFilter
  {
    urls: ["<all_urls>"]
  },
  // extraInfoSpec
  ["blocking"]
)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message, sender)
  chrome.tabs.reload(sender.tab.id)
  tabs_in_countdown[sender.tab.id] = 10 // 10 seconds
  sendResponse("you are dismissed")
})

