"use strict";

interface BlockedEntry {
  tabIds: number[];
  countdown: number | null;
}
type OnCancelCallback = (tabId: number) => void;
type OnTimeoutCallback = (tabId: number) => void;
type OnCountStartCallback = (tabId: number) => void;
type OnBlockStartCallback = (tabId: number, isBlocked: boolean) => void;
type BlockedHostnames = Map<string, BlockedEntry>;
class Core {
  private _blockedHostnames: BlockedHostnames = new Map();
  private _onCancel: OnCancelCallback;
  private _onTimeout: OnTimeoutCallback;
  private _onCountStart: OnCountStartCallback;
  private _onBlockStart: OnBlockStartCallback;
  constructor(
    blocked_hostnames: string[],
    onCancel: (tabId: number) => void,
    onTimeout: (tabId: number) => void,
    onCountStart: (tabId: number) => void,
    onBlockStart: (tabId: number, isBlocked: boolean) => void
  ) {
    this.blockedHostnames = blocked_hostnames;
    this._onCancel = onCancel;
    this._onTimeout = onTimeout;
    this._onCountStart = onCountStart;
    this._onBlockStart = onBlockStart;
  }
  set blockedHostnames(blocked_hostnames: string[]) {
    for (const [originalHostname, blockedEntry] of this._blockedHostnames) {
      if (!blocked_hostnames.includes(originalHostname)) {
        // hostname is no longer blocked
        blockedEntry.tabIds.forEach(this._onCancel);
        this._blockedHostnames.delete(originalHostname);
      }
    }

    for (const hostname of blocked_hostnames) {
      if (!this._blockedHostnames.has(hostname))
        this._blockedHostnames.set(hostname, { tabIds: [], countdown: null });
    }
  }
  tickClock(timeElapsed: number) {
    for (const [, blockedEntry] of this._blockedHostnames) {
      if (blockedEntry.countdown === null) continue;
      blockedEntry.countdown -= timeElapsed;
      if (blockedEntry.countdown <= 0) {
        blockedEntry.tabIds.forEach(this._onTimeout);
        blockedEntry.countdown = null;
      }
    }
  }
  getKey(url: string) {
    const hostname = new URL(url).hostname;
    for (const [key] of this._blockedHostnames) {
      if (hostname.endsWith(key)) {
        return key;
      }
    }
    return null;
  }
  updateTab(tabId: number, url: string) {
    const key = this.getKey(url);
    if (key) {
      // new url is blocked, inject script.

      // don't know how to tell ts returned key is from Map.
      const entry = this._blockedHostnames.get(key)!;
      this._onBlockStart(
        tabId,
        entry.countdown === null || entry.countdown <= 0
      );

      // tab has same domain as privous update.
      if (entry.tabIds.includes(tabId)) return;
    }
    // move tab to correct domain.
    // todo: speed this up with extra data struct storing tabId -> domain
    for (const [originalHostname, blockedEntry] of this._blockedHostnames) {
      if (originalHostname === key) blockedEntry.tabIds.push(tabId);
      else {
        const index = blockedEntry.tabIds.indexOf(tabId);
        if (index > -1) {
          blockedEntry.tabIds.splice(index, 1);
        }
      }
    }
  }
  isTabBlocked(tabId: number) {
    for (const [, blockedEntry] of this._blockedHostnames) {
      const index = blockedEntry.tabIds.indexOf(tabId);
      if (index > -1) {
        return blockedEntry.countdown === null || blockedEntry.countdown <= 0;
      }
    }
    return false;
  }
  closeTab(tabId: number) {
    for (const [, blockedEntry] of this._blockedHostnames) {
      const index = blockedEntry.tabIds.indexOf(tabId);
      if (index > -1) {
        blockedEntry.tabIds.splice(index, 1);
      }
    }
  }
  addTime(tabId: number, sec: number) {
    for (const [, blockedEntry] of this._blockedHostnames) {
      const index = blockedEntry.tabIds.indexOf(tabId);
      if (index > -1) {
        blockedEntry.countdown = sec;
        blockedEntry.tabIds.forEach(this._onCountStart);
      }
    }
  }
}

const stopBlocking = (tabId: number) => {
  chrome.tabs.sendMessage(tabId, "hide");
};

const startBlocking = (tabId: number) => {
  chrome.tabs.sendMessage(tabId, "show");
};

const onCancel: OnCancelCallback = (tabId) => {
  stopBlocking(tabId);
};
const onTimeout: OnTimeoutCallback = (tabId) => {
  startBlocking(tabId);
};

const onCountStart: OnCountStartCallback = (tabId) => {
  stopBlocking(tabId);
};

const onBlockStart: OnBlockStartCallback = (tabId, isBlocked) => {
  chrome.tabs.executeScript(
    tabId,
    {
      file: "overlay/overlay.js",
    },
    () => {
      if (isBlocked) startBlocking(tabId);
      else stopBlocking(tabId);
    }
  );
};

const core = new Core([], onCancel, onTimeout, onCountStart, onBlockStart);
chrome.storage.sync.get("blocked_hostnames", (host_suffixes) => {
  console.log("time locked urls", host_suffixes);
  // read into core
  core.blockedHostnames = host_suffixes.blocked_hostnames || [];
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo?.status == "complete") {
    if (!tab.id || !tab.url) return;
    core.updateTab(tab.id, tab.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  core.closeTab(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message == "refresh block url") {
    // came from save action on options page
    chrome.storage.sync.get("blocked_hostnames", (host_suffixes) => {
      console.log("time locked urls", host_suffixes);
      // read into core
      core.blockedHostnames = host_suffixes.blocked_hostnames || [];
    });
  } else if (message == "close") {
    // came from close action on overlay page
    if (sender.tab?.id) chrome.tabs.remove(sender.tab.id);
  } else {
    if (!sender.tab?.id) return;
    // came from the overlay page, either 5, 15, or 30 minutes
    if (message === "5" || message === "15" || message === "30") {
      const sec = parseInt(message) * 60;
      core.addTime(sender.tab.id, sec);
    }
  }
});

const LOOP_SEC = 1;
const LOOP_MSEC = LOOP_SEC * 1000;
setInterval(() => {
  core.tickClock(LOOP_SEC);
}, LOOP_MSEC); // for every 5 seconds
export {};
