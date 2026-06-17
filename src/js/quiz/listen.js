/**
 * 考核模式 D：听诗选诗
 *
 * 播放诗的 AI 朗读，4 首诗名选项（1 正确 + 3 干扰）
 * 干扰项：从同年级的其他诗里抽，不足时跨年级补
 *
 * 判分：答对 100，错 0
 *
 * 纯函数：所有函数无副作用，方便单测
 */

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function scoreListen(isCorrect) {
  return isCorrect ? 100 : 0;
}

export function buildListenQuestion(poem, allPoems) {
  if (!poem.audio) {
    throw new Error(`诗 ${poem.id} 没有音频，无法出听诗选诗题`);
  }

  const correctAnswer = poem.title;

  let distractorPool = allPoems
    .filter(p => p.id !== poem.id && p.grade === poem.grade)
    .map(p => p.title);

  if (distractorPool.length < 3) {
    const others = allPoems
      .filter(p => p.id !== poem.id && p.grade !== poem.grade)
      .map(p => p.title);
    distractorPool = [...distractorPool, ...others];
  }

  let distractors = shuffle([...new Set(distractorPool)]).slice(0, 3);

  if (distractors.length < 3) {
    const allTitles = allPoems.map(p => p.title).filter(t => t !== correctAnswer);
    const moreDistractors = shuffle(allTitles).filter(t => !distractors.includes(t));
    distractors = [...distractors, ...moreDistractors].slice(0, 3);
  }

  while (distractors.length < 3) {
    distractors.push(correctAnswer);
  }

  const options = shuffle([correctAnswer, ...distractors]);
  const correctIndex = options.indexOf(correctAnswer);

  return {
    poemId: poem.id,
    audio: poem.audio,
    title: poem.title,
    author: poem.author,
    options,
    correctAnswer,
    correctIndex,
  };
}
