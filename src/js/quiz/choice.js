/**
 * 考核模式 B：选择题
 *
 * 两种题型：
 * - next-line: 给上句选下句（同一首诗相邻句）
 * - by-author: 给作者选作品（4 首诗名里选该作者的一首）
 *
 * 判分：答对 100，错 0
 *
 * 纯函数：所有函数无副作用，方便单测
 */

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function pickRandomMode() {
  return Math.random() < 0.5 ? 'next-line' : 'by-author';
}

export function scoreChoice(isCorrect) {
  return isCorrect ? 100 : 0;
}

function buildNextLineQuestion(poem, allPoems) {
  const maxLine = poem.content.length - 1;
  if (maxLine < 1) {
    throw new Error('诗少于 2 句，不能出 next-line 题');
  }
  // 默认选第一句作为出题句（确定性，便于测试）；UI 层可选择随机化
  const lineIdx = 0;
  const correctAnswer = poem.content[lineIdx + 1];
  const promptLine = poem.content[lineIdx];

  const distractorPool = [];
  for (const p of allPoems) {
    if (p.id === poem.id) continue;
    for (const line of p.content) {
      if (line !== correctAnswer) distractorPool.push(line);
    }
  }

  let distractors = shuffle([...new Set(distractorPool)]).slice(0, 3);

  if (distractors.length < 3) {
    const fillers = [];
    for (const p of allPoems) {
      for (const line of p.content) {
        if (line !== correctAnswer) fillers.push(line);
      }
    }
    shuffle(fillers);
    for (const f of fillers) {
      if (distractors.length >= 3) break;
      if (!distractors.includes(f)) distractors.push(f);
    }
    while (distractors.length < 3) {
      distractors.push(correctAnswer);
    }
  }

  const options = shuffle([correctAnswer, ...distractors]);
  const correctIndex = options.indexOf(correctAnswer);

  return {
    poemId: poem.id,
    mode: 'next-line',
    prompt: `请选择 "${promptLine}" 的下一句：`,
    options,
    correctAnswer,
    correctIndex,
  };
}

function buildByAuthorQuestion(poem, allPoems) {
  const correctAnswer = poem.title;
  const prompt = `请选择作者 "${poem.author}" 的作品：`;

  const distractorPool = allPoems
    .filter(p => p.id !== poem.id && p.author !== poem.author)
    .map(p => p.title);

  let distractors = shuffle([...new Set(distractorPool)]).slice(0, 3);

  if (distractors.length < 3) {
    const allTitles = allPoems
      .filter(p => p.id !== poem.id && p.author !== poem.author)
      .map(p => p.title);
    shuffle(allTitles);
    for (const t of allTitles) {
      if (distractors.length >= 3) break;
      if (!distractors.includes(t)) distractors.push(t);
    }
    while (distractors.length < 3) {
      distractors.push(correctAnswer);
    }
  }

  const options = shuffle([correctAnswer, ...distractors]);
  const correctIndex = options.indexOf(correctAnswer);

  return {
    poemId: poem.id,
    mode: 'by-author',
    prompt,
    options,
    correctAnswer,
    correctIndex,
  };
}

export function buildChoiceQuestion(poem, allPoems, mode) {
  const m = mode || pickRandomMode();
  if (m === 'next-line') return buildNextLineQuestion(poem, allPoems);
  return buildByAuthorQuestion(poem, allPoems);
}
