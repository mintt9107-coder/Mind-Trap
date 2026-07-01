/**
 * MindTrap - Question Generator
 * 20개의 라운드마다 중복되지 않는 다양한 질문을 생성합니다.
 * 각 질문은 질문 텍스트와 그에 맞는 선택지 쌍으로 구성됩니다.
 * 심리적 유혹(4선택지) 질문과 2단계 선택지 기능을 지원합니다.
 */

import {
  QUESTION_TYPES,
  GAME_CONFIG,
} from '../utils/constants.js';
import { shuffleArray, getRandomElement } from '../utils/helpers.js';

/**
 * 질문-선택지 쌍 풀
 * 각 질문마다 그에 맞는 선택지를 가집니다.
 * primary/secondary는 2선택지, A/B/C/D는 4선택지입니다.
 */
const QUESTION_POOL = [
  // ========== DIRECTION ==========
  { type: QUESTION_TYPES.DIRECTION, prompt: '낯선 미로의 끝에서 두 개의 문이 있습니다. 왼쪽 문에서 희미한 빛이, 오른쪽 문에서 바람이 느껴집니다. 어느 쪽으로 가시겠습니까?', choices: { primary: '빛이 새어 나오는 왼쪽 문', secondary: '바람이 부는 오른쪽 문' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '길을 잃었습니다. 왼쪽에는 낯익은 풍경이, 오른쪽에는 전혀 모르는 길이 있습니다. 어디로 가시겠습니까?', choices: { primary: '낯익은 왼쪽 길', secondary: '미지의 오른쪽 길' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '두 갈래 길 앞에 섰습니다. 한쪽은 곧게 뻗어 있고, 다른 쪽은 굽어 있습니다. 당신의 발은 어느 쪽을 향합니까?', choices: { primary: '곧게 뻗은 길', secondary: '굽어 있는 길' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '갈림길에서 직감이 말합니다. 왼쪽으로 가야 한다고. 하지만 논리는 오른쪽을 가리킵니다. 어디로?', choices: { primary: '직감을 따라 왼쪽', secondary: '논리를 따라 오른쪽' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '어둠 속에서 두 개의 통로가 보입니다. 하나는 좁고 하나는 넓습니다. 어느 쪽으로?', choices: { primary: '좁은 통로', secondary: '넓은 통로' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '지도에는 표시되지 않은 계단과 사람들이 자주 다닌 복도가 있습니다. 당신은 어느 쪽을 택하겠습니까?', choices: { primary: '지도에 없는 계단', secondary: '사람들이 지나간 복도' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '안내 표지판은 직진을 가리키지만, 왼쪽 벽 너머에서 작은 소리가 들립니다. 어떻게 움직이시겠습니까?', choices: { primary: '소리가 나는 왼쪽으로 간다', secondary: '표지판을 따라 직진한다' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '엘리베이터는 느리지만 안전해 보이고, 비상계단은 빠르지만 어둡습니다. 무엇을 선택하시겠습니까?', choices: { primary: '어두운 비상계단', secondary: '느린 엘리베이터' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '앞에는 열린 문이 있고, 옆에는 닫혀 있지만 잠기지 않은 문이 있습니다. 어느 문이 더 끌립니까?', choices: { primary: '닫혀 있지만 잠기지 않은 문', secondary: '이미 열려 있는 문' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '두 길 모두 목적지로 이어진다고 합니다. 하나는 조용하고, 하나는 사람들이 많습니다. 어느 길로 가시겠습니까?', choices: { primary: '조용한 길', secondary: '사람들이 많은 길' } },

  // ========== COMBAT ==========
  { type: QUESTION_TYPES.COMBAT, prompt: 'AI가 당신의 패턴을 읽고 있다고 밝혔습니다. 먼저 움직여 패턴을 깨시겠습니까, 아니면 AI의 움직임을 기다리시겠습니까?', choices: { primary: '먼저 공격하여 패턴을 깬다', secondary: '기다리며 AI의 움직임을 본다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: 'AI가 도발합니다. "네 다음 수를 알고 있다"고요. 감정적으로 대응하시겠습니까, 이성적으로 무시하시겠습니까?', choices: { primary: '감정적으로 맞선다', secondary: '이성적으로 무시한다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: 'AI와의 대결에서 한 발 뒤로 물러서면 더 큰 기회가 올 수 있습니다. 하지만 물러서는 것은 패배처럼 느껴집니다. 어떻게 하시겠습니까?', choices: { primary: '물러서지 않고 계속 공격', secondary: '한 발 물러서서 기회를 노린다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: 'AI가 압박해옵니다. 시간이 줄어들고 있습니다. 맞서 싸우시겠습니까, 전략적 후퇴를 하시겠습니까?', choices: { primary: '끝까지 맞선다', secondary: '전략적으로 후퇴한다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '예측된 패턴을 깰 기회가 왔습니다. 익숙한 방식으로 가시겠습니까, 아니면 예상을 벗어나시겠습니까?', choices: { primary: '익숙한 방식을 고수한다', secondary: '예상을 벗어나는 선택을 한다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '상대가 일부러 빈틈을 보입니다. 함정일 수도 있습니다. 바로 들어가시겠습니까, 거리를 두시겠습니까?', choices: { primary: '빈틈을 바로 파고든다', secondary: '거리를 두고 지켜본다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '상대가 침묵합니다. 먼저 말을 걸어 흐름을 만들겠습니까, 침묵을 유지하겠습니까?', choices: { primary: '먼저 흐름을 만든다', secondary: '침묵을 유지한다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '당신의 전략이 읽힌 것 같습니다. 그대로 밀어붙이시겠습니까, 즉시 방식을 바꾸시겠습니까?', choices: { primary: '그대로 밀어붙인다', secondary: '즉시 방식을 바꾼다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '상대가 당신의 실수를 기다리고 있습니다. 빠르게 결론을 내겠습니까, 한 번 더 확인하겠습니까?', choices: { primary: '빠르게 결론을 낸다', secondary: '한 번 더 확인한다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '정면으로 부딪히면 손해가 클 수 있습니다. 그래도 주도권을 잡겠습니까, 흐름을 넘겨주겠습니까?', choices: { primary: '주도권을 잡는다', secondary: '흐름을 넘겨준다' } },

  // ========== RISK ==========
  { type: QUESTION_TYPES.RISK, prompt: '모 아니면 도. 큰 것을 걸고 한 판 승부하시겠습니까, 아니면 조금씩 안전하게 가시겠습니까?', choices: { primary: '큰 것을 건다', secondary: '조금씩 안전하게 간다' } },
  { type: QUESTION_TYPES.RISK, prompt: '안전한 길과 위험한 지름길이 있습니다. 지름길은 빠르지만 잃을 수도 있습니다. 어느 쪽으로?', choices: { primary: '위험한 지름길', secondary: '안전한 길' } },
  { type: QUESTION_TYPES.RISK, prompt: '성공하면 크게 앞서갈 수 있지만 실패하면 기회를 잃습니다. 그래도 도전하시겠습니까?', choices: { primary: '크게 앞설 기회에 도전한다', secondary: '기회를 지키며 안정적으로 간다' } },
  { type: QUESTION_TYPES.RISK, prompt: '잃을 수 있는 것과 얻을 수 있는 것. 당신은 무엇에 더 민감합니까? 지금 선택이 그것을 드러냅니다.', choices: { primary: '잃을 것을 두려워하지 않는다', secondary: '잃지 않는 것을 우선한다' } },
  { type: QUESTION_TYPES.RISK, prompt: '결과를 알 수 없는 도박과, 확실하지만 작은 보상이 있습니다. 당신의 선택은?', choices: { primary: '결과를 알 수 없는 도박', secondary: '확실하지만 작은 보상' } },
  { type: QUESTION_TYPES.RISK, prompt: '새로운 제안은 매력적이지만 검증되지 않았습니다. 기존 선택은 지루하지만 안정적입니다. 어느 쪽입니까?', choices: { primary: '검증되지 않은 새 제안', secondary: '지루하지만 안정적인 선택' } },
  { type: QUESTION_TYPES.RISK, prompt: '성공하면 모두가 주목하지만, 실패하면 바로 드러납니다. 도전하시겠습니까, 조용히 지나가시겠습니까?', choices: { primary: '주목받는 도전', secondary: '조용한 안정' } },
  { type: QUESTION_TYPES.RISK, prompt: '누군가 확신에 찬 목소리로 위험을 감수하라고 합니다. 그 확신을 믿겠습니까, 직접 계산하겠습니까?', choices: { primary: '확신을 믿고 움직인다', secondary: '직접 계산하고 움직인다' } },
  { type: QUESTION_TYPES.RISK, prompt: '작은 손해를 감수하면 더 큰 가능성이 열립니다. 지금 손해를 받아들이시겠습니까?', choices: { primary: '작은 손해를 감수한다', secondary: '손해를 피한다' } },
  { type: QUESTION_TYPES.RISK, prompt: '실패 확률은 낮지만 실패했을 때 타격이 큽니다. 그래도 선택하시겠습니까?', choices: { primary: '타격을 감수하고 선택한다', secondary: '타격 가능성을 피한다' } },

  // ========== TIME ==========
  { type: QUESTION_TYPES.TIME, prompt: '기다리면 더 좋은 결과가 올 수 있습니다. 하지만 언제까지 기다릴 수 있을까요? 기다리시겠습니까, 지금 행동하시겠습니까?', choices: { primary: '더 좋은 결과를 기다린다', secondary: '지금 당장 행동한다' } },
  { type: QUESTION_TYPES.TIME, prompt: '시간이 흐를수록 AI가 당신을 더 읽어냅니다. 빠른 결정으로 벗어나시겠습니까, 신중함을 유지하시겠습니까?', choices: { primary: '빠르게 결정한다', secondary: '신중하게 천천히 결정한다' } },
  { type: QUESTION_TYPES.TIME, prompt: '지금 당장 결정해야 합니다. 생각할 시간은 충분하지 않습니다. 기다림의 가치를 믿으시겠습니까, 즉시 행동하시겠습니까?', choices: { primary: '기다림의 가치를 믿는다', secondary: '즉시 행동한다' } },
  { type: QUESTION_TYPES.TIME, prompt: '인내심을 시험합니다. 끝까지 버티는 편입니까, 빠르게 결단하는 편입니까?', choices: { primary: '끝까지 버틴다', secondary: '빠르게 결단한다' } },
  { type: QUESTION_TYPES.TIME, prompt: '시간이 멈춘 것 같습니다. 기다림의 끝에 무엇이 있을까요? 멈춰 서서 기다리시겠습니까, 움직이시겠습니까?', choices: { primary: '멈춰 서서 기다린다', secondary: '움직인다' } },
  { type: QUESTION_TYPES.TIME, prompt: '조금만 더 기다리면 정보가 늘어납니다. 하지만 지금 결정하면 흐름을 잡을 수 있습니다. 무엇을 택합니까?', choices: { primary: '정보를 더 기다린다', secondary: '지금 흐름을 잡는다' } },
  { type: QUESTION_TYPES.TIME, prompt: '상대가 당신의 망설임을 보고 있습니다. 그래도 시간을 쓰겠습니까, 바로 선택하겠습니까?', choices: { primary: '시간을 쓰고 확인한다', secondary: '바로 선택한다' } },
  { type: QUESTION_TYPES.TIME, prompt: '마감 직전입니다. 완성도를 더 높이겠습니까, 지금 제출하겠습니까?', choices: { primary: '완성도를 더 높인다', secondary: '지금 제출한다' } },
  { type: QUESTION_TYPES.TIME, prompt: '기다리는 동안 불안은 커지고 있습니다. 불안을 견디겠습니까, 행동으로 줄이겠습니까?', choices: { primary: '불안을 견디며 기다린다', secondary: '행동으로 불안을 줄인다' } },
  { type: QUESTION_TYPES.TIME, prompt: '좋은 타이밍을 기다리다 기회를 놓칠 수도 있습니다. 더 기다리시겠습니까?', choices: { primary: '좋은 타이밍을 기다린다', secondary: '지금 기회를 잡는다' } },

  // ========== REWARD ==========
  { type: QUESTION_TYPES.REWARD, prompt: '지금 100을 받거나, 내일 200을 받을 수 있습니다. 당신의 선택은?', choices: { primary: '지금 100을 받는다', secondary: '내일 200을 기다린다' } },
  { type: QUESTION_TYPES.REWARD, prompt: '50% 확률로 큰 보상, 100% 확률로 작은 보상. 당신은 어느 쪽을 선택하시겠습니까?', choices: { primary: '50% 확률로 큰 보상', secondary: '100% 확률로 작은 보상' } },
  { type: QUESTION_TYPES.REWARD, prompt: '확실한 작은 보상과 성공하면 더 커지는 기회가 있습니다. 무엇을 택하시겠습니까?', choices: { primary: '더 커질 수 있는 기회', secondary: '확실한 작은 보상' } },
  { type: QUESTION_TYPES.REWARD, prompt: '보상의 크기와 확률. 당신은 어느 것에 더 끌립니까?', choices: { primary: '크기에 끌린다', secondary: '확률에 끌린다' } },
  { type: QUESTION_TYPES.REWARD, prompt: '더 큰 보상을 노리면 결과가 흔들릴 수 있습니다. 그래도 보상의 크기를 우선하시겠습니까?', choices: { primary: '더 큰 보상을 노린다', secondary: '확실한 결과를 고른다' } },
  { type: QUESTION_TYPES.REWARD, prompt: '지금 작은 칭찬을 받거나, 나중에 더 큰 인정을 받을 수 있습니다. 무엇을 원하십니까?', choices: { primary: '지금 작은 칭찬', secondary: '나중의 큰 인정' } },
  { type: QUESTION_TYPES.REWARD, prompt: '남들이 부러워할 성과와 스스로 만족할 결과 중 하나만 고를 수 있습니다. 어느 쪽입니까?', choices: { primary: '남들이 부러워할 성과', secondary: '스스로 만족할 결과' } },
  { type: QUESTION_TYPES.REWARD, prompt: '보상은 크지만 과정이 불편한 선택과, 보상은 작지만 마음이 편한 선택이 있습니다.', choices: { primary: '크지만 불편한 보상', secondary: '작지만 편한 보상' } },
  { type: QUESTION_TYPES.REWARD, prompt: '확실한 보너스와 불확실한 승진 기회가 동시에 주어졌습니다. 무엇을 고르시겠습니까?', choices: { primary: '불확실한 승진 기회', secondary: '확실한 보너스' } },
  { type: QUESTION_TYPES.REWARD, prompt: '당장 얻는 만족과 오래 남는 성취가 충돌합니다. 어느 쪽을 따르시겠습니까?', choices: { primary: '당장의 만족', secondary: '오래 남는 성취' } },

  // ========== EMOTION ==========
  { type: QUESTION_TYPES.EMOTION, prompt: 'AI가 당신의 마음을 읽었다고 주장합니다. 믿으시겠습니까, 경계하시겠습니까?', choices: { primary: 'AI를 믿는다', secondary: 'AI를 경계한다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: 'AI의 제안이 당신의 직감과 다릅니다. 누구를 따르시겠습니까?', choices: { primary: 'AI의 제안을 따른다', secondary: '자신의 직감을 따른다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: 'AI가 당신에게 호의를 보입니다. 받아들이시겠습니까, 의심하시겠습니까?', choices: { primary: '호의를 받아들인다', secondary: '호의를 의심한다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: 'AI가 분석 결과를 제시합니다. 그것을 받아들이시겠습니까, 의문을 품으시겠습니까?', choices: { primary: '분석을 받아들인다', secondary: '분석에 의문을 품는다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: 'AI가 당신을 이해한다고 말합니다. 그 말을 믿으시겠습니까, 경계하시겠습니까?', choices: { primary: '믿는다', secondary: '경계한다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: '누군가 당신의 선택을 칭찬합니다. 그 말을 그대로 받아들이겠습니까, 의도를 살피겠습니까?', choices: { primary: '칭찬을 받아들인다', secondary: '의도를 살핀다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: '상대가 미안하다고 말하지만 표정은 담담합니다. 사과를 믿겠습니까, 거리를 두겠습니까?', choices: { primary: '사과를 믿는다', secondary: '거리를 둔다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: '직감은 불편하다고 말하지만 근거는 부족합니다. 그 감각을 따르겠습니까?', choices: { primary: '불편한 직감을 따른다', secondary: '근거가 나올 때까지 보류한다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: 'AI가 당신의 이전 선택을 좋게 해석합니다. 위로로 받아들이겠습니까, 분석으로 받아들이겠습니까?', choices: { primary: '위로로 받아들인다', secondary: '분석으로 받아들인다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: '누군가 당신을 너무 잘 안다고 말합니다. 가까워진 느낌입니까, 침범당한 느낌입니까?', choices: { primary: '가까워진 느낌', secondary: '침범당한 느낌' } },

  // ========== SPEED ==========
  { type: QUESTION_TYPES.SPEED, prompt: '10초. 결정해야 합니다. 머리로 할까요, 가슴으로 할까요?', choices: { primary: '머리로 결정한다', secondary: '가슴으로 결정한다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '생각할 시간이 부족합니다. 직관에 맡기시겠습니까, 최대한 생각하시겠습니까?', choices: { primary: '직관에 맡긴다', secondary: '최대한 생각한다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '빠른 결정은 실수를, 느린 결정은 기회를 놓칠 수 있습니다. 당신은?', choices: { primary: '빠르게 결정한다', secondary: '느리더라도 신중하게' } },
  { type: QUESTION_TYPES.SPEED, prompt: '직관과 사려 깊음 사이에서, 당신은 어느 쪽에 더 가깝습니까?', choices: { primary: '직관에 가깝다', secondary: '사려 깊음에 가깝다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '반응 속도가 당신을 드러냅니다. 본능적으로 움직이시겠습니까, 의도적으로 늦추시겠습니까?', choices: { primary: '본능적으로 움직인다', secondary: '의도적으로 늦춘다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '첫 느낌은 이미 정해졌습니다. 바로 누르시겠습니까, 한 번 더 의심하시겠습니까?', choices: { primary: '바로 누른다', secondary: '한 번 더 의심한다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '너무 오래 생각하면 답이 흐려질 수 있습니다. 지금의 감각을 믿겠습니까?', choices: { primary: '지금의 감각을 믿는다', secondary: '조금 더 생각한다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '손은 이미 한쪽으로 움직였습니다. 그대로 따르겠습니까, 멈춰 세우겠습니까?', choices: { primary: '움직인 손을 따른다', secondary: '멈춰 세운다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '빠르게 고르면 솔직해지고, 늦게 고르면 계산이 섞입니다. 어느 쪽을 남기겠습니까?', choices: { primary: '솔직한 빠른 선택', secondary: '계산된 느린 선택' } },
  { type: QUESTION_TYPES.SPEED, prompt: '결정 버튼 앞에서 1초가 길게 느껴집니다. 그 1초를 쓰겠습니까, 버리겠습니까?', choices: { primary: '1초를 쓴다', secondary: '바로 버린다' } },

  // ========== TEMPTATION (4선택지) ==========
  { type: QUESTION_TYPES.TEMPTATION, prompt: '위기 상황에서 네 가지 정보가 들어옵니다. 무엇을 먼저 믿으시겠습니까?', choices: { A: '가장 먼저 들어온 정보', B: '다수가 선택한 정보', C: '전문가가 제시한 정보', D: '내 직감이 가리키는 정보' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: 'AI가 네 가지 제안을 합니다. 당신은 무엇을 먼저 신뢰하겠습니까?', choices: { A: 'AI가 첫 번째로 제시한 제안', B: '대중이 선호한 제안', C: '전문가 의견이 담긴 제안', D: '내 직감에 맞는 제안' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '혼란 속에서 네 가지 길이 보입니다. 무엇을 기준으로 선택하시겠습니까?', choices: { A: '가장 빠르게 도달할 수 있는 길', B: '가장 많은 사람이 간 길', C: '전문가가 추천한 길', D: '내 마음이 끌리는 길' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: 'AI가 당신의 약점을 노립니다. 네 가지 대응 중 당신의 선택은?', choices: { A: '가장 즉각적인 대응', B: '통계적으로 안전한 대응', C: '전문가 조언에 따른 대응', D: '본능에 따른 대응' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '결정을 내려야 하는 순간, 네 가지 목소리가 들립니다. 누구의 말을 듣겠습니까?', choices: { A: '가장 먼저 말한 목소리', B: '가장 많은 지지를 받은 목소리', C: '전문가의 목소리', D: '내 안의 목소리' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '새로운 사실 네 가지가 동시에 도착했습니다. 가장 먼저 확인할 것은 무엇입니까?', choices: { A: '시간순으로 가장 먼저 온 사실', B: '가장 많은 사람이 공유한 사실', C: '출처가 가장 권위 있는 사실', D: '내 감각과 가장 맞는 사실' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '혼란스러운 회의에서 네 사람이 다른 의견을 냅니다. 누구에게 먼저 귀를 기울이겠습니까?', choices: { A: '가장 빨리 말한 사람', B: '다수가 동의한 사람', C: '경험이 가장 많은 사람', D: '내 생각을 건드린 사람' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '선택을 정당화할 근거가 필요합니다. 어떤 근거를 먼저 붙잡겠습니까?', choices: { A: '가장 즉시 떠오른 근거', B: '사람들이 납득하기 쉬운 근거', C: '자료로 확인 가능한 근거', D: '내 마음이 이미 알고 있던 근거' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: 'AI가 네 가지 해석을 보여줍니다. 무엇이 가장 불편하게 느껴집니까?', choices: { A: '내 첫 반응을 짚은 해석', B: '남들과 비슷하다는 해석', C: '논리적으로 반박하기 어려운 해석', D: '내 속마음과 닮은 해석' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '짧은 시간 안에 믿을 신호를 골라야 합니다. 당신의 눈은 어디에 먼저 갑니까?', choices: { A: '가장 눈에 먼저 들어온 신호', B: '가장 많은 사람이 따르는 신호', C: '가장 객관적으로 보이는 신호', D: '가장 개인적으로 와닿는 신호' } },
];

const EXTRA_QUESTION_POOL = [
  { type: QUESTION_TYPES.DIRECTION, prompt: '비가 오는 밤, 큰길은 밝지만 멀고 골목길은 어둡지만 빠릅니다. 어느 길을 택하시겠습니까?', choices: { primary: '어둡지만 빠른 골목길', secondary: '밝지만 먼 큰길' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '회의실에서 모두가 한 방향을 봅니다. 당신만 다른 가능성이 보입니다. 그쪽을 확인하시겠습니까?', choices: { primary: '다른 가능성을 확인한다', secondary: '모두가 보는 방향을 따른다' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '계획서에는 A안이 적혀 있지만 현장 분위기는 B안을 가리킵니다. 무엇을 따르시겠습니까?', choices: { primary: '현장 분위기를 따른다', secondary: '계획서의 A안을 따른다' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '익숙한 방법은 안정적이지만 느립니다. 새 방법은 빠르지만 손에 익지 않았습니다. 무엇을 고르시겠습니까?', choices: { primary: '빠른 새 방법', secondary: '안정적인 익숙한 방법' } },

  { type: QUESTION_TYPES.COMBAT, prompt: '상대가 일부러 당신을 자극합니다. 바로 반응하시겠습니까, 반응하지 않고 흐름을 끊겠습니까?', choices: { primary: '바로 반응한다', secondary: '흐름을 끊고 지켜본다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: 'AI가 당신의 선택을 미리 말했습니다. 그 예측을 깨기 위해 바꾸시겠습니까, 원래 판단을 유지하시겠습니까?', choices: { primary: '예측을 깨기 위해 바꾼다', secondary: '원래 판단을 유지한다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '상대가 먼저 양보합니다. 진짜 양보로 받아들이겠습니까, 숨은 의도를 의심하겠습니까?', choices: { primary: '양보로 받아들인다', secondary: '숨은 의도를 의심한다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '판이 불리해졌습니다. 지금 승부를 걸겠습니까, 다음 기회를 만들겠습니까?', choices: { primary: '지금 승부를 건다', secondary: '다음 기회를 만든다' } },

  { type: QUESTION_TYPES.RISK, prompt: '새 프로젝트는 성공하면 크게 성장하지만 준비가 부족합니다. 지금 시작하시겠습니까?', choices: { primary: '부족해도 지금 시작한다', secondary: '준비를 더 한 뒤 시작한다' } },
  { type: QUESTION_TYPES.RISK, prompt: '모두가 망설이는 제안이 있습니다. 먼저 들어가면 이득이 크지만 책임도 큽니다. 어떻게 하시겠습니까?', choices: { primary: '먼저 들어가 이득을 노린다', secondary: '책임을 피하고 지켜본다' } },
  { type: QUESTION_TYPES.RISK, prompt: '확실한 60점과 불확실한 90점 중 하나를 골라야 합니다. 무엇을 택하시겠습니까?', choices: { primary: '불확실한 90점에 도전한다', secondary: '확실한 60점을 고른다' } },
  { type: QUESTION_TYPES.RISK, prompt: '한 번의 선택으로 시간을 크게 줄일 수 있지만 실수하면 다시 시작해야 합니다. 시도하시겠습니까?', choices: { primary: '시간을 줄이기 위해 시도한다', secondary: '다시 시작할 위험을 피한다' } },

  { type: QUESTION_TYPES.TIME, prompt: '답을 더 확인할수록 확신은 늘지만 기회는 줄어듭니다. 더 확인하시겠습니까?', choices: { primary: '확신을 위해 더 확인한다', secondary: '기회가 있을 때 결정한다' } },
  { type: QUESTION_TYPES.TIME, prompt: '상대가 기다리는 동안 초조해지고 있습니다. 침묵을 유지하시겠습니까, 먼저 움직이시겠습니까?', choices: { primary: '침묵을 유지한다', secondary: '먼저 움직인다' } },
  { type: QUESTION_TYPES.TIME, prompt: '지금 결정하면 빠르지만 찜찜함이 남습니다. 더 고민하면 늦을 수 있습니다. 무엇을 고르시겠습니까?', choices: { primary: '더 고민한다', secondary: '지금 결정한다' } },
  { type: QUESTION_TYPES.TIME, prompt: '좋은 정보가 곧 올 수도 있습니다. 하지만 지금도 선택은 가능합니다. 기다리시겠습니까?', choices: { primary: '정보를 기다린다', secondary: '지금 선택한다' } },

  { type: QUESTION_TYPES.REWARD, prompt: '작지만 바로 얻는 보상과 오래 기다려야 하는 큰 보상이 있습니다. 어느 쪽이 더 끌립니까?', choices: { primary: '오래 기다리는 큰 보상', secondary: '바로 얻는 작은 보상' } },
  { type: QUESTION_TYPES.REWARD, prompt: '보상은 작지만 마음이 편한 선택과, 보상은 크지만 부담이 남는 선택이 있습니다. 무엇을 택하시겠습니까?', choices: { primary: '크지만 부담이 남는 보상', secondary: '작지만 마음이 편한 보상' } },
  { type: QUESTION_TYPES.REWARD, prompt: '모두가 인정하는 성과와 나만 만족하는 결과가 충돌합니다. 무엇을 더 원하십니까?', choices: { primary: '모두가 인정하는 성과', secondary: '나만 만족하는 결과' } },
  { type: QUESTION_TYPES.REWARD, prompt: '확실한 보상은 작고, 더 큰 보상은 기다려야 합니다. 지금의 만족을 고르시겠습니까?', choices: { primary: '기다려서 더 큰 보상을 노린다', secondary: '지금 확실한 보상을 받는다' } },

  { type: QUESTION_TYPES.EMOTION, prompt: '누군가 당신을 믿는다고 말합니다. 그 기대를 힘으로 받겠습니까, 부담으로 느끼겠습니까?', choices: { primary: '기대를 힘으로 받는다', secondary: '부담으로 느낀다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: '상대의 말은 논리적이지만 어딘가 불편합니다. 논리를 따르겠습니까, 불편한 감각을 믿겠습니까?', choices: { primary: '불편한 감각을 믿는다', secondary: '논리를 따른다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: 'AI가 방금 선택을 칭찬합니다. 기분 좋게 받아들이겠습니까, 의도를 의심하겠습니까?', choices: { primary: '칭찬으로 받아들인다', secondary: '의도를 의심한다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: '친한 사람이 조언하지만 당신의 생각과 다릅니다. 관계를 믿겠습니까, 판단을 믿겠습니까?', choices: { primary: '관계를 믿고 따른다', secondary: '내 판단을 믿는다' } },

  { type: QUESTION_TYPES.SPEED, prompt: '첫 느낌은 분명하지만 이유는 아직 없습니다. 바로 고르시겠습니까, 이유를 찾고 고르시겠습니까?', choices: { primary: '첫 느낌대로 고른다', secondary: '이유를 찾고 고른다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '빠르게 고르면 솔직하지만 거칠 수 있습니다. 천천히 고르면 정리되지만 계산이 섞입니다. 무엇을 택하시겠습니까?', choices: { primary: '빠르고 솔직한 선택', secondary: '느리지만 정리된 선택' } },
  { type: QUESTION_TYPES.SPEED, prompt: '손이 먼저 간 선택과 머리가 붙잡는 선택이 다릅니다. 어느 쪽을 믿으시겠습니까?', choices: { primary: '손이 먼저 간 선택', secondary: '머리가 붙잡는 선택' } },
  { type: QUESTION_TYPES.SPEED, prompt: '시간이 줄어들수록 답이 더 선명해집니까, 더 흐려집니까?', choices: { primary: '더 선명해진다', secondary: '더 흐려진다' } },

  { type: QUESTION_TYPES.TEMPTATION, prompt: '낯선 제안을 검토해야 합니다. 네 가지 단서 중 무엇을 먼저 보시겠습니까?', choices: { A: '가장 먼저 눈에 띈 장점', B: '다수가 걱정한 단점', C: '수치로 확인되는 근거', D: '내가 불편하게 느낀 지점' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '결정을 미루기 어려운 상황입니다. 무엇이 당신을 가장 빨리 움직입니까?', choices: { A: '마감 시간', B: '주변 사람의 선택', C: '객관적인 자료', D: '내 안의 확신' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: 'AI가 네 가지 약점을 짚습니다. 무엇이 가장 신경 쓰입니까?', choices: { A: '너무 빨리 고른다는 말', B: '남들과 비슷하다는 말', C: '근거가 부족하다는 말', D: '속마음이 보인다는 말' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '새로운 길을 고르기 전, 무엇을 마지막으로 확인하시겠습니까?', choices: { A: '가장 빠른 경로', B: '사람들이 많이 간 기록', C: '전문가의 검토', D: '내가 계속 신경 쓰는 느낌' } },
];

const READABLE_QUESTION_POOL = [
  // ========== DIRECTION ==========
  { type: QUESTION_TYPES.DIRECTION, prompt: '처음 보는 길이 있습니다. 익숙한 길 대신 그쪽으로 가보시겠습니까?', choices: { primary: '처음 보는 길로 간다', secondary: '익숙한 길로 간다' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '표지판은 직진을 가리키지만 옆길이 눈에 들어옵니다. 어느 쪽으로 가시겠습니까?', choices: { primary: '옆길을 확인한다', secondary: '표지판을 따른다' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '빠른 길은 조금 불안하고, 안전한 길은 멉니다. 무엇을 고르시겠습니까?', choices: { primary: '빠른 길로 간다', secondary: '안전한 길로 간다' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '아무도 가지 않은 길이 보입니다. 사람들이 간 길 대신 그쪽을 보시겠습니까?', choices: { primary: '새 길을 확인한다', secondary: '사람들이 간 길을 따른다' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '열린 문 옆에 닫힌 문이 있습니다. 닫힌 문도 확인해보시겠습니까?', choices: { primary: '닫힌 문을 확인한다', secondary: '열린 문으로 간다' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '계획과 현장 분위기가 다릅니다. 지금은 무엇을 믿으시겠습니까?', choices: { primary: '현장 분위기', secondary: '처음 계획' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '조용한 길과 사람이 많은 길이 있습니다. 어느 쪽이 더 편합니까?', choices: { primary: '조용한 길', secondary: '사람이 많은 길' } },
  { type: QUESTION_TYPES.DIRECTION, prompt: '새 방법이 더 빨라 보입니다. 익숙한 방법 대신 써보시겠습니까?', choices: { primary: '새 방법을 써본다', secondary: '익숙한 방법을 쓴다' } },

  // ========== COMBAT ==========
  { type: QUESTION_TYPES.COMBAT, prompt: '상대가 일부러 자극합니다. 바로 반응하시겠습니까?', choices: { primary: '바로 반응한다', secondary: '일단 지켜본다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: 'AI가 다음 선택을 예상했습니다. 그 예상을 깨고 싶습니까?', choices: { primary: '예상을 깬다', secondary: '내 판단대로 간다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '상대의 빈틈이 보입니다. 바로 들어가시겠습니까?', choices: { primary: '바로 들어간다', secondary: '조금 더 본다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '지금은 불리합니다. 그래도 승부를 보시겠습니까?', choices: { primary: '지금 승부를 본다', secondary: '다음 기회를 기다린다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '상대가 아무 말도 하지 않습니다. 먼저 움직이시겠습니까?', choices: { primary: '먼저 움직인다', secondary: '기다린다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '방식이 읽힌 것 같습니다. 바로 바꾸시겠습니까?', choices: { primary: '바로 바꾼다', secondary: '그대로 간다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '상대가 먼저 양보합니다. 그대로 받아들이시겠습니까?', choices: { primary: '받아들인다', secondary: '의도를 본다' } },
  { type: QUESTION_TYPES.COMBAT, prompt: '조금 손해를 보더라도 주도권을 잡고 싶습니까?', choices: { primary: '주도권을 잡는다', secondary: '손해를 피한다' } },

  // ========== RISK ==========
  { type: QUESTION_TYPES.RISK, prompt: '성공하면 크게 앞설 수 있습니다. 실패 가능성이 있어도 도전하시겠습니까?', choices: { primary: '도전한다', secondary: '안정적으로 간다' } },
  { type: QUESTION_TYPES.RISK, prompt: '빠른 길에는 위험이 조금 있습니다. 그래도 빠른 길을 고르시겠습니까?', choices: { primary: '빠른 길', secondary: '안전한 길' } },
  { type: QUESTION_TYPES.RISK, prompt: '확실한 60점보다 90점 가능성에 끌리십니까?', choices: { primary: '90점에 도전한다', secondary: '60점을 지킨다' } },
  { type: QUESTION_TYPES.RISK, prompt: '작은 손해를 감수하면 더 큰 기회가 생깁니다. 받아들이시겠습니까?', choices: { primary: '감수한다', secondary: '피한다' } },
  { type: QUESTION_TYPES.RISK, prompt: '새 제안이 좋아 보입니다. 검증된 선택 대신 고르시겠습니까?', choices: { primary: '새 제안', secondary: '검증된 선택' } },
  { type: QUESTION_TYPES.RISK, prompt: '실패하면 바로 티가 납니다. 그래도 시도하시겠습니까?', choices: { primary: '시도한다', secondary: '피한다' } },
  { type: QUESTION_TYPES.RISK, prompt: '다들 망설이는 기회가 있습니다. 먼저 들어가시겠습니까?', choices: { primary: '먼저 들어간다', secondary: '더 지켜본다' } },
  { type: QUESTION_TYPES.RISK, prompt: '확신은 부족하지만 가능성은 큽니다. 지금 움직이시겠습니까?', choices: { primary: '움직인다', secondary: '확신을 기다린다' } },

  // ========== TIME ==========
  { type: QUESTION_TYPES.TIME, prompt: '조금 더 기다리면 정보가 늘어납니다. 기다리시겠습니까?', choices: { primary: '더 기다린다', secondary: '지금 결정한다' } },
  { type: QUESTION_TYPES.TIME, prompt: '지금 움직이면 흐름을 잡을 수 있습니다. 바로 가시겠습니까?', choices: { primary: '바로 간다', secondary: '조금 더 본다' } },
  { type: QUESTION_TYPES.TIME, prompt: '마감 직전입니다. 조금 더 다듬으시겠습니까?', choices: { primary: '더 다듬는다', secondary: '지금 낸다' } },
  { type: QUESTION_TYPES.TIME, prompt: '기다릴수록 불안합니다. 차라리 행동하시겠습니까?', choices: { primary: '행동한다', secondary: '기다린다' } },
  { type: QUESTION_TYPES.TIME, prompt: '타이밍을 기다리다 놓칠 수도 있습니다. 지금 잡으시겠습니까?', choices: { primary: '지금 잡는다', secondary: '더 기다린다' } },
  { type: QUESTION_TYPES.TIME, prompt: '망설이는 게 느껴집니다. 그래도 시간을 더 쓰시겠습니까?', choices: { primary: '더 생각한다', secondary: '바로 고른다' } },
  { type: QUESTION_TYPES.TIME, prompt: '답은 떠올랐지만 확신은 부족합니다. 그래도 누르시겠습니까?', choices: { primary: '누른다', secondary: '한 번 더 본다' } },
  { type: QUESTION_TYPES.TIME, prompt: '시간이 줄고 있습니다. 서둘러 고르시겠습니까?', choices: { primary: '서둘러 고른다', secondary: '천천히 본다' } },

  // ========== REWARD ==========
  { type: QUESTION_TYPES.REWARD, prompt: '작은 보상은 지금 받을 수 있습니다. 더 큰 보상을 기다리시겠습니까?', choices: { primary: '기다린다', secondary: '지금 받는다' } },
  { type: QUESTION_TYPES.REWARD, prompt: '성과를 더 얻을 수 있지만 편하진 않습니다. 그래도 고르시겠습니까?', choices: { primary: '성과를 고른다', secondary: '편한 쪽을 고른다' } },
  { type: QUESTION_TYPES.REWARD, prompt: '지금 칭찬받는 것보다 나중에 인정받는 쪽이 더 좋습니까?', choices: { primary: '나중의 인정', secondary: '지금의 칭찬' } },
  { type: QUESTION_TYPES.REWARD, prompt: '더 큰 보상에는 부담이 따릅니다. 그래도 노리시겠습니까?', choices: { primary: '노린다', secondary: '편한 보상을 고른다' } },
  { type: QUESTION_TYPES.REWARD, prompt: '남들이 알아주는 결과와 내가 만족하는 결과가 다릅니다. 무엇이 더 중요합니까?', choices: { primary: '남들이 알아주는 결과', secondary: '내가 만족하는 결과' } },
  { type: QUESTION_TYPES.REWARD, prompt: '확실한 보너스와 승진 기회가 있습니다. 어느 쪽이 더 끌립니까?', choices: { primary: '승진 기회', secondary: '확실한 보너스' } },
  { type: QUESTION_TYPES.REWARD, prompt: '당장 즐거운 선택과 오래 남는 선택이 있습니다. 무엇을 고르시겠습니까?', choices: { primary: '오래 남는 선택', secondary: '당장 즐거운 선택' } },
  { type: QUESTION_TYPES.REWARD, prompt: '마음은 편하지만 보상은 작습니다. 그쪽을 고르시겠습니까?', choices: { primary: '더 큰 보상을 본다', secondary: '마음 편한 쪽을 고른다' } },

  // ========== EMOTION ==========
  { type: QUESTION_TYPES.EMOTION, prompt: 'AI가 당신을 꽤 이해한다고 말합니다. 믿어보시겠습니까?', choices: { primary: '믿어본다', secondary: '경계한다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: '칭찬을 들었습니다. 그대로 받아들이는 편입니까?', choices: { primary: '받아들인다', secondary: '의도를 살핀다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: '근거는 없지만 불편한 느낌이 듭니다. 그 느낌을 믿으시겠습니까?', choices: { primary: '느낌을 믿는다', secondary: '근거를 기다린다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: '상대가 사과합니다. 바로 믿으시겠습니까?', choices: { primary: '믿는다', secondary: '거리를 둔다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: '친한 사람이 조언합니다. 내 생각과 달라도 따르시겠습니까?', choices: { primary: '조언을 따른다', secondary: '내 판단을 따른다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: 'AI의 제안이 내 직감과 다릅니다. 어느 쪽을 믿으시겠습니까?', choices: { primary: 'AI의 제안', secondary: '내 직감' } },
  { type: QUESTION_TYPES.EMOTION, prompt: '누군가 나를 너무 잘 안다고 말합니다. 편하게 느껴집니까?', choices: { primary: '편하게 느껴진다', secondary: '불편하게 느껴진다' } },
  { type: QUESTION_TYPES.EMOTION, prompt: '분석 결과가 마음에 걸립니다. 받아들이시겠습니까?', choices: { primary: '받아들인다', secondary: '의심한다' } },

  // ========== SPEED ==========
  { type: QUESTION_TYPES.SPEED, prompt: '첫 느낌이 좋다면 바로 고르는 편입니까?', choices: { primary: '바로 고른다', secondary: '한 번 더 본다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '손이 먼저 가는 선택이 있습니다. 그대로 따르시겠습니까?', choices: { primary: '그대로 따른다', secondary: '멈추고 다시 본다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '빨리 고른 답과 천천히 고른 답이 다릅니다. 어느 쪽을 믿으시겠습니까?', choices: { primary: '빨리 고른 답', secondary: '천천히 고른 답' } },
  { type: QUESTION_TYPES.SPEED, prompt: '이유는 부족해도 느낌이 분명하면 고르시겠습니까?', choices: { primary: '느낌을 믿는다', secondary: '이유를 찾는다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '1초 더 볼 수 있습니다. 그래도 바로 누르시겠습니까?', choices: { primary: '바로 누른다', secondary: '1초 더 본다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '지금 고른 답이 가장 솔직할 수도 있습니다. 바로 선택하시겠습니까?', choices: { primary: '바로 선택한다', secondary: '조금 늦춘다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '생각할수록 더 헷갈립니다. 지금 멈추시겠습니까?', choices: { primary: '지금 멈춘다', secondary: '더 생각한다' } },
  { type: QUESTION_TYPES.SPEED, prompt: '빨리 고르면 실수할 수 있습니다. 그래도 빠르게 가시겠습니까?', choices: { primary: '빠르게 간다', secondary: '천천히 간다' } },

  // ========== TEMPTATION (4선택지) ==========
  { type: QUESTION_TYPES.TEMPTATION, prompt: '정보가 여러 개 들어왔습니다. 무엇을 먼저 믿으시겠습니까?', choices: { A: '처음 본 정보', B: '많은 사람이 믿는 정보', C: '근거가 있는 정보', D: '내 감각에 맞는 정보' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '결정하기 전에 하나만 더 본다면 무엇을 보시겠습니까?', choices: { A: '가장 빠른 방법', B: '사람들이 고른 방법', C: '전문가의 의견', D: '내가 끌리는 방법' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: 'AI가 네 가지 말을 합니다. 무엇이 가장 신경 쓰입니까?', choices: { A: '너무 빠르다는 말', B: '남들과 비슷하다는 말', C: '근거가 약하다는 말', D: '속마음이 보인다는 말' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '헷갈릴 때 무엇을 기준으로 삼는 편입니까?', choices: { A: '처음 떠오른 생각', B: '많은 사람이 고른 선택', C: '자료로 확인된 선택', D: '마음이 끌리는 선택' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '짧은 시간 안에 근거 하나만 고른다면 무엇을 붙잡겠습니까?', choices: { A: '빠르게 떠오른 근거', B: '남들이 납득할 근거', C: '숫자로 보이는 근거', D: '내가 납득하는 근거' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '의견이 갈립니다. 누구의 말을 먼저 듣겠습니까?', choices: { A: '가장 먼저 말한 사람', B: '다수가 따른 사람', C: '경험이 많은 사람', D: '내 생각을 건드린 사람' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: '선택 전에 가장 먼저 확인하는 신호는 무엇입니까?', choices: { A: '속도', B: '사람들의 반응', C: '객관적인 근거', D: '내 느낌' } },
  { type: QUESTION_TYPES.TEMPTATION, prompt: 'AI가 당신을 해석했습니다. 어떤 말이 가장 불편합니까?', choices: { A: '성급하다는 말', B: '평범하다는 말', C: '논리가 약하다는 말', D: '속마음과 닮았다는 말' } },
];

const ALL_QUESTION_POOL = READABLE_QUESTION_POOL;

/**
 * 2단계 선택지 시나리오 템플릿
 */
const TWO_STAGE_SCENARIOS = [
  { mode: 'same', aiMessage: '다시 보니 {otherChoice}도 꽤 설득력 있어 보입니다. 그래도 첫 판단을 유지하시겠습니까?' },
  { mode: 'same', aiMessage: '{otherChoice}를 고르면 후회는 줄어들 수 있습니다. 그래도 방금 선택을 믿으시겠습니까?' },
  { mode: 'same', aiMessage: '잠깐 멈춰보니 {otherChoice}도 흥미로워 보입니다. 그럼에도 첫 판단을 유지하시겠습니까?' },
  { mode: 'same', aiMessage: '방금 선택이 꽤 빨랐습니다. 한 번 더 보면 {otherChoice}도 괜찮아 보이지 않습니까?' },
  { mode: 'same', aiMessage: '지금 그대로 가면 첫 판단을 믿는 쪽입니다. {otherChoice}로 바꾸면 다시 계산하는 쪽이고요. 어떻게 하시겠습니까?' },
  { mode: 'same', aiMessage: '처음 답을 지키는 것도 선택이고, {otherChoice}로 바꾸는 것도 선택입니다. 어느 쪽이 더 납득됩니까?' },
  { mode: 'same', aiMessage: '조금 더 생각해보니 {otherChoice}에도 이유가 있습니다. 그래도 처음 고른 쪽으로 가시겠습니까?' },
  { mode: 'same', aiMessage: '{otherChoice}로 바꿀 기회를 드리겠습니다. 지금도 첫 선택이 더 맞다고 느끼십니까?' },
  { mode: 'same', aiMessage: '방금 답은 직감에 가까워 보였습니다. {otherChoice}를 보고도 같은 생각입니까?' },
  { mode: 'reframe', aiMessage: '같은 선택을 다른 말로 다시 묻겠습니다. 이번에는 어느 쪽이 더 당신답습니까?' },
  { mode: 'reframe', aiMessage: '질문을 조금 바꿔보겠습니다. 지금 더 끌리는 쪽을 골라주세요.' },
  { mode: 'reframe', aiMessage: '표현만 바꿨습니다. 방금 선택이 정말 본심인지 다시 보겠습니다.' },
  { mode: 'reframe', aiMessage: '이번에는 결과보다 이유를 보겠습니다. 같은 기준으로 고를 수 있습니까?' },
  { mode: 'reframe', aiMessage: '방금 답을 다른 각도에서 보겠습니다. 그래도 같은 쪽으로 기울까요?' },
  { mode: 'reframe', aiMessage: '다시 묻겠습니다. 이번에는 고민되는 쪽을 피하지 말고 골라주세요.' },
];

const REFRAMED_PROMPTS = {
  [QUESTION_TYPES.DIRECTION]: '다시 묻겠습니다. 지금은 새로움과 안정감 중 어느 쪽이 더 끌립니까?',
  [QUESTION_TYPES.COMBAT]: '다시 묻겠습니다. 지금은 밀고 나갈까요, 흐름을 읽을까요?',
  [QUESTION_TYPES.RISK]: '다시 묻겠습니다. 기회를 잡을까요, 손실을 줄일까요?',
  [QUESTION_TYPES.TIME]: '다시 묻겠습니다. 조금 더 볼까요, 바로 정할까요?',
  [QUESTION_TYPES.REWARD]: '다시 묻겠습니다. 더 큰 가능성과 확실한 만족 중 무엇이 좋습니까?',
  [QUESTION_TYPES.EMOTION]: '다시 묻겠습니다. 받아들일까요, 거리를 둘까요?',
  [QUESTION_TYPES.SPEED]: '다시 묻겠습니다. 바로 갈까요, 한 번 더 볼까요?',
};

const REFRAMED_CHOICES = {
  [QUESTION_TYPES.DIRECTION]: { primary: '새로움을 고른다', secondary: '안정감을 고른다' },
  [QUESTION_TYPES.COMBAT]: { primary: '밀고 나간다', secondary: '흐름을 읽는다' },
  [QUESTION_TYPES.RISK]: { primary: '기회를 잡는다', secondary: '손실을 줄인다' },
  [QUESTION_TYPES.TIME]: { primary: '조금 더 본다', secondary: '바로 정한다' },
  [QUESTION_TYPES.REWARD]: { primary: '더 큰 가능성', secondary: '확실한 만족' },
  [QUESTION_TYPES.EMOTION]: { primary: '받아들인다', secondary: '거리를 둔다' },
  [QUESTION_TYPES.SPEED]: { primary: '바로 간다', secondary: '한 번 더 본다' },
};

/**
 * QuestionGenerator 클래스
 */
export class QuestionGenerator {
  constructor() {
    this.questionTypes = Object.values(QUESTION_TYPES);
    this._usedIndices = new Set();
    this.recentStorageKey = 'mindtrap_recent_question_prompts';
  }

  /**
   * 20개의 고유한 질문 세트를 생성
   * @returns {Array<Object>} 질문 객체 배열
   */
  generateQuestionSet() {
    const totalRounds = GAME_CONFIG.TOTAL_ROUNDS;

    // 사용된 인덱스 초기화
    this._usedIndices = new Set();
    const recentPrompts = this._loadRecentPrompts();
    const preferredPool = ALL_QUESTION_POOL.filter((question) => !recentPrompts.has(question.prompt));
    const activePool = preferredPool.length >= totalRounds ? preferredPool : ALL_QUESTION_POOL;

    const validationTypes = Object.values(QUESTION_TYPES);
    const typeBuckets = validationTypes.reduce((buckets, type) => {
      buckets[type] = shuffleArray(activePool.filter((question) => question.type === type));
      return buckets;
    }, {});

    const selectedQuestions = [];
    validationTypes.forEach((type) => {
      const bucket = typeBuckets[type] || [];
      selectedQuestions.push(...bucket.slice(0, Math.min(2, bucket.length)));
    });

    const selectedPrompts = new Set(selectedQuestions.map((question) => question.prompt));
    const remainingPool = shuffleArray(
      activePool.filter((question) => !selectedPrompts.has(question.prompt))
    );

    while (selectedQuestions.length < totalRounds && remainingPool.length > 0) {
      selectedQuestions.push(remainingPool.shift());
    }

    while (selectedQuestions.length < totalRounds) {
      selectedQuestions.push(ALL_QUESTION_POOL[Math.floor(Math.random() * ALL_QUESTION_POOL.length)]);
    }

    const questionSet = shuffleArray(selectedQuestions).slice(0, totalRounds).map((questionData, index) => {
      const isFourChoice = questionData.type === QUESTION_TYPES.TEMPTATION;
      const hasTwoStage = !isFourChoice && Math.random() < GAME_CONFIG.TWO_STAGE_CHANCE;

      return {
        id: index + 1,
        type: questionData.type,
        prompt: questionData.prompt,
        choices: { ...questionData.choices },
        isFourChoice,
        hasTwoStage,
        twoStageScenario: hasTwoStage ? getRandomElement(TWO_STAGE_SCENARIOS) : null,
      };
    });

    this._saveRecentPrompts(questionSet.map((question) => question.prompt));
    return questionSet;
  }

  /**
   * 2단계 선택지용 AI 메시지 생성
   * @param {Object} question - 질문 객체
   * @param {string} userChoice - 유저의 1차 선택
   * @returns {Object|null} 2단계 데이터
   */
  generateTwoStageData(question, userChoice) {
    if (!question.hasTwoStage || !question.twoStageScenario) return null;

    const otherChoiceKey = userChoice === 'primary' ? 'secondary' : 'primary';
    const otherChoiceText = question.choices[otherChoiceKey];
    const reframeChoices = REFRAMED_CHOICES[question.type] || question.choices;

    const aiMessage = question.twoStageScenario.aiMessage.replace(
      /\{otherChoice\}/g,
      otherChoiceText
    );

    return {
      aiMessage,
      choices: {
        primary: question.twoStageScenario.mode === 'reframe'
          ? reframeChoices[userChoice] || question.choices[userChoice]
          : '처음 선택을 유지한다',
        secondary: question.twoStageScenario.mode === 'reframe'
          ? reframeChoices[otherChoiceKey] || otherChoiceText
          : `${otherChoiceText}로 바꾼다`,
      },
      prompt: question.twoStageScenario.mode === 'reframe'
        ? REFRAMED_PROMPTS[question.type] || question.prompt
        : null,
      mode: question.twoStageScenario.mode || 'same',
      originalChoice: userChoice,
      otherChoice: otherChoiceKey,
    };
  }

  /**
   * 단일 질문 재생성
   * @param {number} roundNumber - 라운드 번호
   * @param {string} [excludeType] - 제외할 타입
   * @returns {Object} 질문 객체
   */
  generateSingleQuestion(roundNumber, excludeType = null) {
    let availablePool = ALL_QUESTION_POOL.filter((q) => q.type !== excludeType);
    if (availablePool.length === 0) {
      availablePool = [...ALL_QUESTION_POOL];
    }

    const questionData = availablePool[Math.floor(Math.random() * availablePool.length)];
    const isFourChoice = questionData.type === QUESTION_TYPES.TEMPTATION;

    return {
      id: roundNumber,
      type: questionData.type,
      prompt: questionData.prompt,
      choices: { ...questionData.choices },
      isFourChoice,
      hasTwoStage: false,
      twoStageScenario: null,
    };
  }

  _loadRecentPrompts() {
    if (typeof window === 'undefined' || !window.localStorage) return new Set();

    try {
      const saved = JSON.parse(window.localStorage.getItem(this.recentStorageKey) || '[]');
      return new Set(Array.isArray(saved) ? saved : []);
    } catch (error) {
      return new Set();
    }
  }

  _saveRecentPrompts(prompts) {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const previous = Array.from(this._loadRecentPrompts());
      const merged = [...prompts, ...previous].filter(Boolean).slice(0, GAME_CONFIG.TOTAL_ROUNDS * 3);
      window.localStorage.setItem(this.recentStorageKey, JSON.stringify(merged));
    } catch (error) {
      // 질문 생성은 저장 실패와 무관하게 계속 진행합니다.
    }
  }
}
