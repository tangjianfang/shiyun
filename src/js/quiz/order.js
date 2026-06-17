/**
 * 考核模式 C：诗句排序
 *
 * 给一首诗的所有句子打乱，孩子拖拽/点击排序。
 *
 * 判分：
 * - 完全正确: 100
 * - 按位正确率: correctPositions / total * 100, 取整
 *
 * 纯函数：所有函数无副作用，方便单测
 */

export function shuffleLines(arr) {
  const copy = [...arr];
  if (copy.length < 2) return copy;
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildOrderQuestion(poem) {
  if (!poem.content || poem.content.length < 2) {
    throw new Error('诗少于 2 句，不能出排序题');
  }
  return {
    poemId: poem.id,
    title: poem.title,
    originalLines: [...poem.content],
    shuffledLines: shuffleLines(poem.content),
  };
}

export function scoreOrder(poem, userOrder) {
  const total = poem.content.length;
  if (!Array.isArray(userOrder) || userOrder.length !== total) return 0;
  let correct = 0;
  for (let i = 0; i < total; i++) {
    if (userOrder[i] === i) correct++;
  }
  return Math.round((correct / total) * 100);
}

export function isFullyCorrect(poem, userOrder) {
  return scoreOrder(poem, userOrder) === 100;
}

export function listWrongOrderLines(poem, userOrder) {
  const total = poem.content.length;
  if (!Array.isArray(userOrder) || userOrder.length !== total) {
    return poem.content.map((line, idx) => ({
      userPosition: -1,
      correctPosition: idx,
      line,
    }));
  }
  const wrongs = [];
  for (let i = 0; i < total; i++) {
    if (userOrder[i] !== i) {
      wrongs.push({
        userPosition: i,
        correctPosition: userOrder[i],
        line: poem.content[userOrder[i]],
      });
    }
  }
  return wrongs;
}
