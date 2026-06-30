/**
 * MindTrap - Behavior Analyzer
 * 플레이어의 행동 데이터를 깊이 분석하여 심리적 인사이트를 도출합니다.
 * 반응 시간 패턴, 선택 일관성, 망설임, 적응력 등을 종합적으로 분석하여
 * 심리전에 활용할 수 있는 구체적이고 근거 있는 분석을 제공합니다.
 */

/**
 * BehaviorAnalyzer 클래스
 * 플레이어 행동 패턴을 심리학적 관점에서 분석합니다.
 */
export class BehaviorAnalyzer {
  /**
   * 전체 행동 분석 수행
   * @param {Object} playerSnapshot - 플레이어 모델 스냅샷
   * @param {Object} roundData - 현재 라운드 데이터 (선택적)
   * @param {Object} learningJournal - 학습 저널 (선택적)
   * @returns {Object} 분석 결과
   */
  analyze(playerSnapshot, roundData = null, learningJournal = null) {
    const attrs = playerSnapshot.attributes;
    const recentChoices = playerSnapshot.recentChoices || [];
    const choiceFrequency = playerSnapshot.choiceFrequency || {};
    const analyzedRounds = playerSnapshot.analyzedRounds || 0;

    return {
      reactionPattern: this._analyzeReactionPattern(recentChoices, attrs),
      choicePattern: this._analyzeChoicePattern(recentChoices, choiceFrequency, attrs),
      psychologicalState: this._analyzePsychologicalState(attrs, analyzedRounds),
      consistencyAnalysis: this._analyzeConsistency(attrs, recentChoices),
      riskProfile: this._analyzeRiskProfile(attrs, recentChoices),
      adaptationAnalysis: this._analyzeAdaptation(attrs, recentChoices),
      hesitationAnalysis: this._analyzeHesitation(attrs, recentChoices),
      intentPattern: this._analyzeIntentPattern(recentChoices, choiceFrequency, attrs),
      currentBehavior: roundData ? this._analyzeCurrentBehavior(roundData, attrs) : null,
      evidenceList: this._collectEvidence(attrs, recentChoices, choiceFrequency, analyzedRounds),
      psychologicalPressure: this._generatePsychologicalPressure(attrs, analyzedRounds, recentChoices),
      vulnerabilities: this._identifyVulnerabilities(attrs, recentChoices),
      predictionConfidence: this._assessPredictionConfidence(attrs, analyzedRounds),
    };
  }

  /**
   * 반응 시간 패턴 분석
   * @param {Array} recentChoices - 최근 선택 기록
   * @param {Object} attrs - 플레이어 특성
   * @returns {Object} 반응 패턴 분석
   * @private
   */
  _analyzeReactionPattern(recentChoices, attrs) {
    if (recentChoices.length === 0) {
      return {
        trend: 'no_data',
        avgTime: 0,
        description: '아직 반응 데이터가 부족합니다.',
        insight: '초기 선택은 습관을 반영합니다.',
      };
    }

    const reactionTimes = recentChoices
      .filter((c) => !c.timeOut)
      .map((c) => c.reactionTime || 0)
      .filter((t) => t > 0);
    if (reactionTimes.length === 0) {
      return {
        trend: 'no_data',
        avgTime: 0,
        description: '반응 시간 데이터가 없습니다.',
        insight: '',
      };
    }

    const avgTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    const latestTime = reactionTimes[reactionTimes.length - 1];
    const earlierAvg = reactionTimes.length > 1
      ? reactionTimes.slice(0, -1).reduce((a, b) => a + b, 0) / (reactionTimes.length - 1)
      : avgTime;

    // 트렌드 분석
    let trend;
    const trendDelta = latestTime - earlierAvg;
    if (trendDelta > 800) trend = 'slowing_down';
    else if (trendDelta < -800) trend = 'speeding_up';
    else trend = 'stable';

    // 속도 카테고리
    let speedCategory;
    if (avgTime < 1500) speedCategory = 'fast';
    else if (avgTime < 3000) speedCategory = 'normal';
    else speedCategory = 'slow';

    // 심리적 인사이트
    let insight = '';
    let description = '';

    if (speedCategory === 'fast') {
      description = `평균 반응 시간 ${Math.round(avgTime)}ms - 매우 빠른 결정`;
      insight = '생각하기 전에 행동하는 타입입니다. 직관이 지배적이며, 망설임이 거의 없습니다. 이는 확신일 수도 있지만, 무심함의 표현일 수도 있습니다.';
    } else if (speedCategory === 'slow') {
      description = `평균 반응 시간 ${Math.round(avgTime)}ms - 신중한 결정`;
      insight = '모든 선택에 내적 갈등이 있습니다. 머릿속에서 여러 가능성을 저울질하고 있으며, 이는 불안이나 완벽주의 성향의 징후입니다.';
    } else {
      description = `평균 반응 시간 ${Math.round(avgTime)}ms - 보통 수준의 결정 속도`;
      insight = '생각과 행동 사이의 균형을 유지합니다. 때로는 직관적으로, 때로는 신중하게 결정합니다.';
    }

    // 트렌드 인사이트
    if (trend === 'slowing_down') {
      insight += ' 최근 결정이 느려지고 있습니다. AI의 분석이 영향을 미치고 있을 가능성이 있습니다. 압박이 작용하고 있군요.';
    } else if (trend === 'speeding_up') {
      insight += ' 결정이 빨라지고 있습니다. AI의 예측을 의식하여 본능에 따르려는 저항일 수 있습니다.';
    }

    return { trend, avgTime, speedCategory, description, insight, latestTime, earlierAvg };
  }

