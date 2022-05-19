export class Scroller {
  constructor(outer: HTMLElement, inner: HTMLElement);
  print(animate?: boolean): () => void;
  scroll_instant(): () => void;
  destroy();
}
