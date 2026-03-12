/// <reference types="chrome" />

// Toggle side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Context menu: "Open ICP UserHub in full tab"
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open-full-tab",
    title: "Open ICP UserHub in full tab",
    contexts: ["action"],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "open-full-tab") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("tab.html"),
    });
  }
});

// Relay Internet Identity delegation messages from callback.html to sidepanel/tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "II_DELEGATION") {
    // Broadcast to all extension views (sidepanel + tabs)
    chrome.runtime.sendMessage(message).catch(() => {
      // No listeners — that's OK, sidepanel may not be open
    });
    sendResponse({ ok: true });
  }
  return false;
});
