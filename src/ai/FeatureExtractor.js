/**
 * MindTrap - Feature Extractor
 * 게임 데이터에서 행동 특징(Feature)를 추출합니다.
 * 모든 계산은 여기서 이루어지며, Gemini는 이 값을 수정하지 않습니다.
 */

import { GAME_CONFIG, QUESTION_TYPES } from '../utils/constants.js';

/**
 * FeatureExtractor 클래스
 * 매 라운드마다 플레이어의 행동 특징을 추출합니다.
 */
export class FeatureExtractor {
  constructor() {
    /** @type {Array} 이전 라운드의 선택 기록 */
    this.previousChoices = [];

    /** @type {Array} 이전 반응 시간 기록 */
    this.previousReactionTimes = [];

    /** @type {Array} 이전 질문 유형 기록 */
    this.previousQuestionTypes = [];
  }

  /**
   * 단일 라운드에서 특징 추출
   * @param {Object} roundData - 라운드 데이터
   * @param {number} roundData.round - 라운드 번호
   * @param {Object} roundData.question - 질문 객체
   * @param {string} roundData.choice - 선택한 답변
   * @param {number} roundData.reactionTime - 반응 시간 (ms)
   * @param {boolean} roundData.changedChoice - 선택 변경 여부
   * @param {boolean} roundData.timeOut - 시간 초과 여부
   * @returns {Object} 추출된 특징들
   */
  extractFeatures(roundData) {
    const {
      round,
      question,
      choice,
      reactionTime,
      changedChoice,
      timeOut,
    } = roundData;
    const interactionMetrics = roundData.interactionMetrics || {};

    const effectiveChoice = timeOut ? 'timeout' : choice;
    const hoverSwitchCount = interactionMetrics.hoverSwitchCount || 0;
    const selectedHoverMs = interactionMetrics.selectedHoverMs || 0;
    const totalHoverMs = interactionMetrics.totalHoverMs || 0;
    const changedMindBeforeClick = Boolean(interactionMetrics.changedMindBeforeClick);
    const selectedAfterHoveringOther = Boolean(interactionMetrics.selectedAfterHoveringOther);
    const validPreviousChoices = this.previousChoices.filter((previousChoice) => previousChoice !== 'timeout');
    const reactionTimeDelta = this._calculateReactionTimeDelta(reactionTime, timeOut);
    const speedShift = this._categorizeSpeedShift(reactionTimeDelta, timeOut);
    const currentChoiceStreak = this._calculateChoiceStreak(effectiveChoice);
    const recentChoiceDiversity = this._calculateChoiceDiversity(effectiveChoice);

    const features = {
      round,
      timestamp: Date.now(),

      // 기본 행동 특징
      reactionTime,
      choice: effectiveChoice,
      changedChoice: changedChoice ? 1 : 0,
      timeOut: timeOut ? 1 : 0,
      hoverSwitchCount,
      selectedHoverMs,
      totalHoverMs,
      hoveredChoiceCount: interactionMetrics.hoveredChoiceCount || 0,
      changedMindBeforeClick: changedMindBeforeClick ? 1 : 0,
      selectedAfterHoveringOther: selectedAfterHoveringOther ? 1 : 0,
      twoStage: roundData.twoStage ? 1 : 0,
      firstChoice: roundData.firstChoice || null,

      // 파생 특징들
      hesitationTime: this._calculateHesitationTime(reactionTime, timeOut),
      preChoiceHesitation: this._calculatePreChoiceHesitation(interactionMetrics, reactionTime, timeOut),
      concealmentSignal: this._calculateConcealmentSignal(interactionMetrics, reactionTime, effectiveChoice),
      secondThoughtSignal: this._calculateSecondThoughtSignal(roundData, interactionMetrics),
      pressureResponse: this._calculatePressureResponse(roundData, interactionMetrics),
      reactionTimeDelta,
      speedShift,
      currentChoiceStreak,
      recentChoiceDiversity,
      riskChoice: timeOut ? 50 : this._evaluateRiskChoice(question, choice),
      repeatChoice: this._evaluateRepeatChoice(effectiveChoice),
      speedCategory: this._categorizeSpeed(reactionTime, timeOut),

      // 문맥 기반 특징
      consistencyScore: this._calculateConsistency(effectiveChoice),
      adaptationScore: this._calculateAdaptation(effectiveChoice, question.type),
      patienceScore: timeOut ? 0 : this._calculatePatience(reactionTime),

      // 메타 특징
      questionType: question.type,
      choiceValue: timeOut ? '시간 초과' : this._getChoiceValue(question, choice),
      intentTag: timeOut ? 'timeout' : this._getIntentTag(question, choice),
      roundPhase: this._getRoundPhase(round),
      sameQuestionTypeRecently: this.previousQuestionTypes.includes(question.type) ? 1 : 0,
      previousValidChoiceCount: validPreviousChoices.length,
    };

    // 기록 저장
    this.previousChoices.push(effectiveChoice);
    this.previousReactionTimes.push(reactionTime);
    this.previousQuestionTypes.push(question.type);

    // 최근 5개만 유지
    if (this.previousChoices.length > 5) {
      this.previousChoices.shift();
      this.previousReactionTimes.shift();
      this.previousQuestionTypes.shift();
    }

    return features;
  }