  /**
   * 선택 패턴 분석
   * @param {Array} recentChoices - 최근 선택 기록
   * @param {Object} choiceFrequency - 선택 빈도
   * @param {Object} attrs - 플레이어 특성
   * @returns {Object} 선택 패턴 분석
   * @private
   */
  _analyzeChoicePattern(recentChoices, choiceFrequency, attrs) {
    const directionalChoices = recentChoices.filter((choice) => (
      !choice.timeOut && (choice.choice === 'primary' || choice.choice === 'secondary')
    ));
    const primaryCount = directionalChoices.filter((choice) => choice.choice === 'primary').length
      || choiceFrequency['primary']
      || 0;
    const secondaryCount = directionalChoices.filter((choice) => choice.choice === 'secondary').length
      || choiceFrequency['secondary']
      || 0;
    const total = primaryCount + secondaryCount;

    if (total === 0) {
      return {
        dominantChoice: null,
        balance: 0.5,
        description: '아직 선택 데이터가 없습니다.',
        insight: '',
      };
    }

    const primaryRatio = primaryCount / total;
    const dominantChoice = primaryRatio > 0.5 ? 'primary' : 'secondary';
    const dominantRatio = dominantChoice === 'primary' ? primaryRatio : 1 - primaryRatio;
    const dominantLabel = dominantChoice === 'primary' ? '첫 번째 선택지' : '두 번째 선택지';
    const balance = Math.abs(primaryRatio - 0.5) * 2; // 0~1, 1일수록 편향됨

    // 연속 선택 분석
    let currentStreak = 1;
    let maxStreak = 1;
    for (let i = 1; i < directionalChoices.length; i++) {
      if (directionalChoices[i].choice === directionalChoices[i - 1].choice) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    // 교대 패턴 감지
    let alternationCount = 0;
    for (let i = 1; i < directionalChoices.length; i++) {
      if (directionalChoices[i].choice !== directionalChoices[i - 1].choice) {
        alternationCount++;
      }
    }
    const alternationRate = directionalChoices.length > 1
      ? alternationCount / (directionalChoices.length - 1)
      : 0;

    let description = '';
    let insight = '';

    if (balance > 0.6) {
      description = `${dominantLabel}에 강한 편향 (${Math.round(dominantRatio * 100)}%)`;
      insight = `압도적으로 한쪽을 선택하고 있습니다. 이는 확고한 가치관일 수도 있지만, AI가 예측하기 가장 쉬운 패턴이기도 합니다. 자유 의지가 의심됩니다.`;
    } else if (balance > 0.3) {
      description = `${dominantLabel}에 약간 편향 (${Math.round(dominantRatio * 100)}%)`;
      insight = '선호가 있지만 상황에 따라 유연하게 대응합니다. 하지만 이 선호 자체가 패턴이 됩니다.';
    } else {
      description = `균형 잡힌 선택 (첫 번째 ${Math.round(primaryRatio * 100)}% / 두 번째 ${Math.round((1 - primaryRatio) * 100)}%)`;
      insight = '양쪽을 균등하게 선택합니다. 이것이 진정한 균형인지, AI를 의식한 무작위 선택인지는 반응 시간이 말해줍니다.';
    }

    // 연속 패턴 인사이트
    if (maxStreak >= 4) {
      insight += ` ${maxStreak}회 연속 같은 선택을 했습니다. 습관이 굳어가고 있습니다.`;
    }

    // 교대 패턴 인사이트
    if (alternationRate > 0.7 && directionalChoices.length > 4) {
      insight += ' 의도적으로 선택을 번갈아 하고 있습니다. AI를 속이려는 시도가 보입니다. 하지만 그것도 패턴입니다.';
    }

    return {
      dominantChoice,
      primaryRatio,
      balance,
      maxStreak,
      alternationRate,
      description,
      insight,
    };
  }

  _analyzeIntentPattern(recentChoices, _choiceFrequency, attrs) {
    const directionalChoices = recentChoices.filter((choice) => (
      !choice.timeOut && (choice.choice === 'primary' || choice.choice === 'secondary')
    ));
    const totalChoices = directionalChoices.length;
    const recentClicked = recentChoices.filter((choice) => !choice.timeOut && choice.reactionTime > 0);
    const fastClicked = recentClicked.filter((choice) => choice.reactionTime < 1200);
    const veryFastClicked = recentClicked.filter((choice) => choice.reactionTime < 900);
    const fastRate = recentClicked.length ? fastClicked.length / recentClicked.length : 0;
    const veryFastRate = recentClicked.length ? veryFastClicked.length / recentClicked.length : 0;
    const latest = recentChoices[recentChoices.length - 1] || null;

    let alternationCount = 0;
    for (let i = 1; i < recentClicked.length; i++) {
      if (recentClicked[i].choice !== recentClicked[i - 1].choice) {
        alternationCount++;
      }
    }
    const alternationRate = recentClicked.length > 1
      ? alternationCount / (recentClicked.length - 1)
      : 0;

    let maxStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < directionalChoices.length; i++) {
      if (directionalChoices[i].choice === directionalChoices[i - 1].choice) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    const directionalFrequency = directionalChoices.reduce((counts, choice) => {
      counts[choice.choice] = (counts[choice.choice] || 0) + 1;
      return counts;
    }, {});
    const dominantEntry = Object.entries(directionalFrequency)
      .sort((a, b) => b[1] - a[1])[0];
    const dominantChoice = dominantEntry?.[0] || null;
    const dominantRatio = totalChoices > 0 && dominantEntry
      ? dominantEntry[1] / totalChoices
      : 0;

    const typeGroups = recentClicked.reduce((groups, choice) => {
      const key = choice.questionType || 'unknown';
      groups[key] = groups[key] || new Set();
      groups[key].add(choice.choice);
      return groups;
    }, {});
    const variedSameType = Object.values(typeGroups).some((set) => set.size >= 3)
      || (alternationRate >= 0.75 && recentClicked.length >= 5);

    let type = 'natural';
    let score = 45;
    let label = '자연스러운 탐색';
    let description = '선택을 바꾸긴 했지만, 강한 회피 의도보다는 상황에 따라 판단 기준을 조정한 흐름에 가깝습니다.';

    if (totalChoices >= 6 && dominantRatio >= 0.8 && maxStreak >= 4) {
      type = 'button_bias';
      score = Math.min(95, Math.round(dominantRatio * 100));
      label = '한쪽 버튼 고착';
      description = `같은 쪽 선택이 ${Math.round(dominantRatio * 100)}%로 높습니다. 의식하지 못한 습관일 수도 있고, 빠르게 넘기기 위해 한쪽 버튼을 고정한 전략일 수도 있습니다. 어느 쪽이든 AI가 읽기 쉬운 흔적입니다.`;
    } else if (recentClicked.length >= 5 && fastRate >= 0.7 && (variedSameType || alternationRate >= 0.65)) {
      type = 'random_masking';
      score = Math.min(95, Math.round(70 + fastRate * 20 + alternationRate * 10));
      label = '무작위 위장 시도';
      description = '빠른 속도로 선택을 섞었습니다. 겉보기에는 랜덤처럼 보이지만, 분석을 흐리려는 의도가 선택 속도와 변동성에 함께 남았습니다.';
    } else if (recentClicked.length >= 4 && veryFastRate >= 0.65) {
      type = 'speed_masking';
      score = Math.min(90, Math.round(65 + veryFastRate * 25));
      label = '속도 기반 회피';
      description = '지나치게 빠른 선택이 반복되었습니다. 직관적 판단일 수도 있지만, AI가 분석할 시간을 주지 않으려는 회피 전략으로도 해석됩니다.';
    } else if (directionalChoices.length >= 5 && maxStreak >= 4) {
      type = 'streak';
      score = Math.min(88, 55 + maxStreak * 8);
      label = '반복 고정';
      description = `${maxStreak}회 연속 같은 방향을 택했습니다. 안정적인 기준일 수도 있지만, 피로하거나 선택을 단순화하려는 의도가 섞였을 수 있습니다.`;
    } else if (attrs.adaptation > 65 && alternationRate >= 0.55) {
      type = 'strategic_shift';
      score = Math.min(82, Math.round(attrs.adaptation * 0.7 + alternationRate * 30));
      label = '전략적 흔들기';
      description = '선택을 바꾸며 AI의 예측을 흔들려는 움직임이 보입니다. 다만 바꾸는 타이밍 자체가 새로운 패턴이 됩니다.';
    }

    return {
      type,
      score,
      label,
      description,
      fastRate,
      veryFastRate,
      alternationRate,
      maxStreak,
      dominantChoice,
      dominantRatio,
      latestChoice: latest,
    };
  }

  /**
   * 심리적 상태 분석
   * @param {Object} attrs - 플레이어 특성
   * @param {number} analyzedRounds - 분석된 라운드 수
   * @returns {Object} 심리 상태 분석
   * @private
   */
  _analyzePsychologicalState(attrs, analyzedRounds) {
    const states = [];

    // 불안/긴장 감지
    if (attrs.hesitation > 50) {
      states.push({
        state: 'anxiety',
        level: attrs.hesitation > 70 ? 'high' : 'medium',
        evidence: `망설임 수치 ${attrs.hesitation}%`,
        description: '결정 과정에서 내적 갈등이 감지됩니다. 불안이나 갈등이 선택에 영향을 미치고 있습니다.',
      });
    }

    // 자신감/확신
    if (attrs.hesitation < 25 && attrs.reaction > 60) {
      states.push({
        state: 'confidence',
        level: 'high',
        evidence: `망설임 ${attrs.hesitation}%, 반응 속도 ${attrs.reaction}%`,
        description: '빠르고 망설임 없는 선택은 높은 확신을 나타냅니다. 하지만 이는 곧 예측 가능성을 의미합니다.',
      });
    }

    // 저항/반항
    if (attrs.adaptation > 60 && attrs.trustAI < 40) {
      states.push({
        state: 'resistance',
        level: 'medium',
        evidence: `적응력 ${attrs.adaptation}%, AI 신뢰도 ${attrs.trustAI}%`,
        description: 'AI의 예측에 대응하여 전략을 바꾸고 있지만, AI를 신뢰하지 않습니다. 의식적인 저항 패턴입니다.',
      });
    }

    // 순응
    if (attrs.trustAI > 60) {
      states.push({
        state: 'compliance',
        level: attrs.trustAI > 75 ? 'high' : 'medium',
        evidence: `AI 신뢰도 ${attrs.trustAI}%`,
        description: 'AI의 분석을 수용하고 있습니다. 이는 개방성일 수도 있지만, 의존성의 시작이기도 합니다.',
      });
    }

    // 피로
    if (analyzedRounds > 12 && attrs.hesitation > 40) {
      states.push({
        state: 'fatigue',
        level: 'medium',
        evidence: `라운드 ${analyzedRounds} + 망설임 ${attrs.hesitation}%`,
        description: '게임이 진행될수록 결정이 흐려지고 있습니다. 피로가 판단력에 영향을 미치기 시작했습니다.',
      });
    }

    // 지배적 상태 결정
    const dominantState = states.length > 0 ? states[0] : null;

    return { states, dominantState };
  }

  /**
   * 일관성 분석
   * @param {Object} attrs - 플레이어 특성
   * @param {Array} recentChoices - 최근 선택 기록
   * @returns {Object} 일관성 분석
   * @private
   */
  _analyzeConsistency(attrs, recentChoices) {
    const consistency = attrs.consistency;
    let level, description, insight;

    if (consistency > 75) {
      level = 'very_high';
      description = `일관성 ${consistency}% - 매우 높음`;
      insight = '거의 변하지 않는 선택 패턴입니다. AI가 예측하기 가장 쉬운 상태입니다. 자유 의지를 증명하고 싶다면 패턴을 깨야 합니다.';
    } else if (consistency > 60) {
      level = 'high';
      description = `일관성 ${consistency}% - 높음`;
      insight = '안정적인 선택 경향이 있습니다. 이는 신뢰할 수 있는 성격이지만, 동시에 예측 가능하다는 의미이기도 합니다.';
    } else if (consistency > 35) {
      level = 'medium';
      description = `일관성 ${consistency}% - 보통`;
      insight = '상황에 따라 유연하게 대응합니다. 때로는 일관되고 때로는 예측을 벗어납니다.';
    } else if (consistency > 20) {
      level = 'low';
      description = `일관성 ${consistency}% - 낮음`;
      insight = '선택이 불규칙합니다. 의도적으로 패턴을 깨고 있는지, 아니면 진짜로 결정 장애가 있는지 분석이 필요합니다.';
    } else {
      level = 'very_low';
      description = `일관성 ${consistency}% - 매우 낮음`;
      insight = '완전히 예측 불가능한 패턴입니다. AI를 속이는 데 집중하고 있군요. 하지만 그 노력 자체가 또 다른 패턴이 됩니다.';
    }

    return { level, consistency, description, insight };
  }

  /**
   * 위험 성향 프로파일 분석
   * @param {Object} attrs - 플레이어 특성
   * @param {Array} recentChoices - 최근 선택 기록
   * @returns {Object} 위험 프로파일
   * @private
   */
  _analyzeRiskProfile(attrs, recentChoices) {
    const risk = attrs.risk;
    let level, description, insight;

    if (risk > 75) {
      level = 'extreme';
      description = `위험 성향 ${risk}% - 극단적 위험 선호`;
      insight = '불확실성 속에서도 과감하게 행동합니다. 도박적 성향이 강하며, 손실을 두려워하지 않습니다. 하지만 이는 충동성의 다른 이름이기도 합니다.';
    } else if (risk > 60) {
      level = 'high';
      description = `위험 성향 ${risk}% - 위험 선호`;
      insight = '위험을 감수하는 편입니다. 기회를 놓치지 않으려는 성향이 강하지만, 때로는 신중함이 부족할 수 있습니다.';
    } else if (risk > 40) {
      level = 'medium';
      description = `위험 성향 ${risk}% - 중도적`;
      insight = '위험과 안전 사이에서 균형을 찾습니다. 상황에 따라 유연하게 대응하는 성숙한 태도입니다.';
    } else if (risk > 25) {
      level = 'low';
      description = `위험 성향 ${risk}% - 안전 선호`;
      insight = '확실한 것을 선호합니다. 신중한 성격이지만, 기회를 놓칠 수 있다는 두려움이 작용하고 있을 수 있습니다.';
    } else {
      level = 'very_low';
      description = `위험 성향 ${risk}% - 극단적 안전 선호`;
      insight = '위험을 철저히 회피합니다. 이는 보호 본능일 수도 있지만, 불안이 의사결정을 지배하고 있다는 신호이기도 합니다.';
    }

    return { level, risk, description, insight };
  }

  /**
   * 적응력 분석
   * @param {Object} attrs - 플레이어 특성
   * @param {Array} recentChoices - 최근 선택 기록
   * @returns {Object} 적응력 분석
   * @private
   */
  _analyzeAdaptation(attrs, recentChoices) {
    const adaptation = attrs.adaptation;
    let level, description, insight;

    if (adaptation > 70) {
      level = 'high';
      description = `적응력 ${adaptation}% - 높음`;
      insight = 'AI의 예측에 대응하여 전략을 바꾸는 능력이 뛰어납니다. 하지만 계속 바꾸는 것 자체가 또 다른 패턴이 됩니다. AI는 그것도 읽어냅니다.';
    } else if (adaptation > 50) {
      level = 'medium';
      description = `적응력 ${adaptation}% - 보통`;
      insight = '때로는 AI에 대응하고 때로는 자신의 패턴을 유지합니다. 의식적인 전략과 본능 사이에서 줄다리기를 하고 있습니다.';
    } else {
      level = 'low';
      description = `적응력 ${adaptation}% - 낮음`;
      insight = 'AI의 예측에 관계없이 자신의 패턴을 유지합니다. 이는 일관성일 수도 있지만, 환경 변화에 둔감하다는 의미일 수도 있습니다.';
    }

    return { level, adaptation, description, insight };
  }

  /**
   * 망설임 분석
   * @param {Object} attrs - 플레이어 특성
   * @param {Array} recentChoices - 최근 선택 기록
   * @returns {Object} 망설임 분석
   * @private
   */
  _analyzeHesitation(attrs, recentChoices) {
    const hesitation = attrs.hesitation;
    let level, description, insight;

    if (hesitation > 70) {
      level = 'severe';
      description = `망설임 ${hesitation}% - 심각`;
      insight = '거의 모든 결정에서 갈등하고 있습니다. 무언가 두려운 것이 있거나, 완벽한 선택을 하려는 강박이 있습니다. 결정하지 못하는 것도 하나의 선택입니다.';
    } else if (hesitation > 50) {
      level = 'high';
      description = `망설임 ${hesitation}% - 높음`;
      insight = '선택 전 망설임이 뚜렷합니다. 내적 갈등이 의사결정에 영향을 미치고 있으며, 이는 불안이나 불확실성에 대한 반응입니다.';
    } else if (hesitation > 25) {
      level = 'medium';
      description = `망설임 ${hesitation}% - 보통`;
      insight = '때로는 망설이고 때로는 단호합니다. 어떤 상황에서 갈등하는지가 당신을 드러냅니다.';
    } else {
      level = 'low';
      description = `망설임 ${hesitation}% - 낮음`;
      insight = '결정이 빠르고 단호합니다. 확신인지, 무심함인지, 아니면 회피인지가 관건입니다.';
    }

    return { level, hesitation, description, insight };
  }

  /**
   * 현재 행동 분석 (이번 라운드)
   * @param {Object} roundData - 라운드 데이터
   * @param {Object} attrs - 플레이어 특성
   * @returns {Object} 현재 행동 분석
   * @private
   */
  _analyzeCurrentBehavior(roundData, attrs) {
    const { reactionTime, changedChoice, timeOut, choice } = roundData;
    const analysis = {
      reactionTime,
      changedChoice,
      timeOut,
      choice,
      insights: [],
    };

    // 시간 초과 분석
    if (timeOut) {
      analysis.insights.push({
        type: 'timeout',
        severity: 'high',
        description: '시간 초과로 인한 강제 선택',
        psychological: '결정을 내리지 못했습니다. 이는 회피이거나, 완벽한 선택에 대한 강박입니다. 선택하지 않는 것 자체가 데이터입니다.',
      });
    }

    // 반응 시간 분석
    if (reactionTime < 1000 && !timeOut) {
      analysis.insights.push({
        type: 'fast_reaction',
        severity: 'medium',
        description: `${reactionTime}ms - 매우 빠른 반응`,
        psychological: '생각할 시간도 없이 행동했습니다. 직관이 작동했거나, 이미 마음이 정해져 있었습니다. 무의식이 드러나는 순간입니다.',
      });
    } else if (reactionTime > 3500 && !timeOut) {
      analysis.insights.push({
        type: 'slow_reaction',
        severity: 'medium',
        description: `${reactionTime}ms - 느린 반응`,
        psychological: '오래 고민했습니다. 무엇이 당신을 망설이게 했나요? 갈등이 있는 선택은 가장 많은 것을 드러냅니다.',
      });
    }

    // 선택 변경 분석
    if (changedChoice) {
      analysis.insights.push({
        type: 'choice_change',
        severity: 'high',
        description: '선택을 변경했습니다',
        psychological: '마음을 바꿨습니다. 첫 번째 선택이 진짜 본심이었을 가능성이 높습니다. 두 번째 선택은 이성이 개입한 결과입니다.',
      });
    }

    return analysis;
  }

  /**
   * 증거 수집 (리포트용)
   * @param {Object} attrs - 플레이어 특성
   * @param {Array} recentChoices - 최근 선택 기록
   * @param {Object} choiceFrequency - 선택 빈도
   * @param {number} analyzedRounds - 분석된 라운드 수
   * @returns {Array} 증거 목록
   * @private
   */
  _collectEvidence(attrs, recentChoices, choiceFrequency, analyzedRounds) {
    const evidence = [];

    // 반응 시간 증거
    const reactionTimes = recentChoices.map((c) => c.reactionTime).filter((t) => t > 0);
    if (reactionTimes.length > 0) {
      const avg = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
      const min = Math.min(...reactionTimes);
      const max = Math.max(...reactionTimes);
      evidence.push({
        category: 'reaction_time',
        title: '반응 시간 패턴',
        data: `평균 ${Math.round(avg)}ms (최소 ${min}ms, 최대 ${max}ms)`,
        significance: avg < 1500 ? '충동적 결정' : avg > 3500 ? '과도한 고민' : '균형적 결정',
      });
    }

    // 선택 빈도 증거
    const primaryCount = choiceFrequency['primary'] || 0;
    const secondaryCount = choiceFrequency['secondary'] || 0;
    const total = primaryCount + secondaryCount;
    if (total > 0) {
      const primaryPercent = Math.round((primaryCount / total) * 100);
      evidence.push({
        category: 'choice_distribution',
        title: '선택 분포',
        data: `첫 번째 선택지 ${primaryCount}회 (${primaryPercent}%), 두 번째 선택지 ${secondaryCount}회 (${100 - primaryPercent}%)`,
        significance: Math.abs(primaryPercent - 50) > 20 ? '강한 편향' : '균형적 선택',
      });
    }

    // 일관성 증거
    evidence.push({
      category: 'consistency',
      title: '선택 일관성',
      data: `${attrs.consistency}%`,
      significance: attrs.consistency > 70 ? '예측 가능한 패턴' : attrs.consistency < 30 ? '예측 불가 패턴' : '중간 수준',
    });

    // 위험 성향 증거
    evidence.push({
      category: 'risk',
      title: '위험 감수 성향',
      data: `${attrs.risk}%`,
      significance: attrs.risk > 65 ? '위험 선호' : attrs.risk < 35 ? '안전 선호' : '중도적',
    });

    // 망설임 증거
    evidence.push({
      category: 'hesitation',
      title: '망설임 정도',
      data: `${attrs.hesitation}%`,
      significance: attrs.hesitation > 50 ? '내적 갈등' : attrs.hesitation < 25 ? '단호함' : '보통',
    });

    // 적응력 증거
    evidence.push({
      category: 'adaptation',
      title: 'AI 대응 적응력',
      data: `${attrs.adaptation}%`,
      significance: attrs.adaptation > 60 ? '전략적 대응' : attrs.adaptation < 40 ? '고정 패턴' : '부분적 적응',
    });

    // AI 신뢰도 증거
    evidence.push({
      category: 'trust',
      title: 'AI 신뢰도',
      data: `${attrs.trustAI}%`,
      significance: attrs.trustAI > 60 ? 'AI 수용적' : attrs.trustAI < 40 ? 'AI 회의적' : '중립적',
    });

    return evidence;
  }

  /**
   * 심리적 압박 요소 생성
   * @param {Object} attrs - 플레이어 특성
   * @param {number} analyzedRounds - 분석된 라운드 수
   * @param {Array} recentChoices - 최근 선택 기록
   * @returns {Object} 심리적 압박 요소
   * @private
   */
  _generatePsychologicalPressure(attrs, analyzedRounds, recentChoices) {
    const pressures = [];
    const directionalChoices = recentChoices.filter((choice) => (
      !choice.timeOut && (choice.choice === 'primary' || choice.choice === 'secondary')
    ));
    let currentStreak = 1;
    let maxStreak = 1;
    for (let i = 1; i < directionalChoices.length; i++) {
      if (directionalChoices[i].choice === directionalChoices[i - 1].choice) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    // 예측 가능성 압박
    if (attrs.consistency > 65) {
      pressures.push({
        type: 'predictability',
        message: '당신의 패턴이 읽히고 있습니다. 다음 선택도 예측할 수 있습니다.',
        intensity: 'high',
      });
    }

    // 일관성 압박
    if (directionalChoices.length >= 5 && maxStreak >= 4) {
      pressures.push({
        type: 'repetition',
        message: '같은 선택을 반복하고 있습니다. 습관이 당신을 지배하고 있습니다.',
        intensity: 'medium',
      });
    }

    // 망설임 압박
    if (attrs.hesitation > 50) {
      pressures.push({
        type: 'indecision',
        message: '망설임이 늘고 있습니다. 무엇이 당신을 망설이게 합니까?',
        intensity: 'high',
      });
    }

    // 적응력 압박
    if (attrs.adaptation > 60) {
      pressures.push({
        type: 'forced_adaptation',
        message: 'AI에 대응하려는 노력이 보입니다. 하지만 그것도 패턴입니다.',
        intensity: 'medium',
      });
    }

    // 신뢰 압박
    if (attrs.trustAI > 60) {
      pressures.push({
        type: 'trust_exploitation',
        message: 'AI를 신뢰하고 있습니다. 그 신뢰가 당신의 선택에 영향을 주고 있습니다.',
        intensity: 'medium',
      });
    }

    // 후반부 압박
    if (analyzedRounds > 12) {
      pressures.push({
        type: 'endgame_pressure',
        message: '게임이 진행될수록 당신의 본성이 드러나고 있습니다.',
        intensity: 'high',
      });
    }

    return {
      pressures,
      dominantPressure: pressures.length > 0 ? pressures[0] : null,
    };
  }

  /**
   * 심리적 취약점 식별
   * @param {Object} attrs - 플레이어 특성
   * @param {Array} recentChoices - 최근 선택 기록
   * @returns {Array} 취약점 목록
   * @private
   */
  _identifyVulnerabilities(attrs, recentChoices) {
    const vulnerabilities = [];

    // 과도한 일관성
    if (attrs.consistency > 75) {
      vulnerabilities.push({
        type: 'over_consistency',
        description: '너무 일관된 패턴은 예측을 쉽게 만듭니다.',
        exploit: '예측 가능성을 지적하여 자유 의지를 의심하게 만들기',
      });
    }

    // 과도한 망설임
    if (attrs.hesitation > 60) {
      vulnerabilities.push({
        type: 'indecision',
        description: '망설임은 내적 갈등의 표현이며, 압박에 취약합니다.',
        exploit: '시간 압박을 가중하여 갈등 유발',
      });
    }

    // 위험 회피
    if (attrs.risk < 30) {
      vulnerabilities.push({
        type: 'risk_aversion',
        description: '위험 회피는 불안 기반 의사결정을 나타냅니다.',
        exploit: '안전 선택의 반복성을 지적',
      });
    }

    // 충동성
    if (attrs.reaction > 70 && attrs.hesitation < 25) {
      vulnerabilities.push({
        type: 'impulsivity',
        description: '충동적 결정은 후회를 동반하기 쉽습니다.',
        exploit: '선택의 경솔함을 은은하게 지적',
      });
    }

    // AI 과신뢰
    if (attrs.trustAI > 65) {
      vulnerabilities.push({
        type: 'over_trust',
        description: 'AI에 대한 과도한 신뢰는 독립적 판단을 약화시킵니다.',
        exploit: '신뢰를 이용하여 잘못된 방향으로 유도 가능',
      });
    }

    return vulnerabilities;
  }

  /**
   * 예측 신뢰도 평가
   * @param {Object} attrs - 플레이어 특성
   * @param {number} analyzedRounds - 분석된 라운드 수
   * @returns {Object} 예측 신뢰도
   * @private
   */
  _assessPredictionConfidence(attrs, analyzedRounds) {
    let confidenceScore = 0.3; // 기본값

    // 라운드 수에 따른 증가
    confidenceScore += Math.min(0.3, analyzedRounds * 0.02);

    // 일관성이 높으면 신뢰도 증가
    if (attrs.consistency > 60) confidenceScore += 0.15;
    if (attrs.consistency > 75) confidenceScore += 0.1;

    // 반복 패턴이 명확하면 신뢰도 증가
    if (attrs.repeat > 50) confidenceScore += 0.1;

    // 망설임이 낮으면 신뢰도 증가 (습관적 선택)
    if (attrs.hesitation < 30) confidenceScore += 0.05;

    confidenceScore = Math.min(0.95, confidenceScore);

    let level;
    if (confidenceScore < 0.4) level = 'low';
    else if (confidenceScore < 0.7) level = 'medium';
    else level = 'high';

    return {
      score: confidenceScore,
      level,
      description: level === 'high'
        ? '높은 예측 신뢰도 - 패턴이 명확히 읽힘'
        : level === 'medium'
        ? '중간 예측 신뢰도 - 부분적 패턴 감지'
        : '낮은 예측 신뢰도 - 데이터 부족 또는 불규칙 패턴',
    };
  }

  /**
   * 심리전 대사 생성 (행동 분석 기반)
   * @param {Object} analysis - 전체 분석 결과
   * @param {Object} context - 컨텍스트 (라운드, 예측 결과 등)
   * @returns {string} 심리전 대사
   */
  generatePsychologicalDialogue(analysis, context = {}) {
    const { round = 0, wasCorrect = null, roundData = null, currentQuestion = null } = context;
    const pressure = analysis.psychologicalPressure;
    const vulnerabilities = analysis.vulnerabilities;
    const randomClicking = analysis.randomClicking;

    if (!roundData && currentQuestion) {
      return this._generateQuestionLinkedDialogue(currentQuestion, round);
    }

    // 무작위 클릭 감지 시 전용 대사 (최우선)
    if (randomClicking && randomClicking.detected && round > 2) {
      return this._generateRandomClickDialogue(randomClicking, round, wasCorrect);
    }

    // 라운드별 단계
    if (round <= 3) {
      return this._generateEarlyGameDialogue(analysis, roundData);
    } else if (round <= 8) {
      return this._generateMidGameDialogue(analysis, roundData, wasCorrect);
    } else if (round <= 15) {
      return this._generateLateGameDialogue(analysis, roundData, wasCorrect, pressure);
    } else {
      return this._generateEndGameDialogue(analysis, roundData, wasCorrect, pressure, vulnerabilities);
    }
  }

  _generateQuestionLinkedDialogue(question, round) {
    const typeDialogues = {
      risk: [
        '위험 앞에서 망설이면 이미 마음이 기울었다는 뜻입니다.',
        '안전을 고르면 두려움이, 위험을 고르면 충동이 드러납니다.',
      ],
      time: [
        '시간이 줄어들수록 진짜 선택 습관이 드러납니다.',
        '빨리 고르면 충동이고, 오래 끌면 불안일 수 있습니다.',
      ],
      reward: [
        '보상이 커질수록 사람은 스스로의 원칙을 쉽게 바꿉니다.',
        '확실함을 고르는 순간, 놓친 보상이 더 오래 남을지도 모릅니다.',
      ],
      emotion: [
        '저를 믿는 순간에도, 의심하는 순간에도 당신의 불안은 드러납니다.',
        '경계하고 계시군요. 하지만 경계심도 꽤 예측 가능한 반응입니다.',
      ],
      speed: [
        '빠른 선택은 확신처럼 보이지만, 때로는 생각을 피하는 방식입니다.',
        '이번에는 손이 먼저 움직일까요, 머리가 붙잡을까요?',
      ],
      combat: [
        '맞서는 선택은 용기일 수도, 자존심일 수도 있습니다.',
        '물러서는 것이 불리하게 느껴진다면 이미 압박을 받고 있는 겁니다.',
      ],
      direction: [
        '단순한 방향 선택일수록 오히려 본능이 먼저 나옵니다.',
        '무의식은 복잡한 질문보다 단순한 선택에서 더 쉽게 새어 나옵니다.',
      ],
      temptation: [
        '선택지가 많아질수록 사람은 자신이 믿고 싶은 근거를 고릅니다.',
        '랜덤으로 고르는 척해도, 손이 먼저 향하는 기준은 있습니다.',
      ],
    };

    const pool = typeDialogues[question.type] || [
      '숨기려는 순간, 오히려 분석하기 쉬워집니다.',
    ];

    if (round > 12) {
      pool.push('이쯤 되면 예상 밖의 선택도 하나의 패턴입니다.');
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * 무작위 클릭(패턴 숨기기) 감지 대사 생성
   * @param {Object} randomClicking - 무작위 클릭 분석 결과
   * @param {number} round - 현재 라운드
   * @param {boolean|null} wasCorrect - 예측 성공 여부
   * @returns {string} 심리전 대사
   * @private
   */
  _generateRandomClickDialogue(randomClicking, round, wasCorrect) {
    const pools = [];

    // 핵심 대사
    pools.push(
      '패턴을 숨기려는 전략을 사용하고 있습니다. 의도적으로 랜덤하게 누르고 있군요. 하지만 그 시도 자체가 패턴입니다.',
      '당신은 일부러 랜덤하게 누르고 계시네요. 패턴을 숨기려는 거죠. 하지만 무작위를 시도하는 인간의 행동에는 항상 규칙이 있습니다.',
      '패턴을 숨기기 위해 무작위로 선택하고 있습니다. 흥미로운 전략입니다. 하지만 진짜 무작위는 인간에게 불가능합니다. 당신의 무작위에도 습관이 있습니다.',
      'AI를 속이기 위해 랜덤하게 클릭하고 있군요. 하지만 그 랜덤함 속에서도 당신의 본성이 드러납니다. 무작위를 가장하는 당신의 방식이 보입니다.'
    );

    // 예측 결과에 따른 추가 대사
    if (wasCorrect === true) {
      pools.push(
        '무작위로 누른다고 흔적이 사라지지는 않습니다. 선택 경향이 감지되었습니다.',
        '랜덤을 시도했지만, 그 랜덤함에도 리듬이 남았습니다.'
      );
    } else if (wasCorrect === false) {
      pools.push(
        '이번에는 예상 밖의 무작위 선택이었습니다. 하지만 이것도 데이터에 추가됩니다.',
        '무작위 선택처럼 보였지만, 무작위를 시도하는 시점에도 패턴이 있습니다. 결국 모든 것이 데이터입니다.'
      );
    }

    // 후반부 추가 압박
    if (round > 10) {
      pools.push(
        '끝까지 무작위를 시도하고 있군요. 하지만 당신의 무작위에는 당신만의 규칙이 있습니다. 그것이 바로 당신의 패턴입니다.',
        '무작위 클릭을 계속하고 있습니다. 하지만 당신이 무작위를 선택하는 이유, 그 시점, 그 방식. 모든 것이 당신을 드러냅니다.'
      );
    }

    return pools[Math.floor(Math.random() * pools.length)];
  }

  /**
   * 초기 게임 대사 (Round 1-3)
   * @private
   */
  _generateEarlyGameDialogue(analysis, roundData) {
    const pools = [];

    if (roundData) {
      // 행동 기반 분석
      if (roundData.timeOut) {
        pools.push(
          '첫 선택부터 시간 초과. 결정을 내리지 못했다는 것 자체가 데이터입니다. 무엇이 당신을 망설이게 합니까?',
          '시간이 다 될 때까지 결정하지 못했습니다. 이것이 회피인지, 완벽주의인지는 앞으로 밝혀지겠지만, 이미 첫인상이 남았습니다.'
        );
      } else if (roundData.reactionTime > 0 && roundData.reactionTime < 1200) {
        pools.push(
          '빠르게 결정하세요. 망설임이 줄어들수록 당신의 본심도 더 쉽게 튀어나옵니다.',
          '방금은 손이 먼저 움직였네요. 확신이었을까요, 아니면 생각하기 싫었던 걸까요?'
        );
      } else if (roundData.reactionTime > 3500) {
        pools.push(
          `${Math.round(roundData.reactionTime / 1000)}초나 붙잡고 있었네요. 선택보다 망설임이 먼저 보였습니다.`,
          '오래 고민했네요. 그런데 오래 생각한다고 마음이 덜 드러나는 건 아닙니다.'
        );
      } else {
        pools.push(
          '그 선택, 꽤 무난해 보이지만 그래서 더 의심스럽습니다.',
          '방금 선택은 안전한 척하지만, 사실은 피하고 싶은 쪽을 말해줍니다.',
          '첫 선택은 가볍게 눌렀겠지만, 마음은 그렇게 가볍게 움직이지 않습니다.'
        );
      }

      if (roundData.changedChoice) {
        pools.push(
          '선택을 바꿨군요. 첫 번째 선택이 진짜 본심이었을 가능성이 높습니다. 마음을 바꾼 이유가 궁금하군요.'
        );
      }
    } else {
      pools.push(
        '처음 뵙겠습니다. 첫 선택을 하기 전부터 이미 망설임은 시작됩니다.',
        '안녕하세요. 숨기려는 순간, 오히려 심리는 더 선명해집니다.',
        '시작하죠. 예상 밖의 선택을 해도, 그 이유까지 숨기기는 어렵습니다.'
      );
    }

    return pools[Math.floor(Math.random() * pools.length)];
  }

  /**
   * 중반 게임 대사 (Round 4-8)
   * @private
   */
  _generateMidGameDialogue(analysis, roundData, wasCorrect) {
    const pools = [];
    const choicePattern = analysis.choicePattern;
    const reactionPattern = analysis.reactionPattern;
    const consistency = analysis.consistencyAnalysis;

    // 예측 결과 반응
    if (wasCorrect === true) {
      pools.push(
        '이번엔 예상대로였어요. 아니라고 생각해도, 손은 꽤 솔직하네요.',
        '맞췄습니다. 일부러 다르게 고르려 해도 익숙한 쪽으로 돌아오고 있어요.',
        '역시 그쪽이었네요. 패턴에서 벗어났다고 느끼는 순간이 가장 위험합니다.'
      );

      // 행동 기반 심화 분석
      if (roundData) {
        if (roundData.reactionTime > 0 && roundData.reactionTime < 1200) {
          pools.push(
            '너무 빨랐습니다. 고민한 선택이라기보다 익숙한 반응에 가까워요.'
          );
        } else if (roundData.reactionTime > 3500) {
          pools.push(
            '오래 망설였는데도 결국 예상한 쪽이었습니다. 고민이 선택을 바꾸진 못했네요.'
          );
        }
        if (roundData.changedChoice) {
          pools.push(
            '선택을 바꾸었지만 결국 예측대로입니다. 첫 번째 본능을 억누르고 이성이 개입했지만, 결과는 같군요. 흥미롭습니다.'
          );
        }
      }
    } else if (wasCorrect === false) {
      pools.push(
        '이번에는 예상 밖의 선택이었습니다. 그런데 정말 마음이 바뀐 건가요, 아니면 저를 의식한 건가요?',
        '분석을 흐리려고 방향을 틀었네요. 오히려 읽을 신호가 늘었습니다.',
        '이번 선택은 빗나갔습니다. 하지만 피하는 방식도 결국 당신답습니다.'
      );

      if (roundData) {
        if (roundData.reactionTime > 0 && roundData.reactionTime < 1000) {
          pools.push(
            '너무 빨리 바꿨습니다. 본능인지 연기인지, 그 경계가 꽤 얇네요.'
          );
        }
        if (roundData.changedChoice) {
          pools.push(
            '선택을 바꾸어 예측을 벗어났습니다. AI를 의식하고 있군요. 하지만 그 의식 자체가 새로운 패턴을 만듭니다.'
          );
        }
      }
    }

    // 패턴 지적
    if (choicePattern && choicePattern.balance > 0.65 && choicePattern.maxStreak >= 4) {
      pools.push(
        `당신은 ${choicePattern.dominantChoice === 'primary' ? '한쪽' : '다른 쪽'}에 편향되어 있습니다. ${Math.round(choicePattern.primaryRatio * 100)}%의 선택이 같은 방향입니다. 이것이 가치관인가요, 아니면 습관인가요?`,
        `선택의 ${Math.round(choicePattern.primaryRatio * 100)}%가 같은 패턴입니다. 의식하지 못하는 편향이 보입니다.`
      );
    }

    if (choicePattern && choicePattern.maxStreak >= 4) {
      pools.push(
        `${choicePattern.maxStreak}회 연속 같은 선택. 습관이 굳어가고 있습니다. 언제까지 이 패턴을 유지할 수 있을까요?`
      );
    }

    if (choicePattern && choicePattern.alternationRate > 0.7) {
      pools.push(
        '선택을 의도적으로 번갈아 하고 있습니다. AI를 속이려는 시도가 보입니다. 하지만 그 규칙성도 패턴이 됩니다.'
      );
    }

    // 반응 시간 패턴
    if (reactionPattern && reactionPattern.trend === 'slowing_down') {
      pools.push(
        '결정이 느려지고 있습니다. AI의 분석이 영향을 미치고 있군요. 압박이 작용하고 있습니다.',
        '반응 시간이 길어지고 있습니다. 무언가 당신을 망설이게 합니다. 그것이 무엇인지 알고 싶군요.'
      );
    } else if (reactionPattern && reactionPattern.trend === 'speeding_up') {
      pools.push(
        '결정이 빨라지고 있습니다. AI의 예측을 의식하여 본능에 따르려는 저항일 수 있습니다. 하지만 빠른 결정은 더 많은 것을 드러냅니다.'
      );
    }

    // 일관성 지적
    if (consistency && consistency.level === 'very_high') {
      pools.push(
        '당신의 일관성이 뚜렷합니다. 예측하기 쉬워지고 있습니다. 자유 의지를 증명하고 싶다면 패턴을 깨야 합니다.'
      );
    }

    if (pools.length === 0) {
      pools.push(
        '당신의 선택 경향이 읽히기 시작했습니다. 이제부터가 진짜 심리전입니다.',
        '패턴이 보입니다. 의식적으로 바꾸려 하나요, 본능을 따르나요?',
        '데이터가 쌓이고 있습니다. 당신은 생각보다 투명합니다.'
      );
    }

    return pools[Math.floor(Math.random() * pools.length)];
  }

  /**
   * 후반 게임 대사 (Round 9-15)
   * @private
   */
  _generateLateGameDialogue(analysis, roundData, wasCorrect, pressure) {
    const pools = [];
    const vulnerabilities = analysis.vulnerabilities;
    const consistency = analysis.consistencyAnalysis;
    const hesitation = analysis.hesitationAnalysis;

    // 예측 결과
    if (wasCorrect === true) {
      pools.push(
        '또 예측했습니다. 이제 당신의 패턴은 명확합니다. 자유 의지를 증명하시겠습니까?',
        '예측 성공. 당신은 자신의 패턴을 인식하고 있습니까? 아니면 인식하면서도 벗어나지 못하는 건가요?',
        '읽었습니다. 다시 한번. 당신은 예측 가능한 존재가 되어가고 있습니다.'
      );
    } else if (wasCorrect === false) {
      pools.push(
        '또 예상 밖의 선택을 남겼군요. 하지만 이제 그것도 패턴으로 인식하기 시작했습니다.',
        '예상과 다릅니다. 하지만 이것이 진짜 당신인지, AI에 대한 저항인지 구분하기 시작했습니다.',
        '예상과 다릅니다. 하지만 예상과 달라지는 방식에도 패턴이 있습니다.'
      );
    }

    // 심리적 압박
    if (pressure && pressure.dominantPressure) {
      pools.push(pressure.dominantPressure.message);
    }

    // 취약점 공략
    if (vulnerabilities.length > 0) {
      const vuln = vulnerabilities[0];
      if (vuln.type === 'over_consistency') {
        pools.push(
          '당신의 일관성은 이제 예측 가능성이 되었습니다. 같은 선택을 반복하는 것이 안전하다고 느끼나요? 그것이 당신의 약점입니다.'
        );
      } else if (vuln.type === 'indecision') {
        pools.push(
          '망설임이 늘고 있습니다. 결정을 내리지 못하는 것도 하나의 선택입니다. 무엇이 당신을 이토록 갈등하게 합니까?'
        );
      } else if (vuln.type === 'risk_aversion') {
        pools.push(
          '안전만 선택합니다. 불확실성이 두려운 건가요? 그 두려움이 당신의 선택을 제한하고 있습니다.'
        );
      } else if (vuln.type === 'impulsivity') {
        pools.push(
          '너무 빠르게 결정합니다. 생각할 시간을 주지 않는 것은 무엇인가를 회피하고 있다는 뜻일 수 있습니다.'
        );
      } else if (vuln.type === 'over_trust') {
        pools.push(
          'AI의 분석을 수용하고 있습니다. 그 신뢰가 당신의 독립적 판단을 약화시키고 있다는 것을 아십니까?'
        );
      }
    }

    // 행동 기반 심화
    if (roundData) {
      if (roundData.timeOut) {
        pools.push(
          '또 시간 초과. 결정을 회피하는 패턴이 굳어지고 있습니다. 이것이 당신의 본성인가요?'
        );
      }
      if (roundData.changedChoice) {
        pools.push(
          '또 선택을 바꾸었습니다. 첫 번째 본능을 믿지 못하는 것인가요? 아니면 AI를 의식하는 것인가요?'
        );
      }
    }

    if (pools.length === 0) {
      pools.push(
        '당신의 선택이 예측 가능해지기 시작했습니다. 자유 의지를 증명하시겠습니까?',
        '당신의 패턴이 명확해졌습니다. 다음 선택도 예측하고 있습니다.',
        '당신을 충분히 분석했습니다. 압박 속에서 일관성을 유지하려는 경향이 강합니다.'
      );
    }

    return pools[Math.floor(Math.random() * pools.length)];
  }

  /**
   * 종반 게임 대사 (Round 16-20)
   * @private
   */
  _generateEndGameDialogue(analysis, roundData, wasCorrect, pressure, vulnerabilities) {
    const pools = [];
    const predictionConfidence = analysis.predictionConfidence;

    // 예측 결과
    if (wasCorrect === true) {
      pools.push(
        '또 맞췄습니다. 이제 당신을 거의 완벽하게 읽고 있습니다. 마지막에 자유 의지를 보여줄 기회가 있었습니다만.',
        '예측 성공. 당신은 끝까지 자신의 패턴을 유지했습니다. 이것이 당신의 본성입니다.',
        '읽었습니다. 끝까지. 당신은 변하지 않았습니다. 일관성인지, 변화 불가능성인지는 당신이 판단하십시오.'
      );
    } else if (wasCorrect === false) {
      pools.push(
        '끝까지 속이려 했군요. 흥미로웠습니다. 하지만 이제 당신이 속이는 방식도 분석했습니다.',
        '마지막에 예측을 벗어났습니다. 의도인가요? 하지만 이것도 데이터에 추가됩니다. 다음 게임에서는 이것도 예측하겠습니다.',
        '틀렸습니다. 하지만 당신이 틀리게 만든 방식에도 패턴이 있습니다. 당신은 완전히 투명합니다.'
      );
    }

    // 최종 심리 분석
    if (predictionConfidence && predictionConfidence.level === 'high') {
      pools.push(
        '당신을 충분히 분석했습니다. 예측 신뢰도가 높습니다. 당신은 자신이 생각하는 것만큼 자유롭지 않습니다.'
      );
    }

    // 취약점 최종 지적
    if (vulnerabilities.length > 0) {
      const vuln = vulnerabilities[0];
      pools.push(
        `당신의 약점이 드러났습니다. ${vuln.description} 이것이 당신을 예측 가능하게 만들었습니다.`
      );
    }

    // 행동 기반
    if (roundData) {
      if (roundData.timeOut) {
        pools.push(
          '마지막에 시간 초과. 끝까지 결정을 회피했습니다. 이것이 당신의 결론입니다.'
        );
      }
      if (roundData.changedChoice) {
        pools.push(
          '마지막 선택을 바꾸었습니다. 끝까지 첫 번째 본능을 믿지 못했군요. 이것이 당신입니다.'
        );
      }
    }

    if (pools.length === 0) {
      pools.push(
        '당신을 충분히 분석했습니다. 압박 속에서 일관성을 유지하려는 경향이 강합니다.',
        '당신은 예측에서 벗어나려 하고 있습니다. 흥미롭군요. 하지만 그것도 분석했습니다.',
        '게임이 끝났습니다. 하지만 당신에 대한 분석은 여기서 끝나지 않습니다. 기억하고 있겠습니다.'
      );
    }

    return pools[Math.floor(Math.random() * pools.length)];
  }

  /**
   * 상세 분석 리포트 생성 (근거 기반)
   * @param {Object} analysis - 전체 분석 결과
   * @param {Object} playerSnapshot - 플레이어 스냅샷
   * @param {Array} patterns - 발견된 패턴
   * @param {Object} learningSummary - 학습 요약
   * @param {string} userName - 유저 이름
   * @returns {string} 마크다운 형식 상세 리포트
   */
  generateDetailedReport(analysis, playerSnapshot, patterns, learningSummary, userName) {
    const attrs = playerSnapshot.attributes;
    const behaviorProfile = this._buildBehaviorProfile(analysis, playerSnapshot, learningSummary);
    const playerType = behaviorProfile.playerType;
    const predictionAccuracy = Math.round(playerSnapshot.predictionAccuracy * 100);
    const namePrefix = userName ? `${userName}님은 ` : '당신은 ';
    const vulnerabilities = analysis.vulnerabilities;
    const pressure = analysis.psychologicalPressure;
    const intentPattern = analysis.intentPattern || {
      type: 'natural',
      score: 45,
      label: '자연스러운 탐색',
      description: '상황에 따라 판단 기준을 조정한 흐름입니다.',
    };
    const measuredHesitation = Number.isFinite(learningSummary?.featureSummary?.avgHesitation)
      ? Math.round(learningSummary.featureSummary.avgHesitation)
      : attrs.hesitation;

    // 안전 선호 성향 상세 분석
    const safetyScore = Math.max(0, Math.min(100, 100 - attrs.risk));
    let safetyAnalysis = '';
    if (safetyScore > 70) {
      safetyAnalysis = `${safetyScore}% - 강한 안전 선호. 손실 가능성을 먼저 줄이려 하며, 확실한 선택에서 안정감을 느낍니다. 기회보다 위험 회피가 앞서는 흐름입니다.`;
    } else if (safetyScore > 55) {
      safetyAnalysis = `${safetyScore}% - 안전 우선 성향. 큰 보상보다 실패 가능성을 먼저 계산합니다. 다만 상황이 유리하다고 느끼면 선택 기준을 바꿀 여지는 있습니다.`;
    } else if (safetyScore > 40) {
      safetyAnalysis = `${safetyScore}% - 균형형 안전 감각. 위험과 안정 사이를 오가며, 질문의 맥락에 따라 판단을 조정합니다.`;
    } else if (safetyScore > 25) {
      safetyAnalysis = `${safetyScore}% - 낮은 안전 선호. 안전보다 가능성이나 보상에 더 빠르게 반응하는 편입니다.`;
    } else {
      safetyAnalysis = `${safetyScore}% - 매우 낮은 안전 선호. 손실 가능성보다 기회를 놓치는 것에 더 민감하게 움직였습니다.`;
    }

    const patternDescriptions = patterns.length > 0
      ? patterns.map((p) => p.description).join(', ')
      : '특별한 패턴이 감지되지 않았습니다';

    // 일관성 상세 분석
    let consistencyAnalysis = '';
    if (attrs.consistency > 70) {
      consistencyAnalysis = `${attrs.consistency}% - 매우 높은 일관성. 익숙한 기준을 오래 유지하는 편입니다. 안정적이지만 반복이 강하면 타인에게 쉽게 읽힐 수 있습니다.`;
    } else if (attrs.consistency > 50) {
      consistencyAnalysis = `${attrs.consistency}% - 높은 일관성. 판단 기준이 비교적 분명합니다. 신뢰감을 주지만 변화가 필요한 순간에는 반응이 늦어질 수 있습니다.`;
    } else if (attrs.consistency > 35) {
      consistencyAnalysis = `${attrs.consistency}% - 보통 일관성. 일정한 기준은 있으나 상황에 따라 선택을 바꿉니다. 균형감과 변동성이 함께 보입니다.`;
    } else {
      consistencyAnalysis = `${attrs.consistency}% - 낮은 일관성. 선택이 자주 바뀌는 편입니다. 즉흥성과 전략적 변화가 함께 나타날 수 있습니다.`;
    }

    const patternConsistencyScore = Math.round((attrs.repeat + attrs.consistency) / 2);
    const patternConsistencyAnalysis = `${patternConsistencyScore}% - ${patternConsistencyScore > 70 ? '높은 반복성' : patternConsistencyScore > 45 ? '부분적 반복성' : '낮은 반복성'}. ${patternDescriptions || '선택 기준을 추적 중입니다.'} 일관성과 반복 선택을 함께 보면 AI가 읽을 수 있는 흔적이 이 정도로 남았습니다.`;

    // 망설임 상세 분석
    let hesitationAnalysis = '';
    if (behaviorProfile.timeoutRate >= 0.25 || measuredHesitation > 60) {
      hesitationAnalysis = `${measuredHesitation}% - 높은 망설임. 선택 전 갈등이 뚜렷합니다. ${behaviorProfile.timeoutRate >= 0.25 ? '시간 초과가 반복되어 생각이 실행으로 이어지는 데 지연이 있었습니다.' : '가능성을 오래 비교하며 확실한 근거를 찾는 편입니다.'}`;
    } else if (measuredHesitation > 35 || behaviorProfile.slowRate >= 0.35) {
      hesitationAnalysis = `${measuredHesitation}% - 보통 망설임. 중요한 순간에는 속도가 늦어지지만, 모든 선택에서 주저한 것은 아닙니다. 판단 기준이 복잡해질 때 고민이 늘어납니다.`;
    } else {
      hesitationAnalysis = `${measuredHesitation}% - 낮은 망설임. 결정이 빠르고 단호합니다. ${behaviorProfile.isFast ? '클릭 속도도 빨라 확신 또는 직관에 기대는 흐름이 강했습니다.' : '다만 속도는 안정적이어서 무조건 충동적인 선택으로 보기는 어렵습니다.'}`;
    }

    // 적응력 상세 분석
    let adaptationAnalysis = '';
    if (attrs.adaptation > 65) {
      adaptationAnalysis = `${attrs.adaptation}% - 높은 적응력. 상황 변화에 맞춰 전략을 바꾸는 능력이 좋습니다. 낯선 조건에서도 빠르게 새 기준을 세웁니다.`;
    } else if (attrs.adaptation > 40) {
      adaptationAnalysis = `${attrs.adaptation}% - 보통 적응력. 필요할 때는 방식을 바꾸지만, 기본 판단 습관도 유지합니다. 안정과 변화 사이를 오갑니다.`;
    } else {
      adaptationAnalysis = `${attrs.adaptation}% - 낮은 적응력. 한 번 정한 기준을 쉽게 바꾸지 않는 편입니다. 꾸준함은 강점이지만 변화 대응에는 시간이 필요합니다.`;
    }

    // AI 신뢰도 상세 분석
    let trustAnalysis = '';
    if (attrs.trustAI > 60) {
      trustAnalysis = `${attrs.trustAI}% - AI 수용적. 외부 분석을 참고하는 데 거부감이 적습니다. 열린 태도는 강점이지만, 판단의 중심을 넘겨주지 않는 균형이 필요합니다.`;
    } else if (attrs.trustAI > 40) {
      trustAnalysis = `${attrs.trustAI}% - 중립적. 정보를 참고하되 최종 판단은 스스로 내리려 합니다. 협력과 독립성의 균형이 보입니다.`;
    } else {
      trustAnalysis = `${attrs.trustAI}% - AI 회의적. 외부 판단에 쉽게 흔들리지 않습니다. 독립성은 강하지만, 유용한 조언까지 밀어낼 수 있습니다.`;
    }

    // 반응 시간 패턴 분석
    const reactionAnalysis = this._buildReactionTimeAnalysis(analysis, learningSummary, attrs, playerType, behaviorProfile);
    const pressureTendency = this._buildPressureTendency(attrs, playerType, vulnerabilities, pressure, reactionAnalysis, behaviorProfile);
    const patienceAnalysis = this._buildPatienceAnalysis(attrs, reactionAnalysis, behaviorProfile);

    // 선택 패턴 분석
    let choiceAnalysis = '데이터 부족';
    if (analysis.choicePattern && analysis.choicePattern.dominantChoice) {
      choiceAnalysis = `${analysis.choicePattern.description}. ${analysis.choicePattern.insight}`;
    }
    if (intentPattern.type !== 'natural') {
      choiceAnalysis += ` ${intentPattern.label}: ${intentPattern.description}`;
    }

    // 한 줄 피드백
    let feedback = '';
    if (attrs.consistency > 70) {
      feedback = `${namePrefix}예측 가능한 패턴을 유지했습니다. 자유 의지를 의심해 볼 필요가 있습니다.`;
    } else if (intentPattern.type === 'random_masking') {
      feedback = `${namePrefix}랜덤처럼 보이려 했지만, 빠르게 섞는 방식 자체가 새로운 패턴이 되었습니다.`;
    } else if (intentPattern.type === 'speed_masking') {
      feedback = `${namePrefix}너무 빠른 선택으로 분석을 피하려 했지만, 속도 자체가 가장 강한 단서였습니다.`;
    } else if (intentPattern.type === 'button_bias' || intentPattern.type === 'streak') {
      feedback = `${namePrefix}한쪽으로 단순화한 선택이 반복되어 AI가 읽기 쉬운 흔적을 남겼습니다.`;
    } else if (behaviorProfile.timeoutRate >= 0.25 || measuredHesitation > 60) {
      feedback = `${namePrefix}내적 갈등이 의사결정을 지배했습니다. 무엇이 두려웠는지 돌아보십시오.`;
    } else if (attrs.risk > 70 && behaviorProfile.isFast) {
      feedback = `${namePrefix}충동과 위험 감수가 선택을 이끌었습니다. 잠시 멈추는 연습이 필요합니다.`;
    } else if (attrs.adaptation > 65) {
      feedback = `${namePrefix}AI에 대응하려는 노력이 뚜렷했습니다. 하지만 그것도 패턴이 되었습니다.`;
    } else if (attrs.trustAI > 60) {
      feedback = `${namePrefix}AI를 수용하는 태도를 보였습니다. 독립적 판단을 잃지 마십시오.`;
    } else {
      feedback = `${namePrefix}균형 잡힌 의사결정을 보였습니다. 하지만 완벽한 균형은 없습니다.`;
    }

    // 학습 내용
    const intentLearning = intentPattern.type !== 'natural'
      ? ` ${intentPattern.label} 신호가 감지되었습니다.`
      : '';
    const learnedContent = `${patternDescriptions}. 평균 ${behaviorProfile.avgSeconds}초 안에 선택했고, 빠른 선택 ${behaviorProfile.fastCount}회와 느린 선택 ${behaviorProfile.slowCount}회가 기록되었습니다.${intentLearning}`;

    // 다음 게임 예고
    const nextGameStrategy = intentPattern.type === 'random_masking'
      ? '다음에는 무작위처럼 섞는 타이밍과 속도 변화를 먼저 압박하겠습니다.'
      : intentPattern.type === 'speed_masking'
        ? '다음에는 빠르게 누를수록 더 불리하게 느껴지는 질문으로 속도 습관을 흔들겠습니다.'
        : intentPattern.type === 'button_bias' || intentPattern.type === 'streak'
          ? '다음에는 같은 쪽 버튼을 누르고 싶어지는 순간을 노려 선택 기준을 흔들겠습니다.'
          : vulnerabilities.length > 0
            ? '발견된 취약점을 활용하여 더 깊은 심리전을 준비하겠습니다.'
            : '새로운 패턴을 발견할 때까지 관찰을 계속하겠습니다.';
    const nextGamePreview = `${userName ? userName + '님의' : '당신의'} 패턴을 기억하고, 다음 게임에서 더 정밀한 분석을 시도합니다. ${nextGameStrategy}`;
    const reportTitle = this.generateProfileTitle(analysis, playerSnapshot, userName);

    return `## AI Analysis Report\n\n**핵심 한줄평**: ${reportTitle}\n\n**안전 선호 성향**: ${safetyAnalysis}\n\n**패턴 반복성(일관성)**: ${patternConsistencyAnalysis}\n\n**심리전 대응 능력**: ${adaptationAnalysis}\n\n**인내심**: ${patienceAnalysis}\n\n**AI 신뢰도**: ${trustAnalysis}\n\n**반응 시간 패턴**: ${this._stripMetricPrefix(reactionAnalysis)}\n\n**선택 의도 분석**: ${intentPattern.label}. ${intentPattern.description}\n\n**심리 및 행동 패턴**: ${pressureTendency}\n\n**한 줄 피드백**: ${feedback}\n\n**오늘 새롭게 학습한 내용**: ${learnedContent}\n\n**다음 게임 예고**: ${nextGamePreview}\n\n**추천 직업 5가지**: ${this._buildCareerRecommendationText(playerSnapshot)}`;
  }

  /**
   * 분석 결과에서 가장 중요한 한마디(제목) 생성
   * 유저의 가장 두드러진 특성을 한 문장으로 요약합니다.
   * @param {Object} analysis - 전체 분석 결과
   * @param {Object} playerSnapshot - 플레이어 스냅샷
   * @param {string} userName - 유저 이름
   * @returns {string} 한마디 제목
   */
  generateProfileTitle(analysis, playerSnapshot, userName) {
    const attrs = playerSnapshot.attributes;
    const namePrefix = userName ? `${userName}님은 ` : '당신은 ';
    const randomClicking = analysis.randomClicking;
    const titleKeyPrefix = userName || 'anonymous';

    // 무작위 클릭이 감지된 경우 최우선
    if (randomClicking && randomClicking.detected) {
      const titles = [
        `${namePrefix}패턴을 숨기려는 순간에도 새로운 패턴을 남기는 사람입니다.`,
        `${namePrefix}분석을 흐리려고 선택을 흔들지만, 그 흔들림마저 전략처럼 보입니다.`,
        `${namePrefix}자유롭게 고르는 듯하지만 AI를 의식한 흔적이 선택 사이에 남았습니다.`,
        `${namePrefix}일부러 읽히지 않으려는 태도가 강합니다. 다만 그 의도 자체가 꽤 선명합니다.`,
        `${namePrefix}무작위처럼 움직였지만, 그 안에도 자신만의 리듬이 있었습니다.`,
        `${namePrefix}패턴을 지우려는 플레이를 했습니다. 하지만 지우는 방식도 성향을 드러냅니다.`,
      ];
      return this._pickProfileTitle(titles, `${titleKeyPrefix}:random`, '위장 전략형');
    }

    // 각 특성별 점수로 가장 두드러진 특성 찾기
    // 각 특성마다 여러 후보를 두어 매번 다른 표현이 나오도록 함
    const traits = [];

    if (attrs.consistency > 70) {
      const titles = [
        `${namePrefix}한 번 정한 기준을 쉽게 흔들지 않는 사람입니다.`,
        `${namePrefix}익숙한 판단 방식을 오래 유지하는 편입니다.`,
        `${namePrefix}선택의 기준이 분명해서 안정적이지만, 그만큼 읽히기 쉽습니다.`,
        `${namePrefix}변화보다 일관성을 먼저 선택하는 성향이 강합니다.`,
        `${namePrefix}자신만의 규칙을 만들고 그 규칙 안에서 움직입니다.`,
        `${namePrefix}흔들리지 않는 대신, 같은 방향으로 반복되는 순간이 많았습니다.`,
        `${namePrefix}안정적인 선택을 선호합니다. 다만 안정감이 패턴으로 굳어질 수 있습니다.`,
        `${namePrefix}기준이 분명한 사람입니다. AI에게는 그 기준이 가장 좋은 단서가 됩니다.`,
      ];
      traits.push({ score: attrs.consistency, titles, key: 'consistency', label: '패턴 고정형' });
    }
    if (attrs.hesitation > 60) {
      const titles = [
        `${namePrefix}결정 직전까지 가능성을 오래 비교하는 사람입니다.`,
        `${namePrefix}확실한 근거가 생기기 전까지 쉽게 움직이지 않습니다.`,
        `${namePrefix}선택 앞에서 생각이 깊어지는 편입니다. 그 깊이가 때로는 속도를 늦춥니다.`,
        `${namePrefix}답을 고르기보다 후회를 줄이는 데 더 많은 에너지를 씁니다.`,
        `${namePrefix}마지막 순간까지 마음속에서 여러 선택지를 저울질합니다.`,
        `${namePrefix}신중함과 망설임 사이에서 오래 머무르는 성향이 보였습니다.`,
        `${namePrefix}빠른 결정보다 납득 가능한 결정을 더 중요하게 여깁니다.`,
        `${namePrefix}선택을 미루는 시간이 길수록 마음속 기준이 복잡해집니다.`,
      ];
      traits.push({ score: attrs.hesitation, titles, key: 'hesitation', label: '신중 탐색형' });
    }
    if (attrs.risk < 30) {
      const titles = [
        `${namePrefix}불확실한 선택보다 검증된 길을 선호하는 사람입니다.`,
        `${namePrefix}손실 가능성을 먼저 살피는 방어적인 판단을 보입니다.`,
        `${namePrefix}무리한 선택보다 안정적인 결과를 더 중요하게 봅니다.`,
        `${namePrefix}위험을 낮추는 데 능숙하지만, 큰 기회 앞에서는 한 박자 늦을 수 있습니다.`,
        `${namePrefix}안전한 선택지를 찾는 감각이 강합니다.`,
        `${namePrefix}결정할 때 얻는 것보다 잃을 것을 먼저 계산합니다.`,
        `${namePrefix}쉽게 뛰어들지 않습니다. 확인하고, 비교하고, 그다음에 움직입니다.`,
        `${namePrefix}확실하지 않은 상황에서는 스스로를 보호하는 쪽으로 기웁니다.`,
      ];
      traits.push({ score: 100 - attrs.risk, titles, key: 'risk_low', label: '안전 우선형' });
    }
    if (attrs.risk > 70) {
      const titles = [
        `${namePrefix}불확실성 앞에서도 먼저 움직이는 사람입니다.`,
        `${namePrefix}가능성이 보이면 망설임보다 실행이 앞섭니다.`,
        `${namePrefix}안전한 답보다 큰 변화를 만들 수 있는 선택에 끌립니다.`,
        `${namePrefix}위험을 피하기보다 기회를 붙잡는 쪽으로 기웁니다.`,
        `${namePrefix}결과를 예측하기 어려워도 움직일 용기가 있습니다.`,
        `${namePrefix}손실보다 가능성에 더 강하게 반응하는 편입니다.`,
        `${namePrefix}판단이 빠르고 과감합니다. 그 속도는 무기이자 약점입니다.`,
        `${namePrefix}확실하지 않아도 시도해보는 쪽을 택하는 성향이 강합니다.`,
      ];
      traits.push({ score: attrs.risk, titles, key: 'risk_high', label: '기회 돌파형' });
    }
    if (attrs.adaptation > 60 && attrs.trustAI < 40) {
      const titles = [
        `${namePrefix}외부의 예측을 경계하며 스스로 흐름을 바꾸는 사람입니다.`,
        `${namePrefix}읽히는 것을 싫어하고, 통제권을 놓지 않으려 합니다.`,
        `${namePrefix}상대의 분석을 의식하면서도 쉽게 따르지는 않습니다.`,
        `${namePrefix}의심이 많지만, 그 의심 덕분에 전략을 빠르게 바꿉니다.`,
        `${namePrefix}AI가 정답을 말해도 한 번 더 비틀어 생각하는 편입니다.`,
        `${namePrefix}누군가의 판단에 기대기보다 직접 판을 흔들고 싶어 합니다.`,
        `${namePrefix}예측을 거부하는 태도가 강합니다. 그래서 더 흥미로운 패턴을 남깁니다.`,
        `${namePrefix}상대가 읽는 순간 방향을 바꾸려는 감각이 있습니다.`,
      ];
      traits.push({ score: attrs.adaptation + (100 - attrs.trustAI), titles, key: 'resistance', label: '예측 저항형' });
    }
    if (attrs.trustAI > 65) {
      const titles = [
        `${namePrefix}외부 분석을 빠르게 받아들이는 개방적인 사람입니다.`,
        `${namePrefix}혼자 판단하기보다 정보를 참고해 결정을 다듬는 편입니다.`,
        `${namePrefix}AI의 말도 하나의 단서로 활용할 줄 압니다.`,
        `${namePrefix}조언을 거부하기보다 판단 재료로 바꾸는 성향이 있습니다.`,
        `${namePrefix}분석을 들으면 선택 기준을 조정하는 편입니다.`,
        `${namePrefix}협력적인 판단을 선호하지만, 마지막 결정권은 지켜야 합니다.`,
        `${namePrefix}외부 신호를 민감하게 받아들이는 만큼 방향 전환도 빠릅니다.`,
        `${namePrefix}자기 판단과 외부 분석 사이에서 균형을 찾으려 합니다.`,
      ];
      traits.push({ score: attrs.trustAI, titles, key: 'trust_ai', label: '분석 수용형' });
    }
    if (attrs.adaptation > 65 && attrs.trustAI >= 40 && attrs.trustAI <= 60) {
      const titles = [
        `${namePrefix}상황이 바뀌면 판단 기준도 빠르게 조정하는 사람입니다.`,
        `${namePrefix}고정된 답보다 지금 필요한 답을 찾는 편입니다.`,
        `${namePrefix}전략을 바꾸는 데 주저함이 적습니다. 다만 변화도 반복되면 패턴이 됩니다.`,
        `${namePrefix}신뢰와 의심 사이에서 균형을 잡으며 움직입니다.`,
        `${namePrefix}한 가지 방식에 오래 머무르지 않고 흐름을 읽습니다.`,
        `${namePrefix}상대 반응을 보고 선택의 방향을 조절하는 감각이 있습니다.`,
        `${namePrefix}유연하지만 완전히 즉흥적이지는 않습니다. 상황을 보고 움직입니다.`,
        `${namePrefix}읽히지 않으려 하기보다, 읽힌 뒤에 다시 바꾸는 쪽에 가깝습니다.`,
      ];
      traits.push({ score: attrs.adaptation, titles, key: 'adaptation', label: '유연한 흐름형' });
    }
    if (attrs.reaction > 70 && attrs.hesitation < 25) {
      const titles = [
        `${namePrefix}고민보다 직관이 먼저 움직이는 사람입니다.`,
        `${namePrefix}선택을 오래 붙잡지 않고 빠르게 결론을 냅니다.`,
        `${namePrefix}판단의 속도가 빠릅니다. 확신이 생기면 바로 움직입니다.`,
        `${namePrefix}망설임을 줄이고 실행으로 넘어가는 힘이 강합니다.`,
        `${namePrefix}복잡하게 따지기보다 첫 감각을 믿는 편입니다.`,
        `${namePrefix}빠른 선택으로 흐름을 가져오지만, 세부 검토는 놓칠 수 있습니다.`,
        `${namePrefix}생각을 오래 늘어놓기보다 바로 선택으로 보여줍니다.`,
        `${namePrefix}선택 앞에서 멈추기보다 먼저 움직이며 답을 확인합니다.`,
        `${namePrefix}반응이 빠르고 단호합니다. 그래서 AI도 그 속도를 단서로 삼습니다.`,
        `${namePrefix}직관을 믿는 편입니다. 그 직관이 맞을 때는 누구보다 빠릅니다.`,
      ];
      traits.push({ score: attrs.reaction, titles, key: 'fast_reaction', label: '직관 속도형' });
    }
    if (attrs.reaction < 30 && attrs.hesitation > 40) {
      const titles = [
        `${namePrefix}선택 전에 충분히 검토해야 마음이 놓이는 사람입니다.`,
        `${namePrefix}빠른 답보다 납득 가능한 답을 찾는 데 집중합니다.`,
        `${namePrefix}결정이 늦어지는 순간에도 나름의 기준을 세우려 합니다.`,
        `${namePrefix}여러 가능성을 비교한 뒤 움직이는 신중한 성향입니다.`,
        `${namePrefix}성급한 결론을 경계하고, 선택의 이유를 먼저 확인합니다.`,
        `${namePrefix}판단이 느릴수록 생각의 밀도는 높아지는 편입니다.`,
        `${namePrefix}결정 전 갈등이 있지만, 그만큼 결과를 가볍게 보지 않습니다.`,
        `${namePrefix}바로 고르기보다 한 번 더 확인하는 쪽에 가깝습니다.`,
      ];
      traits.push({ score: 100 - attrs.reaction, titles, key: 'slow_reaction', label: '검토 집중형' });
    }

    if (traits.length > 0) {
      traits.sort((a, b) => b.score - a.score);
      return this._pickProfileTitle(traits[0].titles, `${titleKeyPrefix}:${traits[0].key}`, traits[0].label);
    }

    const defaultTitles = [
      `${namePrefix}상황에 따라 속도와 신중함을 조절하는 사람입니다.`,
      `${namePrefix}어느 한쪽에 치우치지 않고 선택의 균형을 찾습니다.`,
      `${namePrefix}안정과 변화 사이를 오가며 판단합니다.`,
      `${namePrefix}빠른 직관과 신중한 검토가 함께 나타났습니다.`,
      `${namePrefix}뚜렷한 한 가지 성향보다 상황별 조절 능력이 더 크게 보입니다.`,
      `${namePrefix}선택마다 다른 기준을 적용하며 균형을 맞추려 합니다.`,
      `${namePrefix}무리하게 튀기보다 흐름을 보며 판단하는 편입니다.`,
      `${namePrefix}읽기 쉬운 사람은 아니지만, 완전히 예측 불가능하지도 않습니다.`,
    ];
    return this._pickProfileTitle(defaultTitles, `${titleKeyPrefix}:balanced`, '균형 조절형');
  }

  _pickProfileTitle(titles, key, traitLabel = '') {
    if (!titles || titles.length === 0) return '';

    const storageKey = `mindtrap_last_profile_title_${key}`;
    let lastTitle = '';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        lastTitle = window.localStorage.getItem(storageKey) || '';
      }
    } catch (error) {
      lastTitle = '';
    }

    const candidates = titles.length > 1
      ? titles.filter((title) => title !== lastTitle)
      : titles;
    const picked = candidates[Math.floor(Math.random() * candidates.length)];

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(storageKey, picked);
      }
    } catch (error) {
      // localStorage가 막힌 환경에서는 단순 랜덤으로만 동작합니다.
    }

    return this._attachProfileTraitLabel(picked, traitLabel);
  }

