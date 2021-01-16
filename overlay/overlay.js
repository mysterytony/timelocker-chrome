"use strict";

// setTimeout(() => {

//   var images = document.getElementsByTagName('img');
//   for (var i = 0, l = images.length; i < l; i++) {
//     images[i].src = 'http://placekitten.com/' + images[i].width + '/' + images[i].height;
//   }
// }, 1000)

chrome.runtime.onMessage.addListener((html, sender, sendResponse) => {
  console.log(html);
  document
    .getElementsByTagName("body")[0]
    .insertAdjacentHTML("beforeend", html);
  document
    .querySelector("button.timelocker-chrome-dismiss")
    .addEventListener("click", (event) => {
      // disable the dismiss button, because reload takes some time, don't want user to link dismiss multiple times
      event.target.disabled = true;

      chrome.runtime.sendMessage(null, "dismiss", {}, (response) => {
        console.log(response);
        // document.querySelector("div.timelocker-chrome-overlay").remove()
      });
    });
  sendResponse("msg received");
});

// $(chrome.runtime.getURL('overlay.html'), function (html) {
//   document.getElementsByTagName("body")[0].insertAdjacentHTML("beforeend", html)
// });

// function btn_dismiss_onclick() {
//   console.log("dismiss")
// }
