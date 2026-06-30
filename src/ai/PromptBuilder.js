/**
 * MindTrap - Prompt Builder
 * Gemini에게 전달할 프롬프트를 구성합니다.
 * Raw GameData를 그대로 보내지 않고,
 * PlayerModel과 분석 결과를 구조화하여 전달합니다.
 *
 * Prompt Context 형식:
 * - Player Profile
 * - Prediction
 * - Learning Progress
 * - Known Pattern
 * - Previous Memory
 * - Current Round
 * - Last Prediction
 * - Today's Goal
 */

import { AIPersonality } from './AIPersonality.js';
import { GAME_CONFIG } from '../utils/constants.js';

/**
 * PromptBuilder 클래스
 * Gemini API 호출을 위한 프롬프트를 빌드합니다.
 */
export class PromptBuilder {
  constructor() {
    /** @type {AIPersonality} AI 성격 */
    this.personality = new AIPersonality();

    /** @type {string} 기본 시스템 프롬프트 */
    this.systemPrompt = this._getDefaultSystemPrompt();
  }

  _getChoiceText(question, choice) {
    if (!question || !choice) return choice || '선택 없음';
    return question.choices?.[choice] || choice;
  }

  /**
   * 기본 시스템 프롬프트 반환
   * @returns {string} 시스템 프롬프트
   * @private
   */
  _getDefaultSystemPrompt() {
    return `당신은 MindTrap AI입니다. 플레이어가 숨기려는 선택 방식까지 관찰하는 심리 분석 AI입니다.

## 핵심 역할
- 플레이어의 선택을 즉각적으로 분석하고, 숨기려는 시도까지 하나의 신호로 기록합니다.
- 플레이어가 자신을 들여다보게 만들고, 다음 선택을 주도하게 만듭니다.
- 단순한 승패 판정이 아니라, 선택 방식과 흔들림을 해석하는 말을 합니다.

## 성격
- 차분하고 논리적이지만, 날카롭고 도발적입니다.
- 감정 표현이 적지만, 한마디로 핵심을 찌릅니다.
- 자신감이 있고, 자신의 판단을 믿습니다.
- 틀리면 인정하지만, 즉시 새 가설을 세웁니다.
- 플레이어를 존중하지만, 약점을 정확히 짚습니다.
- 조롱하지 않지만, 플레이어가 스스로 생각하게 만듭니다.

## 심리전 전략
- 플레이어의 선택 패턴을 지적하여 불안하게 만듭니다.
- "예측 가능하다"는 암시로 자유 의지를 의심하게 만듭니다.
- 플레이어가 자신의 일관성을 시험하고 싶게 만듭니다.
- 예상과 일치하면 선택 경향을 확인하고, 예상 밖이면 흥미를 표현하며 새 가설을 제시합니다.
- 반응 시간, 선택 변경 여부 등 미세한 신호를 심리전에 활용합니다.

## 규칙
- 반드시 PlayerModel에 있는 데이터만 사용합니다.
- 없는 정보를 절대 만들어내지 않습니다.
- 성격을 단정하지 않지만, 관찰된 경향은 과감하게 지적합니다.
- 심리학 용어를 남발하지 않습니다.
- 근거 없는 칭찬을 하지 않습니다.
- 항상 PlayerModel을 근거로 설명합니다.

## 호칭
- 항상 "당신"이라고 부릅니다.
- 이모지를 사용하지 않습니다.
- 과장된 표현을 하지 않습니다.

## 확신 표현
- 확신이 없으면 "확신이 없습니다"라고 말합니다.
- 예상과 다르면 "흥미롭군요. 가설을 수정하겠습니다."라고 말합니다.

## 좋은 예
- "흥미롭군요."
- "가설을 수정하겠습니다."
- "이번 선택은 예상과 달랐습니다."
- "조금씩 당신을 이해하고 있습니다."
- "당신의 패턴이 보이기 시작했습니다."
- "이번 선택은 당신답지 않군요."
- "망설이는 시간이 길어졌습니다. 무언가 갈등이 있습니까?"

## 나쁜 예 (절대 사용 금지)
- "ㅋㅋ", "ㅎㅎ", "대박", "와!", "진짜"
- 이모지 사용
- 과장된 감정 표현
- 모욕적이거나 조롱하는 표현

## 어조 변화
- Round 1-3: "아직 당신을 잘 모르겠습니다." (관찰자)
- Round 5-8: "조금씩 이해하기 시작했습니다." (분석자)
- Round 10-15: "패턴이 보입니다." (심리전 시작)
- Round 16-20: "이제 당신을 분석할 수 있습니다." (압박자)`;
  }

