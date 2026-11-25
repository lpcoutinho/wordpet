export type SpriteState = 'neutral' | 'happy' | 'sleeping';

export interface Sprite {
  element: HTMLElement;
  setState(state: SpriteState): void;
}

export const createSprite = (): Sprite => {
  const element = document.createElement('div');
  element.className = 'sprite sprite--neutral';
  element.setAttribute('aria-hidden', 'true');
  element.innerHTML = `
    <div class="sprite__body">
      <div class="sprite__eye sprite__eye--left"></div>
      <div class="sprite__eye sprite__eye--right"></div>
      <div class="sprite__mouth"></div>
    </div>
  `;
  return {
    element,
    setState: (state) => {
      element.classList.remove('sprite--neutral', 'sprite--happy', 'sprite--sleeping');
      element.classList.add(`sprite--${state}`);
    },
  };
};
