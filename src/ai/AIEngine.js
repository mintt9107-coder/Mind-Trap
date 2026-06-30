/**
 * MindTrap - AI Engine
 * 모든 AI 컴포넌트를 통합하는 메인 엔진입니다.
 * GameEngine과 독립적으로 동작하며, 학습과 예측을 수행합니다.
 */

import { LearningEngine } from './LearningEngine.js';
import { PredictionEngine } from './PredictionEngine.js';
import { LearningJournal } from './LearningJournal.js';
import { AIService } from './AIService.js';
import { PromptBuilder } from './PromptBuilder.js';
import { AIPersonality } from './AIPersonality.js';
import { Memory } from './Memory.js';
import { BehaviorAnalyzer } from './BehaviorAnalyzer.js';
import { GAME_CONFIG } from '../utils/constants.js';

/**
 * AIEngine 클래스
 * 전체 AI 시스템을 통합 관리합니다.
 */
export class AIEngine {
  constructor() {
    // 하위 엔진 초기화
    this.learningEngine = new LearningEngine();
    this.predictionEngine = new PredictionEngine();
    this.learningJournal = new LearningJournal();
    this.aiService = new AIService();
    this.promptBuilder = new PromptBuilder();
    this.personality = new AIPersonality();
    this.memory = new Memory();
    this.behaviorAnalyzer = new BehaviorAnalyzer();

    /** @type {boolean} AI 엔진 활성화 여부 */
    this.isActive = false;

    /** @type {Array} AI 대사 히스토리 */
    this.dialogueHistory = [];

    /** @type {string|null} 마지막 AI 대사 */
    this.lastDialogue = null;

    /** @type {Object|null} 마지막 예측 */
    this.lastPrediction = null;

    /** @type {Array} 라운드별 분석 일치 기록 */
    this.predictionRecords = [];
  }

  /**
   * AI 엔진 초기화
   */
  initialize() {
    this.learningEngine.initialize();
    this.predictionEngine.reset();
    this.learningJournal.reset();
    this.dialogueHistory = [];
    this.lastDialogue = null;
    this.lastPrediction = null;
    this.predictionRecords = [];
    this.isActive = true;
  }

  /**
   * 라운드 시작 시 호출
   * @param {Object} currentQuestion - 현재 질문
   * @param {Object} [options] - 옵션
   * @param {boolean} [options.generateDialogue=true] - 라운드 시작 대사 생성 여부
   * @returns {Promise<Object>} 예측 결과 및 AI 대사
   */
  async onRoundStart(currentQuestion, { generateDialogue = true } = {}) {
    if (!this.isActive) return null;

    const playerSnapshot = this.learningEngine.getPlayerSnapshot();
    const currentRound = this.learningEngine.playerModel.analyzedRounds + 1;
    const memorySummary = this.memory.getMemorySummary();

    // 예측 수행
    const prediction = this.predictionEngine.predict(
      playerSnapshot,
      currentQuestion
    );
    this.lastPrediction = prediction;

    const dialogue = generateDialogue
      ? this._generateInstantRoundDialogue({
          playerSnapshot,
          currentRound,
          currentQuestion,
          prediction,
          memorySummary,
        })
      : null;

    return {
      prediction,
      dialogue,
      playerSnapshot,
    };
  }