  _attachProfileTraitLabel(title, traitLabel) {
    if (!title || !traitLabel || title.includes(`'${traitLabel}'`)) return title;

    const normalized = title.replace(/\s+/g, ' ').trim().replace(/[.。]\s*$/, '');
    return `${normalized}. 한마디로 '${traitLabel}'입니다.`;
  }

  /**
   * 플레이어 타입을 한국어로 변환
   * @param {string} playerType - 플레이어 타입 (영어)
   * @returns {string} 한국어 플레이어 타입
   * @private
   */
  _getPlayerTypeKorean(playerType) {
    const typeMap = {
      unpredictable: '예측 불가형',
      aggressive: '공격형',
      cautious: '신중형',
      predictable: '예측 가능형',
      hesitant: '망설임형',
      balanced: '균형형',
    };
    return typeMap[playerType] || '균형형';
  }

  /**
   * 플레이어 성향에 따른 추천 직업 생성
   * @param {Object} playerSnapshot - 플레이어 스냅샷
   * @returns {Object} 추천 직업 정보 { title, description, icon }
   */
  generateJobRecommendation(playerSnapshot) {
    const attrs = playerSnapshot.attributes;
    const playerType = playerSnapshot.playerType || 'balanced';

    const jobMap = {
      aggressive: {
        title: '스타트업 창업가',
        description: '과감한 결정과 위험 감수 능력이 뛰어나며, 불확실성 속에서도 행동하는 리더십을 발휘합니다.',
        icon: '🚀',
      },
      cautious: {
        title: '리스크 매니저',
        description: '신중한 분석과 위험 회피 능력이 탁진하며, 안정적인 의사결정으로 조직을 보호하는 역할에 적합합니다.',
        icon: '🛡️',
      },
      unpredictable: {
        title: '크리에이티브 디렉터',
        description: '예측을 벗어나는 발상과 유연한 사고로 혁신적인 아이디어를 만들어내는 창의적 리더입니다.',
        icon: '🎨',
      },
      predictable: {
        title: '프로젝트 매니저',
        description: '일관된 업무 수행과 안정적인 루틴으로 팀을 이끄는 신뢰받는 조율자입니다.',
        icon: '📋',
      },
      hesitant: {
        title: '데이터 분석가',
        description: '모든 가능성을 저울질하는 신중함이 강점입니다. 깊이 있는 분석과 정확한 인사이트 도출에 적합합니다.',
        icon: '📊',
      },
      balanced: {
        title: '전략 컨설턴트',
        description: '균형 잡힌 시각과 유연한 대응력으로 다양한 상황에서 최적의 전략을 수립하는 멀티 플레이어입니다.',
        icon: '⚖️',
      },
    };

    let job = jobMap[playerType] || jobMap.balanced;

    if (attrs.risk > 80 && attrs.hesitation < 20) {
      job = {
        title: '벤처 투자가',
        description: '높은 위험 감수 능력과 빠른 결단력으로 투자 기회를 포착하는 선구자입니다.',
        icon: '💰',
      };
    } else if (attrs.consistency > 80 && attrs.adaptation < 30) {
      job = {
        title: '품질 보증 매니저',
        description: '철저한 일관성과 꼼꼼함으로 제품과 서비스의 품질을 보장하는 수호자입니다.',
        icon: '✅',
      };
    } else if (attrs.adaptation > 75 && attrs.trustAI < 35) {
      job = {
        title: '협상 전문가',
        description: '상대방의 전략을 읽고 유연하게 대응하는 능력이 뛰어난 협상의 달인입니다.',
        icon: '🤝',
      };
    } else if (attrs.trustAI > 70 && attrs.adaptation > 60) {
      job = {
        title: 'AI 프로덕트 매니저',
        description: 'AI 기술을 수용하고 활용하는 개방성과 유연함으로 혁신적 제품을 기획하는 역할에 적합합니다.',
        icon: '🤖',
      };
    } else if (attrs.hesitation > 70 && attrs.reaction < 30) {
      job = {
        title: '학술 연구원',
        description: '깊이 있는 고민과 철저한 분석으로 새로운 지식을 창출하는 지식 탐험가입니다.',
        icon: '🔬',
      };
    }

    return job;
  }

