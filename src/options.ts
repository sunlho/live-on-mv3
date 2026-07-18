const settingsKey = "is_over_two_tabs_keep_pinned";
const checkbox = document.querySelector<HTMLInputElement>(
  "#is-over-two-tabs-keep-pinned"
);
const statusDom = document.querySelector<HTMLParagraphElement>("#status");

if (!checkbox || !statusDom) {
  throw new Error("Options page elements are missing");
}

function showStatus(message: string) {
  statusDom!.textContent = message;
  window.setTimeout(function () {
    statusDom!.textContent = "";
  }, 1500);
}

chrome.storage.local.get({ [settingsKey]: false }, function (settings) {
  checkbox.checked = Boolean(settings[settingsKey]);
});

checkbox.addEventListener("change", function () {
  chrome.storage.local.set({ [settingsKey]: checkbox.checked }, function () {
    showStatus("Saved");
  });
});
