"use strict";

// hostNode for overlay
const host = document.createElement("div");

document.addEventListener("fullscreenchange", () => {
  const parent = document.fullscreenElement;
  if (parent && !parent.contains(host)) {
    parent.insertBefore(host, parent.firstChild);
  }
});

const shadowRoot = host.attachShadow({ mode: "open" });

// describe buttons that will be created
// pre: list of nodes(could be strings) to insert before the button.
// post: list of nodes(could be strings) to append after the button.
// text: innerText of the button node.
// event: message payload to send when the button is clicked.

interface ButtonOption {
  event: string;
  text: string;
  pre?: (string | Node)[];
  post?: (string | Node)[];
}
const buttonOptions: ButtonOption[] = [
  { pre: ["Pick a time to continue: "], event: "5", text: "5 Minutes" },
  { event: "15", text: "15 Minutes" },
  { event: "30", text: "30 Minutes" },
  {
    pre: [document.createElement("br"), "Or "],
    event: "close",
    text: "close",
    post: [" instead."],
  },
];
// mapping function to create buttons according to buttonOptions
const createButton = ({ event, text, pre, post }: ButtonOption) => {
  const button = document.createElement("button");

  button.innerText = text;
  button.addEventListener("click", () => {
    chrome.runtime.sendMessage(event);
  });
  return { button, pre, post };
};

const buttonGroup = buttonOptions.map((option) => createButton(option));

// functions to enable/disable all buttons
const disableAllButton = () =>
  buttonGroup.forEach(({ button }) => (button.disabled = true));
const enableAllButton = () =>
  buttonGroup.forEach(({ button }) => (button.disabled = false));

chrome.runtime.onMessage.addListener((command) => {
  if (command === "show") {
    host.setAttribute("style", "display:block;");
    enableAllButton();
    // attach host to dom if necessary
    const parent = document.fullscreenElement;
    if (parent && !parent.contains(host)) {
      parent.insertBefore(host, parent.firstChild);
    } else if (host.parentNode === null)
      document.getElementsByTagName("body")[0].appendChild(host);
  } else if (command === "hide") {
    host.setAttribute("style", "display:none;");
  } else {
    console.log("unknow command", command);
  }
});

(async () => {
  // load overlay and inject into shadow root.
  const loadedContent = await fetch(
    chrome.runtime.getURL("overlay/overlay.html")
  );
  shadowRoot.innerHTML = await loadedContent.text();

  // inject generated buttons into target node.
  const buttonGroupRoot = shadowRoot.getElementById("button-group")!;
  buttonGroup.forEach(({ button, pre, post }) => {
    button.addEventListener("click", () => disableAllButton());
    if (pre) buttonGroupRoot.append(...pre);
    buttonGroupRoot.appendChild(button);
    if (post) buttonGroupRoot.append(...post);
  });
})();
export {};
