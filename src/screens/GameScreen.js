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
export const createGameScreen = ({ gameEngine }) => {
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

  // AI 대사 섹션
  const aiDialogueSection = createElement('div', {
    className: 'game__ai-dialogue',
  });
  const aiAvatar = createElement('div', {
    className: 'game__ai-avatar',
    textContent: 'AI',
  });
  const aiDialogueText = createElement('p', {
    className: 'game__ai-dialogue-text',
    textContent: '분석을 시작합니다...',
  });
  aiDialogueSection.appendChild(aiAvatar);
  aiDialogueSection.appendChild(aiDialogueText);

  // 타이핑 타이머 추적 (깜빡임 방지) + 대사 큐
  let typingTimer = null;
  let queueTimer = null;
  let feedbackTimer = null;
  let currentDialogue = '';
  let dialogueQueue = [];
  let isTyping = false;
  let dialogueToken = 0;

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
    onChoice: (choice) => {
      gameEngine.handleChoice(choice);
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
  gameContainer.appendChild(aiDialogueSection);
  gameContainer.appendChild(questionSection);
  gameContainer.appendChild(choiceSection);
  screen.appendChild(gameContainer);
  screen.appendChild(timeoutOverlay);

  const sanitizeDialogue = (dialogue) => String(dialogue)
    .replace(/\uFFFD/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const resetDialogueQueue = () => {
    dialogueToken++;
    currentDialogue = '';
    dialogueQueue = [];
    isTyping = false;
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    if (queueTimer) {
      clearTimeout(queueTimer);
      queueTimer = null;
    }
  };

  const showAnalysisFeedback = (message) => {
    if (!message) return;
    if (feedbackTimer) {
      clearTimeout(feedbackTimer);
      feedbackTimer = null;
    }
    analysisFeedback.textContent = message;
    analysisFeedback.classList.add('game__analysis-feedback--visible');
    feedbackTimer = setTimeout(() => {
      analysisFeedback.classList.remove('game__analysis-feedback--visible');
      feedbackTimer = null;
    }, 3000);
  };

  // ========== AI 대사 표시 (타자기 효과) ==========
  // 새 대사가 오면 이전 타이핑을 정리하고 최신 대사만 표시합니다.
  const showAiDialogue = (dialogue, isFinal = false) => {
    const cleanDialogue = sanitizeDialogue(dialogue);
    if (!cleanDialogue || cleanDialogue === currentDialogue) return;
    resetDialogueQueue();
    dialogueQueue.push({ dialogue: cleanDialogue, isFinal });
    if (!isTyping) {
      _processDialogueQueue();
    }
  };

  const _processDialogueQueue = () => {
    if (dialogueQueue.length === 0) {
      isTyping = false;
      return;
    }

    isTyping = true;
    const activeToken = dialogueToken;
    const { dialogue, isFinal } = dialogueQueue.shift();
    currentDialogue = dialogue;

    if (isFinal) {
      aiDialogueSection.classList.add('game__ai-dialogue--final');
    } else {
      aiDialogueSection.classList.remove('game__ai-dialogue--final');
    }

    aiDialogueSection.classList.add('game__ai-dialogue--active');

    aiDialogueText.textContent = '';
    let i = 0;
    const speed = 12;
    const typeNext = () => {
      if (activeToken !== dialogueToken) return;
      if (i < dialogue.length) {
        aiDialogueText.textContent += dialogue[i];
        i++;
        typingTimer = setTimeout(typeNext, speed);
      } else {
        typingTimer = null;
        // 타이핑 완료 후 잠시 대기 후 다음 대사 처리
        queueTimer = setTimeout(() => {
          if (activeToken !== dialogueToken) return;
          queueTimer = null;
          isTyping = false;
          _processDialogueQueue();
        }, 500);
      }
    };
    typeNext();
  };

  // ========== 이벤트 리스너 등록 ==========
  gameEngine.addEventListener(GAME_EVENTS.ROUND_START, ({ round, totalRounds, question }) => {
    roundNumber.textContent = `${round} / ${totalRounds}`;
    updateProgress(round - 1, '');

    // 질문 표시
    questionText.textContent = question.prompt;
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

    // 새 라운드 시작 시 대사 큐 초기화
    resetDialogueQueue();
    analysisFeedback.classList.remove('game__analysis-feedback--visible');
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
    questionText.textContent = prompt || aiMessage || '처음 선택을 유지할지, 다른 선택으로 바꿀지 결정하세요.';
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
    timerElement.classList.remove('circular-progress--danger');
    resetDialogueQueue();
    if (feedbackTimer) {
      clearTimeout(feedbackTimer);
      feedbackTimer = null;
    }
  };

  return { element: screen, show, hide, showAiDialogue, showAnalysisFeedback };
};