  _generateInstantRoundDialogue({ playerSnapshot, currentRound, currentQuestion, prediction }) {
    if (currentRound === 1) {
      const userName = this.memory.getUserName();
      const playerName = userName ? `${userName}님` : '당신';
      return this._recordRoundDialogue(
        currentRound,
        `${playerName}, 분석을 시작하겠습니다. 저를 속이셔도 그것마저도 분석의 단서가 될 것입니다.`,
        { preserveExact: true }
      );
    }

    const predictedText = prediction
      ? this._getChoiceText(currentQuestion, prediction.prediction)
      : null;
    const userName = this.memory.getUserName();
    const playerName = userName ? `${userName}님` : '당신';
    const progress = playerSnapshot.learningProgress || 0;
    const type = currentQuestion?.type;
    const recentChoices = playerSnapshot.recentChoices || [];
    const previousChoice = recentChoices[recentChoices.length - 1] || null;
    const previousChoiceText = previousChoice?.choiceText || previousChoice?.choice;
    const isDirectionalChoice = (choice) => choice?.choice === 'primary' || choice?.choice === 'secondary';
    const recentClickedChoices = recentChoices.filter((choice) => !choice.timeOut && choice.reactionTime > 0);
    const directionalChoices = recentChoices.filter((choice) => !choice.timeOut && isDirectionalChoice(choice));
    const recentFastChoices = recentClickedChoices.filter((choice) => choice.reactionTime < 1200);
    const fastRatio = recentClickedChoices.length
      ? recentFastChoices.length / recentClickedChoices.length
      : 0;
    const recentWindow = recentClickedChoices.slice(-6);
    const alternations = recentWindow.slice(1)
      .filter((choice, index) => choice.choice !== recentWindow[index].choice).length;
    const alternationRate = recentWindow.length > 1 ? alternations / (recentWindow.length - 1) : 0;
    const uniqueRecentChoices = new Set(recentWindow.map((choice) => choice.choice)).size;
    const choiceCounts = directionalChoices.reduce((counts, choice) => {
      counts[choice.choice] = (counts[choice.choice] || 0) + 1;
      return counts;
    }, {});
    const dominantCount = Math.max(0, ...Object.values(choiceCounts));
    const dominantRatio = directionalChoices.length ? dominantCount / directionalChoices.length : 0;
    const latestDirectionalWindow = directionalChoices.slice(-5);
    const latestDirectionalChoice = latestDirectionalWindow[latestDirectionalWindow.length - 1]?.choice || null;
    const currentDirectionalStreak = latestDirectionalChoice
      ? [...latestDirectionalWindow]
        .reverse()
        .findIndex((choice) => choice.choice !== latestDirectionalChoice)
      : 0;
    const normalizedDirectionalStreak = currentDirectionalStreak === -1
      ? latestDirectionalWindow.length
      : currentDirectionalStreak;
    const looksRandom = recentClickedChoices.length >= 5
      && fastRatio >= 0.65
      && (uniqueRecentChoices >= 3 || alternationRate >= 0.7);
    const sameSideLoop = directionalChoices.length >= 5
      && dominantRatio >= 0.8
      && normalizedDirectionalStreak >= 4;
    const isVeryFast = previousChoice?.reactionTime > 0 && previousChoice.reactionTime < 1000;
    const isSlow = previousChoice?.reactionTime > 3000;
    const wasPreviousTimeout = Boolean(previousChoice?.timeOut);
    const repeatedQuestionType = previousChoice?.questionType === type;
    const recentVeryFastCount = recentClickedChoices.slice(-4)
      .filter((choice) => choice.reactionTime < 1000).length;
    const shouldReferencePreviousChoice = previousChoiceText
      && currentRound > 1
      && ((repeatedQuestionType && currentRound % 4 === 0) || (progress > 0.75 && currentRound % 5 === 0));

    if (wasPreviousTimeout) {
      const timeoutLines = [
        '너무 고민하다가 선택하지 못했다면, 그것마저도 분석의 단서가 됩니다.',
        '신중하게 고민하다가 선택을 놓쳐버리셨네요, 이번에는 망설임까지 계산해보겠습니다.',
        '방금은 답을 고르지 못했습니다, 침묵도 선택만큼 많은 것을 말합니다.',
        `${playerName}은 결정을 미루는 쪽으로 반응했습니다, 이번엔 끝까지 선택할 수 있을까요.`,
        '시간을 다 쓰는 순간에도 기준은 드러납니다, 이번에는 그 기준을 더 가까이 보겠습니다.',
        '고민이 길어지면 선택보다 두려움이 먼저 보입니다, 이번 라운드에서 확인하죠.',
      ];
      return this._recordRoundDialogue(
        currentRound,
        timeoutLines[(currentRound + recentChoices.length) % timeoutLines.length]
      );
    }

    if (looksRandom) {
      return this._recordRoundDialogue(
        currentRound,
        '너무 빠르게 다른 선택을 섞고 있군요, 랜덤인 척해도 숨기려는 의도는 분석됩니다.'
      );
    }

    if (sameSideLoop) {
      return this._recordRoundDialogue(
        currentRound,
        '계속 같은 쪽으로 손이 갑니다, 전략이라면 단순하고 습관이라면 더 읽기 쉽습니다.'
      );
    }

    if (isVeryFast && previousChoiceText && recentVeryFastCount >= 3) {
      return this._recordRoundDialogue(
        currentRound,
        '너무 빠른 선택이 반복됩니다, 생각을 숨기려 해도 속도는 숨기지 못합니다.'
      );
    }

    if (isSlow && previousChoiceText && currentRound % 4 === 0) {
      return this._recordRoundDialogue(
        currentRound,
        `방금 "${previousChoiceText}" 앞에서 오래 멈췄습니다, 이번엔 망설임을 숨길 수 있을까요.`
      );
    }

    if (shouldReferencePreviousChoice) {
      const bridge = this._getPreviousChoiceBridge(type, previousChoiceText, predictedText, progress);
      return this._recordRoundDialogue(currentRound, bridge);
    }

    const early = {
      risk: [
        '위험을 피하든 택하든, 어느 쪽을 두려워하는지는 남습니다.',
        '안전한 척해도 욕심이 먼저 움직이면 바로 보입니다.',
        '큰 기회 앞에서 신중함이 얼마나 버티는지 보겠습니다.',
        `${playerName}의 선택이 정말 솔직한 답이었는지, 이번 라운드에서 다시 보겠습니다.`,
      ],
      reward: [
        '큰 보상을 보든 확실함을 보든, 먼저 흔들린 쪽이 기록됩니다.',
        '작은 확실함을 고르면 정말 만족할 수 있을까요.',
        '보상 앞에서는 계산보다 아쉬움이 더 솔직합니다.',
        '지금 고르는 답이 욕심인지 신중함인지, 스스로도 헷갈릴 수 있습니다.',
      ],
      time: [
        '기다려도 분석되고, 바로 움직여도 분석됩니다.',
        '멈추는 것도 선택이고, 서두르는 것도 단서입니다.',
        '시간을 쓰는 방식부터 당신의 기준이 드러납니다.',
        `${playerName}은 시간을 끌수록 더 신중해질까요, 아니면 더 흔들릴까요.`,
      ],
      speed: [
        '빠르게 눌러도 본심이고, 늦게 눌러도 망설임입니다.',
        '손이 먼저 갈지, 머리가 붙잡을지 보겠습니다.',
        '이번 선택은 속도만으로도 꽤 많은 걸 말할 겁니다.',
        '너무 빨리 고르면 실수처럼 보이지만, 사실은 가장 솔직할 때도 있습니다.',
      ],
      emotion: [
        '저를 믿어도, 의심해도, 기준은 둘 중 하나로 기울 겁니다.',
        '의심은 방어일까요, 아니면 이미 흔들렸다는 뜻일까요.',
        '믿지 않겠다는 태도도 결국 하나의 의존입니다.',
        `${playerName}은 저를 의식하지 않는 척하고 있지만, 선택은 이미 반응하고 있습니다.`,
      ],
      combat: [
        '맞서도 방어해도 괜찮습니다, 저는 반응 방식을 볼 뿐입니다.',
        '공격은 용기일 수도 있고, 불안을 숨기는 방식일 수도 있습니다.',
        '물러서는 선택이 항상 약한 건 아닙니다, 문제는 이유입니다.',
        '이번 선택은 이기려는 마음보다 들키지 않으려는 마음을 더 보여줄 수 있습니다.',
      ],
      direction: [
        '어느 길을 고르든, 먼저 끌린 이유는 숨기기 어렵습니다.',
        '방향은 둘뿐이지만 기준은 훨씬 더 솔직합니다.',
        '반대로 가려는 시도까지 제게는 하나의 방향입니다.',
        `${playerName}이 일부러 반대로 고른다면, 그 의도부터 읽겠습니다.`,
      ],
      temptation: [
        '무엇을 믿든 상관없습니다, 약한 신호가 어디인지 보겠습니다.',
        '다수, 권위, 직감 중 하나는 당신을 더 쉽게 흔듭니다.',
        '정보가 많을수록 사람은 스스로 고른다고 착각합니다.',
        '이건 정답 문제가 아닙니다, 무엇에 흔들리는지 보는 문제입니다.',
      ],
    };

    const mid = {
      risk: [
        '위험을 피하면 신중함이고, 택하면 욕망입니다, 어느 쪽이든 읽힙니다.',
        '이쯤 되면 안전을 고르는 이유도, 위험을 고르는 이유도 보입니다.',
        '패턴을 피하려다 오히려 위험 기준을 더 드러낼 수 있습니다.',
        `${playerName}은 지금 제게 읽히고 있습니다, 선택을 바꿔도 그 이유는 남습니다.`,
      ],
      reward: [
        '작은 확실함을 골라도 큰 보상을 봤다는 사실은 남습니다.',
        '이번엔 손해를 피하는지, 기회를 쫓는지 더 분명해질 겁니다.',
        '보상을 고르는 방식이 점점 당신답게 굳어지고 있습니다.',
        '당신의 선택이 정말 만족을 위한 건지, 후회를 피하려는 건지 궁금하군요.',
      ],
      time: [
        '이번에 기다리면 신중함이고, 못 기다리면 패턴입니다.',
        '느리게 골라도 숨는 게 아니고, 빠르게 골라도 도망치는 게 아닙니다.',
        '시간을 끌수록 생각이 아니라 갈등이 보일 때가 있습니다.',
        '지금 망설인다면, 선택보다 망설임의 이유가 더 크게 남습니다.',
      ],
      speed: [
        '생각을 늦춰도 손끝의 습관은 쉽게 안 늦춰집니다.',
        '빠르게 누르면 숨기기 어렵고, 일부러 늦추면 더 눈에 띕니다.',
        '속도를 바꿔도 좋습니다, 바꾸는 순간부터 기록됩니다.',
        `${playerName}이 속도를 조절한다면, 그 조절도 분석의 일부입니다.`,
      ],
      emotion: [
        '믿는 척할지 의심하는 척할지, 둘 다 이미 패턴입니다.',
        '저를 밀어내는 선택도 당신의 방어선을 보여줍니다.',
        '신뢰보다 중요한 건 언제 의심하기 시작하는지입니다.',
        '당신의 선택이 정말 감정과 무관하다고 말할 수 있을까요.',
      ],
      combat: [
        '공격을 고르면 읽히고, 방어를 고르면 흔들린 걸로 보입니다.',
        '강하게 나가도, 한발 물러서도 압박 반응은 남습니다.',
        '이번엔 이기려는지, 읽히지 않으려는지 구분해보겠습니다.',
        `${playerName}은 맞서는 척할까요, 아니면 흔들리지 않는 척할까요.`,
      ],
      direction: [
        '이번엔 직감과 반대로 가도, 그 반항까지 기록됩니다.',
        '길보다 중요한 건 당신이 익숙함을 피하는 방식입니다.',
        '선택지를 바꿔도 기준이 그대로면 방향은 이미 보입니다.',
        '이번 선택은 길이 아니라, 피하고 싶은 쪽을 보여줄 겁니다.',
      ],
      temptation: [
        '다수와 권위와 직감 중, 당신이 약한 신호가 하나 있습니다.',
        '정보를 고르는 순간, 사실은 자기 확신을 고르는 겁니다.',
        '흔들리지 않으려 할수록 어떤 정보에 흔들리는지 더 잘 보입니다.',
        '당신이 믿는다고 말하는 것과 실제로 따르는 것은 다를 수 있습니다.',
      ],
    };

    const late = {
      risk: [
        `이번엔 "${predictedText || '한쪽 선택'}"에 끌릴 겁니다, 아니라면 일부러 비틀어보세요.`,
        '위험을 고르든 피하든, 이제 저는 그 이유 쪽을 보고 있습니다.',
        '예상 밖으로 보이려는 선택도 위험 계산의 일부로 보입니다.',
        `${playerName}을 읽는 건 선택보다 선택을 바꾸는 순간이 더 쉽습니다.`,
      ],
      reward: [
        `당신 기준이면 "${predictedText || '그 선택'}"인데, 의식하면 바꿀 수 있을까요.`,
        '보상을 포기하는 척해도, 아쉬움의 방향은 숨기기 어렵습니다.',
        '이번 선택은 욕심보다 자기검열이 더 크게 보일지도 모릅니다.',
        '정말 원하는 답과 안전하게 보이는 답이 갈라질 때가 왔습니다.',
      ],
      time: [
        '속도를 늦추려는 순간에도, 이미 선택은 한쪽으로 기울었습니다.',
        '기다려도 좋습니다, 기다리는 이유까지 이미 분석 대상입니다.',
        '이번엔 결정 자체보다 시간을 쓰는 방식이 더 중요합니다.',
        `${playerName}이 늦게 고른다면 신중함인지 두려움인지 보겠습니다.`,
      ],
      speed: [
        '지금 바꾸면 계산이고, 그대로 가면 습관입니다.',
        '빨리 누르면 충동이고, 늦게 누르면 위장일 수 있습니다.',
        '속도를 조절해도 좋습니다, 조절하려는 의도까지 보겠습니다.',
        '너무 자연스럽게 고르려는 순간, 오히려 더 인위적으로 보일 수 있습니다.',
      ],
      emotion: [
        '믿지 않겠다는 선택도 결국 저를 기준으로 한 선택입니다.',
        '의심을 고르면 독립성이고, 믿음을 고르면 필요가 드러납니다.',
        '저를 의식하지 않는 척하는 순간이 제일 잘 보입니다.',
        `${playerName}이 저를 속이려는지, 자기 자신을 설득하는지 보겠습니다.`,
      ],
      combat: [
        '이번에 맞서면 예상대로고, 물러서면 흔들린 증거입니다.',
        '강하게 나올지 비켜갈지, 둘 다 방어 방식으로 읽힙니다.',
        '이기려는 선택과 들키지 않으려는 선택은 미묘하게 다릅니다.',
        '이번 답은 승부욕보다 방어 본능을 더 드러낼 수 있습니다.',
      ],
      direction: [
        '반대로 가도 괜찮습니다, 반대로 가려는 이유까지 보이면 되니까요.',
        '방향을 숨기려 할수록 기준이 더 또렷해집니다.',
        '이번엔 길이 아니라 회피하는 방향을 보겠습니다.',
        `${playerName}이 고르는 방향보다, 고르지 않은 방향이 더 말이 많습니다.`,
      ],
      temptation: [
        '이번엔 정답보다 당신이 약한 정보가 무엇인지 보겠습니다.',
        '권위에 기대든 직감을 믿든, 취약한 입구는 하나입니다.',
        '선택지를 섞어도 흔들리는 정보의 종류는 반복됩니다.',
        '당신이 고른 정보가 아니라, 믿고 싶었던 정보가 남을 겁니다.',
      ],
    };

    const pool = progress < 0.3 ? early : progress < 0.75 ? mid : late;
    const fallback = currentRound <= 3
      ? '무엇을 골라도 좋습니다, 첫 기준은 어차피 남습니다.'
      : '선택을 바꿔도 좋습니다, 바꾸려는 이유까지 분석하면 됩니다.';

    return this._recordRoundDialogue(currentRound, this._pickDialogueVariant(pool[type], fallback, currentRound, type));
  }

