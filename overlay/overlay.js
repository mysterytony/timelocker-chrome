"use strict";
chrome.runtime.onMessage.addListener(async (command, sender, sendResponse) => {
  if (command !== "go") return;

  const response = await fetch(chrome.runtime.getURL("overlay/overlay.html"));
  const html = await response.text();

  const host = document.createElement("div");
  document.getElementsByTagName("body")[0].appendChild(host);
  const shadowRoot = host.attachShadow({ mode: "open" });
  shadowRoot.innerHTML = html;

  // .insertAdjacentHTML("beforeend", html);
  // .insertAdjacentElement("beforeend", myWidget);
  // .attachShadow(shadowRoot);
  shadowRoot
    .querySelector(".timelocker-chrome-overlay-wrapper button")
    .addEventListener("click", () => {
      // disable all the button, because reload takes some time,
      // don't want user to click buttons multiple times
      shadowRoot
        .querySelectorAll(".timelocker-chrome-overlay-wrapper button")
        .forEach((b) => (b.disabled = true));
    });
  shadowRoot
    .querySelector("button.timelocker-chrome-dismiss-5-minutes")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage(null, "5");
    });
  shadowRoot
    .querySelector("button.timelocker-chrome-dismiss-15-minutes")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage(null, "15");
    });
  shadowRoot
    .querySelector("button.timelocker-chrome-dismiss-30-minutes")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage(null, "30");
    });
  shadowRoot
    .querySelector("button.timelocker-chrome-close")
    .addEventListener("click", () => {
      chrome.runtime.sendMessage(null, "close");
    });
});