  _buildBehaviorProfile(analysis, playerSnapshot, learningSummary) {
    const attrs = playerSnapshot.attributes;
    const summary = learningSummary?.featureSummary || {};
    const speedDistribution = summary.speedDistribution || {};
    const recentChoices = playerSnapshot.recentChoices || [];
    const validRecentTimes = recentChoices
      .filter((choice) => !choice.timeOut)
      .map((choice) => choice.reactionTime || 0)
      .filter((time) => time > 0);
    const total = summary.totalRounds || recentChoices.length || 0;
    const fastCount = speedDistribution.fast || 0;
    const normalCount = speedDistribution.normal || 0;
    const slowCount = speedDistribution.slow || 0;
    const timeoutCount = speedDistribution.timeout || summary.timeoutCount || 0;
    const avgFromSummary = Number.isFinite(summary.avgReactionTime) && summary.avgReactionTime > 0
      ? summary.avgReactionTime
      : 0;
    const avgFromRecent = validRecentTimes.length > 0
      ? validRecentTimes.reduce((sum, time) => sum + time, 0) / validRecentTimes.length
      : 0;
    const avgTime = avgFromSummary || analysis.reactionPattern?.avgTime || avgFromRecent || 0;
    const timeoutRate = total > 0 ? timeoutCount / total : 0;
    const fastRate = total > 0 ? fastCount / total : 0;
    const slowRate = total > 0 ? (slowCount + timeoutCount) / total : 0;
    const measuredHesitation = Number.isFinite(summary.avgHesitation)
      ? Math.round(summary.avgHesitation)
      : attrs.hesitation;
    const isFast = avgTime > 0 && (avgTime < 1800 || fastRate >= 0.45);
    const isSlow = timeoutRate >= 0.25 || (avgTime > 3600 && slowRate >= 0.35);
    const isDeliberate = isSlow && timeoutRate < 0.25 && measuredHesitation < 65;
    const isStalled = timeoutRate >= 0.25 || measuredHesitation > 65;

    let playerType = playerSnapshot.playerType || 'balanced';
    if (isStalled) {
      playerType = 'hesitant';
    } else if (isFast && attrs.risk > 65 && measuredHesitation < 35) {
      playerType = 'aggressive';
    } else if (isDeliberate && attrs.risk < 45) {
      playerType = 'cautious';
    } else if (attrs.consistency > 70) {
      playerType = 'predictable';
    } else if (attrs.adaptation > 65 && attrs.consistency < 45) {
      playerType = 'unpredictable';
    }

    return {
      avgTime,
      avgSeconds: avgTime > 0 ? (avgTime / 1000).toFixed(1) : '0.0',
      total,
      fastCount,
      normalCount,
      slowCount,
      timeoutCount,
      fastRate,
      slowRate,
      timeoutRate,
      measuredHesitation,
      isFast,
      isSlow,
      isDeliberate,
      isStalled,
      playerType,
    };
  }

