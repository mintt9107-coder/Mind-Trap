/**
 * MindTrap - AI Service
 * OpenRouter를 통해 Gemini API를 호출합니다.
 * GameEngine은 이 서비스를 통해서만 Gemini와 통신합니다.
 *
 * @see {@link https://openrouter.ai/docs/quickstart}
 */

/**
 * AIService 클래스
 * OpenRouter API를 통한 Gemini 호출을 관리합니다.
 * 모델: google/gemini-3.5-flash
 */
export class AIService {
  constructor() {
    this.apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
    this.modelId = 'google/gemini-3.5-flash';
    this.apiKey = null;
    this.useMock = false;
    this.callHistory = [];
    this._loadConfig();
    this._usedDialogues = new Set();
  }

  _pickUniqueDialogue(pool) {
    const available = pool.filter((d) => !this._usedDialogues.has(d));
    if (available.length === 0) {
      pool.forEach((d) => this._usedDialogues.delete(d));
      return pool[Math.floor(Math.random() * pool.length)];
    }
    const selected = available[Math.floor(Math.random() * available.length)];
    this._usedDialogues.add(selected);
    return selected;
  }

  _loadConfig() {
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_OPENROUTER_API_KEY) {
      this.apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    }
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_OPENROUTER_MODEL_ID) {
      this.modelId = process.env.NEXT_PUBLIC_OPENROUTER_MODEL_ID;
    }
    if (typeof window !== 'undefined' && window.MINDTRAP_CONFIG?.OPENROUTER_API_KEY) {
      this.apiKey = window.MINDTRAP_CONFIG.OPENROUTER_API_KEY;
    }
    if (typeof window !== 'undefined' && window.MINDTRAP_CONFIG?.openRouter?.modelId) {
      this.modelId = window.MINDTRAP_CONFIG.openRouter.modelId;
    }
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.useMock = false;
  }

  setModelId(modelId) {
    if (modelId) {
      this.modelId = modelId;
    }
  }

  async chatCompletion({ messages, maxTokens = 500, temperature = 0.7 }) {
    const requestStart = Date.now();

    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured.');
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-OpenRouter-Title': 'MindTrap',
      };

      if (typeof window !== 'undefined' && window.location) {
        headers['HTTP-Referer'] = window.location.origin;
      }

      const requestBody = {
        model: this.modelId,
        messages,
        max_tokens: maxTokens,
        temperature,
        reasoning: { effort: 'low' },
      };

      console.log('AIService: Calling OpenRouter API...', { model: this.modelId, maxTokens });

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} ${errorText}`);
      }

      const data = await response.json();
      const requestTime = Date.now() - requestStart;
      const content = data.choices[0]?.message?.content || '';

      console.log('AIService: API response received', {
        requestTime,
        contentLength: content.length,
        usage: data.usage,
      });

      this.callHistory.push({
        timestamp: Date.now(),
        requestTime,
        model: this.modelId,
        tokenUsage: data.usage,
        success: true,
      });

      return { content, usage: data.usage, requestTime };
    } catch (error) {
      console.error('AIService Error:', error);
      throw error;
    }
  }

  async _getMockResponse(messages) {
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));

    const userMessage = messages.find((m) => m.role === 'user');
    const content = userMessage?.content || '';

    // 프롬프트에서 정보 추출
    const roundMatch = content.match(/라운드:\s*(\d+)/);
    const round = roundMatch ? parseInt(roundMatch[1], 10) : 0;
    const reactionMatch = content.match(/반응 시간:\s*(\d+)ms/);
    const reactionTime = reactionMatch ? parseInt(reactionMatch[1], 10) : 0;
    const isTimeout = content.includes('시간 초과: 예');
    const isChoiceReaction = content.includes('[Choice Detail]') || content.includes('[Behavior Detail]');

    // 질문 타입 추론
    let qType = null;
    if (content.includes('위험') || content.includes('안전')) qType = 'risk';
    else if (content.includes('공격') || content.includes('방어')) qType = 'combat';
    else if (content.includes('왼쪽') || content.includes('오른쪽')) qType = 'direction';
    else if (content.includes('기다리') || content.includes('즉시') || content.includes('인내')) qType = 'time';
    else if (content.includes('보상') || content.includes('높은') || content.includes('낮은')) qType = 'reward';
    else if (content.includes('신뢰') || content.includes('의심')) qType = 'emotion';
    else if (content.includes('빠르게') || content.includes('천천히') || content.includes('속도')) qType = 'speed';

    // 타입별 심리전 대사
    const typeDialogues = {
      risk: ['위험과 안전의 경계에서 당신의 선택은 본성을 드러냅니다.', '도박인가, 확실함인가. 이것이 당신의 위험 성향을 말해줍니다.'],
      combat: ['공격과 방어. 위협 앞에서 당신은 어떤 타입입니까?', '대결 상황의 선택은 투쟁 본능을 드러냅니다.'],
      direction: ['방향 선택은 본능적입니다. 당신의 직감은 어디를 향하나요?', '공간적 직감이 당신의 무의식을 드러냅니다.'],
      time: ['기다림과 행동. 인내심은 가장 드러나는 심리 지표입니다.', '시간 압박 속에서 당신의 본성이 드러납니다.'],
      reward: ['보상의 크기와 확실성. 당신은 무엇을 우선합니까?', '욕심과 신중함, 이 선택은 당신의 가치관을 반영합니다.'],
      emotion: ['신뢰와 의심. AI를 대하는 당신의 태도가 흥미롭습니다.', '저를 믿으시겠습니까? 이 질문 자체가 심리전입니다.'],
      speed: ['빠름과 느림. 결정 방식이 일관된 패턴을 만듭니다.', '직관과 사려 깊음. 당신은 어느 쪽에 기울어져 있나요?'],
    };

    // 라운드별 기본 대사 풀
    const earlyPool = [
      '아직 당신을 잘 모르겠습니다. 매 선택에는 무의식이 드러납니다.',
      '데이터가 부족합니다. 하지만 첫 인상은 중요하죠.',
      '초기 선택은 습관을 반영합니다. 당신의 습관은 무엇인가요?',
      '아직 가설을 세우기 이릅니다. 하지만 무언가가 보이기 시작했습니다.',
    ];
    const midPool = [
      '당신의 선택 경향이 읽히기 시작했습니다. 이제부터가 진짜 심리전입니다.',
      '패턴이 보입니다. 의식적으로 바꾸려 하나요, 본능을 따르나요?',
      '당신은 일관된 경향을 보이고 있습니다. 벗어날 수 있을까요?',
      '선택 속에서 갈등이 보입니다. 무엇을 망설이고 있나요?',
      '데이터가 쌓이고 있습니다. 당신은 생각보다 투명합니다.',
    ];
    const latePool = [
      '당신의 선택이 예측 가능해지기 시작했습니다. 자유 의지를 증명하시겠습니까?',
      '당신의 패턴이 명확해졌습니다. 다음 선택도 예측하고 있습니다.',
      '당신을 충분히 분석했습니다. 압박 속에서 일관성을 유지하려는 경향이 강합니다.',
      '당신은 예상 밖으로 보이려 하고 있습니다. 흥미롭군요.',
    ];

    let responseContent = '';

    // 1. 게임 시작
    if (content.includes('게임 시작')) {
      const startPool = [
        '처음 뵙겠습니다. 첫 선택을 하기 전부터 이미 망설임은 시작됩니다.',
        '안녕하세요. 숨기려는 순간, 오히려 심리는 더 선명해집니다.',
        '시작하죠. 예상 밖의 선택을 해도, 그 이유까지 숨기기는 어렵습니다.',
      ];
      responseContent = this._pickUniqueDialogue(startPool);
    }
    // 2. 분석 리포트 (AIEngine에서 별도 처리)
    else if (content.includes('AI Analysis Report') || content.includes('분석 리포트')) {
      responseContent = '## AI Analysis Report\n\n**예측 성공률**: 50%';
    }
    // 3. 예측 결과
    else if (content.includes('결과: 성공')) {
      const pool = [
        '예상대로입니다. 당신의 일관성이 예측을 가능하게 합니다.',
        '역시 이 선택을 하셨군요. 패턴에서 벗어나지 못했습니다.',
        '읽었습니다. 당신의 선택은 데이터가 예측한 대로입니다.',
        '선택 경향이 감지되었습니다. 당신은 자신의 패턴을 인식하고 있습니까?',
      ];
      const base = this._pickUniqueDialogue(pool);
      const typeD = qType ? typeDialogues[qType][Math.floor(Math.random() * typeDialogues[qType].length)] : '';
      responseContent = typeD ? `${base} ${typeD}` : base;
    } else if (content.includes('결과: 실패')) {
      const pool = [
        '흥미롭군요. 예상과 달랐습니다. 가설을 수정하겠습니다.',
        '이번 선택은 예상 밖입니다. 의도인가요, 본능인가요?',
        '예상을 벗어나는 선택. 당신이 더 흥미로워졌습니다.',
        '틀렸습니다. 하지만 이것도 데이터입니다. 새 가설이 필요합니다.',
      ];
      const base = this._pickUniqueDialogue(pool);
      const typeD = qType ? typeDialogues[qType][Math.floor(Math.random() * typeDialogues[qType].length)] : '';
      responseContent = typeD ? `${base} ${typeD}` : base;
    }
    // 4. 선택 반응 (행동 정보가 있는 경우)
    else if (isChoiceReaction) {
      if (isTimeout) {
        const pool = [
          '시간 초과. 10초 안에 결정하지 못하셨네요. 선택하지 않는 것도 데이터입니다.',
          '결정을 내리지 못했군요. 압박 속에서 멈추는 타입이신 것 같습니다.',
          '시간이 다 됐습니다. 망설임이 길어지면 결정을 회피하는 패턴이 됩니다.',
        ];
        responseContent = this._pickUniqueDialogue(pool);
      } else if (reactionTime > 0 && reactionTime < 1500) {
        const pool = [
          '빠르게 결정하세요. 망설임이 줄어들수록 본심은 더 쉽게 튀어나옵니다.',
          '거의 망설이지 않았네요. 확신이었을까요, 생각하기 싫었던 걸까요?',
          '방금은 손이 먼저 움직였습니다. 이런 순간이 제일 솔직합니다.',
        ];
        responseContent = this._pickUniqueDialogue(pool);
      } else if (reactionTime > 3000) {
        const pool = [
          '망설이는 시간이 길었네요. 무언가 갈등이 있었던 건가요?',
          '신중하시군요. 하지만 신중함도 하나의 패턴이 될 수 있습니다.',
          '오래 고민하셨습니다. 무엇이 당신을 이렇게 망설이게 했나요?',
        ];
        responseContent = this._pickUniqueDialogue(pool);
      } else {
        const pool = qType ? typeDialogues[qType] : earlyPool;
        responseContent = this._pickUniqueDialogue(pool);
      }
    }
    // 5. 라운드 진행 대사
    else {
      let pool;
      if (round <= 5) pool = earlyPool;
      else if (round <= 12) pool = midPool;
      else pool = latePool;

      const base = this._pickUniqueDialogue(pool);
      const typeD = qType ? typeDialogues[qType][Math.floor(Math.random() * typeDialogues[qType].length)] : '';
      responseContent = typeD ? `${base} ${typeD}` : base;
    }

    return {
      content: responseContent,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      requestTime: 0,
      isMock: true,
    };
  }

  async generateDialogue(systemPrompt, userMessage) {
    const response = await this.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      maxTokens: 300,
      temperature: 0.6,
    });
    return response.content;
  }

  async generateAnalysisReport(systemPrompt, analysisRequest) {
    const response = await this.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: analysisRequest },
      ],
      maxTokens: 1200,
      temperature: 0.5,
    });
    return response.content;
  }

  getStatus() {
    return {
      apiKey: this.apiKey ? 'configured' : 'not_configured',
      useMock: this.useMock,
      callCount: this.callHistory.length,
      lastCall: this.callHistory.length > 0 ? this.callHistory[this.callHistory.length - 1] : null,
    };
  }

  getCallHistory() {
    return [...this.callHistory];
  }

  reset() {
    this.callHistory = [];
  }
}
