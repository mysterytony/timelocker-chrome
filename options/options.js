"use strict";

chrome.storage.sync.get("blocked_hostnames", (host_suffixes) => {
  if (
    host_suffixes.blocked_hostnames &&
    host_suffixes.blocked_hostnames.length > 0
  ) {
    var textArea = document.getElementById("blocked-urls");
    textArea.value = host_suffixes.blocked_hostnames.join("\n");
  }
});

document
  .getElementById("option-save-btn")
  .addEventListener("click", (event) => {
    var textArea = document.getElementById("blocked-urls");
    chrome.storage.sync.set(
      { blocked_hostnames: textArea.value.split("\n") },
      () => {
        chrome.runtime.sendMessage(null, "refresh block url");
        alert("saved");
        window.close();
      }
    );
  });
