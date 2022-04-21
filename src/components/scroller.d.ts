export class Scroller {
  constructor(outer: HTMLElement, inner: HTMLElement);
  print(animate?: boolean): () => void;
  destroy();
}
