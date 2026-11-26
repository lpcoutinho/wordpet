import type { PetStage } from '../core/pet';

export type SpriteState = 'neutral' | 'happy' | 'sleeping';

export interface Sprite {
  element: HTMLElement;
  setState(state: SpriteState): void;
  setStage(stage: PetStage): void;
}

export const createSprite = (): Sprite => {
  const element = document.createElement('div');
  element.className = 'sprite sprite--neutral';
  element.dataset.stage = 'egg';
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
    setStage: (stage) => {
      element.dataset.stage = stage;
    },
    setState: (state) => {
      element.classList.remove('sprite--neutral', 'sprite--happy', 'sprite--sleeping');
      element.classList.add(`sprite--${state}`);
    },
  };
};