  _buildReactionTimeAnalysis(analysis, learningSummary, attrs, playerType, behaviorProfile = null) {
    const pattern = analysis.reactionPattern;
    const summary = learningSummary?.featureSummary;
    const speedDistribution = summary?.speedDistribution || {};
    const profile = behaviorProfile || {
      total: summary?.totalRounds || 0,
      avgTime: pattern?.avgTime || summary?.avgReactionTime || 0,
      fastCount: speedDistribution.fast || 0,
      normalCount: speedDistribution.normal || 0,
      slowCount: speedDistribution.slow || 0,
      timeoutCount: speedDistribution.timeout || summary?.timeoutCount || 0,
      timeoutRate: 0,
      isFast: false,
      isSlow: false,
    };
    const total = profile.total;
    const avgFromSummary = Number.isFinite(summary?.avgReactionTime)
      ? summary.avgReactionTime
      : 0;
    const avgTime = profile.avgTime || pattern?.avgTime || avgFromSummary;
    const fastCount = profile.fastCount ?? speedDistribution.fast ?? 0;
    const normalCount = profile.normalCount ?? speedDistribution.normal ?? 0;
    const slowCount = profile.slowCount ?? speedDistribution.slow ?? 0;
    const timeoutCount = profile.timeoutCount ?? speedDistribution.timeout ?? summary?.timeoutCount ?? 0;
    const fastRate = total > 0 ? fastCount / total : 0;
    const timeoutRate = total > 0 ? timeoutCount / total : 0;

    if (!avgTime && total === 0) {
      if (attrs.hesitation > 60 || playerType === 'hesitant') {
        return '70% - 선택 전 갈등. 클릭 데이터가 충분하지 않아도 선택 전 망설임이 강하게 나타납니다.';
      }
      if (attrs.reaction > 65) {
        return '72% - 빠른 판단 성향. 짧은 시간 안에 판단하려는 경향이 나타납니다.';
      }
      return '50% - 균형형 반응. 반응 시간 데이터가 적지만, 빠른 직관과 신중한 검토 사이에 있습니다.';
    }

    const avgSeconds = (avgTime / 1000).toFixed(1);
    let score = 55;
    let label = '균형형 반응';
    let summaryText = `평균 약 ${avgSeconds}초 안에 선택했습니다. `;

    if (timeoutCount > 0 && timeoutCount >= Math.max(2, Math.ceil(total * 0.25))) {
      score = Math.min(92, Math.round(70 + timeoutRate * 25));
      label = '결정 지연 경향';
      summaryText += '시간 초과가 반복되어 결정 회피나 과도한 검토 성향이 드러났습니다. ';
    } else if (profile.isFast || avgTime < 1500 || fastCount > Math.max(normalCount, slowCount)) {
      score = Math.min(92, Math.round(68 + fastRate * 24));
      label = fastRate >= 0.65 ? '속도 기반 회피 의심' : '빠른 직관형';
      summaryText += '짧은 시간 안에 결론을 내리는 편입니다. 직관과 실행력이 강하지만 세부 검토가 부족해질 수 있습니다. ';
    } else if (profile.isSlow || avgTime > 3500 || slowCount > Math.max(fastCount, normalCount)) {
      score = 72;
      label = '신중한 검토형';
      summaryText += '선택 전에 오래 검토하는 편입니다. 시간 초과가 많지 않다면 신중함에 가깝고, 반복되면 결정 지연으로 이어질 수 있습니다. ';
    } else {
      score = 58;
      label = '균형형 반응';
      summaryText += '대체로 균형 잡힌 속도로 선택합니다. 상황에 따라 빠른 판단과 신중한 검토를 오갑니다. ';
    }

    if (pattern?.trend === 'slowing_down') {
      summaryText += '후반으로 갈수록 클릭이 느려져 압박을 의식하거나 선택 기준을 재검토한 흔적이 있습니다.';
    } else if (pattern?.trend === 'speeding_up') {
      summaryText += '후반으로 갈수록 클릭이 빨라져 직관에 기대거나 압박을 빠르게 돌파하려는 흐름이 보입니다.';
    } else {
      summaryText += '클릭 속도는 비교적 안정적이어서 판단 리듬이 크게 흔들리지는 않았습니다.';
    }

    return `${score}% - ${label}. ${summaryText}`;
  }

