/**
 * MindTrap - Game Engine
 * 전체 게임의 총괄 관리 클래스입니다.
 * QuestionGenerator, RoundManager, TimerEngine, GameService를 통합합니다.
 * 10초 제한 시간, 4선택지, 2단계 선택지 기능을 지원합니다.
 */

import { SCREEN_STATES, GAME_EVENTS, GAME_CONFIG } from '../utils/constants.js';
import { createTimestamp } from '../utils/helpers.js';
import { QuestionGenerator } from './QuestionGenerator.js';
import { RoundManager } from './RoundManager.js';
import { TimerEngine } from './TimerEngine.js';
import { GameService } from '../services/GameService.js';

/**
 * GameEngine 클래스
 */
export class GameEngine {
  constructor() {
    this.questionGenerator = new QuestionGenerator();
    this.roundManager = new RoundManager();
    this.timerEngine = new TimerEngine();
    this.gameService = new GameService();

    this.currentScreen = SCREEN_STATES.SPLASH;
    this.isGameRunning = false;
    this.isAwaitingChoice = false;

    // 2단계 선택지 상태
    this.isTwoStagePhase = false;
    this.twoStageData = null;
    this.pendingTwoStageChoice = null;

    this.listeners = {};
    this._setupTimerListeners();
  }

  /**
   * 타이머 이벤트 리스너 설정
   * @private
   */
  _setupTimerListeners() {
    this.timerEngine.addListeners(
      (remainingTime) => {
        this._emit(GAME_EVENTS.TIMER_TICK, { remainingTime });
      },
      () => {
        this._handleTimeExpired();
      }
    );
  }

  /**
   * 이벤트 리스너 등록
   */
  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  /**
   * 이벤트 발생
   * @private
   */
  _emit(event, data = {}) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * 화면 전환
   */
  changeScreen(screen) {
    const previousScreen = this.currentScreen;
    this.currentScreen = screen;
    this._emit(GAME_EVENTS.SCREEN_CHANGE, { previousScreen, currentScreen: screen });
  }

  /**
   * 스플래시 화면 시작
   */
  startSplash() {
    this.changeScreen(SCREEN_STATES.SPLASH);
    this._emit('splash:start', {});
  }

  /**
   * 랜딩 화면으로 전환
   */
  showLanding() {
    this.changeScreen(SCREEN_STATES.LANDING);
    this._emit('landing:show', {});
  }

  /**
   * 튜토리얼 화면으로 전환
   */
  showTutorial() {
    this.changeScreen(SCREEN_STATES.TUTORIAL);
    this._emit('tutorial:show', {});
  }

  /**
   * 게임 시작
   */
  startGame() {
    const questionSet = this.questionGenerator.generateQuestionSet();
    this.roundManager.initialize(questionSet);
    this.gameService.createSession(questionSet);

    this.isGameRunning = true;
    this.isAwaitingChoice = false;
    this.isTwoStagePhase = false;
    this.twoStageData = null;
    this.pendingTwoStageChoice = null;

    this.changeScreen(SCREEN_STATES.GAME);

    this._emit(GAME_EVENTS.GAME_START, {
      totalRounds: this.roundManager.totalRounds,
      questions: questionSet,
    });

    this._startNextRound();
  }

  /**
   * 다음 라운드 시작
   * @private
   */
  _startNextRound() {
    const roundInfo = this.roundManager.startRound();

    if (!roundInfo) {
      this._endGame();
      return;
    }

    this.isAwaitingChoice = true;
    this.isTwoStagePhase = false;
    this.twoStageData = null;

    // 10초 타이머 시작
    this.timerEngine.start(GAME_CONFIG.ROUND_TIME_LIMIT);

    this._emit(GAME_EVENTS.ROUND_START, {
      round: roundInfo.roundNumber,
      totalRounds: roundInfo.totalRounds,
      question: roundInfo.question,
    });
  }

