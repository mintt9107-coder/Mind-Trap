/**
 * MindTrap - Analysis Report Screen
 * AI 분석 리포트 화면
 */

import { createElement } from '../utils/helpers.js';
import { createButton } from '../components/Button.js';
import { createCard } from '../components/Card.js';

/**
 * AnalysisReportScreen 생성
 * @param {Object} options - 옵션
 * @param {Object} options.report - AI 분석 리포트 데이터
 * @param {Function} options.onPlayAgain - 다시 플레이 콜백
 * @param {Function} options.onShare - 공유하기 콜백
 * @param {Function} options.onBack - 뒤로 가기 콜백
 * @returns {Object} 분석 리포트 화면 객체
 */
export const createAnalysisReportScreen = ({
  report,
  onPlayAgain,
  onShare,
  onBack,
}) => {
  const screen = createElement('div', {
    className: 'screen analysis-report-screen',
    id: 'analysis-report-screen',
  });

  // 헤더
  const header = createElement('div', {
    className: 'analysis-report__header',
  });

  const title = createElement('h1', {
    className: 'analysis-report__title text-gradient',
    textContent: 'AI Analysis Report',
  });

  const subtitle = createElement('p', {
    className: 'analysis-report__subtitle',
    textContent: 'AI가 당신을 분석했습니다',
  });

  header.appendChild(title);
  header.appendChild(subtitle);
  screen.appendChild(header);

  // 리포트 컨테이너
  const container = createElement('div', {
    className: 'analysis-report__container',
  });

  // ========== 예측 성공률 ==========
  const accuracyCard = createCard({
    className: 'analysis-report__card analysis-report__accuracy',
    glass: true,
    children: [
      createElement('div', {
        className: 'analysis-report__metric',
        children: [
          createElement('span', {
            className: 'analysis-report__metric-label',
            textContent: '분석 일치도',
          }),
          createElement('div', {
            className: 'analysis-report__metric-value',
            textContent: `${Math.round((report?.playerModel?.predictionAccuracy || 0) * 100)}%`,
          }),
        ],
      }),
    ],
  });

  container.appendChild(accuracyCard);

  // ========== 상세 분석 ==========
  const detailsCard = createCard({
    className: 'analysis-report__card analysis-report__details',
    glass: true,
    children: [
      createElement('h2', {
        className: 'analysis-report__card-title',
        textContent: '상세 분석',
      }),
    ],
  });

  const details = [
    {
      label: '위험 성향',
      value: report?.summary?.riskPreference || '분석 중',
      icon: '⚡',
    },
    {
      label: '패턴 반복성',
      value: report?.summary?.patternRepeat || '분석 중',
      icon: '🔄',
    },
    {
      label: '선택 변화 시점',
      value: report?.summary?.choiceChangeTiming || '분석 중',
      icon: '⏱️',
    },
    {
      label: '심리전 대응 능력',
      value: report?.summary?.psychologicalResistance || '분석 중',
      icon: '🎭',
    },
  ];

  details.forEach((detail) => {
    const row = createElement('div', {
      className: 'analysis-report__detail-row',
    });

    row.appendChild(createElement('span', {
      className: 'analysis-report__detail-icon',
      textContent: detail.icon,
    }));

    row.appendChild(createElement('span', {
      className: 'analysis-report__detail-label',
      textContent: detail.label,
    }));

    row.appendChild(createElement('span', {
      className: 'analysis-report__detail-value',
      textContent: detail.value,
    }));

    detailsCard.appendChild(row);
  });

  container.appendChild(detailsCard);

  // ========== 하이라이트 ==========
  const highlightsCard = createCard({
    className: 'analysis-report__card analysis-report__highlights',
    glass: true,
    children: [
      createElement('h2', {
        className: 'analysis-report__card-title',
        textContent: '하이라이트',
      }),
    ],
  });

  // First Learning Moment
  if (report?.summary?.firstLearningMoment) {
    const learningRow = createElement('div', {
      className: 'analysis-report__highlight-row',
    });

    learningRow.appendChild(createElement('span', {
      className: 'analysis-report__highlight-label',
      textContent: '🎯 AI가 당신을 이해하기 시작한 순간',
    }));

    learningRow.appendChild(createElement('span', {
      className: 'analysis-report__highlight-value',
      textContent: report.summary.firstLearningMoment,
    }));

    highlightsCard.appendChild(learningRow);
  }

  container.appendChild(highlightsCard);

  // ========== 요약 ==========
  const summaryCard = createCard({
    className: 'analysis-report__card analysis-report__summary',
    glass: true,
    children: [
      createElement('h2', {
        className: 'analysis-report__card-title',
        textContent: "Today's Summary",
      }),
      createElement('p', {
        className: 'analysis-report__summary-text',
        textContent: report?.summary?.todaySummary || '당신은 생각보다 예측하기 어려운 플레이어입니다.',
      }),
    ],
  });

  container.appendChild(summaryCard);

  // ========== Next Challenge ==========
  const nextCard = createCard({
    className: 'analysis-report__card analysis-report__next',
    glass: true,
    children: [
      createElement('h2', {
        className: 'analysis-report__card-title',
        textContent: 'Next Challenge',
      }),
      createElement('p', {
        className: 'analysis-report__next-text',
        textContent: report?.summary?.nextChallenge || '다음 게임에서는 당신의 위험 선택 패턴을 더 빠르게 분석해보겠습니다.',
      }),
    ],
  });

  container.appendChild(nextCard);

  screen.appendChild(container);

  // ========== 버튼 ==========
  const buttons = createElement('div', {
    className: 'analysis-report__buttons',
  });

  if (onShare) {
    buttons.appendChild(createButton({
      text: '공유하기',
      variant: 'secondary',
      size: 'large',
      onClick: onShare,
    }));
  }

  buttons.appendChild(createButton({
    text: '다시 플레이',
    variant: 'primary',
    size: 'large',
    onClick: onPlayAgain,
  }));

  screen.appendChild(buttons);

  /**
   * 화면 표시
   */
  const show = () => {
    screen.classList.add('active', 'fade-in');
  };

  /**
   * 화면 숨기기
   */
  const hide = () => {
    screen.classList.remove('active');
    screen.classList.remove('fade-in');
  };

  /**
   * 리포트 업데이트
   * @param {Object} newReport - 새 리포트 데이터
   */
  const updateReport = (newReport) => {
    // 리포트 데이터 업데이트 로직
    console.log('Report updated:', newReport);
  };

  return {
    element: screen,
    show,
    hide,
    updateReport,
  };
};
