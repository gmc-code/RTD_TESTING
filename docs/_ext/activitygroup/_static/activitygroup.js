/* activitygroup - an activity (e.g. graphing) followed by questions about it.
   The questions can stay locked until the activity announces that it is
   finished with a bubbling "activitygroup:complete" event
   (detail.how = "check" when completed correctly, "answer" when the answer
   was shown). */
(function () {
  "use strict";

  function initGroup(group) {
    if (group.dataset.activitygroupReady) return;
    group.dataset.activitygroupReady = "true";

    const reveal = group.dataset.reveal || "always";
    const activity = group.querySelector(":scope > .activitygroup-activity");
    const questions = group.querySelector(":scope > .activitygroup-questions");
    const notice = group.querySelector(":scope > .activitygroup-lock-notice");

    function unlock(announce) {
      if (!group.classList.contains("activitygroup-locked")) return;
      group.classList.remove("activitygroup-locked");
      if (notice) {
        if (announce) {
          notice.classList.add("activitygroup-lock-open");
          notice.textContent = "🔓 Questions unlocked.";
        } else {
          notice.remove();
        }
      }
    }

    if (questions && reveal !== "always") {
      group.classList.add("activitygroup-locked");

      // An activity that cannot announce when it is finished would leave the
      // questions locked for ever, so show them straight away instead.
      const canAnnounce = activity && activity.querySelector("[data-activitygroup-events]");
      if (!canAnnounce) {
        console.warn("activitygroup: the activity cannot report when it is finished, " +
          "so the questions are shown from the start.");
        unlock(false);
      } else {
        activity.addEventListener("activitygroup:complete", event => {
          const how = event.detail && event.detail.how;
          if (how === "check" || (how === "answer" && reveal === "answer")) unlock(true);
        });
      }
    }

    // Print the whole group on its own: it is moved into a temporary host at
    // the top of <body> (everything else is hidden by CSS) and moved back.
    const btnPrint = group.querySelector(":scope > .activitygroup-controls .activitygroup-btn-print");
    function startPrintMode() {
      if (document.body.classList.contains("activitygroup-printing")) return;
      const marker = document.createComment("activitygroup");
      group.parentNode.insertBefore(marker, group);
      const host = document.createElement("div");
      host.className = "activitygroup-print-host";
      document.body.appendChild(host);
      host.appendChild(group);
      document.body.classList.add("activitygroup-printing");
      const done = () => {
        marker.parentNode.insertBefore(group, marker);
        marker.remove();
        host.remove();
        document.body.classList.remove("activitygroup-printing");
        window.removeEventListener("afterprint", done);
      };
      window.addEventListener("afterprint", done);
    }
    group._activitygroupStartPrint = startPrintMode;     // used by tests
    if (btnPrint) {
      btnPrint.addEventListener("click", () => {
        startPrintMode();
        window.print();
      });
    }
  }

  function initAll() {
    document.querySelectorAll(".activitygroup-block").forEach(initGroup);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