  /**
   * 선택 처리
   * @param {string} choice - 선택한 답변
   * @param {boolean} changedChoice - 선택 변경 여부
   */
  handleChoice(choice, changedChoice = false) {
    if (!this.isAwaitingChoice) return;

    this.isAwaitingChoice = false;
    const reactionTime = this.timerEngine.getReactionTime();
    this.timerEngine.stop();
    const currentRound = this.roundManager.getCurrentRound();
    const question = currentRound.question;

    // 2단계 선택지 처리
    if (this.isTwoStagePhase) {
      // 2단계에서 유지/바꾸기 선택
      const finalChoice = choice === 'secondary' ? this.twoStageData.otherChoice : this.twoStageData.originalChoice;

      const roundData = {
        round: currentRound.roundNumber,
        question,
        choice: finalChoice,
        firstChoice: this.pendingTwoStageChoice,
        changedChoice: choice === 'secondary',
        reactionTime,
        timeOut: false,
        twoStage: true,
        timestamp: createTimestamp(),
      };

      this.roundManager.recordRoundResult(roundData);
      this.gameService.recordRound(roundData);

      this._emit(GAME_EVENTS.CHOICE_MADE, {
        ...roundData,
        totalRounds: currentRound.totalRounds,
      });

      this._emit(GAME_EVENTS.ROUND_END, {
        round: currentRound.roundNumber,
        totalRounds: currentRound.totalRounds,
        isGameComplete: this.roundManager.isGameComplete(),
      });

      this.isTwoStagePhase = false;
      this.twoStageData = null;
      this.pendingTwoStageChoice = null;

      if (this.roundManager.isGameComplete()) {
        setTimeout(() => this._endGame(), 500);
      } else {
        setTimeout(() => this._startNextRound(), 300);
      }
      return;
    }

    // 1차 선택 후 2단계 선택지 확인
    if (question.hasTwoStage && !this.isTwoStagePhase) {
      const twoStageData = this.questionGenerator.generateTwoStageData(question, choice);

      if (twoStageData) {
        this.isTwoStagePhase = true;
        this.twoStageData = twoStageData;
        this.pendingTwoStageChoice = choice;

        // 2단계 이벤트 발생 (GameScreen에서 2단계 UI 표시)
        this._emit(GAME_EVENTS.TWO_STAGE, {
          round: currentRound.roundNumber,
          aiMessage: twoStageData.aiMessage,
          choices: twoStageData.choices,
        });

        // 2단계 타이머 재시작
        this.isAwaitingChoice = true;
        this.timerEngine.start(GAME_CONFIG.ROUND_TIME_LIMIT);
        return;
      }
    }

    // 일반 선택 처리
    const roundData = {
      round: currentRound.roundNumber,
      question,
      choice,
      reactionTime,
      changedChoice,
      timeOut: false,
      timestamp: createTimestamp(),
    };

    this.roundManager.recordRoundResult(roundData);
    this.gameService.recordRound(roundData);

    this._emit(GAME_EVENTS.CHOICE_MADE, {
      ...roundData,
      totalRounds: currentRound.totalRounds,
    });

    this._emit(GAME_EVENTS.ROUND_END, {
      round: currentRound.roundNumber,
      totalRounds: currentRound.totalRounds,
      isGameComplete: this.roundManager.isGameComplete(),
    });

    if (this.roundManager.isGameComplete()) {
      setTimeout(() => this._endGame(), 500);
    } else {
      setTimeout(() => this._startNextRound(), 300);
    }
  }

