function getTitle (context) {
  let title = "";
  while (context) {
    if (context.title) {
      if (title) {
        title = ` - ${title}`;
      }
      title = context.title + title;
    }
    context = context.parent;
  }
  return title;
}

export { getTitle };
