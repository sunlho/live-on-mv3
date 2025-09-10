var reopen_tab_id: number | null | undefined = null;
var creating_tab = false;
var activate_tab = false;

function keep_two() {
  chrome.windows.getAll({ populate: true }, function (windows) {
    var tab_count = 0;
    let w: chrome.windows.Window | null = null;
    for (var i = 0; i < windows.length; i++) {
      w = windows[i];
      if (!w.tabs) continue;
      tab_count += w.tabs.length;
    }
    if (tab_count == 1 && !creating_tab) {
      const w_tab = w!.tabs![0];
      creating_tab = true;

      if (w_tab.pinned == true) {
        activate_tab = true;
      } else {
        activate_tab = false;
      }

      chrome.tabs.create(
        { active: activate_tab, pinned: w_tab.pinned == false },
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
      if (id == tab.id)
        //Do not close new tab which is chrome://newtab
        continue;
      if (tabs[i].url == "chrome://newtab/" && tabs[i].pinned && id) {
        chrome.tabs.remove(id);
        return;
      }
    }
  });
}
keep_two();

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

chrome.tabs.onActivated.addListener(function (tab) {
  chrome.windows.getAll({ populate: true }, function (windows) {
    var tab_count = 0;
    var w: chrome.windows.Window | null = null;
    for (var i = 0; i < windows.length; i++) {
      w = windows[i];
      if (!w.tabs) continue;
      tab_count += w.tabs.length;
    }

    if (tab_count == 2) {
      const w_tab1 = w!.tabs![0];
      const w_tab2 = w!.tabs![1];
      if (
        w_tab1.pinned &&
        w_tab1.id == tab.tabId &&
        w_tab1.url == "chrome://newtab/" &&
        w_tab2.id
      ) {
        chrome.tabs.update(w_tab2.id, { active: true });
      }
    }
  });
});