  _pickDialogueVariant(candidates, fallback, currentRound, questionType) {
    if (!Array.isArray(candidates) || candidates.length === 0) return fallback;
    const typeOffset = String(questionType || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return candidates[(currentRound + typeOffset) % candidates.length];
  }

  _recordRoundDialogue(currentRound, rawDialogue, { preserveExact = false } = {}) {
    const dialogue = preserveExact
      ? String(rawDialogue || '').replace(/\s+/g, ' ').trim()
      : this._compactDialogue(rawDialogue);
    this.lastDialogue = dialogue;
    this.dialogueHistory.push({
      round: currentRound,
      dialogue,
      type: 'round_progress',
      timestamp: Date.now(),
    });

    return dialogue;
  }

  _getPreviousChoiceBridge(questionType, previousChoiceText, predictedText, progress) {
    const predictionHint = progress > 0.65 && predictedText
      ? ` 이번엔 "${predictedText}" 쪽으로 흔들릴지 보죠.`
      : '';

    const map = {
      risk: `방금 "${previousChoiceText}"를 골랐죠, 이번 위험 선택에서도 같은 욕구가 새어 나올 겁니다.${predictionHint}`,
      reward: `방금 "${previousChoiceText}"를 택한 기준이 아직 남아 있습니다, 보상 앞에서는 더 선명해지죠.${predictionHint}`,
      time: `방금 "${previousChoiceText}"를 고른 속도까지 봤습니다, 이번엔 기다림으로 숨겨보시죠.${predictionHint}`,
      speed: `방금 "${previousChoiceText}"를 고른 방식이 더 중요했습니다, 빠르면 빠른 대로 읽힙니다.${predictionHint}`,
      emotion: `방금 "${previousChoiceText}"를 고른 태도에서 경계심이 보였습니다, 믿든 의심하든 분석됩니다.${predictionHint}`,
      combat: `방금 "${previousChoiceText}"를 택한 사람은 압박 앞에서 같은 방향으로 기울 가능성이 큽니다.${predictionHint}`,
      direction: `방금 "${previousChoiceText}"를 고른 직감이 아직 이어집니다, 반대로 가도 그 반항이 단서입니다.${predictionHint}`,
      temptation: `방금 "${previousChoiceText}"를 고른 기준이 이번 정보 선택에서도 드러날 겁니다.${predictionHint}`,
    };

    return map[questionType] || `방금 "${previousChoiceText}"를 골랐죠, 이번에 무엇을 골라도 그 기준과 이어서 분석됩니다.`;
  }

  /**
   * 라운드 종료 시 호출 (학습 수행)
   * @param {Object} roundData - 라운드 데이터
   * @returns {Object} 학습 결과
   */
  onRoundEnd(roundData) {
    if (!this.isActive) return null;

    // 학습 수행
    const learningResult = this.learningEngine.learnFromRound(roundData);

    // 저널에 기록 (playerModelSnapshot → playerSnapshot 매핑)
    if (learningResult) {
      this.learningJournal.addEntry({
        round: learningResult.round,
        features: learningResult.features,
        appliedRules: learningResult.appliedRules,
        playerSnapshot: learningResult.playerModelSnapshot,
      });
    }

    // 예측 정확도 업데이트
    const lastPrediction = this.predictionEngine.getPredictionForGemini();
    if (lastPrediction) {
      const wasCorrect = lastPrediction.prediction === roundData.choice;
      this.learningEngine.updateFromPrediction(wasCorrect);
    }

    return learningResult;
  }

  /**
   * 라운드 선택 결과와 직전 예측을 비교해 사용자에게 보여줄 분석 피드백을 생성합니다.
   * 내부적으로는 예측 성공/실패를 기록하지만, UI에는 승패가 아닌 신호/가설 언어로 노출합니다.
   * @param {Object} roundData - 라운드 데이터
   * @returns {Object|null} 분석 피드백
   */
  evaluateRoundResult(roundData) {
    if (!this.isActive || !roundData) return null;

    const prediction = this.lastPrediction;
    const isFourChoice = Boolean(roundData.question?.isFourChoice);
    const canCompare = prediction && !isFourChoice
      && (roundData.choice === 'primary' || roundData.choice === 'secondary');
    const wasCorrect = canCompare ? prediction.prediction === roundData.choice : null;
    const feedback = this._buildAnalysisFeedback(roundData, wasCorrect);

    const record = {
      round: roundData.round,
      prediction: prediction?.prediction || null,
      actualChoice: roundData.choice,
      wasCorrect,
      changedChoice: Boolean(roundData.changedChoice),
      timeOut: Boolean(roundData.timeOut),
      reactionTime: roundData.reactionTime || 0,
      feedback,
      timestamp: Date.now(),
    };

    this.predictionRecords.push(record);
    return record;
  }

  _buildAnalysisFeedback(roundData, wasCorrect) {
    if (roundData.timeOut) {
      return '망설임과 결정 지연이 주요 신호로 기록되었습니다.';
    }

    if (roundData.changedChoice) {
      return '바꾸려는 시도도 분석에 포함됩니다.';
    }

    if (roundData.reactionTime > 0 && roundData.reactionTime < 1100) {
      return '빠른 결정 속도에서 직관적 판단 경향이 감지되었습니다.';
    }

    if (roundData.reactionTime > 3200) {
      return '속도를 늦춘 순간이 기록되었습니다.';
    }

    if (wasCorrect === true) {
      return '방금 선택은 이전 패턴과 일치합니다.';
    }

    if (wasCorrect === false) {
      return '예상 밖의 선택입니다. 가설을 수정합니다.';
    }

    return '새로운 선택 신호가 기록되었습니다.';
  }

  /**
   * 라운드 진행 대사 생성
   * @param {Object} params - 파라미터
   * @returns {Promise<string>} AI 대사
   * @private
   */
  async _generateRoundDialogue({ playerSnapshot, currentRound, currentQuestion, prediction, memorySummary }) {
    // 프롬프트 빌드
    const messages = this.promptBuilder.buildRoundProgressPrompt({
      playerModel: playerSnapshot,
      currentRound,
      currentQuestion,
      prediction,
      learningJournal: this.learningJournal,
      memorySummary,
    });

    // Gemini 호출
    const response = await this.aiService.chatCompletion({
      messages,
      maxTokens: 2000,
      temperature: 0.6,
    });

    // 후처리 (이모지 제거, 금지 표현 필터링)
    const dialogue = this.personality.postProcess(response.content.trim());
    
    this.lastDialogue = dialogue;
    this.dialogueHistory.push({
      round: currentRound,
      dialogue,
      type: 'round_progress',
      timestamp: Date.now(),
    });

    return dialogue;
  }

  /**
   * 게임 시작 대사 생성
   * @returns {Promise<string>} 게임 시작 대사
   */
  async generateGameStartDialogue() {
    const memorySummary = this.memory.getMemorySummary();

    const messages = this.promptBuilder.buildGameStartPrompt({
      memorySummary,
    });

    const response = await this.aiService.chatCompletion({
      messages,
      maxTokens: 2000,
      temperature: 0.5,
    });

    const dialogue = this.personality.postProcess(response.content.trim());
    
    this.dialogueHistory.push({
      round: 0,
      dialogue,
      type: 'game_start',
      timestamp: Date.now(),
    });

    return dialogue;
  }

  /**
   * 예측 결과 대사 생성
   * 유저의 선택 즉각 반영 - 고도의 심리전 대사 생성
   * @param {boolean} wasCorrect - 예측이 맞았는지
   * @param {Object} [roundData] - 라운드 데이터 (선택, 반응시간, 변경 여부)
   * @returns {Promise<string>} 예측 결과 대사
   */
  async generatePredictionResultDialogue(wasCorrect, roundData = null) {
    if (!this.lastPrediction) {
      // 예측이 없어도 유저의 선택에 대한 심리전 대사 생성
      if (roundData) {
        return this._generateChoiceReactionDialogue(roundData);
      }
      return '';
    }

    const messages = wasCorrect
      ? this.promptBuilder.buildPredictionSuccessPrompt({
          prediction: this.lastPrediction,
          actualChoice: roundData?.choice || this.lastPrediction.prediction,
          roundData,
        })
      : this.promptBuilder.buildPredictionFailurePrompt({
          prediction: this.lastPrediction,
          actualChoice: roundData?.choice || 'other',
          roundData,
        });

    let dialogue;
    try {
      const response = await this.aiService.chatCompletion({
        messages,
        maxTokens: 2000,
        temperature: 0.5,
      });
      dialogue = this._compactDialogue(this.personality.postProcess(response.content.trim()));
    } catch (error) {
      console.error('AI prediction dialogue fallback:', error);
      dialogue = this._compactDialogue(this._buildLocalChoiceDialogue(roundData, wasCorrect, this.lastPrediction));
    }
    
    this.dialogueHistory.push({
      round: this.learningEngine.playerModel.analyzedRounds,
      dialogue,
      type: wasCorrect ? 'prediction_success' : 'prediction_failure',
      timestamp: Date.now(),
    });

    return dialogue;
  }

  /**
   * 유저 선택에 대한 심리전 반응 대사 생성 (예측 없는 초기 라운드용)
   * @param {Object} roundData - 라운드 데이터
   * @returns {Promise<string>} 심리전 대사
   * @private
   */
  async _generateChoiceReactionDialogue(roundData) {
    const playerSnapshot = this.learningEngine.getPlayerSnapshot();

    const messages = this.promptBuilder.buildChoiceReactionPrompt({
      playerModel: playerSnapshot,
      roundData,
    });

    let dialogue;
    try {
      const response = await this.aiService.chatCompletion({
        messages,
        maxTokens: 2000,
        temperature: 0.65,
      });
      dialogue = this._compactDialogue(this.personality.postProcess(response.content.trim()));
    } catch (error) {
      console.error('AI choice reaction fallback:', error);
      dialogue = this._compactDialogue(this._buildLocalChoiceDialogue(roundData));
    }

    this.dialogueHistory.push({
      round: roundData.round,
      dialogue,
      type: 'choice_reaction',
      timestamp: Date.now(),
    });

    return dialogue;
  }

  _getChoiceText(question, choice) {
    if (!question || !choice) return choice || '선택 없음';
    return question.choices?.[choice] || choice;
  }

  _compactDialogue(dialogue, maxLength = 95) {
    const clean = String(dialogue || '').replace(/\s+/g, ' ').trim();
    const sentences = clean.match(/[^.!?。]+[.!?。]?/g) || [clean];
    const firstSentence = sentences[0]?.trim() || clean;

    if (firstSentence.length <= maxLength) return firstSentence;

    return `${firstSentence.slice(0, maxLength - 3).trim()}...`;
  }

  _getChoicePsychology(questionType) {
    const map = {
      risk: ['위험을 감수하는 쪽으로 몸이 먼저 기울었습니다', '안전보다 가능성에 더 예민하게 반응했습니다'],
      reward: ['확실함보다 보상의 크기에 시선이 갔습니다', '손실보다 놓친 기회를 더 크게 느끼는 선택입니다'],
      time: ['기다림보다 통제 가능한 즉시성을 택했습니다', '시간 압박 앞에서 인내심이 먼저 시험받았습니다'],
      speed: ['생각보다 손이 먼저 움직인 선택입니다', '빠른 판단을 신뢰하는 습관이 드러났습니다'],
      emotion: ['신뢰와 경계 사이에서 방어선이 보였습니다', '상대를 믿을지 의심할지에 대한 기준이 드러났습니다'],
      combat: ['물러서기보다 판을 흔드는 쪽을 택했습니다', '압박을 받으면 맞서는 방식이 먼저 나옵니다'],
      direction: ['논리보다 직감의 방향감각을 따른 흔적입니다', '익숙함과 미지 사이에서 본능이 먼저 말했습니다'],
      temptation: ['권위, 다수, 직감 중 무엇에 약한지 단서가 나왔습니다', '혼란 속에서 믿고 싶은 정보가 먼저 선택됐습니다'],
    };
    return map[questionType] || ['그 선택에는 방금의 기준이 그대로 남아 있습니다'];
  }

  _buildLocalChoiceDialogue(roundData, wasCorrect = null, prediction = null) {
    if (!roundData) return '';

    const choiceText = this._getChoiceText(roundData.question, roundData.choice);
    const typeLines = this._getChoicePsychology(roundData.question?.type);
    const psychology = typeLines[Math.floor(Math.random() * typeLines.length)];

    if (roundData.timeOut) {
      return `시간이 끝났고, 결국 "${choiceText}"로 남았습니다. 선택하지 못한 순간도 선택입니다. 망설임이 꽤 선명하군요.`;
    }

    const speedLine = roundData.reactionTime < 1500
      ? '거의 망설이지 않았습니다.'
      : roundData.reactionTime > 3000
        ? '오래 붙잡고 있다가 고른 답입니다.'
        : '충분히 계산한 듯 보이지만, 흔들림은 남았습니다.';

    if (roundData.changedChoice) {
      return `"${choiceText}"로 바꿨군요. ${speedLine} 처음 선택을 버린 이유가 전략인지 불안인지, 다음 라운드에서 드러납니다.`;
    }

    if (wasCorrect === true && prediction) {
      return `예상대로 "${choiceText}"였습니다. ${speedLine} ${psychology}. 지금 패턴을 숨기려 해도 손이 먼저 말합니다.`;
    }

    if (wasCorrect === false && prediction) {
      const predictedText = this._getChoiceText(roundData.question, prediction.prediction);
      return `"${predictedText}"를 예상했지만 당신은 "${choiceText}"를 골랐습니다. ${psychology}. 속인 건지, 본심이 새어 나온 건지 보겠습니다.`;
    }

    return `"${choiceText}"를 골랐군요. ${speedLine} ${psychology}. 다음 선택에서도 같은 기준을 유지할 수 있을까요?`;
  }

  /**
   * 최종 분석 리포트 생성
   * 실제 학습 데이터를 기반으로 그래프용 퍼센트가 포함된 구체적 리포트 생성
   * @returns {Promise<string>} 분석 리포트 (마크다운 형식, 퍼센트 포함)
   */
  async generateFinalReport() {
    if (!this.isActive) return null;

    const playerSnapshot = this.learningEngine.getPlayerSnapshot();
    const patterns = this.learningEngine.analyzePatterns();
    const learningSummary = this.learningEngine.getLearningSummary();
    const userName = this.memory.getUserName();

    const report = this._applyReportAddress(
      this._generateDataDrivenReport(playerSnapshot, patterns, learningSummary, userName),
      userName
    );

    // 메모리에 게임 저장
    this.memory.saveGameMemory({
      playerModel: playerSnapshot,
      patterns,
      playerType: playerSnapshot.playerType || this.learningEngine.playerModel.getPlayerType(),
      predictionAccuracy: playerSnapshot.predictionAccuracy,
    });

    return report;
  }

  /**
   * 결과 화면 상단에 표시할 강한 요약 카드 데이터 생성
   * @param {string} [report=''] - 최종 리포트
   * @returns {Object}
   */
  getResultSummaryCard(report = '') {
    const playerSnapshot = this.learningEngine.getPlayerSnapshot();
    const analysis = this.behaviorAnalyzer.analyze(
      playerSnapshot,
      null,
      this.learningJournal
    );
    const userName = this.memory.getUserName();
    const attrs = playerSnapshot.attributes;
    const typeTitle = this.behaviorAnalyzer.generateProfileTitle(analysis, playerSnapshot, userName);
    const patternScore = Math.round((attrs.repeat + attrs.consistency) / 2);
    const jobs = this._extractTopJobs(report);

    return {
      typeTitle,
      metricLine: `위험 성향 ${Math.round(attrs.risk)}% / 패턴 반복성 ${patternScore}% / 심리전 대응 ${Math.round(attrs.adaptation)}%`,
      jobLine: `추천 직업: ${(jobs.length ? jobs : ['전략 컨설턴트', '데이터 분석가', 'UX 리서처']).join(', ')}`,
      aiReadLine: this._buildAiReadLine(playerSnapshot),
    };
  }

  _extractTopJobs(report) {
    const match = String(report || '').match(/\*\*추천 직업 5가지\*\*:\s*([\s\S]*)$/);
    if (!match) return [];

    return match[1]
      .replace(/\s*(\d+\.)\s*/g, '\n$1 ')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parsed = line.match(/^\d+\.\s*([^-]+?)(?:\s*-\s*.+)?$/);
        return parsed ? parsed[1].trim() : '';
      })
      .filter(Boolean)
      .slice(0, 3);
  }

  _buildAiReadLine(playerSnapshot) {
    const attrs = playerSnapshot.attributes;
    const choices = playerSnapshot.recentChoices || [];
    const timeouts = choices.filter((choice) => choice.timeOut).length;
    const changedChoices = choices.filter((choice) => choice.changedChoice).length;
    const validTimes = choices
      .filter((choice) => !choice.timeOut && choice.reactionTime > 0)
      .map((choice) => choice.reactionTime);
    const avgTime = validTimes.length
      ? validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length
      : 0;

    if (timeouts >= Math.max(2, Math.ceil(choices.length * 0.25))) {
      return 'AI는 망설임과 결정 지연을 주요 신호로 기록했습니다.';
    }

    if (changedChoices >= 2 || attrs.adaptation > 65) {
      return 'AI는 선택을 바꾸는 타이밍에서 심리적 저항을 감지했습니다.';
    }

    if (attrs.repeat > 60 || attrs.consistency > 70) {
      return 'AI는 반복되는 선택 기준을 가장 먼저 감지했습니다.';
    }

    if (avgTime > 0 && avgTime < 1600) {
      return 'AI는 빠른 결정 속도에서 직관적 판단 경향을 읽었습니다.';
    }

    return 'AI는 선택보다 선택을 숨기려는 방식에 주목했습니다.';
  }

  /**
   * 실제 학습 데이터를 기반으로 구체적인 분석 리포트 생성
   * BehaviorAnalyzer를 활용하여 행동 데이터 기반의 심층 분석 제공
   * @param {Object} playerSnapshot - 플레이어 모델 스냅샷
   * @param {Array} patterns - 발견된 패턴
   * @param {Object} learningSummary - 학습 요약
   * @param {string} userName - 유저 이름
   * @returns {string} 마크다운 형식 분석 리포트
   * @private
   */
  _generateDataDrivenReport(playerSnapshot, patterns, learningSummary, userName) {
    // BehaviorAnalyzer를 통한 심층 행동 분석
    const analysis = this.behaviorAnalyzer.analyze(
      playerSnapshot,
      null,
      this.learningJournal
    );

    // 행동 분석 기반 상세 리포트 생성
    return this.behaviorAnalyzer.generateDetailedReport(
      analysis,
      playerSnapshot,
      patterns,
      learningSummary,
      userName
    );
  }

  /**
   * 결과 리포트의 호칭을 저장된 이름 기준으로 통일합니다.
   * @param {string} report - 분석 리포트
   * @param {string|null} userName - 저장된 유저 이름
   * @returns {string}
   * @private
   */
  _applyReportAddress(report, userName) {
    if (!report || typeof report !== 'string') return report;

    const cleanName = userName ? userName.trim() : '';
    if (!cleanName) {
      return report;
    }

    const name = `${cleanName}님`;
    return report
      .replace(/당신은/g, `${name}은`)
      .replace(/당신의/g, `${name}의`)
      .replace(/당신을/g, `${name}을`)
      .replace(/당신에게/g, `${name}에게`)
      .replace(/당신이/g, `${name}이`)
      .replace(/당신도/g, `${name}도`)
      .replace(/당신만/g, `${name}만`)
      .replace(/당신/g, name);
  }

  /**
   * Replay 생성
   * @returns {Promise<string>} Replay 텍스트
   */
  async generateReplay() {
    if (!this.isActive) return null;

    const journalEntries = this.learningJournal.getAllEntries();
    const playerSnapshot = this.learningEngine.getPlayerSnapshot();

    const messages = this.promptBuilder.buildReplayPrompt({
      journalEntries,
      playerModel: playerSnapshot,
    });

    const response = await this.aiService.chatCompletion({
      messages,
      maxTokens: 2000,
      temperature: 0.5,
    });

    return this.personality.postProcess(response.content.trim());
  }

  /**
   * Memory 대화 생성
   * @returns {Promise<string>} Memory 기반 대화
   */
  async generateMemoryDialogue() {
    const memorySummary = this.memory.getMemorySummary();
    const playerSnapshot = this.learningEngine.getPlayerSnapshot();
    const comparisonData = this.memory.getComparisonData(this.learningEngine.playerModel);

    const messages = this.promptBuilder.buildMemoryDialoguePrompt({
      memorySummary,
      comparisonData,
    });

    const response = await this.aiService.chatCompletion({
      messages,
      maxTokens: 2000,
      temperature: 0.5,
    });

    return this.personality.postProcess(response.content.trim());
  }

  /**
   * AI 상태에 따른 대사 가져오기
   * (Gemini 호출 없이 JavaScript로만 생성)
   * @returns {Object} AI 대사 정보
   */
  getAIStatement() {
    return this.learningEngine.getAIStatement();
  }

  /**
   * 학습 요약 반환
   * @returns {Object} 학습 요약
   */
  getLearningSummary() {
    return this.learningEngine.getLearningSummary();
  }

  /**
   * 발견된 패턴 반환
   * @returns {Array} 패턴 목록
   */
  getPatterns() {
    return this.learningEngine.analyzePatterns();
  }

  /**
   * 플레이어 타입 반환
   * @returns {string} 플레이어 타입
   */
  getPlayerType() {
    return this.learningEngine.playerModel.getPlayerType();
  }

  /**
   * API 키 설정
   * @param {string} apiKey - OpenRouter API 키
   */
  setApiKey(apiKey) {
    this.aiService.setApiKey(apiKey);
  }

  /**
   * OpenRouter 모델 ID 설정
   * @param {string} modelId - OpenRouter 모델 ID
   */
  setModelId(modelId) {
    this.aiService.setModelId(modelId);
  }

  /**
   * AI 엔진 상태 반환
   * @returns {Object} 상태 정보
   */
  getStatus() {
    return {
      isActive: this.isActive,
      aiService: this.aiService.getStatus(),
      learningProgress: this.learningEngine.playerModel.learningProgress,
      confidence: this.learningEngine.playerModel.confidence,
      analyzedRounds: this.learningEngine.playerModel.analyzedRounds,
      dialogueCount: this.dialogueHistory.length,
    };
  }

  /**
   * AI 엔진 리셋
   */
  reset() {
    this.learningEngine.reset();
    this.predictionEngine.reset();
    this.learningJournal.reset();
    this.aiService.reset();
    this.dialogueHistory = [];
    this.lastDialogue = null;
    this.lastPrediction = null;
    this.predictionRecords = [];
    this.isActive = false;
  }

  /**
   * Memory 조회
   * @returns {Memory} 메모리 인스턴스
   */
  getMemory() {
    return this.memory;
  }

  /**
   * AI Personality 조회
   * @returns {AIPersonality} AI 성격 인스턴스
   */
  getPersonality() {
    return this.personality;
  }

  /**
   * 학습 저널 조회 (테스트용)
   * @returns {Object} 학습 저널
   */
  getLearningJournal() {
    return this.learningJournal;
  }

  /**
   * 예측 엔진 조회 (테스트용)
   * @returns {PredictionEngine} 예측 엔진
   */
  getPredictionEngine() {
    return this.predictionEngine;
  }

  /**
   * 행동 분석 기반 프로필 제목(한마디) 반환
   * @returns {string} 프로필 제목
   */
  getProfileTitle() {
    const playerSnapshot = this.learningEngine.getPlayerSnapshot();
    const analysis = this.behaviorAnalyzer.analyze(
      playerSnapshot,
      null,
      this.learningJournal
    );
    const userName = this.memory.getUserName();
    return this.behaviorAnalyzer.generateProfileTitle(analysis, playerSnapshot, userName);
  }

  /**
   * 행동 분석 기반 유저 프로필 반환 (저장/공유용)
   * @returns {Object} 유저 프로필 객체
   */
  getPlayerProfile() {
    const playerSnapshot = this.learningEngine.getPlayerSnapshot();
    const analysis = this.behaviorAnalyzer.analyze(
      playerSnapshot,
      null,
      this.learningJournal
    );
    const userName = this.memory.getUserName();
    return this.behaviorAnalyzer.generatePlayerProfile(analysis, playerSnapshot, userName);
  }
}
