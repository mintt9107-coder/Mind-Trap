/**
 * MindTrap - Learning Engine
 * AI 학습의 핵심 엔진입니다.
 * FeatureExtractor, RuleEngine, PlayerModel을 통합하여
 * 매 라운드마다 플레이어를 학습합니다.
 */

import { PlayerModel } from './PlayerModel.js';
import { FeatureExtractor } from './FeatureExtractor.js';
import { RuleEngine } from './RuleEngine.js';
import { GAME_CONFIG } from '../utils/constants.js';

/**
 * LearningEngine 클래스
 * 전체 AI 학습 과정을 관리합니다.
 */
export class LearningEngine {
  constructor() {
    // 하위 컴포넌트 초기화
    this.playerModel = new PlayerModel();
    this.featureExtractor = new FeatureExtractor();
    this.ruleEngine = new RuleEngine();

    /** @type {Array} 학습 히스토리 */
    this.learningHistory = [];

    /** @type {Array} 적용된 규칙 히스토리 */
    this.ruleHistory = [];

    /** @type {boolean} 엔진 활성화 여부 */
    this.isActive = false;
  }

  /**
   * 학습 엔진 초기화
   */
  initialize() {
    this.playerModel.reset();
    this.featureExtractor.reset();
    this.learningHistory = [];
    this.ruleHistory = [];
    this.isActive = true;
  }

  /**
   * 단일 라운드 학습 수행
   * @param {Object} roundData - 라운드 데이터
   * @returns {Object} 학습 결과
   */
  learnFromRound(roundData) {
    if (!this.isActive) {
      console.warn('LearningEngine is not active');
      return null;
    }

    const { round } = roundData;
    const totalRounds = GAME_CONFIG.TOTAL_ROUNDS;

    // 1. Feature 추출
    const features = this.featureExtractor.extractFeatures(roundData);

    // 2. Rule 적용하여 PlayerModel 업데이트
    const appliedRules = this.ruleEngine.applyRules(features, this.playerModel);

    // 3. 학습 진행률 업데이트
    this.playerModel.updateLearningProgress(round, totalRounds);

    // 4. 선택 기록
    const recordedChoice = roundData.timeOut ? 'timeout' : roundData.choice;
    this.playerModel.recordChoice(recordedChoice, {
      reactionTime: roundData.reactionTime,
      questionType: roundData.question.type,
      choiceText: roundData.timeOut
        ? '시간 초과'
        : roundData.question.choices?.[roundData.choice] || roundData.choice,
      questionPrompt: roundData.question.prompt,
      timeOut: Boolean(roundData.timeOut),
      actualChoice: roundData.choice,
      changedChoice: Boolean(roundData.changedChoice),
      interactionMetrics: roundData.interactionMetrics || {},
      preChoiceHesitation: features.preChoiceHesitation || 0,
      concealmentSignal: features.concealmentSignal || 0,
      hoverSwitchCount: features.hoverSwitchCount || 0,
      changedMindBeforeClick: Boolean(features.changedMindBeforeClick),
      selectedAfterHoveringOther: Boolean(features.selectedAfterHoveringOther),
      twoStage: Boolean(features.twoStage),
      firstChoice: features.firstChoice,
      secondThoughtSignal: features.secondThoughtSignal || 0,
      pressureResponse: features.pressureResponse || 0,
      reactionTimeDelta: features.reactionTimeDelta || 0,
      speedShift: features.speedShift,
      currentChoiceStreak: features.currentChoiceStreak || 0,
      recentChoiceDiversity: features.recentChoiceDiversity || 0,
      intentTag: features.intentTag,
      roundPhase: features.roundPhase,
      sameQuestionTypeRecently: Boolean(features.sameQuestionTypeRecently),
    });

    // 5. 자신감 업데이트 (데이터가 많을수록 자신감 증가)
    const newConfidence = Math.min(1, this.playerModel.learningProgress * 0.8 + 
      this.playerModel.predictionAccuracy * 0.2);
    this.playerModel.updateConfidence(newConfidence);

    // 6. 학습 결과 기록
    const learningResult = {
      round,
      features,
      appliedRules,
      playerModelSnapshot: this.playerModel.getSnapshot(),
      timestamp: Date.now(),
    };

    this.learningHistory.push(learningResult);
    this.ruleHistory.push(...appliedRules.map((r) => ({ ...r, round })));

    return learningResult;
  }

  /**
   * 여러 라운드 일괄 학습
   * @param {Array} roundDataList - 라운드 데이터 배열
   * @returns {Array} 학습 결과 배열
   */
  learnFromMultipleRounds(roundDataList) {
    return roundDataList
      .sort((a, b) => a.round - b.round)
      .map((data) => this.learnFromRound(data));
  }

  /**
   * 예측 결과 학습 (예측이 맞았는지 틀렸는지)
   * @param {boolean} wasCorrect - 예측 정확 여부
   * @param {number} learningRate - 학습률
   */
  updateFromPrediction(wasCorrect, learningRate = 0.1) {
    this.playerModel.updatePredictionAccuracy(wasCorrect, learningRate);
  }

  /**
   * 현재 플레이어 모델 스냅샷 반환
   * @returns {Object} 플레이어 모델 상태
   */
  getPlayerSnapshot() {
    return this.playerModel.getSnapshot();
  }

