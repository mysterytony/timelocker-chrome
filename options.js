"use strict";

let page = document.getElementById("buttonDiv");
const kButtonColors = ["#3aa757", "#e8453c", "#f9bb2d", "#4688f1"];
function constructOptions(kButtonColors) {
  for (let item of kButtonColors) {
    let button = document.createElement("button");
    button.style.backgroundColor = item;
    button.addEventListener("click", function () {
      chrome.storage.sync.set({ color: item }, function () {
        console.log("color is " + item);
      });
    });
    page.appendChild(button);
  }
}
// constructOptions(kButtonColors);

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
      }
    );
  });
