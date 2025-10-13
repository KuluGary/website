module.exports = {
  getStoriesGrouped,
};

function getStoriesGrouped(collectionApi) {
  const stories = collectionApi.getFilteredByTag("story") || [];

  // Group by storyId
  const grouped = {};
  for (const item of stories) {
    const id = item.data.storyId;
    if (!grouped[id]) grouped[id] = [];
    grouped[id].push(item);
  }

  // Sort chapters within each story
  for (const id in grouped) {
    grouped[id].sort((a, b) => (a.data.storyChapter ?? 0) - (b.data.storyChapter ?? 0));
  }

  // Return as array of {storyId, storyTitle, chapters}
  return Object.entries(grouped).map(([storyId, chapters]) => ({
    storyId,
    storyTitle: chapters[0].data.storyTitle,
    chapters,
  }));
}
