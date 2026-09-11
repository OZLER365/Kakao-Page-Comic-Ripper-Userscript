# KakaoPage Comic Ripper

A Tampermonkey userscript designed to concurrently download chapter images from KakaoPage. It intercepts background API requests to capture high-quality image URLs and saves them directly to an organized local folder on your device.

## ✨ Key Features

* **Concurrent Downloading:** Downloads all chapter images simultaneously to maximize speed, bypassing sequential loading delays.
* **Smart API Interception:** Hooks into the site's `XMLHttpRequest` and `Fetch` APIs to silently capture image data as soon as it loads.
* **Built-in Retry Logic:** Automatically retries downloading individual images up to 3 times (with a 2-second wait) if a network timeout or error occurs.
* **Native Folder Export:** Utilizes `GM_download` to save images directly into a folder named after the chapter, avoiding the need for ZIP extraction.
* **Floating UI:** Features a dark-themed, non-intrusive floating panel in the bottom-right corner to track readiness and download progress.
* **SPA Navigation Support:** Automatically resets the script and UI when you navigate to a new chapter without refreshing the page.

## 🚀 Installation & Usage

* **Prerequisite:** Install the **Tampermonkey** extension (highly recommended for file-saving permissions).
* **Install Script:** Add the userscript directly from my Greasyfork profile.
* **Usage:** Open any chapter on KakaoPage. The floating panel will initially display "Waiting for Chapter Data...".
* **Download:** Once the data is successfully intercepted, the button will turn yellow and display the total page count. Click **Direct DL (Folder)** to save all pages.

## ⚠️ Important Notes

* **Educational Use:** This tool is strictly for educational purposes. Please support original creators and do not repost or distribute the downloaded images.
* **No ZIP Support:** Images are downloaded individually into a local folder; ZIP packaging is not supported.

## 🔗 Links, Feedback & Support

* **Greasyfork Scripts:** [ozler365's Profile](https://greasyfork.org/en/users/1553223-ozler365)
* **GitHub Repositories:** [ozler-s-works-info](https://ozler365.github.io/ozler-s-works-info/#/repositories)
* **Support the Developer:** Keep this script updated and running smoothly by leaving a small donation at [Buy Me a Coffee (ozler)](https://buymeacoffee.com/ozler)

For queries, bug reports, or feature requests, please leave a review on Greasyfork or email **devjk6918@gmail.com**.
