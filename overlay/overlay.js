"use strict";

chrome.runtime.onMessage.addListener((html, sender, sendResponse) => {
  document
    .getElementsByTagName("body")[0]
    .insertAdjacentHTML("beforeend", html);
  document
    .querySelector(".timelocker-chrome-overlay-wrapper button")
    .addEventListener("click", () => {
      // disable all the button, because reload takes some time,
      // don't want user to click buttons multiple times
      document
        .querySelectorAll(".timelocker-chrome-overlay-wrapper button")
        .forEach((b) => (b.disabled = true));
    });
  document
    .querySelector("button.timelocker-chrome-dismiss-5-minutes")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage(null, "5");
    });
  document
    .querySelector("button.timelocker-chrome-dismiss-15-minutes")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage(null, "15");
    });
  document
    .querySelector("button.timelocker-chrome-dismiss-30-minutes")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage(null, "30");
    });
  document
    .querySelector("button.timelocker-chrome-close")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage(null, "close");
    });
});
