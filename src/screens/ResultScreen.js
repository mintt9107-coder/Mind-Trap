/**
 * MindTrap - Result Screen
 * 게임 결과 화면입니다. AI 분석 리포트를 그래프+퍼센트 형식으로 표시합니다.
 * 행동 분석 기반 프로필 제목(한마디)과 저장/공유 기능을 제공합니다.
 */

import { createElement, msToSeconds } from '../utils/helpers.js';
import { createButton } from '../components/Button.js';
import html2canvas from 'html2canvas';

/**
 * AI 리포트 마크다운을 파싱하여 항목별 데이터 추출
 * @param {string} report - 마크다운 형식 리포트
 * @returns {Object} 파싱된 리포트 데이터
 */
const parseAiReport = (report) => {
  if (!report || typeof report !== 'string') return null;

  const result = {
    predictionAccuracy: null,
    sections: [],
    feedback: '',
    learned: '',
    nextGame: '',
  };

  const reportKeys = [
    '핵심 한줄평',
    '안전 선호 성향',
    '패턴 반복성(일관성)',
    '심리전 대응 능력',
    '인내심',
    'AI 신뢰도',
    '반응 시간 패턴',
    '선택 의도 분석',
    '심리 및 행동 패턴',
    '한 줄 피드백',
    '오늘 새롭게 학습한 내용',
    '다음 게임 예고',
    '추천 직업 5가지',
  ];

  const normalizePercent = (value, key, sections = []) => {
    const percentMatch = value.match(/(\d+(?:\.\d+)?)\s*%/);
    if (percentMatch) return parseFloat(percentMatch[1]);

    if (/높음|강함|우수|탁월/.test(value)) return 85;
    if (/보통|중간|평균/.test(value)) return 55;
    if (/낮음|약함|부족/.test(value)) return 25;

    if (key.includes('반응 시간')) {
      const avgMatch = value.match(/평균\s*(\d+(?:\.\d+)?)\s*ms/i);
      if (avgMatch) {
        const avg = parseFloat(avgMatch[1]);
        if (avg <= 1200) return 90;
        if (avg <= 2000) return 70;
        if (avg <= 3500) return 45;
        return 25;
      }
    }

    if (key.includes('심리 및 행동 패턴')) {
      const metricSections = sections.filter((s) => typeof s.percent === 'number');
      if (metricSections.length > 0) {
        const total = metricSections.reduce((sum, section) => sum + section.percent, 0);
        return Math.round(total / metricSections.length);
      }
    }

    return null;
  };

  const addSection = (key, rawValue) => {
    const value = rawValue
      .replace(/^[:：]\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!value) return;

    const percent = normalizePercent(value, key, result.sections);
    result.sections.push({ key, value, percent });
  };

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // "## AI Analysis Report" 헤더 제거
  const cleaned = report
    .replace(/^##\s*AI Analysis Report\s*/i, '')
    .replace(/\bprimary\b/g, '첫 번째 선택지')
    .replace(/\bsecondary\b/g, '두 번째 선택지')
    .replace(
      /\*\*===\s*한 줄 피드백\s*===\*\*\s*([\s\S]*?)\s*\*\*=+\*\*/g,
      '**한 줄 피드백**: $1'
    );

  // 항목별 파싱: **항목**: 내용 (여러 줄 내용 포함)
  const itemRegex = /\*\*([^*]+)\*\*\s*:\s*([\s\S]*?)(?=\s*\*\*[^*]+\*\*\s*:|$)/g;
  let match;
  while ((match = itemRegex.exec(cleaned)) !== null) {
    addSection(match[1].trim(), match[2].trim());
  }

  if (result.sections.length === 0) {
    const plain = cleaned
      .replace(/\*\*/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const positions = reportKeys
      .map((key) => {
        const regex = new RegExp(`${escapeRegExp(key)}\\s*[:：]`, 'i');
        const found = regex.exec(plain);
        return found ? { key, index: found.index, length: found[0].length } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.index - b.index);

    positions.forEach((position, index) => {
      const next = positions[index + 1];
      const valueStart = position.index + position.length;
      const valueEnd = next ? next.index : plain.length;
      addSection(position.key, plain.slice(valueStart, valueEnd));
    });
  }

  // 한 줄 피드백, 학습 내용, 다음 게임 예고
  result.sections.forEach((s) => {
    if (s.key.includes('한 줄 피드백')) result.feedback = s.value;
    if (s.key.includes('학습')) result.learned = s.value;
    if (s.key.includes('다음 게임')) result.nextGame = s.value;
  });

  return result;
};

const appendJobRecommendations = (container, value) => {
  const list = createElement('div', {
    className: 'analysis-item__job-list',
  });
  const icons = ['🧭', '💡', '📊', '🎯', '✨'];
  const jobs = value
    .replace(/\s*(\d+\.)\s*/g, '\n$1 ')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  jobs.forEach((line, index) => {
    const row = createElement('p', {
      className: 'analysis-item__job',
    });
    const match = line.match(/^(\d+\.)\s*([^-]+?)\s*-\s*(.+)$/);
    if (!match) {
      row.textContent = line;
      list.appendChild(row);
      return;
    }

    row.appendChild(createElement('span', {
      className: 'analysis-item__job-icon',
      textContent: icons[index % icons.length],
    }));
    row.appendChild(document.createTextNode(` ${match[1]} `));
    row.appendChild(createElement('strong', {
      className: 'analysis-item__job-title',
      textContent: match[2].trim(),
    }));
    row.appendChild(document.createTextNode(` - ${match[3].trim()}`));
    list.appendChild(row);
  });

  container.appendChild(list);
};

const cleanAnalysisDetail = (text, percent) => {
  let detail = text || '';
  if (percent !== null) {
    const escapedPercent = String(percent).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    detail = detail.replace(new RegExp(`\\b${escapedPercent}(?:\\.0+)?\\s*%\\b`, 'g'), '');
  }
  return detail
    .replace(/\s+\./g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s*[.,]\s*/, '')
    .trim();
};

const simplifyReactionTimeText = (text) => {
  if (!text) return '';

  return text
    .replace(/평균\s*(\d+(?:\.\d+)?)\s*ms\s*의\s*빠른\s*클릭\s*속도/g, (_, ms) => {
      const seconds = (Number(ms) / 1000).toFixed(1);
      return `평균 약 ${seconds}초 안에 선택한 편`;
    })
    .replace(/평균\s*(\d+(?:\.\d+)?)\s*ms\s*의\s*느린\s*클릭\s*속도/g, (_, ms) => {
      const seconds = (Number(ms) / 1000).toFixed(1);
      return `평균 약 ${seconds}초 동안 고민한 편`;
    })
    .replace(/평균\s*(\d+(?:\.\d+)?)\s*ms/g, (_, ms) => {
      const seconds = (Number(ms) / 1000).toFixed(1);
      return `평균 약 ${seconds}초`;
    })
    .replace(/빠른 클릭 속도/g, '비교적 빠른 선택 속도')
    .replace(/느린 클릭 속도/g, '비교적 신중한 선택 속도');
};

const getShareUrl = () => {
  if (typeof window === 'undefined') return 'https://mindtrap.ai';

  const configuredUrl = window.MINDTRAP_CONFIG?.appUrl
    || window.MINDTRAP_CONFIG?.APP_URL
    || '';
  if (configuredUrl) return configuredUrl;

  const { origin } = window.location;
  if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    return origin;
  }

  return 'https://mindtrap.ai';
};

/**
 * 분석 항목을 그래프 바 + 퍼센트로 렌더링
 * @param {Object} section - { key, value, percent }
 * @returns {HTMLElement}
 */
const createAnalysisGraphItem = (section) => {
  const item = createElement('div', {
    className: 'analysis-item',
  });
  const barSectionKeys = [
    '안전 선호 성향',
    '패턴 반복성(일관성)',
    '심리전 대응 능력',
    '인내심',
    'AI 신뢰도',
  ];
  const isJobRecommendation = section.key.includes('추천 직업');
  const isCoreSummary = section.key.includes('핵심 한줄평');
  const shouldShowBar = barSectionKeys.includes(section.key)
    && section.percent !== null
    && !isJobRecommendation;

  // 라벨 행 (항목명 + 퍼센트)
  const labelRow = createElement('div', {
    className: 'analysis-item__label-row',
  });

  if (!isCoreSummary) {
    const label = createElement('span', {
      className: 'analysis-item__label',
      textContent: section.key,
    });

    labelRow.appendChild(label);
  }

  if (shouldShowBar && section.percent !== null && !Number.isNaN(section.percent)) {
    labelRow.appendChild(createElement('span', {
      className: 'analysis-item__percent',
      textContent: `${Math.round(section.percent)}%`,
    }));
  }

  if (!isCoreSummary) {
    item.appendChild(labelRow);
  }

  // 그래프 바 (퍼센트가 있는 경우)
  if (shouldShowBar) {
    const barTrack = createElement('div', {
      className: 'analysis-item__bar-track',
    });
    const barFill = createElement('div', {
      className: 'analysis-item__bar-fill',
    });
    barFill.style.width = `${Math.min(100, Math.max(0, section.percent))}%`;

    // 퍼센트에 따른 색상 클래스
    if (section.percent > 50) {
      barFill.classList.add('analysis-item__bar-fill--high');
    } else if (section.percent > 30) {
      barFill.classList.add('analysis-item__bar-fill--medium');
    } else {
      barFill.classList.add('analysis-item__bar-fill--low');
    }

    barTrack.appendChild(barFill);
    item.appendChild(barTrack);
  }

  const desc = createElement('div', {
    className: 'analysis-item__desc',
  });

  const value = section.key.includes('반응 시간')
    ? simplifyReactionTimeText(section.value.replace(/\s+/g, ' ').trim())
    : section.value.replace(/\s+/g, ' ').trim();
  if (section.key.includes('추천 직업')) {
    appendJobRecommendations(desc, section.value);
    item.appendChild(desc);
    return item;
  }

  if (isCoreSummary) {
    item.classList.add('analysis-item--core-summary');
    desc.appendChild(createElement('p', {
      className: 'analysis-item__core-quote',
      textContent: `"${cleanAnalysisDetail(value, section.percent)}"`,
    }));
    item.appendChild(desc);
    return item;
  }

  if (section.key.includes('한 줄 피드백')) {
    desc.appendChild(createElement('strong', {
      className: 'analysis-item__highlight',
      textContent: cleanAnalysisDetail(value, section.percent),
    }));
    item.appendChild(desc);
    return item;
  }

  const summaryMatch = value.match(/^(\d+(?:\.\d+)?%\s*-\s*[^.]+\.?)(?:\s*(.*))?$/);

  if (summaryMatch) {
    const summary = summaryMatch[1].endsWith('.') ? summaryMatch[1] : `${summaryMatch[1]}.`;
    const detail = cleanAnalysisDetail(summaryMatch[2] || '', section.percent);
    desc.appendChild(createElement('strong', {
      className: 'analysis-item__highlight',
      textContent: summary,
    }));
    if (detail) {
      desc.appendChild(createElement('span', {
        className: 'analysis-item__detail',
        textContent: detail,
      }));
    }
  } else {
    desc.textContent = cleanAnalysisDetail(value, section.percent);
  }

  item.appendChild(desc);

  return item;
};

const formatResultSummaryText = (text = '') => String(text)
  .trim()
  .replace(/\s*\n\s*/g, '\n')
  .replace(/([.!?。！？])\s+/g, '$1\n')
  .replace(/\n{3,}/g, '\n\n');

/**
 * ResultScreen 생성
 * @param {Object} options - 결과 화면 옵션
 * @param {Object} options.gameEngine - 게임 엔진 인스턴스
 * @param {Function} options.onBackToMenu - 메뉴로 돌아가기 콜백
 * @returns {Object} 결과 화면 객체
 */
export const createResultScreen = ({ gameEngine, onBackToMenu }) => {
  const screen = createElement('div', {
    className: 'screen result-screen',
    id: 'result-screen',
  });

  // 결과 컨테이너
  const resultContainer = createElement('div', {
    className: 'result__container',
  });

  // 제목
  const title = createElement('h1', {
    className: 'result__title text-gradient',
    textContent: '분석 완료',
  });

  // AI 한마디 프로필 제목 (행동 분석 기반)
  const profileTitle = createElement('h2', {
    className: 'result__profile-title',
    textContent: '분석 중...',
  });
  profileTitle.style.display = 'none';

  // 통계 메시지
  const resultMessage = createElement('p', {
    className: 'result__message',
    textContent: '숨기려던 선택까지 분석에 포함되었습니다.',
  });

  const summaryCard = createElement('section', {
    className: 'result__summary-card glass',
  });

  const summaryEyebrow = createElement('span', {
    className: 'result__summary-eyebrow',
    textContent: 'AI가 읽어낸 요약',
  });

  const summaryType = createElement('h2', {
    className: 'result__summary-type',
    textContent: '분석 요약을 준비 중입니다.',
  });

  const summaryMetric = createElement('p', {
    className: 'result__summary-metric',
    textContent: '위험 성향 --% / 패턴 반복성 --% / 심리전 대응 --%',
  });

  const summaryJobs = createElement('p', {
    className: 'result__summary-jobs',
    textContent: '추천 직업: 분석 중',
  });

  summaryCard.appendChild(summaryEyebrow);
  summaryCard.appendChild(summaryType);
  summaryCard.appendChild(summaryMetric);
  summaryCard.appendChild(summaryJobs);

  const signalCard = createElement('section', {
    className: 'result__signal-card glass',
  });

  const signalTitle = createElement('h2', {
    className: 'result__signal-title',
    textContent: 'AI가 읽어낸 핵심 신호',
  });

  const signalText = createElement('p', {
    className: 'result__signal-text',
    textContent: 'AI는 선택보다 선택을 숨기려는 방식에 주목했습니다.',
  });

  signalCard.appendChild(signalTitle);
  signalCard.appendChild(signalText);

  const reliabilityCard = createElement('section', {
    className: 'result__reliability-card glass',
  });

  const reliabilityTitle = createElement('h2', {
    className: 'result__reliability-title',
    textContent: '분석 신뢰도',
  });

  const reliabilityScore = createElement('p', {
    className: 'result__reliability-score',
    textContent: '분석 신뢰도: 계산 중',
  });

  const reliabilityReasons = createElement('p', {
    className: 'result__reliability-reasons',
    textContent: '근거를 수집 중입니다.',
  });

  reliabilityCard.appendChild(reliabilityTitle);
  reliabilityCard.appendChild(reliabilityScore);
  reliabilityCard.appendChild(reliabilityReasons);

  // 통계 카드 섹션
  const statsSection = createElement('div', {
    className: 'result__stats',
  });

  // 통계 아이템 생성 헬퍼
  const createStatItem = (label, value) => {
    const item = createElement('div', {
      className: 'result__stat-item glass',
    });

    const statLabel = createElement('span', {
      className: 'result__stat-label',
      textContent: label,
    });

    const statValue = createElement('span', {
      className: 'result__stat-value',
      textContent: value,
    });

    item.appendChild(statLabel);
    item.appendChild(statValue);
    return {
      element: item,
      updateLabel: (newLabel) => (statLabel.textContent = newLabel),
      updateValue: (newValue) => (statValue.textContent = newValue),
    };
  };

  // 통계 아이템들
  const totalRoundsStat = createStatItem('총 라운드', '0');
  const timeoutsStat = createStatItem('시간 초과', '0');
  const avgReactionTimeStat = createStatItem('평균 반응시간', '0초');

  statsSection.appendChild(totalRoundsStat.element);
  statsSection.appendChild(timeoutsStat.element);
  statsSection.appendChild(avgReactionTimeStat.element);

  // AI 분석 리포트 섹션 (그래프 + 퍼센트)
  const analysisSection = createElement('div', {
    className: 'result__analysis',
  });

  const analysisTitle = createElement('h2', {
    className: 'result__analysis-title',
    textContent: '🤖 AI Analysis Report',
  });

  // 분석 그래프 컨테이너
  const analysisGraphContainer = createElement('div', {
    className: 'result__analysis-graphs',
  });

  // 로딩 텍스트
  const loadingText = createElement('p', {
    className: 'result__analysis-loading',
    textContent: 'AI가 분석 중입니다...',
  });
  analysisGraphContainer.appendChild(loadingText);

  analysisSection.appendChild(analysisTitle);
  analysisSection.appendChild(analysisGraphContainer);

  // 직업 추천 섹션
  const jobRecommendationSection = createElement('div', {
    className: 'result__job-recommendation glass',
  });
  jobRecommendationSection.style.display = 'none';

  const jobRecTitle = createElement('h2', {
    className: 'result__job-title',
    textContent: '💼🔎 추천 직업',
  });

  const jobRecContent = createElement('div', {
    className: 'result__job-content',
  });

  const jobIcon = createElement('span', {
    className: 'result__job-icon',
    textContent: '🔍',
  });

  const jobName = createElement('h3', {
    className: 'result__job-name',
    textContent: '분석 중...',
  });

  const jobDesc = createElement('p', {
    className: 'result__job-desc',
    textContent: '당신의 성향에 맞는 직업을 찾고 있습니다.',
  });

  jobRecContent.appendChild(jobIcon);
  jobRecContent.appendChild(jobName);
  jobRecContent.appendChild(jobDesc);
  jobRecommendationSection.appendChild(jobRecTitle);
  jobRecommendationSection.appendChild(jobRecContent);

  // AI 리포트 저장 변수
  let aiReport = null;

  // 유저 프로필 데이터
  let playerProfile = null;

  // 결과 요약 카드 데이터
  let summaryCardData = null;

  // 프로필 액션 버튼 (저장/공유)
  const profileActionSection = createElement('div', {
    className: 'result__profile-actions',
  });

  const saveProfileBtn = createButton({
    text: 'JPG 저장',
    variant: 'secondary',
    size: 'medium',
    onClick: () => _saveProfile(),
  });

  const shareProfileBtn = createButton({
    text: '공유하기',
    variant: 'secondary',
    size: 'medium',
    onClick: () => _shareProfile(),
  });

  profileActionSection.appendChild(saveProfileBtn);
  profileActionSection.appendChild(shareProfileBtn);

  // 버튼 섹션
  const buttonSection = createElement('div', {
    className: 'result__buttons',
  });

  const menuBtn = createButton({
    text: '메뉴',
    variant: 'primary',
    size: 'large',
    onClick: onBackToMenu,
  });

  buttonSection.appendChild(menuBtn);

  resultContainer.appendChild(title);
  resultContainer.appendChild(profileTitle);
  resultContainer.appendChild(resultMessage);
  resultContainer.appendChild(summaryCard);
  resultContainer.appendChild(signalCard);
  resultContainer.appendChild(reliabilityCard);
  resultContainer.appendChild(statsSection);
  resultContainer.appendChild(analysisSection);
  resultContainer.appendChild(jobRecommendationSection);
  resultContainer.appendChild(profileActionSection);
  resultContainer.appendChild(buttonSection);
  screen.appendChild(resultContainer);

  /**
   * 분석 리포트를 그래프로 렌더링
   * @param {string} report - AI 분석 리포트 (마크다운)
   */
  const renderAiReport = (report) => {
    // 기존 내용 초기화
    analysisGraphContainer.innerHTML = '';
    analysisGraphContainer.appendChild(summaryCard);
    analysisGraphContainer.appendChild(signalCard);

    if (!report) {
      analysisGraphContainer.appendChild(loadingText);
      return;
    }

    const parsed = parseAiReport(report);

    if (!parsed || parsed.sections.length === 0) {
      // 파싱 실패 시 원본 텍스트 표시
      const fallback = createElement('p', {
        className: 'result__analysis-fallback',
        textContent: report,
      });
      analysisGraphContainer.appendChild(fallback);
      return;
    }

    analysisTitle.textContent = '🤖 AI Analysis Report';

    parsed.sections
      .filter((section) => ![
        '핵심 한줄평',
        '플레이어 타입',
        '선택 변화 시점',
        'AI를 가장 많이 속인 순간',
      ].includes(section.key))
      .forEach((section) => {
      analysisGraphContainer.appendChild(createAnalysisGraphItem(section));
      });
  };

  /**
   * 결과 데이터로 업데이트
   * @param {Object} resultData - 결과 데이터
   */
  const update = (resultData) => {
    if (!resultData) return;

    const { stats, totalRounds } = resultData;

    totalRoundsStat.updateValue(`${stats.totalRounds} / ${totalRounds}`);
    timeoutsStat.updateValue(`${stats.totalTimeOuts}`);
    avgReactionTimeStat.updateValue(`${msToSeconds(stats.avgReactionTime).toFixed(2)}초`);

    // AI 리포트가 있으면 표시
    if (aiReport) {
      renderAiReport(aiReport);
    }
  };

  /**
   * AI 리포트 설정
   * @param {string} report - AI 분석 리포트
   */
  const setAiReport = (report) => {
    aiReport = report;
    // 결과 화면이 이미 보이고 있으면 즉시 업데이트
    renderAiReport(report);
  };

  /**
   * 결과 상단 요약 카드 설정
   * @param {Object} summary - { typeTitle, metricLine, jobLine, aiReadLine }
   */
  const setSummaryCard = (summary) => {
    summaryCardData = summary || null;
    if (!summaryCardData) return;
    summaryType.textContent = formatResultSummaryText(summaryCardData.typeTitle || 'AI가 당신의 선택 흐름을 분석했습니다.');
    summaryMetric.textContent = summaryCardData.metricLine || '위험 성향 --% / 패턴 반복성 --% / 심리전 대응 --%';
    summaryJobs.textContent = summaryCardData.jobLine || '추천 직업: 분석 중';
    signalText.textContent = summaryCardData.aiReadLine || 'AI는 선택보다 선택을 숨기려는 방식에 주목했습니다.';
    reliabilityScore.textContent = summaryCardData.reliability?.line || '분석 신뢰도: 계산 중';
    reliabilityReasons.textContent = summaryCardData.reliability?.reasons?.length
      ? `근거: ${summaryCardData.reliability.reasons.join(' / ')}`
      : '근거를 수집 중입니다.';
  };

  /**
   * 프로필 제목(한마디) 설정
   * @param {string} titleText - 프로필 제목
   */
  const setProfileTitle = (titleText) => {
    profileTitle.textContent = '';
    profileTitle.style.display = 'none';
  };

  /**
   * 유저 프로필 설정
   * @param {Object} profile - 유저 프로필 객체
   */
  const setPlayerProfile = (profile) => {
    playerProfile = profile;
    if (profile && profile.title) {
      setProfileTitle(profile.title);
    }
  };

  /**
   * 직업 추천 설정
   * @param {Object} job - 추천 직업 { title, description, icon }
   */
  const setJobRecommendation = (job) => {
    if (!job) return;
    jobRecommendationSection.style.display = '';
    jobIcon.textContent = job.icon || '🔍';
    jobName.textContent = job.title || '';
    jobDesc.textContent = job.description || '';
  };

  /**
   * 프로필을 로컬 스토리지에 저장
   * @private
   */
  const _saveProfile = async () => {
    try {
      const previousText = saveProfileBtn.textContent;
      saveProfileBtn.textContent = '저장 중...';
      saveProfileBtn.disabled = true;

      const canvas = await html2canvas(analysisSection, {
        backgroundColor: '#070711',
        scale: Math.min(2, window.devicePixelRatio || 1),
        useCORS: true,
      });
      const imageUrl = canvas.toDataURL('image/jpeg', 0.92);
      const link = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      link.href = imageUrl;
      link.download = `mindtrap-report-${date}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      saveProfileBtn.textContent = previousText;
      saveProfileBtn.disabled = false;
    } catch (e) {
      console.error('JPG save error:', e);
      saveProfileBtn.textContent = 'JPG 저장';
      saveProfileBtn.disabled = false;
      alert('JPG 저장에 실패했습니다.');
    }
  };

  /**
   * 프로필 공유 (클립보드 복사 + 공유 API)
   * @private
   */
  const _shareProfile = async () => {
    if (!aiReport && !playerProfile && !summaryCardData) {
      alert('아직 프로필이 생성되지 않았습니다.');
      return;
    }

    const shareText = _buildShareText();

    // Web Share API 시도 (모바일)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MindTrap - AI 행동 분석 프로필',
          text: shareText,
        });
        return;
      } catch (e) {
        // 공유 취소 또는 실패 시 클립보드 복사로 폴백
      }
    }

    // 클립보드 복사 (데스크톱)
    try {
      await navigator.clipboard.writeText(shareText);
      alert('프로필이 클립보드에 복사되었습니다.');
    } catch (e) {
      // 구형 브라우저 폴백
      const textarea = document.createElement('textarea');
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        alert('프로필이 클립보드에 복사되었습니다.');
      } catch (err) {
        alert('복사에 실패했습니다. 직접 텍스트를 선택해서 복사하세요.');
      }
      document.body.removeChild(textarea);
    }
  };

  /**
   * 공유용 텍스트 생성
   * @returns {string} 공유 텍스트
   * @private
   */
  const _buildShareText = () => {
    if (!aiReport && !playerProfile && !summaryCardData) return '';

    const lines = [];
    lines.push('MindTrap - AI 심리 분석 결과');
    lines.push('');

    if (summaryCardData) {
      lines.push(summaryCardData.typeTitle);
      lines.push(summaryCardData.metricLine);
      lines.push(summaryCardData.aiReadLine);
      if (summaryCardData.reliability?.line) {
        lines.push(summaryCardData.reliability.line);
      }
      lines.push(summaryCardData.jobLine);
      lines.push('');
    }

    const parsed = parseAiReport(aiReport || '');
    if (parsed && parsed.sections.length > 0) {
      lines.push('AI Analysis Report');
      lines.push('');

      parsed.sections
        .filter((section) => ![
          '핵심 한줄평',
          '플레이어 타입',
          '선택 변화 시점',
          'AI를 가장 많이 속인 순간',
        ].includes(section.key))
        .forEach((section) => {
          const value = section.key.includes('반응 시간')
            ? simplifyReactionTimeText(section.value.replace(/\s+/g, ' ').trim())
            : section.value.replace(/\s+/g, ' ').trim();

          lines.push(`${section.key}: ${cleanAnalysisDetail(value, section.percent)}`);
          lines.push('');
        });
    } else if (playerProfile) {
      lines.push(`"${playerProfile.title}"`);
      lines.push('');
      lines.push(`분석 대상: ${playerProfile.userName}`);
      lines.push(`플레이어 타입: ${playerProfile.playerType}`);
      lines.push(`분석 일치도: ${playerProfile.predictionAccuracy}%`);
      lines.push('');
    }

    lines.push('MindTrap에서 나를 분석해보세요.');
    lines.push(getShareUrl());

    return lines.join('\n');
  };

  /**
   * 화면 표시
   */
  const show = () => {
    // 결과 데이터 업데이트
    const resultData = gameEngine.getResultData();
    update(resultData);

    screen.classList.add('active', 'fade-in');
  };

  /**
   * 화면 숨기기
   */
  const hide = () => {
    screen.classList.remove('active');
    screen.classList.remove('fade-in');
  };

  return {
    element: screen,
    show,
    hide,
    update,
    setAiReport,
    setSummaryCard,
    setProfileTitle,
    setPlayerProfile,
    setJobRecommendation,
  };
};
