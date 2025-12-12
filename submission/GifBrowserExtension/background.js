// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


 chrome.runtime.onMessage.addListener(
    function(message, callback) {
      if (message == "runContentScript"){
      		chrome.tabs.executeScript({
      		file: 'contentScript.js'
      });
      }
   });

 chrome.runtime.onMessage.addListener(
 	function(message,callback) {
 		if(message=="runContentScript"){
 			chrome.tabs.executeScript({
 			file: 'detection.js'
 		});
 		}
 	});
