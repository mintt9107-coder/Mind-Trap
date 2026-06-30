/**
 * MindTrap - Landing Screen
 * 심플한 메인 랜딩 화면
 */

import { createElement } from '../utils/helpers.js';
import { createButton } from '../components/Button.js';

/**
 * LandingScreen 생성
 */
export const createLandingScreen = ({
  onStartGame,
  onShowTutorial,
  onShowMemory,
  onShowHistory,
  onShowPremium,
  memorySummary,
  initialUserName = '',
  onSaveUserName,
  viewMode = 'desktop',
  onChangeViewMode,
  onResetMemory,
}) => {
  const buildMemoryText = (summary, name = '') => {
    const playerName = name ? `${name}님` : '당신';
    const savedNameCount = summary?.nameSaveCount || 0;
    if (summary && summary.hasMemory) {
      const analysisNumber = Math.max((summary.totalGames || 0) + 1, savedNameCount);
      return `이번은 ${analysisNumber}번째 분석입니다. 제가 ${playerName}을 다시 분석해보겠습니다. 도전하시겠습니까?`;
    }

    if (name && savedNameCount > 1) {
      return `이번은 ${savedNameCount}번째 분석입니다. 제가 ${playerName}을 다시 분석해보겠습니다. 도전하시겠습니까?`;
    }

    return name
      ? `처음 뵙겠습니다. 제가 ${playerName}을 처음 분석해보겠습니다. 도전하시겠습니까?`
      : '처음 뵙겠습니다. 제가 당신을 처음 분석해보겠습니다. 도전하시겠습니까?';
  };

  const screen = createElement('div', {
    className: 'screen landing-screen',
    id: 'landing-screen',
  });

  // ========== Hero Section ==========
  const heroSection = createElement('div', {
    className: 'landing__hero',
  });

  const title = createElement('h1', {
    className: 'landing__title text-gradient',
    textContent: 'MindTrap',
  });

  const subtitle = createElement('p', {
    className: 'landing__subtitle',
    textContent: 'AI는 당신을 분석합니다.',
  });

  const subtitleCont = createElement('p', {
    className: 'landing__subtitle landing__subtitle--secondary',
    textContent: '그리고 기억합니다.',
  });

  const gameIntro = createElement('p', {
    className: 'landing__intro',
    textContent: 'MindTrap은 플레이어가 선택을 숨기려는 순간까지 AI가 관찰하는 심리 분석 게임입니다.\n플레이를 반복할수록 AI는 반응속도, 흔들림, 반복되는 기준을 기억하며 더 정밀한 가설을 세웁니다.\n속이려는 시도도 하나의 패턴이 됩니다.',
  });

  // ========== 화면 버전 선택 ==========
  const modeSection = createElement('div', {
    className: 'landing__mode-section',
  });

  const modeLabel = createElement('span', {
    className: 'landing__mode-label',
    textContent: '화면 버전',
  });

  const modeControls = createElement('div', {
    className: 'landing__mode-controls',
  });

  const modeButtons = {};
  const setActiveMode = (mode) => {
    Object.entries(modeButtons).forEach(([key, button]) => {
      button.classList.toggle('landing__mode-btn--active', key === mode);
      button.setAttribute('aria-pressed', key === mode ? 'true' : 'false');
    });
  };

  const createModeButton = (mode, label) => {
    const button = createElement('button', {
      className: 'landing__mode-btn',
      textContent: label,
    });
    button.type = 'button';
    button.setAttribute('aria-pressed', mode === viewMode ? 'true' : 'false');
    button.addEventListener('click', () => {
      setActiveMode(mode);
      if (onChangeViewMode) {
        onChangeViewMode(mode);
      }
    });
    modeButtons[mode] = button;
    return button;
  };

  modeControls.appendChild(createModeButton('desktop', 'PC 버전'));
  modeControls.appendChild(createModeButton('mobile', '모바일 버전'));
  modeSection.appendChild(modeLabel);
  modeSection.appendChild(modeControls);
  setActiveMode(viewMode);

  // ========== 유저 이름 입력 섹션 ==========
  const nameInputSection = createElement('div', {
    className: 'landing__name-section',
  });

  const nameLabel = createElement('label', {
    className: 'landing__name-label',
    textContent: 'AI가 당신을 기억할 이름',
  });
  nameLabel.setAttribute('for', 'user-name-input');

  const nameInput = createElement('input', {
    className: 'landing__name-input',
    id: 'user-name-input',
  });
  nameInput.type = 'text';
  nameInput.placeholder = '이름을 입력하세요';
  nameInput.maxLength = 20;
  nameInput.value = initialUserName || '';

  const nameSaveBtn = createElement('button', {
    className: 'btn btn--secondary btn--small landing__name-save-btn',
    textContent: '저장',
  });
  nameSaveBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name && onSaveUserName) {
      const updatedSummary = onSaveUserName(name);
      if (updatedSummary) {
        latestMemorySummary = updatedSummary;
      }
      memorySubtitle.textContent = buildMemoryText(latestMemorySummary, name);
      nameSaveStatus.textContent = `'${name}' 이름으로 저장되었습니다.`;
      nameSaveStatus.classList.add('landing__name-status--visible');
      setTimeout(() => {
        nameSaveStatus.classList.remove('landing__name-status--visible');
      }, 3000);
    } else if (!name) {
      nameSaveStatus.textContent = '이름을 입력해주세요.';
      nameSaveStatus.classList.add('landing__name-status--visible');
      nameSaveStatus.style.color = 'var(--color-timer-danger)';
      setTimeout(() => {
        nameSaveStatus.classList.remove('landing__name-status--visible');
        nameSaveStatus.style.color = '';
      }, 2000);
    }
  });

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      nameSaveBtn.click();
    }
  });

  const nameSaveStatus = createElement('span', {
    className: 'landing__name-status',
    textContent: '',
  });

  nameInputSection.appendChild(nameLabel);
  nameInputSection.appendChild(nameInput);
  nameInputSection.appendChild(nameSaveBtn);
  nameInputSection.appendChild(nameSaveStatus);

  // Memory 기반 서브텍스트 - 신규/기존 유저에 따른 메시지
  let latestMemorySummary = memorySummary;
  const memoryText = buildMemoryText(latestMemorySummary, initialUserName);

  const memorySubtitle = createElement('p', {
    className: 'landing__memory-text',
    textContent: memoryText,
  });

  // ========== CTA 버튼 ==========
  const heroCTA = createElement('div', {
    className: 'landing__hero-cta',
  });

  heroCTA.appendChild(createButton({
    text: 'START',
    variant: 'primary',
    size: 'large',
    onClick: onStartGame,
    className: 'landing__cta-button',
  }));

  heroCTA.appendChild(createButton({
    text: '게임 설명',
    variant: 'secondary',
    size: 'large',
    onClick: onShowTutorial,
  }));

  // 하단 보조 버튼들
  const subButtons = createElement('div', {
    className: 'landing__sub-buttons',
  });

  if (onShowMemory) {
    subButtons.appendChild(createButton({
      text: 'AI의 기억',
      variant: 'ghost',
      size: 'small',
      onClick: onShowMemory,
    }));
  }

  if (onShowHistory) {
    subButtons.appendChild(createButton({
      text: '기록',
      variant: 'ghost',
      size: 'small',
      onClick: onShowHistory,
    }));
  }

  if (onShowPremium) {
    subButtons.appendChild(createButton({
      text: 'Premium',
      variant: 'ghost',
      size: 'small',
      onClick: onShowPremium,
    }));
  }

  if (onResetMemory) {
    subButtons.appendChild(createButton({
      text: '기억 삭제',
      variant: 'ghost',
      size: 'small',
      onClick: () => {
        if (confirm('AI의 모든 기억을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
          onResetMemory();
        }
      },
    }));
  }

  heroSection.appendChild(title);
  heroSection.appendChild(subtitle);
  heroSection.appendChild(subtitleCont);
  heroSection.appendChild(gameIntro);
  heroSection.appendChild(modeSection);
  heroSection.appendChild(nameInputSection);
  if (memorySubtitle) {
    heroSection.appendChild(memorySubtitle);
  }
  heroSection.appendChild(heroCTA);
  heroSection.appendChild(subButtons);

  screen.appendChild(heroSection);

  // ========== Footer ==========
  const footer = createElement('footer', {
    className: 'landing__footer',
  });

  footer.appendChild(createElement('p', {
    className: 'landing__footer-text',
    textContent: '© 2026 MindTrap. v1.0.0',
  }));

  screen.appendChild(footer);

  const show = () => {
    screen.classList.add('active', 'fade-in');
  };

  const hide = () => {
    screen.classList.remove('active');
    screen.classList.remove('fade-in');
  };

  const updateMemorySummary = (summary) => {
    if (!memorySubtitle) return;
    latestMemorySummary = summary;
    memorySubtitle.textContent = buildMemoryText(latestMemorySummary, nameInput.value.trim());
  };

  return {
    element: screen,
    show,
    hide,
    updateMemorySummary,
  };
};
