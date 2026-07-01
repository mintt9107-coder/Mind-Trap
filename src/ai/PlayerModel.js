/**
 * MindTrap - Player Model
 * 플레이어의 행동 패턴을 저장하고 관리하는 모델입니다.
 * 모든 값은 JavaScript에서 계산되며, Gemini는 이 값을 수정하지 않습니다.
 */

/**
 * PlayerModel 클래스
 * 플레이어의 심리적 특성을 수치화하여 저장합니다.
 */
export class PlayerModel {
  constructor() {
    this.reset();
  }

  /**
   * 모델 초기화
   */
  reset() {
    /** @type {Object} 플레이어 특성 값들 */
    this.attributes = {
      // 공격적 성향 (0-100)
      risk: 50,
      // 반복 패턴 강도 (0-100)
      repeat: 0,
      // 적응력 (0-100)
      adaptation: 50,
      // 망설임 정도 (0-100)
      hesitation: 0,
      // 반응 속도 점수 (0-100)
      reaction: 50,
      // AI 신뢰도 (0-100)
      trustAI: 50,
      // 인내심 (0-100)
      patience: 50,
      // 일관성 (0-100)
      consistency: 50,
      // 충동성 (0-100)
      impulsive: 50,
      // 압박 저항력 (0-100)
      pressureResistance: 50,
      // 재검토 성향 (0-100)
      selfCorrection: 50,
      // 탐색 성향 (0-100)
      exploration: 50,
      // 확실성 추구 (0-100)
      certaintySeeking: 50,
    };

    /** @type {number} 예측 정확도 (0-1) */
    this.predictionAccuracy = 0.5;

    /** @type {string[]} 알려진 패턴들 */
    this.knownPatterns = [];

    /** @type {number} 학습 진행률 (0-1) */
    this.learningProgress = 0;

    /** @type {number} AI의 자신감 (0-1) */
    this.confidence = 0;

    /** @type {number} 총 분석된 라운드 수 */
    this.analyzedRounds = 0;

    /** @type {Array} 최근 선택 기록 */
    this.recentChoices = [];

    /** @type {Object} 선택 빈도 통계 */
    this.choiceFrequency = {};

    /** @type {Object} 분석 근거 데이터 */
    this.evidenceStats = {
      questionTypeCounts: {},
      intentCounts: {},
      phaseCounts: { early: 0, mid: 0, late: 0 },
      speedShiftCounts: { faster: 0, stable: 0, slower: 0, timeout: 0 },
      twoStageCount: 0,
      twoStageChangedCount: 0,
      changedChoiceCount: 0,
      timeoutCount: 0,
      hoverSwitchTotal: 0,
      pressureResponseTotal: 0,
      secondThoughtTotal: 0,
      concealmentSignalTotal: 0,
      choiceDiversityTotal: 0,
      evidenceRounds: 0,
    };
  }

  /**
   * 특성值 업데이트
   * @param {string} attribute - 특성 이름
   * @param {number} delta - 변경량
   */
  updateAttribute(attribute, delta) {
    if (!(attribute in this.attributes)) {
      console.warn(`Unknown attribute: ${attribute}`);
      return;
    }

    this.attributes[attribute] = Math.max(0, Math.min(100, 
      this.attributes[attribute] + delta
    ));
  }

  /**
   * 여러 특성 동시에 업데이트
   * @param {Object} updates - { attribute: delta } 형태의 객체
   */
  updateAttributes(updates) {
    Object.entries(updates).forEach(([attr, delta]) => {
      this.updateAttribute(attr, delta);
    });
  }

  /**
   * 예측 정확도 업데이트
   * @param {boolean} wasCorrect - 예측이 맞았는지
   * @param {number} learningRate - 학습률 (0-1)
   */
  updatePredictionAccuracy(wasCorrect, learningRate = 0.1) {
    const target = wasCorrect ? 1 : 0;
    this.predictionAccuracy += learningRate * (target - this.predictionAccuracy);
    this.predictionAccuracy = Math.max(0, Math.min(1, this.predictionAccuracy));
  }

  /**
   * 학습 진행률 업데이트
   * @param {number} round - 현재 라운드
   * @param {number} totalRounds - 총 라운드 수
   */
  updateLearningProgress(round, totalRounds) {
    this.learningProgress = Math.min(1, round / totalRounds);
    this.analyzedRounds = round;
  }