  /**
   * 망설임 시간 계산
   * @param {number} reactionTime - 반응 시간
   * @param {boolean} timeOut - 시간 초과 여부
   * @returns {number} 망설임 점수 (0-100)
   * @private
   */
  _calculateHesitationTime(reactionTime, timeOut) {
    if (timeOut) return 100;
    
    const normalized = Math.min(100, (reactionTime / GAME_CONFIG.ROUND_TIME_LIMIT) * 100);
    return Math.round(normalized);
  }

  _calculatePreChoiceHesitation(interactionMetrics, reactionTime, timeOut) {
    if (timeOut) return 100;

    const totalHoverMs = interactionMetrics.totalHoverMs || 0;
    const hoverSwitchCount = interactionMetrics.hoverSwitchCount || 0;
    const changedMind = interactionMetrics.changedMindBeforeClick ? 25 : 0;
    const hoverScore = Math.min(45, totalHoverMs / 90);
    const switchScore = Math.min(30, hoverSwitchCount * 12);
    const timeScore = Math.min(25, reactionTime / 350);

    return Math.round(Math.min(100, hoverScore + switchScore + changedMind + timeScore));
  }

  _calculateConcealmentSignal(interactionMetrics, reactionTime, effectiveChoice) {
    if (effectiveChoice === 'timeout') return 30;

    let score = 0;
    if (reactionTime > 0 && reactionTime < 850) score += 28;
    if (interactionMetrics.hoverSwitchCount >= 2) score += 24;
    if (interactionMetrics.changedMindBeforeClick) score += 18;
    if (interactionMetrics.selectedAfterHoveringOther) score += 18;
    if ((interactionMetrics.totalHoverMs || 0) < 120 && reactionTime < 1200) score += 12;

    return Math.round(Math.min(100, score));
  }

  _calculateSecondThoughtSignal(roundData, interactionMetrics) {
    let score = 0;
    if (roundData.changedChoice) score += 45;
    if (roundData.twoStage) score += 20;
    if (interactionMetrics.changedMindBeforeClick) score += 20;
    if (interactionMetrics.selectedAfterHoveringOther) score += 15;
    if ((interactionMetrics.hoverSwitchCount || 0) >= 2) score += 10;

    return Math.round(Math.min(100, score));
  }

  _calculatePressureResponse(roundData, interactionMetrics) {
    if (roundData.timeOut) return 85;

    let score = 0;
    if (roundData.twoStage) score += 20;
    if (roundData.changedChoice) score += 24;
    if (roundData.reactionTime > 0 && roundData.reactionTime < 900) score += 22;
    if (roundData.reactionTime > 3600) score += 18;
    if ((interactionMetrics.hoverSwitchCount || 0) >= 2) score += 16;
    if (interactionMetrics.changedMindBeforeClick) score += 12;

    return Math.round(Math.min(100, score));
  }

