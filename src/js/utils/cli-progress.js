const cliProgress = require("cli-progress");

let progressBar;

function startProgress(totalValue) {
  if (!progressBar) {
    progressBar = new cliProgress.SingleBar(
      { format: "[{bar}] {percentage}%", linewrap: true },
      cliProgress.Presets.rect
    );
  } else {
    throw new Error("Progress bar already started. Call `stopProgress` before initializing a new one.");
  }

  progressBar.start(totalValue, 0);
}

function incrementProgress() {
  if (!progressBar) throw new Error("Progress bar not started. Call `startProgress` before incrementing.");

  progressBar.increment();
}

function stopProgress() {
  if (!progressBar) throw new Error("Progress bar not started. Call `startProgress` before stopping.");

  progressBar.stop();
  progressBar = undefined;
}

module.exports = {
  startProgress,
  incrementProgress,
  stopProgress,
};
