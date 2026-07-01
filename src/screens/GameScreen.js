/**
 * MindTrap - Game Screen
 * 게임 플레이 화면입니다.
 * 10초 타이머, 4선택지, 2단계 선택지 UI를 지원합니다.
 */

import { createElement } from '../utils/helpers.js';
import { createProgressBar, createCircularProgressBar } from '../components/ProgressBar.js';
import { createGameChoice } from '../components/GameChoice.js';
import { GAME_CONFIG, GAME_EVENTS } from '../utils/constants.js';

/**
 * GameScreen 생성
 * @param {Object} options - 게임 화면 옵션
 * @param {Object} options.gameEngine - 게임 엔진 인스턴스
 * @returns {Object} 게임 화면 객체
 */
export const createGameScreen = ({ gameEngine, onBackToMenu, getUserName }) => {
  const formatReadableText = (text = '') => String(text)
    .trim()
    .replace(/\s*\n\s*/g, '\n')
    .replace(/([.!?。！？])\s+/g, '$1\n')
    .replace(/\n{3,}/g, '\n\n');

  const formatQuestionText = (text = '') => {
    const userName = typeof getUserName === 'function' ? getUserName() : '';
    const playerName = userName ? `${userName}님` : '당신';
    return formatReadableText(String(text).replace(/\{playerName\}/g, playerName));
  };

  const screen = createElement('div', {
    className: 'screen game-screen',
    id: 'game-screen',
  });

  const gameContainer = createElement('div', {
    className: 'game__container',
  });

  // 상단 정보 바
  const topBar = createElement('div', {
    className: 'game__top-bar',
  });

  // 라운드 정보
  const roundInfo = createElement('div', {
    className: 'game__round-info',
  });
  const roundLabel = createElement('span', {
    className: 'game__round-label',
    textContent: 'ROUND',
  });
  const roundNumber = createElement('span', {
    className: 'game__round-number',
    textContent: '0 / 0',
  });
  roundInfo.appendChild(roundLabel);
  roundInfo.appendChild(roundNumber);

  // 프로그레스 바
  const { element: progressElement, update: updateProgress } = createProgressBar({
    value: 0,
    max: GAME_CONFIG.TOTAL_ROUNDS,
    variant: 'primary',
    showLabel: false,
  });

  // 원형 타이머 (10초 카운트다운)
  const { element: timerElement, update: updateTimer } = createCircularProgressBar({
    value: 0,
    max: GAME_CONFIG.ROUND_TIME_LIMIT,
    variant: 'timer',
    size: 56,
  });

  topBar.appendChild(roundInfo);
  topBar.appendChild(progressElement);
  topBar.appendChild(timerElement);

  const gameActions = createElement('div', {
    className: 'game__actions',
  });

  const pauseButton = createElement('button', {
    className: 'game__action-btn',
    textContent: 'STOP',
  });
  pauseButton.type = 'button';

  const homeButton = createElement('button', {
    className: 'game__action-btn',
    textContent: 'HOME',
  });
  homeButton.type = 'button';

  gameActions.appendChild(pauseButton);
  gameActions.appendChild(homeButton);
  topBar.appendChild(gameActions);

  // 팝업 타이머 추적
  let feedbackTimer = null;

  // 질문 섹션
  const questionSection = createElement('div', {
    className: 'game__question-section',
  });

  const questionPrompt = createElement('p', {
    className: 'game__question-prompt',
    textContent: '',
  });

  const questionCard = createElement('div', {
    className: 'game__question-card glass',
  });
  const questionText = createElement('h2', {
    className: 'game__question-text',
    textContent: '',
  });
  questionCard.appendChild(questionText);

  questionSection.appendChild(questionPrompt);
  questionSection.appendChild(questionCard);

  const analysisFeedback = createElement('div', {
    className: 'game__analysis-feedback',
    textContent: '',
  });
  questionSection.appendChild(analysisFeedback);

  // 선택지 섹션
  const choiceSection = createElement('div', {
    className: 'game__choice-section',
  });

  const { element: choiceElement, enable, disable, setFourChoices, setTwoChoices } = createGameChoice({
    primaryText: '선택 1',
    secondaryText: '선택 2',
    onChoice: (choice, interactionMetrics) => {
      gameEngine.handleChoice(choice, interactionMetrics);
    },
    disabled: true,
  });

  choiceSection.appendChild(choiceElement);

  // 타임아웃 표시
  const timeoutOverlay = createElement('div', {
    className: 'game__timeout-overlay',
  });
  const timeoutText = createElement('span', {
    className: 'game__timeout-text',
    textContent: '시간 초과!',
  });
  timeoutOverlay.appendChild(timeoutText);

  gameContainer.appendChild(topBar);
  gameContainer.appendChild(questionSection);
  gameContainer.appendChild(choiceSection);
  screen.appendChild(gameContainer);
  screen.appendChild(timeoutOverlay);

  const popupOverlay = createElement('div', {
    className: 'game__popup-overlay',
  });
  const popup = createElement('div', {
    className: 'game__popup glass',
  });
  const popupTitle = createElement('h2', {
    className: 'game__popup-title',
    textContent: '',
  });
  const popupMessage = createElement('p', {
    className: 'game__popup-message',
    textContent: '',
  });
  const popupButton = createElement('button', {
    className: 'btn btn--primary btn--medium game__popup-button',
    textContent: '계속',
  });
  popupButton.type = 'button';
  popup.appendChild(popupTitle);
  popup.appendChild(popupMessage);
  popup.appendChild(popupButton);
  popupOverlay.appendChild(popup);
  screen.appendChild(popupOverlay);

  let popupCloseHandler = null;
  let isPausedByUser = false;

  const showAnalysisFeedback = (message) => {
    if (!message) return;
    if (feedbackTimer) {
      clearTimeout(feedbackTimer);
      feedbackTimer = null;
    }
    analysisFeedback.textContent = formatReadableText(message);
    analysisFeedback.classList.add('game__analysis-feedback--visible');
    feedbackTimer = setTimeout(() => {
      analysisFeedback.classList.remove('game__analysis-feedback--visible');
      feedbackTimer = null;
    }, 3000);
  };

  const showAnalysisPopup = ({ title = 'AI :', message = '', buttonText = '계속', onClose } = {}) => {
    if (!message) return;
    popupTitle.textContent = title;
    popupMessage.textContent = formatReadableText(message);
    popupButton.textContent = buttonText;
    popupCloseHandler = onClose || null;
    popupOverlay.classList.add('game__popup-overlay--visible');
    popupButton.focus();
  };

  const closeAnalysisPopup = () => {
    popupOverlay.classList.remove('game__popup-overlay--visible');
    const handler = popupCloseHandler;
    popupCloseHandler = null;
    if (typeof handler === 'function') {
      handler();
    }
  };

  popupButton.addEventListener('click', closeAnalysisPopup);

  const showPausePopup = () => {
    if (popupOverlay.classList.contains('game__popup-overlay--visible')) return;
    isPausedByUser = true;
    gameEngine.pauseGame();
    disable();
    showAnalysisPopup({
      title: 'AI :',
      message: '분석을 잠시 멈췄습니다. 계속하면 남은 시간부터 다시 진행됩니다.',
      buttonText: '계속하기',
      onClose: () => {
        isPausedByUser = false;
        gameEngine.resumeGame();
        if (gameEngine.getState().isAwaitingChoice) {
          enable();
        }
      },
    });
  };

  pauseButton.addEventListener('click', showPausePopup);

  homeButton.addEventListener('click', () => {
    if (confirm('홈 화면으로 돌아가시겠습니까? 현재 게임은 종료됩니다.')) {
      popupOverlay.classList.remove('game__popup-overlay--visible');
      popupCloseHandler = null;
      onBackToMenu?.();
    }
  });

  // ========== 이벤트 리스너 등록 ==========
  gameEngine.addEventListener(GAME_EVENTS.ROUND_START, ({ round, totalRounds, question }) => {
    roundNumber.textContent = `${round} / ${totalRounds}`;
    updateProgress(round - 1, '');

    // 질문 표시
    questionText.textContent = formatQuestionText(question.prompt);
    questionPrompt.textContent = '';

    // 선택지 설정 (4선택지 vs 2선택지)
    if (question.isFourChoice) {
      setFourChoices(
        question.choices.A,
        question.choices.B,
        question.choices.C,
        question.choices.D
      );
    } else {
      setTwoChoices(question.choices.primary, question.choices.secondary);
    }
    enable();

    // 타이머 표시
    timerElement.style.display = '';
    updateTimer(GAME_CONFIG.ROUND_TIME_LIMIT);

    timeoutOverlay.classList.remove('visible');

    analysisFeedback.classList.remove('game__analysis-feedback--visible');
    if (isPausedByUser) {
      disable();
    }
  });

  // 타이머 틱 이벤트
  gameEngine.addEventListener(GAME_EVENTS.TIMER_TICK, ({ remainingTime }) => {
    if (remainingTime !== null && remainingTime !== undefined) {
      updateTimer(remainingTime);

      // 시간이 3초 이하일 때 위험 색상
      if (remainingTime <= 3000) {
        timerElement.classList.add('circular-progress--danger');
        timerElement.classList.remove('circular-progress--timer');
      } else {
        timerElement.classList.remove('circular-progress--danger');
        timerElement.classList.add('circular-progress--timer');
      }
    }
  });

  // 2단계 선택지 이벤트
  gameEngine.addEventListener(GAME_EVENTS.TWO_STAGE, ({ aiMessage, prompt, choices }) => {
    questionPrompt.textContent = '';
    questionText.textContent = formatQuestionText(prompt || aiMessage || '처음 선택을 유지할지, 다른 선택으로 바꿀지 결정하세요.');
    setTwoChoices(choices.primary, choices.secondary);
    enable();
    updateTimer(GAME_CONFIG.ROUND_TIME_LIMIT);
    timerElement.classList.remove('circular-progress--danger');
    timerElement.classList.add('circular-progress--timer');
  });

  gameEngine.addEventListener(GAME_EVENTS.CHOICE_MADE, () => {
    disable();
    updateProgress(gameEngine.roundManager.currentRound, '');
  });

  gameEngine.addEventListener(GAME_EVENTS.TIME_EXPIRED, () => {
    disable();
    timeoutOverlay.classList.add('visible');
    setTimeout(() => {
      timeoutOverlay.classList.remove('visible');
    }, 800);
  });

  // ========== 화면 제어 ==========
  const show = () => {
    screen.classList.add('active', 'fade-in');
  };

  const hide = () => {
    screen.classList.remove('active');
    screen.classList.remove('fade-in');
    disable();
    updateProgress(0);
    updateTimer(0);
    roundNumber.textContent = '0 / 0';
    questionPrompt.textContent = '';
    questionText.textContent = '';
    analysisFeedback.classList.remove('game__analysis-feedback--visible');
    popupOverlay.classList.remove('game__popup-overlay--visible');
    popupCloseHandler = null;
    isPausedByUser = false;
    timerElement.classList.remove('circular-progress--danger');
    if (feedbackTimer) {
      clearTimeout(feedbackTimer);
      feedbackTimer = null;
    }
  };

  return { element: screen, show, hide, showAnalysisFeedback, showAnalysisPopup };
};
