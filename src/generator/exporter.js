/**
 * 学习版导出器
 * - 读取 POEMS_META + localStorage 中的 text/image/audio
 * - 合并为完整 Poem 数组
 * - 拼接学习版 HTML 模板 + 内嵌所有 CSS/JS/数据
 * - 触发浏览器下载
 */

import { POEMS_META } from '../data/poems-meta.js';
import { loadPoemPiece } from './state.js';

/**
 * 把元数据 + 三类持久化内容合并
 * - 即使没生成完也导出（学习版允许缺图缺音）
 */
export function collectPoemsData(metaList = POEMS_META) {
  return metaList.map(meta => {
    const text = loadPoemPiece(meta.id, 'text');
    const image = loadPoemPiece(meta.id, 'image') || '';
    const audio = loadPoemPiece(meta.id, 'audio') || '';
    const pinyin = (text && Array.isArray(text.pinyin)) ? text.pinyin : [];
    const keySentences = (text && Array.isArray(text.keySentences)) ? text.keySentences : [];
    return {
      ...meta,
      translation: text?.translation || '',
      background: text?.background || '',
      annotations: text?.annotations || {},
      theme: text?.theme || '',
      keywords: text?.keywords || [],
      keySentences,
      pinyin,
      image,
      audio,
    };
  });
}

/**
 * 用 fetch 读取外部资产（在生成器 HTML 中通过相对路径访问）
 */
export async function loadAssetText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('读取 ' + url + ' 失败：' + res.status);
  return await res.text();
}

/**
 * 把所有资产塞进模板
 */
export function buildLearningHtml({ poemsJson, learningTemplate, assets }) {
  const styles = [
    '<style>',
    '/* === main.css === */',
    assets.mainCss,
    '</style>',
    '<style media="print">',
    '/* === print.css === */',
    assets.printCss,
    '</style>',
  ].join('\n');

  const dataScript = [
    '<script>',
    'window.__SHIYUN_POEMS__ = ' + poemsJson + ';',
    '</script>',
  ].join('\n');

  const scripts = [
    '<script>',
    '/* === pinyin-pro === */',
    assets.pinyinPro,
    '</script>',
    '<script type="module">',
    '/* === data.js (runtime, reads window.__SHIYUN_POEMS__) === */',
    assets.dataJs,
    '</script>',
    '<script type="module">',
    '/* === storage.js === */',
    assets.storageJs,
    '</script>',
    '<script type="module">',
    '/* === srs.js === */',
    assets.srsJs,
    '</script>',
    '<script type="module">',
    '/* === router.js === */',
    assets.routerJs,
    '</script>',
    '<script type="module">',
    '/* === audio.js === */',
    assets.audioJs,
    '</script>',
    '<script type="module">',
    '/* === print.js === */',
    assets.printJs,
    '</script>',
    '<script type="module">',
    '/* === UI scripts === */',
    assets.uiScripts.home,
    assets.uiScripts.learn,
    assets.uiScripts.review,
    assets.uiScripts.quiz,
    assets.uiScripts.print,
    assets.uiScripts.progress,
    '</script>',
  ].join('\n');

  return learningTemplate
    .replace('<!-- @@STYLES -->', styles)
    .replace('<!-- @@DATA -->', dataScript)
    .replace('<!-- @@SCRIPTS -->', scripts);
}

/**
 * 触发浏览器下载
 */
export function downloadLearningHtml(html, filename = '诗云-学习版.html') {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 一站式：从生成器 HTML 调用此函数即可导出
 * - 自动读取所有源码与持久化数据
 * - 依赖：src/learning.template.html + src/css/* + src/lib/* + src/js/* 必须存在
 */
export async function exportLearningHtml() {
  const baseUrl = 'src/';
  const [
    learningTemplate,
    mainCss,
    printCss,
    pinyinPro,
    dataJs,
    storageJs,
    srsJs,
    routerJs,
    audioJs,
    printJs,
    homeJs,
    learnJs,
    reviewJs,
    quizJs,
    printUiJs,
    progressJs,
  ] = await Promise.all([
    loadAssetText('src/learning.template.html'),
    loadAssetText(baseUrl + 'css/main.css'),
    loadAssetText(baseUrl + 'css/print.css'),
    loadAssetText(baseUrl + 'lib/pinyin-pro.min.js'),
    loadAssetText(baseUrl + 'js/data.js'),
    loadAssetText(baseUrl + 'js/storage.js'),
    loadAssetText(baseUrl + 'js/srs.js'),
    loadAssetText(baseUrl + 'js/router.js'),
    loadAssetText(baseUrl + 'js/audio.js'),
    loadAssetText(baseUrl + 'js/print.js'),
    loadAssetText(baseUrl + 'js/ui/home.js'),
    loadAssetText(baseUrl + 'js/ui/learn.js'),
    loadAssetText(baseUrl + 'js/ui/review.js'),
    loadAssetText(baseUrl + 'js/ui/quiz.js'),
    loadAssetText(baseUrl + 'js/ui/print.js'),
    loadAssetText(baseUrl + 'js/ui/progress.js'),
  ]);

  const poems = collectPoemsData();
  const poemsJson = JSON.stringify(poems);

  const html = buildLearningHtml({
    poemsJson,
    learningTemplate,
    assets: {
      mainCss, printCss, pinyinPro, dataJs, storageJs, srsJs, routerJs, audioJs, printJs,
      uiScripts: {
        home: homeJs, learn: learnJs, review: reviewJs,
        quiz: quizJs, print: printUiJs, progress: progressJs,
      },
    },
  });

  downloadLearningHtml(html);
  return html.length;
}