  _calculateReactionTimeDelta(reactionTime, timeOut) {
    if (timeOut || !reactionTime || this.previousReactionTimes.length === 0) return 0;

    const validTimes = this.previousReactionTimes.filter((time) => time > 0 && time < GAME_CONFIG.ROUND_TIME_LIMIT);
    if (validTimes.length === 0) return 0;

    const avg = validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
    return Math.round(reactionTime - avg);
  }

  _categorizeSpeedShift(reactionTimeDelta, timeOut) {
    if (timeOut) return 'timeout';
    if (reactionTimeDelta <= -800) return 'faster';
    if (reactionTimeDelta >= 800) return 'slower';
    return 'stable';
  }

  _calculateChoiceStreak(currentChoice) {
    if (currentChoice === 'timeout') return 0;

    let streak = 1;
    for (let index = this.previousChoices.length - 1; index >= 0; index--) {
      if (this.previousChoices[index] !== currentChoice) break;
      streak += 1;
    }
    return streak;
  }

  _calculateChoiceDiversity(currentChoice) {
    const window = [...this.previousChoices, currentChoice].filter((choice) => choice !== 'timeout').slice(-6);
    if (window.length === 0) return 0;

    return Math.round((new Set(window).size / window.length) * 100);
  }

  /**
   * 위험 선택 평가
   * @param {Object} question - 질문 객체
   * @param {string} choice - 선택
   * @returns {number} 위험 수준 (0-100)
   * @private
   */
  _evaluateRiskChoice(question, choice) {
    const { type } = question;
    const isPrimary = choice === 'primary';

    // 타입별 위험 평가
    const riskMap = {
      [QUESTION_TYPES.RISK]: isPrimary ? 80 : 20,
      [QUESTION_TYPES.COMBAT]: isPrimary ? 70 : 30,
      [QUESTION_TYPES.REWARD]: isPrimary ? 90 : 10,
      [QUESTION_TYPES.TIME]: isPrimary ? 40 : 60,
      [QUESTION_TYPES.EMOTION]: isPrimary ? 60 : 40,
      [QUESTION_TYPES.SPEED]: isPrimary ? 70 : 30,
      [QUESTION_TYPES.DIRECTION]: 50, // 중립
    };

    return riskMap[type] ?? 50;
  }

  /**
   * 반복 선택 평가
   * @param {string} choice - 현재 선택
   * @returns {number} 반복 정도 (0-100)
   * @private
   */
  _evaluateRepeatChoice(choice) {
    if (choice === 'timeout') return 0;
    if (this.previousChoices.length === 0) return 0;

    const lastChoice = [...this.previousChoices]
      .reverse()
      .find((previousChoice) => previousChoice !== 'timeout');
    if (!lastChoice) return 0;
    return lastChoice === choice ? 100 : 0;
  }

  /**
   * 속도 카테고리 분류
   * @param {number} reactionTime - 반응 시간
   * @param {boolean} timeOut - 시간 초과
   * @returns {string} 'fast' | 'normal' | 'slow' | 'timeout'
   * @private
   */
  _categorizeSpeed(reactionTime, timeOut) {
    if (timeOut) return 'timeout';
    if (reactionTime < 1500) return 'fast';
    if (reactionTime < 3000) return 'normal';
    return 'slow';
  }

  /**
   * 일관성 점수 계산
   * @param {string} currentChoice - 현재 선택
   * @returns {number} 일관성 (0-100)
   * @private
   */
  _calculateConsistency(currentChoice) {
    if (currentChoice === 'timeout') return 50;

    const validPreviousChoices = this.previousChoices.filter((choice) => choice !== 'timeout');
    if (validPreviousChoices.length < 2) return 50;

    const sameCount = validPreviousChoices.filter(
      (c) => c === currentChoice
    ).length;
    const ratio = sameCount / validPreviousChoices.length;

    return Math.round(ratio * 100);
  }

