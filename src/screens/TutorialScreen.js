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
      content: 'MindTrap은 정답을 맞히는 게임이 아니라, 제한 시간 안에서 드러나는 선택 습관을 AI가 읽어내는 심리 분석 게임입니다.\n플레이가 쌓일수록 AI는 반응 속도, 망설임, 반복되는 기준, 마음을 바꾸는 타이밍을 기억하며 더 정밀한 가설을 세웁니다.\n일부러 속이려는 시도도 결국 하나의 패턴으로 남습니다.',
    },
    {
      title: '🔍 AI는 당신을 관찰합니다',
      content: 'AI는 무엇을 골랐는지만 보지 않습니다. 선택의 방향, 반응 속도, 커서의 흔들림, 선택을 바꾸는 순간, 일부러 늦춘 반응까지 다음 분석의 단서로 삼습니다.\n중간중간 AI가 말을 걸거나 선택을 흔드는 상황이 나타날 수 있으며, 그때의 반응도 분석에 반영됩니다.',
    },
    {
      title: `📊 총 ${GAME_CONFIG.TOTAL_ROUNDS}개의 라운드`,
      content: '각 라운드는 짧고 빠르게 진행됩니다. 두 가지 또는 네 가지 선택지 중 하나를 고르면, AI는 그 선택을 이전 흐름과 비교해 당신의 판단 기준을 추적합니다.',
    },
    {
      title: '⏱️ 제한 시간 안에 결정하세요',
      content: `각 라운드마다 ${GAME_CONFIG.ROUND_TIME_LIMIT / 1000}초의 시간 제한이 있습니다. 빠르게 고른 선택, 끝까지 미룬 선택, 시간 초과까지 모두 AI가 해석할 데이터가 됩니다.`,
    },
    {
      title: '🎯 숨기려는 순간도 기록됩니다',
      content: '빠른 반응, 신중한 선택, 일부러 깨뜨린 패턴, 예상 밖의 판단까지 모두 분석됩니다. 게임이 끝나면 AI는 예측 정확도보다 당신이 선택을 다루는 방식에 가까운 리포트를 남깁니다.',
    },
    {
      title: '🧾 결과 리포트를 확인하세요',
      content: '게임이 끝나면 AI가 당신의 위험 성향, 반복성, 인내심, 심리전 대응, AI 신뢰도 등을 리포트로 정리합니다.\n리포트에는 한 줄 피드백, AI가 새로 학습한 내용, 다음 게임에서 더 집중해서 볼 지점도 함께 표시됩니다.',
    },
    {
      title: '🧠 AI는 당신을 기억합니다',
      content: '이름을 저장하고 게임을 반복하면 AI는 이전 플레이 기록을 바탕으로 당신을 다시 분석합니다.\n누적된 기억은 AI의 기억 화면에서 확인할 수 있으며, 원하지 않을 때는 메인 화면의 기억 삭제 버튼으로 저장된 기억을 지울 수 있습니다.',
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
