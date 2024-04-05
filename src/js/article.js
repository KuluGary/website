document.onreadystatechange = () => {
  if (document.readyState == "complete") {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }
};