  /**
   * 선택 기록 추가
   * @param {string} choice - 선택한 답변
   * @param {Object} metadata - 추가 정보
   */
  recordChoice(choice, metadata = {}) {
    this.recentChoices.push({
      choice,
      timestamp: Date.now(),
      ...metadata,
    });

    // 전체 20라운드 흐름을 결과 신뢰도 계산에 활용합니다.
    if (this.recentChoices.length > 20) {
      this.recentChoices.shift();
    }

    // 빈도 업데이트
    this.choiceFrequency[choice] = (this.choiceFrequency[choice] || 0) + 1;
    this._recordEvidence(metadata);
  }

  _recordEvidence(metadata = {}) {
    this.evidenceStats.evidenceRounds += 1;

    const questionType = metadata.questionType || 'unknown';
    const intentTag = metadata.intentTag || 'unknown';
    const phase = metadata.roundPhase || 'mid';
    const speedShift = metadata.speedShift || 'stable';

    this.evidenceStats.questionTypeCounts[questionType] =
      (this.evidenceStats.questionTypeCounts[questionType] || 0) + 1;
    this.evidenceStats.intentCounts[intentTag] =
      (this.evidenceStats.intentCounts[intentTag] || 0) + 1;
    this.evidenceStats.phaseCounts[phase] =
      (this.evidenceStats.phaseCounts[phase] || 0) + 1;
    this.evidenceStats.speedShiftCounts[speedShift] =
      (this.evidenceStats.speedShiftCounts[speedShift] || 0) + 1;

    this.evidenceStats.twoStageCount += metadata.twoStage ? 1 : 0;
    this.evidenceStats.twoStageChangedCount += metadata.twoStage && metadata.changedChoice ? 1 : 0;
    this.evidenceStats.changedChoiceCount += metadata.changedChoice ? 1 : 0;
    this.evidenceStats.timeoutCount += metadata.timeOut ? 1 : 0;
    this.evidenceStats.hoverSwitchTotal += metadata.hoverSwitchCount || 0;
    this.evidenceStats.pressureResponseTotal += metadata.pressureResponse || 0;
    this.evidenceStats.secondThoughtTotal += metadata.secondThoughtSignal || 0;
    this.evidenceStats.concealmentSignalTotal += metadata.concealmentSignal || 0;
    this.evidenceStats.choiceDiversityTotal += metadata.recentChoiceDiversity || 0;
  }

  /**
   * 패턴 발견 시 추가
   * @param {string} pattern - 패턴 설명
   */
  addKnownPattern(pattern) {
    if (!this.knownPatterns.includes(pattern)) {
      this.knownPatterns.push(pattern);
    }
  }

  /**
   * 자신감 업데이트
   * @param {number} newConfidence - 새 자신감 값 (0-1)
   */
  updateConfidence(newConfidence) {
    this.confidence = Math.max(0, Math.min(1, newConfidence));
  }

  /**
   * 모델 스냅샷 반환 (분석용)
   * @returns {Object} 현재 모델 상태
   */
  getSnapshot() {
    return {
      attributes: { ...this.attributes },
      predictionAccuracy: this.predictionAccuracy,
      knownPatterns: [...this.knownPatterns],
      learningProgress: this.learningProgress,
      confidence: this.confidence,
      analyzedRounds: this.analyzedRounds,
      recentChoices: [...this.recentChoices],
      choiceFrequency: { ...this.choiceFrequency },
      evidenceStats: {
        ...this.evidenceStats,
        questionTypeCounts: { ...this.evidenceStats.questionTypeCounts },
        intentCounts: { ...this.evidenceStats.intentCounts },
        phaseCounts: { ...this.evidenceStats.phaseCounts },
        speedShiftCounts: { ...this.evidenceStats.speedShiftCounts },
      },
      playerType: this.getPlayerType(),
    };
  }

  /**
   * 플레이어 타입 분류
   * @returns {string} 플레이어 타입
   */
  getPlayerType() {
    const { risk, patience, consistency, hesitation, impulsive, selfCorrection, exploration, pressureResistance } = this.attributes;

    if (selfCorrection > 70 && hesitation > 45) return 'self_editor';
    if (exploration > 70 && consistency < 55) return 'explorer';
    if (pressureResistance < 35 && hesitation > 55) return 'pressure_sensitive';
    if (impulsive > 70 && patience < 45) return 'impulsive';
    if (risk > 70 && consistency < 40) return 'unpredictable';
    if (risk > 70 && hesitation < 30) return 'aggressive';
    if (patience > 70 && risk < 40) return 'cautious';
    if (consistency > 70) return 'predictable';
    if (hesitation > 60) return 'hesitant';
    
    return 'balanced';
  }

  /**
   * 특정 특성 값 조회
   * @param {string} attribute - 특성 이름
   * @returns {number} 특성 값
   */
  getAttribute(attribute) {
    return this.attributes[attribute] ?? 50;
  }
}