  /**
   * 적응력 점수 계산
   * @param {string} choice - 현재 선택
   * @param {string} questionType - 질문 타입
   * @returns {number} 적응력 (0-100)
   * @private
   */
  _calculateAdaptation(choice, questionType) {
    if (choice === 'timeout') return 50;

    // 간단히 직전 선택과 다른지 확인
    if (this.previousChoices.length === 0) return 50;

    const lastChoice = [...this.previousChoices]
      .reverse()
      .find((previousChoice) => previousChoice !== 'timeout');
    if (!lastChoice) return 50;
    return choice !== lastChoice ? 70 : 30;
  }

  /**
   * 인내심 점수 계산
   * @param {number} reactionTime - 반응 시간
   * @returns {number} 인내심 (0-100)
   * @private
   */
  _calculatePatience(reactionTime) {
    // 반응 시간이 빠를수록 인내심 낮음
    const patience = Math.max(0, reactionTime / 50);
    return Math.min(100, Math.round(patience));
  }

  /**
   * 선택 값 반환 (primary/secondary를 의미있는 값으로)
   * @param {Object} question - 질문 객체
   * @param {string} choice - 선택
   * @returns {string} 선택의 실제 텍스트
   * @private
   */
  _getChoiceValue(question, choice) {
    return question.choices?.[choice] || choice;
  }

  _getIntentTag(question, choice) {
    const type = question.type;
    const isPrimary = choice === 'primary' || choice === 'A';
    const map = {
      [QUESTION_TYPES.RISK]: isPrimary ? 'opportunity' : 'loss_control',
      [QUESTION_TYPES.COMBAT]: isPrimary ? 'confrontation' : 'observation',
      [QUESTION_TYPES.REWARD]: isPrimary ? 'growth_reward' : 'secure_reward',
      [QUESTION_TYPES.TIME]: isPrimary ? 'wait_for_certainty' : 'act_now',
      [QUESTION_TYPES.EMOTION]: isPrimary ? 'accept_external_signal' : 'guard_boundary',
      [QUESTION_TYPES.SPEED]: isPrimary ? 'intuition' : 'deliberation',
      [QUESTION_TYPES.DIRECTION]: isPrimary ? 'novel_path' : 'familiar_path',
      [QUESTION_TYPES.TEMPTATION]: this._getTemptationIntent(choice),
    };

    return map[type] || choice;
  }

  _getTemptationIntent(choice) {
    const map = {
      A: 'first_signal',
      B: 'social_proof',
      C: 'authority_evidence',
      D: 'inner_signal',
    };
    return map[choice] || 'unknown_signal';
  }

  _getRoundPhase(round) {
    if (round <= Math.ceil(GAME_CONFIG.TOTAL_ROUNDS * 0.3)) return 'early';
    if (round <= Math.ceil(GAME_CONFIG.TOTAL_ROUNDS * 0.7)) return 'mid';
    return 'late';
  }

  /**
   * 여러 라운드 특징 추출
   * @param {Array} roundDataList - 라운드 데이터 배열
   * @returns {Array} 추출된 특징 배열
   */
  extractMultipleFeatures(roundDataList) {
    return roundDataList.map((data) => this.extractFeatures(data));
  }