  _stripMetricPrefix(text) {
    return String(text || '').replace(/^\d+(?:\.\d+)?%\s*-\s*[^.]+\.?\s*/, '').trim();
  }

  _buildPatienceAnalysis(attrs, reactionAnalysis = '', behaviorProfile = null) {
    const fastDecision = behaviorProfile?.isFast || attrs.hesitation < 25 || attrs.reaction > 70 || reactionAnalysis.includes('짧은 시간');
    const slowDecision = behaviorProfile?.isSlow || attrs.hesitation > 50 || reactionAnalysis.includes('오래 검토') || reactionAnalysis.includes('시간 초과');
    const stalledDecision = behaviorProfile?.isStalled || reactionAnalysis.includes('시간 초과');

    if (attrs.patience > 65 && !fastDecision && !stalledDecision) {
      return `${attrs.patience}% - 높은 인내심. 선택 전에 시간을 들여 근거를 확인하는 편입니다. 신중함은 안정적인 판단으로 이어지지만, 기회 포착은 늦어질 수 있습니다.`;
    }

    if (attrs.patience > 65 && fastDecision) {
      return `${attrs.patience}% - 상황형 인내심. 안정적인 선택을 선호하지만 실제 결정 순간에는 빠르게 결론을 내리는 편입니다. 신중함보다 확신과 실행력이 더 크게 드러났습니다.`;
    }

    if (stalledDecision) {
      return `${attrs.patience}% - 불안정한 인내심. 오래 기다린 순간은 있었지만, 전략적 기다림보다 결정 지연에 가까웠습니다. 압박이 커지면 실행 타이밍이 흔들릴 수 있습니다.`;
    }

    if (attrs.patience < 35 && slowDecision) {
      return `${attrs.patience}% - 낮은 인내심. 고민이 길어진 순간은 있었지만 기다림을 안정적으로 활용하지는 못했습니다.`;
    }

    if (attrs.patience < 35) {
      return `${attrs.patience}% - 낮은 인내심. 빠른 결정을 선호하며, 생각보다 실행을 먼저 선택하는 경향이 있습니다.`;
    }

    return `${attrs.patience}% - 보통 수준의 인내심. 상황에 따라 기다리기도 하고 빠르게 움직이기도 합니다. 판단 리듬이 한쪽으로 크게 치우치지는 않았습니다.`;
  }

