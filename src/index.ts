var reopen_tab_id: number | null | undefined = null;
var creating_tab = false;
var activate_tab = false;
var is_over_two_tabs_keep_pinned = false;
const settings_key = "is_over_two_tabs_keep_pinned";

chrome.storage.local.get({ [settings_key]: false }, function (settings) {
  is_over_two_tabs_keep_pinned = Boolean(settings[settings_key]);
  keep_two();
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName !== "local" || !changes[settings_key]) return;
  is_over_two_tabs_keep_pinned = Boolean(changes[settings_key].newValue);
});

function is_pinned_tab(tab: chrome.tabs.Tab) {
  const correct_url =
    tab.url &&
    (tab.url == "chrome://newtab/" ||
      tab.url.startsWith("chrome-extension://"));
  return tab.pinned && correct_url;
}

function keep_two() {
  chrome.windows.getAll({ populate: true }, function (windows) {
    var tab_count = 0;
    let remaining_tab: chrome.tabs.Tab | undefined;
    for (var i = 0; i < windows.length; i++) {
      const w = windows[i];
      if (!w.tabs) continue;
      tab_count += w.tabs.length;
      if (w.tabs.length > 0) remaining_tab = w.tabs[0];
    }
    if (tab_count == 1 && remaining_tab && !creating_tab) {
      const w_tab = remaining_tab;
      creating_tab = true;

      if (is_pinned_tab(w_tab) && w_tab.id) {
        const buffer_tab_id = w_tab.id;
        chrome.tabs.create(
          { active: false, pinned: true, windowId: w_tab.windowId },
          function (tab) {
            reopen_tab_id = tab.id;
            chrome.tabs.update(
              buffer_tab_id,
              { active: true, pinned: false },
              function () {
                creating_tab = false;
              }
            );
          }
        );
        return;
      }

      if (w_tab.pinned == true) {
        activate_tab = true;
      } else {
        activate_tab = false;
      }

      chrome.tabs.create(
        {
          active: activate_tab,
          pinned: w_tab.pinned == false,
          windowId: w_tab.windowId
        },
        function (tab) {
          // save this tab id in case of Close Tabs to The Right.
          // Chrome will close this tab if that is the case even it's just being
          // added.
          reopen_tab_id = tab.id;
          creating_tab = false;
        }
      );
    }
  });
}

function close_one(tab: chrome.tabs.Tab) {
  if (!tab || !tab.windowId || !tab.id) return;
  chrome.tabs.query({ windowId: tab.windowId }, function (tabs) {
    if (tabs.length != 3) return;
    for (
      var i = 0, closed = 0;
      i < tabs.length && closed < tabs.length - 2;
      i++
    ) {
      const id = tabs[i].id;
      if (id == tab.id) {
        continue;
      }
      if (is_pinned_tab(tabs[i]) && id && !is_over_two_tabs_keep_pinned) {
        chrome.tabs.remove(id);
        return;
      }
    }
  });
}

chrome.tabs.onRemoved.addListener(function (tabId) {
  if (reopen_tab_id == tabId) {
    setTimeout(keep_two, 100);
    return;
  }
  keep_two();
});

chrome.tabs.onCreated.addListener(function (tab) {
  if (tab.id != reopen_tab_id) reopen_tab_id = null;
  close_one(tab);
});
