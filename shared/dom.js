// Build a DOM node; text goes through textContent so user input is never parsed as HTML.
export const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids);
  return n;
};