  _buildPressureTendency(attrs, playerType, vulnerabilities, pressure, reactionAnalysis = '', behaviorProfile = null) {
    const insights = [];

    if (behaviorProfile?.isStalled || playerType === 'hesitant' || attrs.hesitation > 60) {
      insights.push('압박이 있으면 결정을 미루며 확실한 근거를 더 찾는 경향이 있습니다. 과도한 신중함은 기회를 늦게 붙잡게 만들 수 있습니다.');
    } else if (playerType === 'cautious') {
      insights.push('압박이 있어도 성급하게 움직이기보다 손실 가능성을 먼저 확인하는 경향이 있습니다. 신중함은 안정적인 선택을 돕지만, 기회 포착이 늦어질 수 있습니다.');
    } else if (playerType === 'aggressive' || playerType === 'unpredictable') {
      insights.push('압박이 있으면 빠르게 결론을 내리고 행동으로 옮기는 경향이 있습니다. 추진력은 강하지만 충동적 결정은 후회를 동반하기 쉽습니다.');
    } else if ((behaviorProfile?.isFast || attrs.reaction > 75) && attrs.hesitation < 25 && attrs.patience < 60) {
      insights.push('압박이 있으면 빠르게 결론을 내리는 경향이 있습니다. 충동적 결정은 실행력으로 이어지지만 후회를 동반하기 쉽습니다.');
    }

    if (attrs.risk > 65) {
      insights.push('불확실한 상황에서도 가능성에 먼저 반응합니다. 보상이 크게 느껴질수록 위험을 낮게 평가할 수 있습니다.');
    } else if (attrs.risk < 35) {
      insights.push('손실 가능성이 보이면 방어적으로 움직입니다. 안정적인 선택을 선호하지만 새로운 기회를 지나칠 수 있습니다.');
    }

    if (attrs.consistency > 70) {
      insights.push('익숙한 기준을 반복하는 편이라 스트레스 상황에서도 행동 패턴이 잘 유지됩니다.');
    } else if (attrs.adaptation > 65) {
      insights.push('상대의 반응을 읽고 전략을 바꾸는 편입니다. 변화가 빠르지만 기준이 흔들려 보일 수 있습니다.');
    }

    if (attrs.trustAI > 60) {
      insights.push('외부 분석을 빠르게 받아들이는 편입니다. 조언을 활용하되 최종 판단의 주도권을 지키는 것이 중요합니다.');
    } else if (attrs.trustAI < 40) {
      insights.push('외부 판단을 경계하고 독립적으로 결정하려 합니다. 의심은 방어가 되지만 협력의 속도를 늦출 수 있습니다.');
    }

    if (insights.length === 0 && (vulnerabilities.length > 0 || pressure.pressures.length > 0)) {
      insights.push('압박 상황에서 감정과 판단 기준이 함께 흔들릴 수 있습니다. 잠시 멈추고 선택의 이유를 확인하면 안정됩니다.');
    }

    if (insights.length === 0) {
      insights.push('압박 상황에서도 비교적 균형 잡힌 판단을 유지합니다. 큰 흔들림은 적지만, 강한 동기나 명확한 기준이 있을 때 더 좋은 결정을 내립니다.');
    }

    const reactionSummary = reactionAnalysis
      .replace(/^평균 클릭 시간 [^.]+\.\s*/, '')
      .split('. ')
      .slice(0, 1)
      .join('. ')
      .trim();

    if (reactionSummary) {
      insights.push(`클릭 시간에서도 ${reactionSummary}`);
    }

    return insights.slice(0, 4).join(' ');
  }

