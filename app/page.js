'use client';

import { useEffect, useRef, useState } from 'react';

function getRuntimeConfig() {
  return {
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
    OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
    openRouter: {
      apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
      modelId: process.env.NEXT_PUBLIC_OPENROUTER_MODEL_ID || '',
    },
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
    },
  };
}

/* ---------- Scroll reveal hook ---------- */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.lp__reveal');
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('lp__reveal--in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ---------- Animated counter hook ---------- */
function useCounter(target, duration = 1600) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now) => {
              const p = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              setVal(Math.round(eased * target));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [target, duration]);

  return [val, ref];
}

/* ---------- Landing Page Component ---------- */
function LandingPage({ onStart }) {
  useReveal();
  const [rounds, roundsRef] = useCounter(20);
  const [modules, modulesRef] = useCounter(6);
  const [accuracy, accuracyRef] = useCounter(92);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="lp">
      {/* Nav */}
      <nav className="lp__nav">
        <div className="lp__nav-logo">MindTrap</div>
        <div className="lp__nav-links">
          <button className="lp__nav-link" onClick={scrollTo('how')}>게임 방식</button>
          <button className="lp__nav-link" onClick={scrollTo('features')}>기능</button>
          <button className="lp__nav-link" onClick={scrollTo('ai')}>AI 성격</button>
          <button className="lp__nav-link" onClick={scrollTo('tech')}>기술</button>
        </div>
        <button className="lp__nav-cta" onClick={onStart}>START</button>
      </nav>

      {/* Hero */}
      <header className="lp__hero">
        <div className="lp__hero-badge">
          <span className="lp__hero-badge-dot" />
          AI 심리 분석 웹게임 · 실시간 행동 예측
        </div>
        <h1 className="lp__hero-title">
          AI는 당신을 <span className="grad">분석</span>합니다.
          <br />
          그리고 <span className="grad">기억</span>합니다.
        </h1>
        <p className="lp__hero-sub">
          정답을 맞히는 게임이 아닙니다. 제한 시간 안에서 드러나는 <strong>선택 습관</strong>을
          AI가 읽어내는 심리 분석 게임입니다. <strong>망설임, 반복, 마음을 바꾸는 타이밍</strong>까지
          모두 하나의 행동 프로필로 기록됩니다.
        </p>
        <div className="lp__hero-cta">
          <button className="lp__btn lp__btn--primary" onClick={onStart}>
            지금 분석받기 →
          </button>
          <button className="lp__btn lp__btn--ghost" onClick={scrollTo('how')}>
            게임 설명 보기
          </button>
        </div>
        <div className="lp__hero-trust">
          <span>● 20라운드 분석</span>
          <span>● 실시간 AI 예측</span>
          <span>● 행동 프로필 리포트</span>
          <span>● 재방문 시 더 깊은 분석</span>
        </div>

        {/* AI Scan visual */}
        <div className="lp__scan">
          <div className="lp__scan-head">
            <div className="lp__scan-avatar">AI</div>
            MindTrap AI · 실시간 분석 중
          </div>
          <p className="lp__scan-line">&ldquo;이번 선택은 예상과 달랐습니다. 흥미롭군요.&rdquo;</p>
          <p className="lp__scan-line lp__scan-line--muted">
            망설임 1.2s · 일관성 낮음 · 패턴 수정 감지 · 신뢰도 72%
          </p>
          <div className="lp__scan-bar">
            <div className="lp__scan-bar-fill" />
          </div>
        </div>
      </header>

      {/* Hook Quote */}
      <section className="lp__hook lp__reveal">
        <p className="lp__hook-quote">
          &ldquo;당신이 선택을 바꾸는 순간, <br />
          <span className="accent">AI는 당신의 망설임까지 분석합니다.</span>&rdquo;
        </p>
        <p className="lp__hook-sub">
          20개의 라운드. 매 선택마다 AI는 당신을 더 정확하게 예측하려 합니다.
          의도적으로 속이려 하거나 패턴을 꼬아 교란해도, <strong>그 저항의 방식마저 당신의 진짜 행동 습관으로 분석됩니다.</strong>
          그리고 다시 찾아왔을 때, AI는 과거의 데이터와 결합해 당신조차 몰랐던 일관된 행동 특성을 완벽히 도출해 냅니다.
        </p>
      </section>

      {/* How it works */}
      <section id="how" className="lp__section">
        <div className="lp__section-head lp__reveal">
          <div className="lp__eyebrow">How it works</div>
          <h2 className="lp__section-title">4단계로 당신을 분석합니다</h2>
          <p className="lp__section-desc">
            간단한 선택이 모여 하나의 행동 프로필이 됩니다. AI는 라운드가 진행될수록
            당신을 더 깊이 이해합니다.
          </p>
        </div>
        <div className="lp__steps">
          <div className="lp__step lp__reveal">
            <div className="lp__step-num">1</div>
            <h3 className="lp__step-title">선택하세요</h3>
            <p className="lp__step-desc">각 라운드에서 2개 또는 4개의 선택지 중 하나를 고릅니다. 10초의 제한 시간 안에서 당신의 성향과 행동패턴이 드러납니다.</p>
          </div>
          <div className="lp__step lp__reveal">
            <div className="lp__step-num">2</div>
            <h3 className="lp__step-title">AI가 기록하고 예측합니다</h3>
            <p className="lp__step-desc">AI가 당신의 선택을 기록하고 다음 선택을 예측합니다. 무엇을 골랐는지만 보는것이 아니라 선택의 방향, 반응 속도, 커서의 흔들림, 선택을 바꾸는 순간, 일부러 늦춘 반응까지 모두 분석의 단서가 됩니다.</p>
          </div>
          <div className="lp__step lp__reveal">
            <div className="lp__step-num">3</div>
            <h3 className="lp__step-title">의도적 교란</h3>
            <p className="lp__step-desc">일부러 예측을 벗어나려고 심리전을 시도해 보세요. 하지만 AI는 그 교란 시도마저 새로운 패턴으로 학습하고 흡수합니다.</p>
          </div>
          <div className="lp__step lp__reveal">
            <div className="lp__step-num">4</div>
            <h3 className="lp__step-title">분석 결과를 확인하세요</h3>
            <p className="lp__step-desc">게임 종료 후 AI가 당신을 분석한 상세 리포트와 행동 프로필을 받습니다. 총 33개의 유형 중 당신은 과연 어떤 유형일까요? 당신의 분석 결과는 기록되어 다음 플레이에서는 더 정확한 분석이 가능해집니다. AI의 기억을 원하지 않을 경우 기억 삭제를 해주세요.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="lp__section">
        <div className="lp__section-head lp__reveal">
          <div className="lp__eyebrow">Features</div>
          <h2 className="lp__section-title">단순한 게임이 아닌, 분석 시스템</h2>
          <p className="lp__section-desc">
            행동 특성 모델링, 패턴 학습, 예측 엔진까지. MindTrap은 게임 플레이 그 자체로
            하나의 AI 분석 과정입니다.
          </p>
        </div>
        <div className="lp__features">
          <div className="lp__feature lp__reveal">
            <div className="lp__feature-icon">🧠</div>
            <h3 className="lp__feature-title">AI 학습 엔진</h3>
            <p className="lp__feature-desc">20라운드 동안 선택 패턴, 반응 속도, 일관성을 실시간으로 분석합니다.</p>
          </div>
          <div className="lp__feature lp__reveal">
            <div className="lp__feature-icon">🎯</div>
            <h3 className="lp__feature-title">예측 엔진</h3>
            <p className="lp__feature-desc">학습된 데이터를 기반으로 다음 선택을 예측하고, 빗나가면 가설을 수정합니다.</p>
          </div>
          <div className="lp__feature lp__reveal">
            <div className="lp__feature-icon">💾</div>
            <h3 className="lp__feature-title">Firebase Memory</h3>
            <p className="lp__feature-desc">게임 데이터를 저장하여 AI가 당신을 기억하고, 다음 게임을 더 정확하게 예측합니다.</p>
          </div>
          <div className="lp__feature lp__reveal">
            <div className="lp__feature-icon">📊</div>
            <h3 className="lp__feature-title">AI 분석 리포트</h3>
            <p className="lp__feature-desc">게임 종료 후 행동 프로필, 신뢰도, 분석 시그널이 담긴 상세 리포트를 제공합니다.</p>
          </div>
          <div className="lp__feature lp__reveal">
            <div className="lp__feature-icon">📖</div>
            <h3 className="lp__feature-title">Memory Book</h3>
            <p className="lp__feature-desc">AI가 기억하는 당신의 모습을 확인하세요. 다시 찾아올수록 더 깊이 분석됩니다.</p>
          </div>
          <div className="lp__feature lp__reveal">
            <div className="lp__feature-icon">📱</div>
            <h3 className="lp__feature-title">반응형 디자인</h3>
            <p className="lp__feature-desc">Glassmorphism 기반 UI로 Desktop, Tablet, Mobile 모두 자연스럽게 동작합니다.</p>
          </div>
        </div>
      </section>

      {/* AI Personality */}
      <section id="ai" className="lp__section">
        <div className="lp__persona">
          <div className="lp__persona-card lp__reveal">
            <p className="lp__persona-line">&ldquo;처음 뵙겠습니다. 제가 당신을 처음 분석해보겠습니다.&rdquo;</p>
            <p className="lp__persona-line">&ldquo;이번 선택은 예상과 달랐습니다. 흥미롭군요.&rdquo;</p>
            <p className="lp__persona-line">&ldquo;조금씩 당신을 이해하고 있습니다.&rdquo;</p>
            <p className="lp__persona-line">&ldquo;당신을 충분히 분석했습니다.&rdquo;</p>
            <div className="lp__persona-traits">
              <span className="lp__trait">차분함</span>
              <span className="lp__trait">논리적</span>
              <span className="lp__trait">감정 절제</span>
              <span className="lp__trait">존중</span>
              <span className="lp__trait">조롱 없음</span>
            </div>
          </div>
          <div className="lp__persona-text lp__reveal">
            <h3>차분하고 논리적인 AI</h3>
            <p>
              MindTrap AI는 조롱하지 않습니다. 이모지도, 유행어도 쓰지 않습니다.
              당신의 선택을 담담하게 관찰하고, 틀리면 인정하며, 맞추면 조용히 확신합니다.
            </p>
            <p>
              게임이 진행될수록 AI의 자신감은 올라갑니다. &ldquo;아직 당신을 잘 모르겠습니다&rdquo;에서
              시작해 &ldquo;이제 당신을 분석할 수 있습니다&rdquo;에 이르기까지, AI의 대사가 변합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="lp__section">
        <div className="lp__stats lp__reveal">
          <div ref={roundsRef}>
            <div className="lp__stat-num">{rounds}</div>
            <div className="lp__stat-label">분석 라운드</div>
          </div>
          <div ref={modulesRef}>
            <div className="lp__stat-num">{modules}+</div>
            <div className="lp__stat-label">AI 엔진 모듈</div>
          </div>
          <div ref={accuracyRef}>
            <div className="lp__stat-num">{accuracy}%</div>
            <div className="lp__stat-label">평균 예측 정확도</div>
          </div>
          <div>
            <div className="lp__stat-num">∞</div>
            <div className="lp__stat-label">재방문 분석</div>
          </div>
        </div>
      </section>

      {/* Tech */}
      <section id="tech" className="lp__section">
        <div className="lp__section-head lp__reveal">
          <div className="lp__eyebrow">Tech Stack</div>
          <h2 className="lp__section-title">만들어진 기술</h2>
          <p className="lp__section-desc">
            Next.js, React, Firebase, 그리고 OpenRouter 기반의 AI 엔진으로 구축되었습니다.
          </p>
        </div>
        <div className="lp__tech lp__reveal">
          <span className="lp__tech-chip">Next.js</span>
          <span className="lp__tech-chip">React</span>
          <span className="lp__tech-chip">Firebase Auth</span>
          <span className="lp__tech-chip">Firestore</span>
          <span className="lp__tech-chip">OpenRouter · Gemini</span>
          <span className="lp__tech-chip">PlayerModel</span>
          <span className="lp__tech-chip">FeatureExtractor</span>
          <span className="lp__tech-chip">RuleEngine</span>
          <span className="lp__tech-chip">LearningEngine</span>
          <span className="lp__tech-chip">PredictionEngine</span>
          <span className="lp__tech-chip">MemoryEngine</span>
          <span className="lp__tech-chip">Glassmorphism UI</span>
        </div>
      </section>

      {/* Final CTA */}
      <section className="lp__final lp__reveal">
        <h2 className="lp__final-title">
          AI가 당신을 <span className="grad">기억</span>할 준비가 되었습니다.
        </h2>
        <p className="lp__final-sub">
          20라운드면 충분합니다. AI는 당신의 패턴을 읽고, 다음 선택을 예측하며,
          당신이 돌아왔을 때 다시 분석을 시작합니다. <strong>지금, AI 앞에 당신을 드러내세요.</strong>
        </p>
        <button className="lp__btn lp__btn--primary" onClick={onStart}>
          분석 시작하기 →
        </button>
      </section>

      {/* Footer */}
      <footer className="lp__footer">
        © 2026 MindTrap · AI는 당신을 분석합니다. 그리고 기억합니다.
      </footer>
    </div>
  );
}

/* ---------- Game Mount Component ---------- */
function GameMount() {
  const appRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    window.MINDTRAP_CONFIG = getRuntimeConfig();

    import('../src/main.js').then(({ initMindTrap }) => {
      if (!cancelled) {
        initMindTrap();
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="lp__game-mount">
      <button className="lp__game-back" onClick={() => window.location.reload()}>
        ← 랜딩으로
      </button>
      <div id="app" ref={appRef} />
    </div>
  );
}

/* ---------- Page ---------- */
export default function Home() {
  const [started, setStarted] = useState(false);

  if (started) {
    return <GameMount />;
  }

  return <LandingPage onStart={() => setStarted(true)} />;
}