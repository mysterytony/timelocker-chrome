const textArea = document.createElement("textarea");
textArea.cols = 30;
textArea.rows = 10;
const textAreaContainer = document.getElementById("blocked-urls-container")!;
textAreaContainer.appendChild(textArea);

chrome.storage.sync.get("blocked_hostnames", (host_suffixes) => {
  if (
    host_suffixes.blocked_hostnames &&
    host_suffixes.blocked_hostnames.length > 0
  ) {
    textArea.value = host_suffixes.blocked_hostnames.join("\n");
  }
});

document
  .getElementById("option-save-btn")
  ?.addEventListener("click", (event) => {
    chrome.storage.sync.set(
      { blocked_hostnames: textArea.value.split("\n") },
      () => {
        chrome.runtime.sendMessage("refresh block url");
        alert("saved");
        window.close();
      }
    );
  });
export {};