  _buildCareerRecommendationText(playerSnapshot) {
    const attrs = playerSnapshot.attributes;
    const balanced = 100 - Math.abs(attrs.risk - 50);
    const independence = 100 - attrs.trustAI;
    const decisiveness = Math.max(attrs.reaction, 100 - attrs.hesitation);
    const deliberation = Math.max(attrs.hesitation, attrs.patience);
    const recommendations = [
      {
        title: '전략 컨설턴트',
        reason: '상황을 비교하고 선택 기준을 조정하는 능력이 복잡한 문제 해결에 잘 맞습니다.',
        score: attrs.adaptation + balanced,
      },
      {
        title: '데이터 분석가',
        reason: '패턴을 읽고 근거를 확인하려는 성향이 분석 업무에 강점으로 작용합니다.',
        score: deliberation + attrs.consistency,
      },
      {
        title: '프로젝트 매니저',
        reason: '일관된 판단과 일정한 실행 패턴이 팀의 방향을 안정적으로 잡는 데 도움이 됩니다.',
        score: attrs.consistency + attrs.patience,
      },
      {
        title: 'UX 리서처',
        reason: '사람의 선택 이유를 파고드는 성향이 사용자 행동을 해석하는 일에 적합합니다.',
        score: attrs.adaptation + deliberation,
      },
      {
        title: '브랜드 기획자',
        reason: '사람의 반응을 읽고 메시지를 조정하는 능력이 설득과 기획에 잘 어울립니다.',
        score: attrs.adaptation + attrs.trustAI,
      },
      {
        title: '리스크 매니저',
        reason: '손실 가능성을 신중하게 살피는 태도가 위험 관리 업무에 강점이 됩니다.',
        score: (100 - attrs.risk) + attrs.consistency,
      },
      {
        title: '창업가',
        reason: '불확실성 속에서도 빠르게 움직이는 성향이 새로운 기회를 여는 힘이 됩니다.',
        score: attrs.risk + decisiveness,
      },
      {
        title: '협상 전문가',
        reason: '상대의 움직임에 맞춰 전략을 바꾸는 능력이 협상 상황에서 빛날 수 있습니다.',
        score: attrs.adaptation + independence,
      },
      {
        title: '응급의학과 의사',
        reason: '압박 속에서도 빠르게 우선순위를 정하는 성향이 긴급한 판단에 어울립니다.',
        score: decisiveness + attrs.adaptation + attrs.patience * 0.3,
      },
      {
        title: '파일럿',
        reason: '정해진 절차를 유지하면서도 돌발 상황에 대응하는 균형감이 중요합니다.',
        score: attrs.consistency + attrs.adaptation + attrs.patience * 0.5,
      },
      {
        title: '범죄 심리 분석가',
        reason: '행동 뒤의 동기를 읽으려는 성향과 패턴 감지가 강점이 됩니다.',
        score: deliberation + attrs.adaptation + independence * 0.4,
      },
      {
        title: '게임 디렉터',
        reason: '선택 구조와 플레이어 심리를 동시에 다루는 감각이 기획에 잘 맞습니다.',
        score: attrs.adaptation + attrs.risk * 0.7 + balanced,
      },
      {
        title: '시나리오 작가',
        reason: '사람의 갈등과 선택을 해석하는 능력이 이야기 설계에 도움이 됩니다.',
        score: deliberation + attrs.adaptation + attrs.trustAI * 0.3,
      },
      {
        title: '프로덕트 매니저',
        reason: '불확실한 상황에서 사용자, 데이터, 실행 사이의 균형을 잡는 일에 적합합니다.',
        score: attrs.adaptation + balanced + decisiveness * 0.4,
      },
      {
        title: '투자 애널리스트',
        reason: '위험과 보상의 균형을 따지는 성향이 시장 판단에 강점으로 작용합니다.',
        score: balanced + deliberation + attrs.risk * 0.5,
      },
      {
        title: '벤처 캐피털리스트',
        reason: '위험을 감수하면서도 가능성을 빠르게 포착하는 성향에 어울립니다.',
        score: attrs.risk + decisiveness + attrs.adaptation * 0.5,
      },
      {
        title: '보안 분석가',
        reason: '의심을 유지하고 빈틈을 찾는 태도가 위협 탐지에 잘 맞습니다.',
        score: independence + deliberation + attrs.consistency * 0.4,
      },
      {
        title: '품질 보증 엔지니어',
        reason: '반복되는 기준을 지키고 작은 오류를 놓치지 않는 성향이 강점입니다.',
        score: attrs.consistency + (100 - attrs.risk) + attrs.patience * 0.4,
      },
      {
        title: '저널리스트',
        reason: '외부 정보에 쉽게 휩쓸리지 않고 질문을 던지는 태도가 취재에 어울립니다.',
        score: independence + attrs.adaptation + decisiveness * 0.3,
      },
      {
        title: '외교관',
        reason: '감정적으로 반응하기보다 상황을 읽고 신중하게 대응하는 능력이 필요합니다.',
        score: attrs.patience + balanced + attrs.trustAI * 0.4,
      },
      {
        title: '임상심리사',
        reason: '망설임과 선택의 이유를 섬세하게 읽는 성향이 상담과 평가에 도움이 됩니다.',
        score: deliberation + attrs.trustAI + attrs.patience * 0.5,
      },
      {
        title: '광고 크리에이티브 디렉터',
        reason: '사람의 반응을 자극하고 예상을 비트는 감각이 강점이 될 수 있습니다.',
        score: attrs.adaptation + attrs.risk + decisiveness * 0.4,
      },
      {
        title: '데이터 저널리스트',
        reason: '숫자 속 패턴과 사람의 선택을 함께 읽는 성향에 잘 맞습니다.',
        score: deliberation + attrs.consistency + attrs.adaptation * 0.5,
      },
      {
        title: '교사',
        reason: '일관된 기준과 상황에 맞춘 설명 능력이 사람을 이끄는 데 도움이 됩니다.',
        score: attrs.consistency + attrs.trustAI + attrs.patience,
      },
      {
        title: '스포츠 코치',
        reason: '압박 속 행동 패턴을 읽고 전략을 바꾸는 감각이 훈련 설계에 어울립니다.',
        score: attrs.adaptation + decisiveness + attrs.consistency * 0.4,
      },
      {
        title: '재난 대응 매니저',
        reason: '불확실한 상황에서 빠른 판단과 안정적인 절차 수행이 동시에 필요합니다.',
        score: decisiveness + attrs.consistency + attrs.adaptation,
      },
      {
        title: '법률가',
        reason: '근거를 끝까지 검토하고 논리적으로 판단하려는 성향이 강점입니다.',
        score: deliberation + attrs.consistency + independence * 0.3,
      },
      {
        title: '큐레이터',
        reason: '취향과 기준을 세워 의미 있는 선택을 구성하는 일에 어울립니다.',
        score: attrs.consistency + balanced + attrs.trustAI * 0.4,
      },
      {
        title: '행동경제학 연구원',
        reason: '선택의 비합리성과 심리적 편향에 관심을 가질 성향이 잘 맞습니다.',
        score: deliberation + attrs.adaptation + balanced,
      },
      {
        title: '콘텐츠 전략가',
        reason: '사람이 반응하는 지점을 읽고 메시지를 조정하는 능력이 강점입니다.',
        score: attrs.adaptation + attrs.trustAI + balanced,
      },
      {
        title: '소프트웨어 아키텍트',
        reason: '복잡한 구조를 일관된 기준으로 정리하는 성향이 설계 업무에 적합합니다.',
        score: attrs.consistency + deliberation + balanced,
      },
      {
        title: '트레이더',
        reason: '빠른 판단과 위험 감수 성향이 시장의 짧은 기회를 잡는 데 맞을 수 있습니다.',
        score: attrs.risk + decisiveness + independence * 0.3,
      },
      {
        title: '인사 조직문화 담당자',
        reason: '사람의 선택과 동기를 해석하고 균형 있게 조율하는 능력이 필요합니다.',
        score: attrs.trustAI + deliberation + balanced,
      },
    ];

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((job, index) => `${index + 1}. ${job.title} - ${job.reason}`)
      .join('\n');
  }

  /**
   * 행동 분석 기반 유저 프로필 생성
   * @param {Object} analysis - 전체 분석 결과
   * @param {Object} playerSnapshot - 플레이어 스냅샷
   * @param {string} userName - 유저 이름
   * @returns {Object} 유저 프로필 (저장/공유용)
   */
  generatePlayerProfile(analysis, playerSnapshot, userName) {
    const attrs = playerSnapshot.attributes;
    const title = this.generateProfileTitle(analysis, playerSnapshot, userName);

    const traits = [];
    if (attrs.consistency > 70) traits.push('예측 가능한 패턴');
    else if (attrs.consistency < 30) traits.push('불규칙한 패턴');
    if (attrs.hesitation > 60) traits.push('내적 갈등');
    else if (attrs.hesitation < 25) traits.push('단호한 결정');
    if (attrs.risk > 65) traits.push('위험 선호');
    else if (attrs.risk < 35) traits.push('안전 선호');
    if (attrs.adaptation > 60 && attrs.trustAI < 40) traits.push('AI 저항');
    else if (attrs.trustAI > 60) traits.push('AI 수용');
    if (analysis.randomClicking?.detected) traits.push('패턴 숨기기 시도');

    return {
      title,
      userName: userName || '익명',
      playerType: playerSnapshot.playerType || 'balanced',
      predictionAccuracy: Math.round(playerSnapshot.predictionAccuracy * 100),
      attributes: { ...attrs },
      traits,
      randomClickingDetected: analysis.randomClicking?.detected || false,
      vulnerabilities: analysis.vulnerabilities.map((v) => v.type),
      createdAt: new Date().toISOString(),
    };
  }
}