  /**
   * 시간 초과 처리
   * @private
   */
  _handleTimeExpired() {
    if (!this.isAwaitingChoice) return;

    this.isAwaitingChoice = false;
    const currentRound = this.roundManager.getCurrentRound();
    const question = currentRound.question;

    // 2단계 phase에서 시간 초과 시 자동 유지
    if (this.isTwoStagePhase) {
      const finalChoice = this.twoStageData.originalChoice;

      const roundData = {
        round: currentRound.roundNumber,
        question,
        choice: finalChoice,
        firstChoice: this.pendingTwoStageChoice,
        changedChoice: false,
        reactionTime: GAME_CONFIG.ROUND_TIME_LIMIT,
        timeOut: true,
        twoStage: true,
        timestamp: createTimestamp(),
      };

      this.roundManager.recordRoundResult(roundData);
      this.gameService.recordRound(roundData);

      this._emit(GAME_EVENTS.TIME_EXPIRED, {
        ...roundData,
        totalRounds: currentRound.totalRounds,
      });

      this._emit(GAME_EVENTS.ROUND_END, {
        round: currentRound.roundNumber,
        totalRounds: currentRound.totalRounds,
        isGameComplete: this.roundManager.isGameComplete(),
      });

      this.isTwoStagePhase = false;
      this.twoStageData = null;
      this.pendingTwoStageChoice = null;

      if (this.roundManager.isGameComplete()) {
        setTimeout(() => this._endGame(), 500);
      } else {
        setTimeout(() => this._startNextRound(), 300);
      }
      return;
    }

    // 일반 시간 초과 - 랜덤 선택
    let randomChoice;
    if (question.isFourChoice) {
      randomChoice = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
    } else {
      randomChoice = Math.random() < 0.5 ? 'primary' : 'secondary';
    }

    const roundData = {
      round: currentRound.roundNumber,
      question,
      choice: randomChoice,
      reactionTime: GAME_CONFIG.ROUND_TIME_LIMIT,
      changedChoice: false,
      timeOut: true,
      timestamp: createTimestamp(),
    };

    this.roundManager.recordRoundResult(roundData);
    this.gameService.recordRound(roundData);

    this._emit(GAME_EVENTS.TIME_EXPIRED, {
      ...roundData,
      totalRounds: currentRound.totalRounds,
    });

    this._emit(GAME_EVENTS.ROUND_END, {
      round: currentRound.roundNumber,
      totalRounds: currentRound.totalRounds,
      isGameComplete: this.roundManager.isGameComplete(),
    });

    if (this.roundManager.isGameComplete()) {
      setTimeout(() => this._endGame(), 500);
    } else {
      setTimeout(() => this._startNextRound(), 300);
    }
  }

  /**
   * 게임 종료 처리
   * @private
   */
  _endGame() {
    this.isGameRunning = false;
    this.timerEngine.stop();
    this.roundManager.finishGame();

    const completedSession = this.gameService.endSession();

    this._emit(GAME_EVENTS.GAME_END, {
      stats: this.gameService.getResultSummary(completedSession),
      history: this.roundManager.getHistory(),
    });

    this.changeScreen(SCREEN_STATES.RESULT);
  }

  /**
   * 결과 화면으로 이동
   */
  showResult() {
    this.changeScreen(SCREEN_STATES.RESULT);
  }

  /**
   * 결과 화면의 데이터 반환
   */
  getResultData() {
    const history = this.roundManager.getHistory();
    const stats = this.roundManager.getStats();

    return {
      stats,
      history,
      totalRounds: this.roundManager.totalRounds,
    };
  }

  /**
   * 게임 재시작
   */
  restartGame() {
    this.roundManager.reset();
    this.timerEngine.stop();
    this.isGameRunning = false;
    this.isAwaitingChoice = false;
    this.isTwoStagePhase = false;
    this.twoStageData = null;
    this.pendingTwoStageChoice = null;
    this.showLanding();
  }

  /**
   * 메인 메뉴로 돌아가기
   */
  backToMenu() {
    this.roundManager.reset();
    this.timerEngine.stop();
    this.gameService.clearAllData();
    this.isGameRunning = false;
    this.isAwaitingChoice = false;
    this.isTwoStagePhase = false;
    this.twoStageData = null;
    this.pendingTwoStageChoice = null;
    this.showLanding();
  }

  /**
   * 현재 게임 상태 반환
   */
  getState() {
    return {
      currentScreen: this.currentScreen,
      isGameRunning: this.isGameRunning,
      isAwaitingChoice: this.isAwaitingChoice,
      currentRound: this.roundManager.currentRound,
      totalRounds: this.roundManager.totalRounds,
      timerState: this.timerEngine.state,
      isTwoStagePhase: this.isTwoStagePhase,
    };
  }

  /**
   * 리소스 해제
   */
  destroy() {
    this.timerEngine.destroy();
    this.roundManager.reset();
    this.gameService.clearAllData();
    this.listeners = {};
    this.isGameRunning = false;
    this.isAwaitingChoice = false;
  }
}
