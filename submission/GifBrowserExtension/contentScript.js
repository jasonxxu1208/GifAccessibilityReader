//contentScript.js
//console.log("Accesibility Tool-Content Script is Running");


window.browser = (function () {
  return window.msBrowser || window.browser || window.chrome;
})();