  /**
   * 학습 요약 반환
   * @returns {Object} 학습 요약 데이터
   */
  getLearningSummary() {
    const totalRounds = this.learningHistory.length;
    const features = this.learningHistory.map((h) => h.features);
    const featureSummary = this.featureExtractor.generateFeatureSummary(features);

    return {
      totalRounds,
      playerType: this.playerModel.getPlayerType(),
      attributes: { ...this.playerModel.attributes },
      predictionAccuracy: this.playerModel.predictionAccuracy,
      learningProgress: this.playerModel.learningProgress,
      confidence: this.playerModel.confidence,
      knownPatterns: [...this.playerModel.knownPatterns],
      featureSummary,
      evidenceStats: this.playerModel.getSnapshot().evidenceStats,
    };
  }

  /**
   * 패턴 분석
   * 학습된 데이터를 기반으로 발견된 패턴을 반환합니다.
   * @returns {Array} 발견된 패턴 목록
   */
  analyzePatterns() {
    const patterns = [];
    const attrs = this.playerModel.attributes;

    // 위험 성향 패턴
    if (attrs.risk > 65) {
      patterns.push({
        type: 'risk_seeker',
        strength: attrs.risk,
        description: '위험을 감수하는 성향',
      });
    } else if (attrs.risk < 35) {
      patterns.push({
        type: 'risk_averse',
        strength: 100 - attrs.risk,
        description: '안전을 선호하는 성향',
      });
    }

    // 반복 패턴
    if (attrs.repeat > 60) {
      patterns.push({
        type: 'repetitive',
        strength: attrs.repeat,
        description: '동일한 선택을 반복하는 패턴',
      });
    }

    // 일관성 패턴
    if (attrs.consistency > 70) {
      patterns.push({
        type: 'consistent',
        strength: attrs.consistency,
        description: '일관된 선택 패턴',
      });
    } else if (attrs.consistency < 30) {
      patterns.push({
        type: 'unpredictable',
        strength: 100 - attrs.consistency,
        description: '예측하기 어려운 선택 패턴',
      });
    }

    // 인내심 패턴
    if (attrs.patience > 65) {
      patterns.push({
        type: 'patient',
        strength: attrs.patience,
        description: '인내심이 강한 성향',
      });
    } else if (attrs.patience < 35) {
      patterns.push({
        type: 'impatient',
        strength: 100 - attrs.patience,
        description: '성급한 성향',
      });
    }

    // 망설임 패턴
    if (attrs.hesitation > 50) {
      patterns.push({
        type: 'hesitant',
        strength: attrs.hesitation,
        description: '결정을 망설이는 성향',
      });
    }

    if (attrs.impulsive > 65) {
      patterns.push({
        type: 'impulsive',
        strength: attrs.impulsive,
        description: '빠르게 결론을 내리는 성향',
      });
    }

    if (attrs.selfCorrection > 65) {
      patterns.push({
        type: 'self_correction',
        strength: attrs.selfCorrection,
        description: '선택을 다시 검토하는 성향',
      });
    }

    if (attrs.exploration > 65) {
      patterns.push({
        type: 'exploratory',
        strength: attrs.exploration,
        description: '낯선 가능성을 탐색하는 성향',
      });
    }

    if (attrs.certaintySeeking > 65) {
      patterns.push({
        type: 'certainty_seeking',
        strength: attrs.certaintySeeking,
        description: '확실한 근거를 선호하는 성향',
      });
    }

    if (attrs.pressureResistance < 35) {
      patterns.push({
        type: 'pressure_sensitive',
        strength: 100 - attrs.pressureResistance,
        description: '압박 상황에서 흔들리는 성향',
      });
    }

    return patterns;
  }

  /**
   * 학습 상태에 따른 AI 대사 결정
   * Learning Progress에 따라 다른 레벨의 대사를 반환합니다.
   * @returns {Object} AI 대사 정보
   */
  getAIStatement() {
    const progress = this.playerModel.learningProgress;
    const confidence = this.playerModel.confidence;
    const patterns = this.analyzePatterns();

    if (progress < 0.2) {
      return {
        level: 'beginner',
        message: '아직 당신을 잘 모르겠습니다.',
        confidence: 'low',
      };
    } else if (progress < 0.5) {
      return {
        level: 'learning',
        message: '조금씩 이해하기 시작했습니다.',
        confidence: 'low',
      };
    } else if (progress < 0.8) {
      if (patterns.length > 0) {
        return {
          level: 'developing',
          message: '패턴이 보입니다.',
          confidence: 'medium',
          pattern: patterns[0].description,
        };
      }
      return {
        level: 'developing',
        message: '당신의 모습을 분석하고 있습니다.',
        confidence: 'medium',
      };
    } else {
      return {
        level: 'completed',
        message: '이제 당신을 분석할 수 있습니다.',
        confidence: 'high',
        patterns,
      };
    }
  }

  /**
   * 엔진 리셋
   */
  reset() {
    this.playerModel.reset();
    this.featureExtractor.reset();
    this.learningHistory = [];
    this.ruleHistory = [];
    this.isActive = false;
  }

  /**
   * 엔진 활성화
   */
  activate() {
    this.isActive = true;
  }

  /**
   * 엔진 비활성화
   */
  deactivate() {
    this.isActive = false;
  }
}