  /**
   * 특징 요약 통계 생성
   * @param {Array} features - 특징 배열
   * @returns {Object} 요약 통계
   */
  generateFeatureSummary(features) {
    if (features.length === 0) {
      return {
        totalRounds: 0,
        avgReactionTime: 0,
        avgHesitation: 0,
        avgPreChoiceHesitation: 0,
        avgConcealmentSignal: 0,
        avgSecondThoughtSignal: 0,
        avgPressureResponse: 0,
        avgChoiceDiversity: 0,
        avgRisk: 0,
        repeatCount: 0,
        timeoutCount: 0,
        changedChoiceCount: 0,
        twoStageCount: 0,
        twoStageChangedCount: 0,
        speedDistribution: { fast: 0, normal: 0, slow: 0, timeout: 0 },
        speedShiftDistribution: { faster: 0, stable: 0, slower: 0, timeout: 0 },
        choiceDistribution: {},
        questionTypeDistribution: {},
        intentDistribution: {},
        phaseDistribution: { early: 0, mid: 0, late: 0 },
      };
    }

    const summary = {
      totalRounds: features.length,
      avgReactionTime: 0,
      avgHesitation: 0,
      avgPreChoiceHesitation: 0,
      avgConcealmentSignal: 0,
      avgSecondThoughtSignal: 0,
      avgPressureResponse: 0,
      avgChoiceDiversity: 0,
      avgRisk: 0,
      repeatCount: 0,
      timeoutCount: 0,
      changedChoiceCount: 0,
      twoStageCount: 0,
      twoStageChangedCount: 0,
      speedDistribution: { fast: 0, normal: 0, slow: 0, timeout: 0 },
      speedShiftDistribution: { faster: 0, stable: 0, slower: 0, timeout: 0 },
      choiceDistribution: {},
      questionTypeDistribution: {},
      intentDistribution: {},
      phaseDistribution: { early: 0, mid: 0, late: 0 },
    };

    const clickedFeatures = features.filter((f) => !f.timeOut && f.reactionTime > 0);

    features.forEach((f) => {
      summary.avgHesitation += f.hesitationTime;
      summary.avgPreChoiceHesitation += f.preChoiceHesitation || 0;
      summary.avgConcealmentSignal += f.concealmentSignal || 0;
      summary.avgSecondThoughtSignal += f.secondThoughtSignal || 0;
      summary.avgPressureResponse += f.pressureResponse || 0;
      summary.avgChoiceDiversity += f.recentChoiceDiversity || 0;
      summary.avgRisk += f.riskChoice;
      summary.repeatCount += f.repeatChoice === 100 ? 1 : 0;
      summary.timeoutCount += f.timeOut;
      summary.changedChoiceCount += f.changedChoice || 0;
      summary.twoStageCount += f.twoStage || 0;
      summary.twoStageChangedCount += f.twoStage && f.changedChoice ? 1 : 0;
      summary.speedDistribution[f.speedCategory]++;
      summary.speedShiftDistribution[f.speedShift] =
        (summary.speedShiftDistribution[f.speedShift] || 0) + 1;
      summary.choiceDistribution[f.choice] =
        (summary.choiceDistribution[f.choice] || 0) + 1;
      summary.questionTypeDistribution[f.questionType] =
        (summary.questionTypeDistribution[f.questionType] || 0) + 1;
      summary.intentDistribution[f.intentTag] =
        (summary.intentDistribution[f.intentTag] || 0) + 1;
      summary.phaseDistribution[f.roundPhase] =
        (summary.phaseDistribution[f.roundPhase] || 0) + 1;
    });

    summary.avgReactionTime = clickedFeatures.length > 0
      ? clickedFeatures.reduce((sum, f) => sum + f.reactionTime, 0) / clickedFeatures.length
      : 0;
    summary.avgHesitation /= features.length;
    summary.avgPreChoiceHesitation = Math.round(summary.avgPreChoiceHesitation / features.length);
    summary.avgConcealmentSignal = Math.round(summary.avgConcealmentSignal / features.length);
    summary.avgSecondThoughtSignal = Math.round(summary.avgSecondThoughtSignal / features.length);
    summary.avgPressureResponse = Math.round(summary.avgPressureResponse / features.length);
    summary.avgChoiceDiversity = Math.round(summary.avgChoiceDiversity / features.length);
    summary.avgRisk /= features.length;

    return summary;
  }

  /**
   * extractor 초기화
   */
  reset() {
    this.previousChoices = [];
    this.previousReactionTimes = [];
    this.previousQuestionTypes = [];
  }
}
