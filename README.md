You can input a list of URLs to block. When you visit these blocked webpages, it
will first ask if you want to continue and give options to select a time of
duration. After the duration is expired, the webpage will be blocked again.

## First Time Setup

1.  In a terminal:

    ```bash
    # fork and clone the repository
    git clone git@github.com:<YOUR-FORK>/timelocker-chrome.git
    cd timelocker-chrome

    # install the dependencies
    npm install

    # build the project
    npm run build
    ```

2.  Then in chrome://extensions, open developer mode, and
    "Load unpacked". Select `build/` folder

Heavily inspired by
[老师好我叫何同学](https://www.bilibili.com/video/BV1ev411x7en) and
[this TED](https://www.youtube.com/watch?v=TQMbvJNRpLE)

I'm using [prettier](https://prettier.io/) for formatting.
