// detection.js (modernized to call local FastAPI BLIP backend)

// Basic setup
window.browser = (function () {
  return window.msBrowser || window.browser || window.chrome;
})();

'use strict';

const FASTAPI_BASE = "http://127.0.0.1:8000";

const BLIP_ENDPOINT = "/caption/blip/url";

// Helper to build the full URL for the caption endpoint
function buildCaptionRequestUrl(mediaUrl) {
  return `${FASTAPI_BASE}${BLIP_ENDPOINT}?url=${encodeURIComponent(mediaUrl)}`;
}

// Global state
window.urlsDetected = [];
window.urlsWithText = [];

// MutationObserver – watches for new GIFs / videos
let observer = new MutationObserver(mutations => {
  let imageOrVideoDetected = false;
  let twitterVideoDetected = false;
  let redditVideoDetected = false;

  for (let mutation of mutations) {
    for (let addedNode of mutation.addedNodes) {
      if (
        addedNode.nodeName === "IMG" ||
        addedNode.getElementsByTagName?.("img")?.length
      ) {
        imageOrVideoDetected = true;
      }

      if (
        addedNode.nodeName === "VIDEO" ||
        addedNode.getElementsByTagName?.("video")?.length
      ) {
        if (window.location.href.includes("twitter.com")) {
          twitterVideoDetected = true;
        } else if (window.location.href.includes("reddit.com")) {
          redditVideoDetected = true;
        } else {
          imageOrVideoDetected = true;
        }
      }

      if (imageOrVideoDetected || twitterVideoDetected || redditVideoDetected) {
        break;
      }
    }

    if (imageOrVideoDetected || twitterVideoDetected || redditVideoDetected) {
      break;
    }
  }

  if (twitterVideoDetected) {
    twitter_find();
  } else if (redditVideoDetected) {
    reddit_find();
  } else if (imageOrVideoDetected) {
    img_find();
  }
});

observer.observe(document, { childList: true, subtree: true });

// GIF <img> handling
function img_find() {
  // Wait a bit so the page can finish loading images
  setTimeout(runWhenPageLoaded, 3000);

  function runWhenPageLoaded() {
    const imgs = document.getElementsByTagName("img");
    const imgSrcs = [];
    let counter = 0;

    if (!imgs.length) {
      return;
    }

    for (let i = 0; i < imgs.length; i++) {
      const src = imgs[i].src;
      if (!src) continue;

      // Only process GIFs that don't already have alt text
      if (src.toLowerCase().includes(".gif") && !imgs[i].alt) {
        imgSrcs.push({ img: imgs[i], url: src });

        const requestUrl = buildCaptionRequestUrl(src);

        fetch(requestUrl, { method: "POST" })
          .then(response => response.json())
          .then(result => {
            counter++;
            const caption = result.caption || "Animated image";

            // Update alt text and give a small visual hint (green border)
            imgs[i].alt = caption;
            imgs[i].style.cssText += " border: 3px solid green;";

            console.log("BLIP caption (GIF):", caption);

            if (counter === imgSrcs.length) {
              // alert("Page accessibility ready (GIF captions added).");
            }
          })
          .catch(error => {
            counter++;
            console.error("Error calling FastAPI BLIP for GIF:", error);
          });
      }
    }
  }
}

// Twitter <video> handling (mp4)
function twitter_find() {
  setTimeout(runWhenTwitterLoaded, 2000);

  function runWhenTwitterLoaded() {
    const videos = document.getElementsByTagName("video");
    if (!videos.length) return;

    const videoEntries = [];
    let counter = 0;

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];

      // Try to grab the first <source> inside the <video>
      const source = video.getElementsByTagName("source")[0];
      const src = (source && source.src) || video.src;

      if (!src) continue;

      // Only process .mp4 and avoid duplicates
      if (src.toLowerCase().includes(".mp4")) {
        if (window.urlsDetected.includes(src.toLowerCase())) {
          continue;
        }
        window.urlsDetected.push(src.toLowerCase());

        videoEntries.push({ video, url: src });

        const requestUrl = buildCaptionRequestUrl(src);

        fetch(requestUrl, { method: "POST" })
          .then(response => response.json())
          .then(result => {
            counter++;
            const caption = result.caption || "Video clip";

            // Use aria-label so screen readers can read it
            video.setAttribute("aria-label", caption);
            video.tabIndex = 0;

            console.log("BLIP caption (Twitter video):", caption);

            if (counter === videoEntries.length) {
              // alert("Twitter videos captioned.");
            }
          })
          .catch(error => {
            counter++;
            console.error("Error calling FastAPI BLIP for Twitter video:", error);
          });
      }
    }
  }
}

// Reddit <video> handling (mp4)
function reddit_find() {
  setTimeout(runWhenRedditLoaded, 2000);

  function runWhenRedditLoaded() {
    const videos = document.getElementsByTagName("video");
    if (!videos.length) return;

    const videoEntries = [];
    let counter = 0;

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];

      // Similar to Twitter: first look at <source>, fallback to video.src
      const source = video.getElementsByTagName("source")[0];
      const src = (source && source.src) || video.src;

      if (!src) continue;

      // Only process Reddit mp4 URLs (they often have format=mp4)
      if (src.toLowerCase().includes("mp4")) {
        if (window.urlsDetected.includes(src.toLowerCase())) {
          continue;
        }
        window.urlsDetected.push(src.toLowerCase());

        videoEntries.push({ video, url: src });

        const requestUrl = buildCaptionRequestUrl(src);

        fetch(requestUrl, { method: "POST" })
          .then(response => response.json())
          .then(result => {
            counter++;
            const caption = result.caption || "Video clip";

            video.setAttribute("aria-label", caption);
            video.tabIndex = 0;

            console.log("BLIP caption (Reddit video):", caption);

            if (counter === videoEntries.length) {
              // alert("Reddit videos captioned.");
            }
          })
          .catch(error => {
            counter++;
            console.error("Error calling FastAPI BLIP for Reddit video:", error);
          });
      }
    }
  }
}