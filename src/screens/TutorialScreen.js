/**
 * MindTrap - Tutorial Screen
 * 게임 튜토리얼 화면입니다.
 */

import { createElement } from '../utils/helpers.js';
import { createButton } from '../components/Button.js';
import { createCard } from '../components/Card.js';
import { GAME_CONFIG } from '../utils/constants.js';

/**
 * TutorialScreen 생성
 * @param {Object} options - 튜토리얼 화면 옵션
 * @param {Function} options.onBack - 뒤로가기 콜백
 * @returns {Object} 튜토리얼 화면 객체 {element, show, hide}
 */
export const createTutorialScreen = ({ onBack }) => {
  const screen = createElement('div', {
    className: 'screen tutorial-screen',
    id: 'tutorial-screen',
  });

  // 튜토리얼 컨테이너
  const tutorialContainer = createElement('div', {
    className: 'tutorial__container',
  });

  // 제목
  const title = createElement('h1', {
    className: 'tutorial__title text-gradient',
    textContent: '게임 설명',
  });

  // 튜토리얼 카드들
  const cardsSection = createElement('div', {
    className: 'tutorial__cards',
  });

  const tutorialCards = [
    {
      title: '🧠 MindTrap이란?',
      content: 'MindTrap은 플레이어가 선택을 숨기려는 순간까지 AI가 관찰하는 심리 분석 게임입니다.\n플레이를 반복할수록 AI는 플레이어의 반응속도, 흔들림, 반복되는 기준을 기억하며 더 정밀한 가설을 세웁니다.\n속이려는 시도도 하나의 패턴이 됩니다.',
    },
    {
      title: '🔍 AI는 당신을 관찰합니다',
      content: 'AI는 선택의 방향, 반응 속도, 망설임, 반복되는 패턴을 분석합니다. 숨기려는 선택, 바꾸려는 순간, 일부러 늦춘 반응까지 모두 다음 가설의 단서가 됩니다.',
    },
    {
      title: `📊 총 ${GAME_CONFIG.TOTAL_ROUNDS}개의 라운드`,
      content: '각 라운드는 짧고 빠르게 진행됩니다. 두 가지 또는 네 가지 선택지 중 하나를 고르며, 모든 선택은 다음 분석의 단서가 됩니다.',
    },
    {
      title: '⏱️ 제한 시간 안에 결정하세요',
      content: `각 라운드마다 ${GAME_CONFIG.ROUND_TIME_LIMIT / 1000}초의 시간 제한이 있습니다. 시간이 지나면 자동으로 선택되며, 시간 초과 역시 AI가 해석할 데이터가 됩니다.`,
    },
    {
      title: '🎯 숨기려는 순간도 기록됩니다',
      content: '빠른 반응, 신중한 선택, 일부러 깨뜨린 패턴, 예상 밖의 판단까지 모두 분석됩니다. AI는 정답을 찾는 것이 아니라, 당신이 선택을 다루는 방식을 읽습니다.',
    },
  ];

  tutorialCards.forEach((cardData) => {
    const card = createCard({
      title: cardData.title,
      content: cardData.content,
      className: 'tutorial__card',
      glass: true,
    });
    cardsSection.appendChild(card);
  });

  // 버튼 섹션
  const buttonSection = createElement('div', {
    className: 'tutorial__buttons',
  });

  const backBtn = createButton({
    text: '뒤로가기',
    variant: 'primary',
    size: 'large',
    onClick: onBack,
  });

  buttonSection.appendChild(backBtn);

  tutorialContainer.appendChild(title);
  tutorialContainer.appendChild(cardsSection);
  tutorialContainer.appendChild(buttonSection);
  screen.appendChild(tutorialContainer);

  /**
   * 화면 표시
   */
  const show = () => {
    screen.classList.add('active', 'fade-in');
  };

  /**
   * 화면 숨기기
   */
  const hide = () => {
    screen.classList.remove('active');
    screen.classList.remove('fade-in');
  };

  return { element: screen, show, hide };
};