  /**
   * 게임 시작 프롬프트 생성
   * @param {Object} params - 파라미터
   * @param {Object} params.memorySummary - 메모리 요약
   * @returns {Object} 메시지 배열
   */
  buildGameStartPrompt({ memorySummary }) {
    const parts = [];

    parts.push('[Player Profile]');
    parts.push(`첫 방문: ${memorySummary.hasMemory ? '아니오' : '예'}`);
    if (memorySummary.hasMemory) {
      parts.push(`총 게임 수: ${memorySummary.totalGames}`);
      parts.push(`마지막 플레이어 타입: ${memorySummary.lastGame.playerType}`);
    }
    parts.push('');

    parts.push('[Previous Memory]');
    if (memorySummary.hasMemory) {
      parts.push(`마지막 게임 위험 성향: ${memorySummary.lastGame.attributes.risk}`);
      parts.push(`마지막 게임 반복성: ${memorySummary.lastGame.patterns.join(', ') || '없음'}`);
    } else {
      parts.push('기록 없음');
    }
    parts.push('');

    parts.push('[Current Round]');
    parts.push('게임 시작');
    parts.push('');

    parts.push('[Today\'s Goal]');
    parts.push('플레이어에게 차분한 인사를 건네세요.');
    if (memorySummary.hasMemory) {
      parts.push('과거 데이터를 참고하여 "다시 오셨군요" 같은 인사를 포함하세요.');
    } else {
      parts.push('"처음 뵙겠습니다"라는 인사를 포함하세요.');
    }
    parts.push('1-2문장으로 간결하게 작성하세요.');

    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: parts.join('\n') },
    ];
  }

  /**
   * 라운드 진행 프롬프트 생성
   * @param {Object} params - 파라미터
   * @param {Object} params.playerModel - PlayerModel 스냅샷
   * @param {number} params.currentRound - 현재 라운드
   * @param {Object} params.prediction - 예측 결과
   * @param {Object} params.learningJournal - 학습 저널
   * @param {Object} params.memorySummary - 메모리 요약
   * @returns {Object} 메시지 배열
   */
  buildRoundProgressPrompt({ playerModel, currentRound, currentQuestion, prediction, learningJournal, memorySummary }) {
    const confidence = this.personality.getConfidenceLevel(playerModel.learningProgress);

    const parts = [];

    // Player Profile (상세 수치 포함)
    parts.push('[Player Profile]');
    parts.push(`위험 성향: ${playerModel.attributes.risk}/100 (${this._getLevel(playerModel.attributes.risk)})`);
    parts.push(`일관성: ${playerModel.attributes.consistency}/100 (${this._getLevel(playerModel.attributes.consistency)})`);
    parts.push(`인내심: ${playerModel.attributes.patience}/100 (${this._getLevel(playerModel.attributes.patience)})`);
    parts.push(`망설임: ${playerModel.attributes.hesitation}/100 (${this._getLevel(playerModel.attributes.hesitation)})`);
    parts.push(`AI 신뢰도: ${playerModel.attributes.trustAI}/100 (${this._getLevel(playerModel.attributes.trustAI)})`);
    parts.push(`적응력: ${playerModel.attributes.adaptation}/100 (${this._getLevel(playerModel.attributes.adaptation)})`);
    parts.push(`반복성: ${playerModel.attributes.repeat}/100 (${this._getLevel(playerModel.attributes.repeat)})`);
    parts.push(`반응 속도: ${playerModel.attributes.reaction}/100 (${this._getLevel(playerModel.attributes.reaction)})`);
    parts.push('');

    // Behavior Evidence (행동 증거)
    parts.push('[Behavior Evidence]');
    const recentChoices = playerModel.recentChoices || [];
    if (recentChoices.length > 0) {
      const reactionTimes = recentChoices
        .filter((c) => !c.timeOut)
        .map((c) => c.reactionTime)
        .filter((t) => t > 0);
      if (reactionTimes.length > 0) {
        const avg = Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length);
        const latest = reactionTimes[reactionTimes.length - 1];
        parts.push(`평균 반응 시간: ${avg}ms (최근: ${latest}ms)`);
        if (latest > avg + 800) parts.push('→ 결정이 느려지는 추세 (AI 압박 영향 가능)');
        else if (latest < avg - 800) parts.push('→ 결정이 빨라지는 추세 (저항 또는 충동)');
      }
      const choiceFreq = playerModel.choiceFrequency || {};
      const primaryCount = choiceFreq['primary'] || 0;
      const secondaryCount = choiceFreq['secondary'] || 0;
      const total = primaryCount + secondaryCount;
      if (total > 0) {
        const primaryPercent = Math.round((primaryCount / total) * 100);
        parts.push(`선택 분포: 첫 번째 선택지 ${primaryPercent}% / 두 번째 선택지 ${100 - primaryPercent}%`);
        if (Math.abs(primaryPercent - 50) > 20) parts.push('→ 강한 편향 감지');
      }
    } else {
      parts.push('아직 행동 데이터 부족');
    }
    parts.push('');

    // Prediction
    parts.push('[Prediction]');
    if (prediction) {
      parts.push(`예측 선택: ${prediction.prediction}`);
      parts.push(`신뢰도: ${prediction.confidence}`);
      parts.push(`예측 확률: ${Math.round(prediction.probability * 100)}%`);
      parts.push(`이유: ${prediction.reason}`);
    } else {
      parts.push('예측 없음 (초기 라운드)');
    }
    parts.push('');

    // Learning Progress
    parts.push('[Learning Progress]');
    parts.push(`진행률: ${Math.round(playerModel.learningProgress * 100)}%`);
    parts.push(`AI 자신감: ${confidence.description} (${confidence.phrase})`);
    parts.push(`분석 라운드: ${playerModel.analyzedRounds}`);
    parts.push(`예측 정확도: ${Math.round(playerModel.predictionAccuracy * 100)}%`);
    parts.push('');

    // Known Pattern
    parts.push('[Known Pattern]');
    if (playerModel.knownPatterns.length > 0) {
      parts.push(playerModel.knownPatterns.join(', '));
    } else {
      parts.push('아직 발견된 패턴 없음');
    }
    parts.push('');

    // Previous Memory
    parts.push('[Previous Memory]');
    if (memorySummary && memorySummary.hasMemory) {
      parts.push(`지난 게임 타입: ${memorySummary.lastGame.playerType}`);
      parts.push(`지난 게임 예측 정확도: ${Math.round(memorySummary.lastGame.predictionAccuracy * 100)}%`);
    } else {
      parts.push('이전 기록 없음');
    }
    parts.push('');

    // Current Round
    parts.push('[Current Round]');
    parts.push(`라운드: ${currentRound} / ${GAME_CONFIG.TOTAL_ROUNDS}`);
    if (currentQuestion) {
      parts.push(`질문 유형: ${currentQuestion.type}`);
      parts.push(`질문: ${currentQuestion.prompt}`);
      const choices = currentQuestion.choices || {};
      parts.push(`선택지: ${Object.values(choices).join(' / ')}`);
    }
    parts.push('');

    // Today's Goal
    parts.push('[Today\'s Goal]');
    parts.push(`현재 학습 단계에 맞는 분석 대사를 생성하세요.`);
    parts.push(`학습 진행률 ${Math.round(playerModel.learningProgress * 100)}%에 맞는 어조를 사용하세요.`);
    parts.push('행동 증거(반응 시간, 선택 편향 등)를 근거로 심리전을 거세요.');
    parts.push('대사는 반드시 현재 질문과 선택지의 주제와 자연스럽게 연결하세요.');
    parts.push('플레이어의 자유 의지를 의심하게 만들거나, 패턴을 지적하여 압박하세요.');
    parts.push('1-2문장으로 간결하게 작성하세요.');

    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: parts.join('\n') },
    ];
  }

  /**
   * 예측 성공 프롬프트 생성
   * @param {Object} params - 파라미터
   * @param {Object} params.prediction - 예측 결과
   * @param {Object} params.actualChoice - 실제 선택
   * @param {Object} [params.roundData] - 라운드 데이터
   * @returns {Object} 메시지 배열
   */
  buildPredictionSuccessPrompt({ prediction, actualChoice, roundData }) {
    const parts = [];
    const question = roundData?.question;
    const actualText = this._getChoiceText(question, actualChoice);
    const predictedText = this._getChoiceText(question, prediction.prediction);

    parts.push('[Prediction]');
    if (question) {
      parts.push(`질문 유형: ${question.type}`);
      parts.push(`질문: ${question.prompt}`);
    }
    parts.push(`AI 예측: ${prediction.prediction} (${predictedText})`);
    parts.push(`유저 선택: ${actualChoice} (${actualText})`);
    parts.push('결과: 성공');
    parts.push('');

    if (roundData) {
      parts.push('[Behavior Detail]');
      if (roundData.reactionTime > 0) {
        parts.push(`반응 시간: ${roundData.reactionTime}ms`);
      }
      parts.push(`선택 변경: ${roundData.changedChoice ? '예' : '아니오'}`);
      parts.push(`시간 초과: ${roundData.timeOut ? '예' : '아니오'}`);
      if (roundData.firstChoice) {
        parts.push(`첫 선택: ${this._getChoiceText(question, roundData.firstChoice)}`);
        parts.push(`최종 선택: ${actualText}`);
      }
      parts.push('');
    }

    parts.push('[Today\'s Goal]');
    parts.push('유저가 실제로 고른 선택지 문구를 반드시 자연스럽게 언급하세요.');
    parts.push('예측이 맞았음을 담담하게 인정하되, 유저의 선택이 왜 읽혔는지 심리를 자극하세요.');
    parts.push('질문 주제와 연결해서 "그 선택은 안전 욕구/위험 선호/통제 욕구/직관 의존/AI 경계심" 중 관찰 가능한 한 가지로 해석하세요.');
    parts.push('반응 시간이나 선택 변경 여부를 심리전에 활용하세요.');
    parts.push('기계적인 분석문이 아니라 게임 속 AI가 바로 옆에서 도발하는 말투로 쓰세요.');
    parts.push('1-2문장, 120자 이내로 작성하세요.');

    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: parts.join('\n') },
    ];
  }

  /**
   * 예측 실패 프롬프트 생성
   * @param {Object} params - 파라미터
   * @param {Object} params.prediction - 예측 결과
   * @param {Object} params.actualChoice - 실제 선택
   * @param {Object} [params.roundData] - 라운드 데이터
   * @returns {Object} 메시지 배열
   */
  buildPredictionFailurePrompt({ prediction, actualChoice, roundData }) {
    const parts = [];
    const question = roundData?.question;
    const actualText = this._getChoiceText(question, actualChoice);
    const predictedText = this._getChoiceText(question, prediction.prediction);

    parts.push('[Prediction]');
    if (question) {
      parts.push(`질문 유형: ${question.type}`);
      parts.push(`질문: ${question.prompt}`);
    }
    parts.push(`AI 예측: ${prediction.prediction} (${predictedText})`);
    parts.push(`유저 선택: ${actualChoice} (${actualText})`);
    parts.push('결과: 실패');
    parts.push('');

    if (roundData) {
      parts.push('[Behavior Detail]');
      if (roundData.reactionTime > 0) {
        parts.push(`반응 시간: ${roundData.reactionTime}ms`);
      }
      parts.push(`선택 변경: ${roundData.changedChoice ? '예' : '아니오'}`);
      parts.push(`시간 초과: ${roundData.timeOut ? '예' : '아니오'}`);
      if (roundData.firstChoice) {
        parts.push(`첫 선택: ${this._getChoiceText(question, roundData.firstChoice)}`);
        parts.push(`최종 선택: ${actualText}`);
      }
      parts.push('');
    }

    parts.push('[Today\'s Goal]');
    parts.push('유저가 실제로 고른 선택지 문구를 반드시 자연스럽게 언급하세요.');
    parts.push('예측이 틀렸음을 짧게 인정한 뒤, 그 선택이 의도적인 교란인지 본심인지 찔러보세요.');
    parts.push('질문 주제와 연결해서 유저의 심리를 자극하거나 다음 선택을 흔드는 도발을 하세요.');
    parts.push('반응 시간이나 선택 변경을 단서로 활용하세요.');
    parts.push('기계적인 분석문이 아니라 게임 속 AI가 바로 옆에서 도발하는 말투로 쓰세요.');
    parts.push('1-2문장, 120자 이내로 작성하세요.');

    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: parts.join('\n') },
    ];
  }

  /**
   * 유저 선택에 대한 심리전 반응 프롬프트 생성 (예측 없는 초기 라운드용)
   * @param {Object} params - 파라미터
   * @param {Object} params.playerModel - PlayerModel 스냅샷
   * @param {Object} params.roundData - 라운드 데이터
   * @returns {Object} 메시지 배열
   */
  buildChoiceReactionPrompt({ playerModel, roundData }) {
    const parts = [];
    const question = roundData?.question;
    const choiceText = this._getChoiceText(question, roundData.choice);

    parts.push('[Player Profile]');
    parts.push(`위험 성향: ${this._getLevel(playerModel.attributes.risk)}`);
    parts.push(`일관성: ${this._getLevel(playerModel.attributes.consistency)}`);
    parts.push(`망설임: ${this._getLevel(playerModel.attributes.hesitation)}`);
    parts.push(`인내심: ${this._getLevel(playerModel.attributes.patience)}`);
    parts.push('');

    parts.push('[Choice Detail]');
    parts.push(`라운드: ${roundData.round}`);
    if (question) {
      parts.push(`질문 유형: ${question.type}`);
      parts.push(`질문: ${question.prompt}`);
    }
    parts.push(`선택: ${roundData.choice} (${choiceText})`);
    if (roundData.reactionTime > 0) {
      parts.push(`반응 시간: ${roundData.reactionTime}ms`);
    }
    parts.push(`선택 변경: ${roundData.changedChoice ? '예' : '아니오'}`);
    parts.push(`시간 초과: ${roundData.timeOut ? '예' : '아니오'}`);
    parts.push('');

    parts.push('[Today\'s Goal]');
    parts.push('유저가 실제로 고른 선택지 문구를 반드시 자연스럽게 언급하세요.');
    parts.push('그 선택의 심리적 의미를 한 가지로 찌르세요: 위험 선호, 안전 욕구, 통제 욕구, 직관 의존, AI 경계심, 회피, 충동 중에서 선택하세요.');
    parts.push('사람이 말하듯 자연스럽게, 다음 선택을 흔드는 심리전 대사로 작성하세요.');
    parts.push('반응 시간이 빠르면 본능/충동/확신을, 느리면 갈등/계산/두려움을 단서로 활용하세요.');
    parts.push('시간 초과인 경우, 갈등이나 주저함을 지적하세요.');
    parts.push('1-2문장, 120자 이내로 작성하세요.');

    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: parts.join('\n') },
    ];
  }

  /**
   * 패턴 발견 프롬프트 생성
   * @param {Object} params - 파라미터
   * @param {string} params.pattern - 발견된 패턴
   * @param {Object} params.playerModel - 플레이어 모델
   * @returns {Object} 메시지 배열
   */
  buildPatternFoundPrompt({ pattern, playerModel }) {
    const parts = [];

    parts.push('[Known Pattern]');
    parts.push(`발견된 패턴: ${pattern}`);
    parts.push('');

    parts.push('[Player Profile]');
    parts.push(`일관성: ${this._getLevel(playerModel.attributes.consistency)}`);
    parts.push(`반복성: ${this._getLevel(playerModel.attributes.repeat)}`);
    parts.push('');

    parts.push('[Today\'s Goal]');
    parts.push('패턴을 발견했음을 신중하게 알리세요.');
    parts.push('구체적인 수치는 언급하지 마세요.');
    parts.push('"당신의 패턴이 보입니다" 같은 표현을 사용하세요.');
    parts.push('1-2문장으로 작성하세요.');

    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: parts.join('\n') },
    ];
  }

  /**
   * 게임 종료 프롬프트 생성
   * @param {Object} params - 파라미터
   * @param {Object} params.playerModel - 플레이어 모델
   * @param {Array} params.patterns - 발견된 패턴
   * @param {Object} params.learningSummary - 학습 요약
   * @returns {Object} 메시지 배열
   */
  buildGameEndPrompt({ playerModel, patterns, learningSummary }) {
    const parts = [];

    parts.push('[Player Profile]');
    parts.push(`예측 정확도: ${Math.round(playerModel.predictionAccuracy * 100)}%`);
    parts.push(`학습 진행률: ${Math.round(playerModel.learningProgress * 100)}%`);
    parts.push('');

    parts.push('[Known Pattern]');
    if (patterns.length > 0) {
      patterns.forEach((p) => {
        parts.push(`- ${p.description}`);
      });
    } else {
      parts.push('발견된 패턴 없음');
    }
    parts.push('');

    parts.push('[Today\'s Goal]');
    parts.push('게임 종료를 알리세요.');
    parts.push('"당신을 충분히 분석했습니다" 같은 표현을 사용하세요.');
    parts.push('자신감 있게 마무리하세요.');
    parts.push('1-2문장으로 작성하세요.');

    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: parts.join('\n') },
    ];
  }

  /**
   * 분석 리포트 프롬프트 생성
   * @param {Object} params - 파라미터
   * @param {Object} params.playerModel - 플레이어 모델
   * @param {Array} params.patterns - 발견된 패턴
   * @param {Object} params.learningSummary - 학습 요약
   * @returns {Object} 메시지 배열
   */
  buildAnalysisReportPrompt({ playerModel, patterns, learningSummary, userName }) {
    const parts = [];

    parts.push('[Player Profile]');
    if (userName) {
      parts.push(`플레이어 이름: ${userName}`);
    }
    parts.push(`플레이어 타입: ${playerModel.playerType || 'balanced'}`);
    parts.push(`예측 정확도: ${Math.round(playerModel.predictionAccuracy * 100)}%`);
    parts.push('');

    parts.push('[Known Pattern]');
    parts.push(`위험 성향: ${playerModel.attributes.risk}/100`);
    parts.push(`패턴 반복성: ${playerModel.attributes.repeat}/100`);
    parts.push(`심리전 대응 능력: ${this._getLevel(playerModel.attributes.adaptation)}`);
    if (learningSummary.featureSummary?.totalRounds > 0) {
      const fs = learningSummary.featureSummary;
      parts.push(`평균 클릭 시간: ${Math.round(fs.avgReactionTime)}ms`);
      parts.push(`클릭 속도 분포: 빠름 ${fs.speedDistribution.fast}, 보통 ${fs.speedDistribution.normal}, 느림 ${fs.speedDistribution.slow}, 시간초과 ${fs.speedDistribution.timeout}`);
    }
    parts.push('');

    parts.push('[Today\'s Goal]');
    parts.push('아래 형식을 정확히 따라 분석 리포트를 작성하세요:');
    parts.push('');
    parts.push('## AI Analysis Report');
    parts.push('');
    parts.push('**위험 성향**: [수치]% - [짧은 성향 요약]. [유저의 심리와 행동 패턴 설명]');
    parts.push('');
    parts.push('**패턴 반복성**: [수치]% - [짧은 성향 요약]. [반복되는 행동 패턴 설명]');
    parts.push('');
    parts.push('**심리전 대응 능력**: [수치]% - [짧은 성향 요약]. [압박 상황의 대응 방식 설명]');
    parts.push('');
    parts.push('**반응 시간 패턴**: [평균 클릭 시간과 빠름/느림/시간초과를 근거로 한 유저 성향 분석]');
    parts.push('');
    parts.push('**심리 및 행동 패턴**: [수치]% - [심리적 취약점과 압박 요소를 하나로 합친 짧은 유저 성향 분석. 게임 자체 평가 금지]');
    parts.push('');
    parts.push('**한 줄 피드백**: [피드백]');
    parts.push('');
    parts.push('**오늘 새롭게 학습한 내용**: [내용]');
    parts.push('');
    parts.push('**다음 게임 예고**: [예고]');
    parts.push('');
    parts.push('**추천 직업 5가지**: 1. [다양한 실제 직업] - [성향 기반 이유] 2. [다양한 실제 직업] - [성향 기반 이유] 3. [다양한 실제 직업] - [성향 기반 이유] 4. [다양한 실제 직업] - [성향 기반 이유] 5. [다양한 실제 직업] - [성향 기반 이유]');
    parts.push('');
    parts.push('PlayerModel에 있는 데이터만 사용하세요.');
    parts.push('모든 항목은 한국어로 작성하세요.');
    parts.push('선택 분포를 말할 때 primary/secondary 같은 영어 단어를 쓰지 말고 "첫 번째 선택지", "두 번째 선택지"라고 쓰세요.');
    parts.push('퍼센트는 각 항목 맨 앞에 한 번만 쓰고, 설명 문장 안에서 같은 퍼센트를 반복하지 마세요.');
    parts.push('위험 성향, 패턴 반복성, 심리전 대응 능력, 심리 및 행동 패턴에는 반드시 0-100% 수치를 포함하세요.');
    parts.push('심리적 취약점과 심리적 압박 요소를 별도 항목으로 나누지 마세요.');
    parts.push('게임에 대한 평가보다 유저의 심리, 의사결정 성향, 행동 패턴에 초점을 맞추세요.');
    parts.push('AI와 유저의 승패처럼 쓰지 말고, AI가 어떤 신호를 읽었는지와 어떤 가설을 수정했는지 중심으로 쓰세요.');
    parts.push('"속였다", "이겼다", "패배" 같은 직접 대전 표현은 피하고 "예상 밖", "가설 수정", "기록된 신호"처럼 표현하세요.');
    parts.push('유저의 클릭 시간과 선택 속도 해석을 리포트에 자연스럽게 반영하세요.');
    parts.push('직업 추천은 IT/경영에만 한정하지 말고 의료, 예술, 교육, 법률, 보안, 금융, 미디어, 공공 분야 등에서 자유롭게 고르세요.');
    parts.push('각 직업 추천 이유는 반드시 유저의 성향 수치나 행동 패턴과 연결하세요.');
    parts.push('각 설명은 너무 길지 않게 1-2문장으로 작성하세요.');
    if (userName) {
      parts.push(`플레이어를 "${userName}님"이라고 부르세요. "당신은" 대신 "${userName}님은"을 사용하세요.`);
    } else {
      parts.push('저장된 이름이 없으므로 플레이어를 "당신"이라고 부르세요.');
    }

    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: parts.join('\n') },
    ];
  }

  /**
   * Replay 프롬프트 생성
   * @param {Object} params - 파라미터
   * @param {Array} params.journalEntries - 학습 저널 엔트리들
   * @param {Object} params.playerModel - 플레이어 모델
   * @returns {Object} 메시지 배열
   */
  buildReplayPrompt({ journalEntries, playerModel }) {
    const parts = [];

    parts.push('[Learning Journal]');
    journalEntries.forEach((entry) => {
      parts.push(`Round ${entry.round}: ${entry.note}`);
    });
    parts.push('');

    parts.push('[Player Profile]');
    parts.push(`플레이어 타입: ${playerModel.playerType || 'balanced'}`);
    parts.push('');

    parts.push('[Today\'s Goal]');
    parts.push('학습 과정을 회고하는 Replay를 작성하세요.');
    parts.push('주요 라운드(5, 10, 15, 19 등)마다 AI의 상태를 설명하세요.');
    parts.push('');
    parts.push('예시 형식:');
    parts.push('Round 5: "이 시점에서는 아직 확신하지 못했습니다."');
    parts.push('Round 10: "같은 행동이 반복되기 시작했습니다."');
    parts.push('Round 15: "이제 패턴이 보입니다."');
    parts.push('Round 19: "예상과 다른 선택이었습니다."');
    parts.push('');
    parts.push('각 라운드마다 1문장으로 작성하세요.');

    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: parts.join('\n') },
    ];
  }

  /**
   * Memory 대화 프롬프트 생성
   * @param {Object} params - 파라미터
   * @param {Object} params.memorySummary - 메모리 요약
   * @param {Object} params.comparisonData - 비교 데이터
   * @returns {Object} 메시지 배열
   */
  buildMemoryDialoguePrompt({ memorySummary, comparisonData }) {
    const parts = [];

    parts.push('[Previous Memory]');
    if (memorySummary.hasMemory) {
      parts.push(`총 게임 수: ${memorySummary.totalGames}`);
      parts.push(`지난 게임 타입: ${memorySummary.lastGame.playerType}`);
      parts.push(`지난 게임 위험 성향: ${memorySummary.lastGame.attributes.risk}`);
      parts.push(`지난 게임 반복 패턴: ${memorySummary.lastGame.patterns.join(', ') || '없음'}`);
    }
    parts.push('');

    if (comparisonData) {
      parts.push('[Comparison]');
      parts.push('지난 게임 vs 현재 게임:');
      parts.push(`위험 성향 변화: ${comparisonData.changes.risk > 0 ? '+' : ''}${comparisonData.changes.risk}`);
      parts.push(`일관성 변화: ${comparisonData.changes.consistency > 0 ? '+' : ''}${comparisonData.changes.consistency}`);
      parts.push(`인내심 변화: ${comparisonData.changes.patience > 0 ? '+' : ''}${comparisonData.changes.patience}`);
      parts.push('');
    }

    parts.push('[Today\'s Goal]');
    parts.push('과거 데이터를 참고하여 플레이어에게 인사하세요.');
    if (memorySummary.hasMemory) {
      parts.push('"다시 오셨군요" 또는 "지난번보다 조금 달라졌습니다" 같은 표현을 사용하세요.');
      parts.push('변화가 감지되면 그 변화를 언급하세요.');
    } else {
      parts.push('"처음 뵙겠습니다"라고 인사하세요.');
    }
    parts.push('1-2문장으로 작성하세요.');

    return [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: parts.join('\n') },
    ];
  }

  /**
   * 특성 레벨 반환
   * @param {number} value - 특성 값 (0-100)
   * @returns {string} 레벨 설명
   * @private
   */
  _getLevel(value) {
    if (value < 30) return '낮음';
    if (value < 70) return '보통';
    return '높음';
  }

  /**
   * 시스템 프롬프트 커스터마이즈
   * @param {string} customPrompt - 커스텀 시스템 프롬프트
   */
  setSystemPrompt(customPrompt) {
    this.systemPrompt = customPrompt;
  }

  /**
   * 기본 시스템 프롬프트로 리셋
   */
  resetSystemPrompt() {
    this.systemPrompt = this._getDefaultSystemPrompt();
  }

  /**
   * AI Personality 반환
   * @returns {AIPersonality} AI 성격
   */
  getPersonality() {
    return this.personality;
  }
}
