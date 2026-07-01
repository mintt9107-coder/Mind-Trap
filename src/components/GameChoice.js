/**
 * MindTrap - GameChoice Component
 * 게임에서 2개 또는 4개의 선택지를 표시하는 컴포넌트입니다.
 */

import { createElement } from '../utils/helpers.js';

/**
 * GameChoice 컴포넌트 생성
 * @param {Object} options - 선택지 옵션
 * @param {string} options.primaryText - 첫 번째 선택지 텍스트
 * @param {string} options.secondaryText - 두 번째 선택지 텍스트
 * @param {Function} options.onChoice - 선택 콜백 (choice: 'primary' | 'secondary' | 'A' | 'B' | 'C' | 'D')
 * @param {boolean} [options.disabled=false] - 선택 비활성화 여부
 * @returns {Object} 컴포넌트 객체 {element, enable, disable, reset, setFourChoices, setTwoChoices}
 */
export const createGameChoice = ({
  primaryText,
  secondaryText,
  onChoice,
  disabled = false,
}) => {
  const container = createElement('div', {
    className: 'game-choice',
  });

  let isEnabled = !disabled;
  let buttons = [];
  let interactionStartAt = performance.now();
  let hoverStartedAt = null;
  let currentHoverChoice = null;
  let firstHoverChoice = null;
  let lastHoverChoice = null;
  let hoverSwitchCount = 0;
  let hoverDurations = {};
  let hoveredChoices = new Set();

  const resetInteraction = () => {
    interactionStartAt = performance.now();
    hoverStartedAt = null;
    currentHoverChoice = null;
    firstHoverChoice = null;
    lastHoverChoice = null;
    hoverSwitchCount = 0;
    hoverDurations = {};
    hoveredChoices = new Set();
  };

  const endCurrentHover = () => {
    if (!currentHoverChoice || hoverStartedAt === null) return;
    const duration = Math.max(0, performance.now() - hoverStartedAt);
    hoverDurations[currentHoverChoice] = (hoverDurations[currentHoverChoice] || 0) + duration;
    hoverStartedAt = null;
  };

  const startHover = (choice) => {
    if (!isEnabled) return;
    if (currentHoverChoice === choice && hoverStartedAt !== null) return;
    endCurrentHover();
    if (lastHoverChoice && lastHoverChoice !== choice) {
      hoverSwitchCount += 1;
    }
    currentHoverChoice = choice;
    hoverStartedAt = performance.now();
    firstHoverChoice = firstHoverChoice || choice;
    lastHoverChoice = choice;
    hoveredChoices.add(choice);
  };

  const stopHover = (choice) => {
    if (currentHoverChoice !== choice) return;
    endCurrentHover();
    currentHoverChoice = null;
  };

  const getInteractionSnapshot = (selectedChoice) => {
    endCurrentHover();
    const totalHoverMs = Object.values(hoverDurations).reduce((sum, value) => sum + value, 0);
    const selectedHoverMs = Math.round(hoverDurations[selectedChoice] || 0);
    const snapshot = {
      decisionWindowMs: Math.round(performance.now() - interactionStartAt),
      totalHoverMs: Math.round(totalHoverMs),
      selectedHoverMs,
      hoverSwitchCount,
      hoveredChoiceCount: hoveredChoices.size,
      firstHoverChoice,
      lastHoverChoice,
      changedMindBeforeClick: Boolean(firstHoverChoice && firstHoverChoice !== selectedChoice),
      selectedAfterHoveringOther: Boolean(
        hoveredChoices.size > 1 &&
        (hoverDurations[selectedChoice] || 0) < totalHoverMs * 0.5
      ),
    };
    currentHoverChoice = null;
    hoverStartedAt = null;
    return snapshot;
  };

  /**
   * 버튼 생성 헬퍼
   * @param {string} key - 선택 키
   * @param {string} text - 선택지 텍스트
   * @param {string} variant - primary | secondary
   * @returns {HTMLElement} 버튼 요소
   */
  const createChoiceBtn = (key, text, variant) => {
    const btn = createElement('button', {
      className: `game-choice__btn game-choice__btn--${variant}`,
    });
    btn.addEventListener('pointerenter', () => startHover(key));
    btn.addEventListener('pointerleave', () => stopHover(key));
    btn.addEventListener('focus', () => startHover(key));
    btn.addEventListener('blur', () => stopHover(key));
    btn.addEventListener('click', () => {
      if (!isEnabled) return;
      onChoice(key, getInteractionSnapshot(key));
    });

    const textEl = createElement('span', {
      className: 'game-choice__text',
      textContent: text,
    });
    btn.appendChild(textEl);
    return btn;
  };

  // 초기 2선택지 버튼 생성
  const primaryBtn = createChoiceBtn('primary', primaryText, 'primary');
  const secondaryBtn = createChoiceBtn('secondary', secondaryText, 'secondary');
  buttons = [primaryBtn, secondaryBtn];
  container.appendChild(primaryBtn);
  container.appendChild(secondaryBtn);

  /**
   * 컨테이너 비우고 버튼 재구성
   * @param {Array<HTMLElement>} newButtons - 새 버튼 배열
   */
  const rebuildButtons = (newButtons) => {
    container.innerHTML = '';
    resetInteraction();
    buttons = newButtons;
    buttons.forEach((btn) => container.appendChild(btn));
    if (!isEnabled) {
      buttons.forEach((btn) => btn.classList.add('game-choice__btn--disabled'));
    }
  };

  /**
   * 2선택지 설정
   * @param {string} textA - 첫 번째 선택지 텍스트
   * @param {string} textB - 두 번째 선택지 텍스트
   */
  const setTwoChoices = (textA, textB) => {
    const btnA = createChoiceBtn('primary', textA, 'primary');
    const btnB = createChoiceBtn('secondary', textB, 'secondary');
    rebuildButtons([btnA, btnB]);
    enable();
  };

  /**
   * 4선택지 설정
   * @param {string} textA - A 선택지 텍스트
   * @param {string} textB - B 선택지 텍스트
   * @param {string} textC - C 선택지 텍스트
   * @param {string} textD - D 선택지 텍스트
   */
  const setFourChoices = (textA, textB, textC, textD) => {
    const btnA = createChoiceBtn('A', textA, 'primary');
    const btnB = createChoiceBtn('B', textB, 'secondary');
    const btnC = createChoiceBtn('C', textC, 'primary');
    const btnD = createChoiceBtn('D', textD, 'secondary');
    rebuildButtons([btnA, btnB, btnC, btnD]);
    enable();
  };

  /**
   * 선택 활성화
   */
  const enable = () => {
    isEnabled = true;
    resetInteraction();
    buttons.forEach((btn) => btn.classList.remove('game-choice__btn--disabled'));
  };

  /**
   * 선택 비활성화
   */
  const disable = () => {
    isEnabled = false;
    endCurrentHover();
    buttons.forEach((btn) => btn.classList.add('game-choice__btn--disabled'));
  };

  /**
   * 선택지 리셋 (2선택지 텍스트 변경)
   * @param {string} newPrimaryText - 새 첫 번째 선택지 텍스트
   * @param {string} newSecondaryText - 새 두 번째 선택지 텍스트
   */
  const reset = (newPrimaryText, newSecondaryText) => {
    setTwoChoices(newPrimaryText, newSecondaryText);
  };

  // 초기 비활성화 상태인 경우
  if (disabled) {
    disable();
  }

  return { element: container, enable, disable, reset, setTwoChoices, setFourChoices };
};
