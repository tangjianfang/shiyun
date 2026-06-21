/**
 * 部编版小学语文 1-6 年级 112 首必背古诗词元数据
 * 数据来源：《小学生必备古诗词112首》（人民教育出版社，2019.11 第1版）
 * 文档：src/data/小学生必备古诗词112首-2019年11月第1版.txt
 * 真实教材：1-6 年级上下册对应 12 个学期，按部编版教学进度排列
 *
 * 字段说明：
 * - id:             唯一 ID，格式 g{年级}-{学期}-{学期内序号}，如 g1-上-01
 * - grade:          年级（1-6）
 * - semester:       学期，"上" 或 "下"
 * - sequence:       学期内序号（1-N）
 * - globalSequence: 全局序号（1-112）
 * - title:          标题
 * - author:         作者
 * - dynasty:        朝代（无名作者为空字符串）
 * - type:           诗体（占位）
 * - content:        分句数组（占位，由 AI 生成器填充）
 * - source:         来源标注
 *
 * ⚠️ 本文件由 scripts/gen-poems-meta.mjs 从 .txt 重新生成，请勿手改；
 *    如需修改，请直接修改 .txt 后跑 node scripts/gen-poems-meta.mjs
 */

export const POEMS_META = [
  // ===== 一 年级 上 册 =====
  { id: 'g1-上-01', grade: 1, semester: '上', sequence: 1, globalSequence: 1, title: '咏鹅', author: '骆宾王', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 一 年级 上 册' },
  { id: 'g1-上-02', grade: 1, semester: '上', sequence: 2, globalSequence: 2, title: '江南', author: '佚名', dynasty: '汉', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 一 年级 上 册' },
  { id: 'g1-上-03', grade: 1, semester: '上', sequence: 3, globalSequence: 3, title: '画', author: '佚名', dynasty: '', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 一 年级 上 册' },
  { id: 'g1-上-04', grade: 1, semester: '上', sequence: 4, globalSequence: 4, title: '悯农（其二）', author: '李绅', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 一 年级 上 册' },
  { id: 'g1-上-05', grade: 1, semester: '上', sequence: 5, globalSequence: 5, title: '古朗月行（节选）', author: '李白', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 一 年级 上 册' },
  { id: 'g1-上-06', grade: 1, semester: '上', sequence: 6, globalSequence: 6, title: '风', author: '李峤', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 一 年级 上 册' },
  // ===== 一 年级 下 册 =====
  { id: 'g1-下-01', grade: 1, semester: '下', sequence: 1, globalSequence: 7, title: '春晓', author: '孟浩然', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 一 年级 下 册' },
  { id: 'g1-下-02', grade: 1, semester: '下', sequence: 2, globalSequence: 8, title: '赠汪伦', author: '李白', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 一 年级 下 册' },
  { id: 'g1-下-03', grade: 1, semester: '下', sequence: 3, globalSequence: 9, title: '静夜思', author: '李白', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 一 年级 下 册' },
  { id: 'g1-下-04', grade: 1, semester: '下', sequence: 4, globalSequence: 10, title: '寻隐者不遇', author: '贾岛', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 一 年级 下 册' },
  { id: 'g1-下-05', grade: 1, semester: '下', sequence: 5, globalSequence: 11, title: '池上', author: '白居易', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 一 年级 下 册' },
  { id: 'g1-下-06', grade: 1, semester: '下', sequence: 6, globalSequence: 12, title: '小池', author: '杨万里', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 一 年级 下 册' },
  { id: 'g1-下-07', grade: 1, semester: '下', sequence: 7, globalSequence: 13, title: '画鸡', author: '唐寅', dynasty: '明', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 一 年级 下 册' },
  // ===== 二 年级 上 册 =====
  { id: 'g2-上-01', grade: 2, semester: '上', sequence: 1, globalSequence: 14, title: '梅花', author: '王安石', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 二 年级 上 册' },
  { id: 'g2-上-02', grade: 2, semester: '上', sequence: 2, globalSequence: 15, title: '小儿垂钓', author: '胡令能', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 二 年级 上 册' },
  { id: 'g2-上-03', grade: 2, semester: '上', sequence: 3, globalSequence: 16, title: '登鹳雀楼', author: '王之涣', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 二 年级 上 册' },
  { id: 'g2-上-04', grade: 2, semester: '上', sequence: 4, globalSequence: 17, title: '望庐山瀑布', author: '李白', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 二 年级 上 册' },
  { id: 'g2-上-05', grade: 2, semester: '上', sequence: 5, globalSequence: 18, title: '江雪', author: '柳宗元', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 二 年级 上 册' },
  { id: 'g2-上-06', grade: 2, semester: '上', sequence: 6, globalSequence: 19, title: '夜宿山寺', author: '李白', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 二 年级 上 册' },
  { id: 'g2-上-07', grade: 2, semester: '上', sequence: 7, globalSequence: 20, title: '敕勒歌', author: '佚名', dynasty: '南北朝', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 二 年级 上 册' },
  // ===== 二 年级 下 册 =====
  { id: 'g2-下-01', grade: 2, semester: '下', sequence: 1, globalSequence: 21, title: '村居', author: '高鼎', dynasty: '清', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 二 年级 下 册' },
  { id: 'g2-下-02', grade: 2, semester: '下', sequence: 2, globalSequence: 22, title: '咏柳', author: '贺知章', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 二 年级 下 册' },
  { id: 'g2-下-03', grade: 2, semester: '下', sequence: 3, globalSequence: 23, title: '赋得古原草送别（节选）', author: '白居易', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 二 年级 下 册' },
  { id: 'g2-下-04', grade: 2, semester: '下', sequence: 4, globalSequence: 24, title: '晓出净慈寺送林子方', author: '杨万里', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 二 年级 下 册' },
  { id: 'g2-下-05', grade: 2, semester: '下', sequence: 5, globalSequence: 25, title: '绝句', author: '杜甫', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 二 年级 下 册' },
  { id: 'g2-下-06', grade: 2, semester: '下', sequence: 6, globalSequence: 26, title: '悯农（其一）', author: '李绅', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 二 年级 下 册' },
  { id: 'g2-下-07', grade: 2, semester: '下', sequence: 7, globalSequence: 27, title: '舟夜书所见', author: '查慎行', dynasty: '清', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 二 年级 下 册' },
  // ===== 三 年级 上 册 =====
  { id: 'g3-上-01', grade: 3, semester: '上', sequence: 1, globalSequence: 28, title: '所见', author: '袁枚', dynasty: '清', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 上 册' },
  { id: 'g3-上-02', grade: 3, semester: '上', sequence: 2, globalSequence: 29, title: '山行', author: '杜牧', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 上 册' },
  { id: 'g3-上-03', grade: 3, semester: '上', sequence: 3, globalSequence: 30, title: '赠刘景文', author: '苏轼', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 上 册' },
  { id: 'g3-上-04', grade: 3, semester: '上', sequence: 4, globalSequence: 31, title: '夜书所见', author: '叶绍翁', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 上 册' },
  { id: 'g3-上-05', grade: 3, semester: '上', sequence: 5, globalSequence: 32, title: '望天门山', author: '李白', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 上 册' },
  { id: 'g3-上-06', grade: 3, semester: '上', sequence: 6, globalSequence: 33, title: '饮湖上初晴后雨', author: '苏轼', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 上 册' },
  { id: 'g3-上-07', grade: 3, semester: '上', sequence: 7, globalSequence: 34, title: '望洞庭', author: '刘禹锡', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 上 册' },
  { id: 'g3-上-08', grade: 3, semester: '上', sequence: 8, globalSequence: 35, title: '早发白帝城', author: '李白', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 上 册' },
  { id: 'g3-上-09', grade: 3, semester: '上', sequence: 9, globalSequence: 36, title: '采莲曲', author: '王昌龄', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 上 册' },
  // ===== 三 年级 下 册 =====
  { id: 'g3-下-01', grade: 3, semester: '下', sequence: 1, globalSequence: 37, title: '绝句', author: '杜甫', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 下 册' },
  { id: 'g3-下-02', grade: 3, semester: '下', sequence: 2, globalSequence: 38, title: '惠崇春江晚景', author: '苏轼', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 下 册' },
  { id: 'g3-下-03', grade: 3, semester: '下', sequence: 3, globalSequence: 39, title: '三衢道中', author: '曾几', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 下 册' },
  { id: 'g3-下-04', grade: 3, semester: '下', sequence: 4, globalSequence: 40, title: '忆江南', author: '白居易', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 下 册' },
  { id: 'g3-下-05', grade: 3, semester: '下', sequence: 5, globalSequence: 41, title: '元日', author: '王安石', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 下 册' },
  { id: 'g3-下-06', grade: 3, semester: '下', sequence: 6, globalSequence: 42, title: '清明', author: '杜牧', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 下 册' },
  { id: 'g3-下-07', grade: 3, semester: '下', sequence: 7, globalSequence: 43, title: '九月九日忆山东兄弟', author: '王维', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 下 册' },
  { id: 'g3-下-08', grade: 3, semester: '下', sequence: 8, globalSequence: 44, title: '滁州西涧', author: '韦应物', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 下 册' },
  { id: 'g3-下-09', grade: 3, semester: '下', sequence: 9, globalSequence: 45, title: '大林寺桃花', author: '白居易', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 三 年级 下 册' },
  // ===== 四 年级 上 册 =====
  { id: 'g4-上-01', grade: 4, semester: '上', sequence: 1, globalSequence: 46, title: '浪淘沙（其七）', author: '刘禹锡', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 上 册' },
  { id: 'g4-上-02', grade: 4, semester: '上', sequence: 2, globalSequence: 47, title: '鹿柴', author: '王维', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 上 册' },
  { id: 'g4-上-03', grade: 4, semester: '上', sequence: 3, globalSequence: 48, title: '暮江吟', author: '白居易', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 上 册' },
  { id: 'g4-上-04', grade: 4, semester: '上', sequence: 4, globalSequence: 49, title: '题西林壁', author: '苏轼', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 上 册' },
  { id: 'g4-上-05', grade: 4, semester: '上', sequence: 5, globalSequence: 50, title: '雪梅', author: '卢钺', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 上 册' },
  { id: 'g4-上-06', grade: 4, semester: '上', sequence: 6, globalSequence: 51, title: '嫦娥', author: '李商隐', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 上 册' },
  { id: 'g4-上-07', grade: 4, semester: '上', sequence: 7, globalSequence: 52, title: '出塞', author: '王昌龄', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 上 册' },
  { id: 'g4-上-08', grade: 4, semester: '上', sequence: 8, globalSequence: 53, title: '凉州词', author: '王翰', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 上 册' },
  { id: 'g4-上-09', grade: 4, semester: '上', sequence: 9, globalSequence: 54, title: '夏日绝句', author: '李清照', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 上 册' },
  // ===== 四 年级 下 册 =====
  { id: 'g4-下-01', grade: 4, semester: '下', sequence: 1, globalSequence: 55, title: '别董大', author: '高适', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 下 册' },
  { id: 'g4-下-02', grade: 4, semester: '下', sequence: 2, globalSequence: 56, title: '宿新市徐公店', author: '杨万里', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 下 册' },
  { id: 'g4-下-03', grade: 4, semester: '下', sequence: 3, globalSequence: 57, title: '四时田园杂兴（其二十五）', author: '范成大', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 下 册' },
  { id: 'g4-下-04', grade: 4, semester: '下', sequence: 4, globalSequence: 58, title: '清平乐·村居', author: '辛弃疾', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 下 册' },
  { id: 'g4-下-05', grade: 4, semester: '下', sequence: 5, globalSequence: 59, title: '江畔独步寻花', author: '杜甫', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 下 册' },
  { id: 'g4-下-06', grade: 4, semester: '下', sequence: 6, globalSequence: 60, title: '蜂', author: '罗隐', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 下 册' },
  { id: 'g4-下-07', grade: 4, semester: '下', sequence: 7, globalSequence: 61, title: '独坐敬亭山', author: '李白', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 下 册' },
  { id: 'g4-下-08', grade: 4, semester: '下', sequence: 8, globalSequence: 62, title: '芙蓉楼送辛渐', author: '王昌龄', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 下 册' },
  { id: 'g4-下-09', grade: 4, semester: '下', sequence: 9, globalSequence: 63, title: '塞下曲', author: '卢纶', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 下 册' },
  { id: 'g4-下-10', grade: 4, semester: '下', sequence: 10, globalSequence: 64, title: '墨梅', author: '王冕', dynasty: '元', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 四 年级 下 册' },
  // ===== 五 年级 上 册 =====
  { id: 'g5-上-01', grade: 5, semester: '上', sequence: 1, globalSequence: 65, title: '蝉', author: '虞世南', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 上 册' },
  { id: 'g5-上-02', grade: 5, semester: '上', sequence: 2, globalSequence: 66, title: '乞巧', author: '林杰', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 上 册' },
  { id: 'g5-上-03', grade: 5, semester: '上', sequence: 3, globalSequence: 67, title: '示儿', author: '陆游', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 上 册' },
  { id: 'g5-上-04', grade: 5, semester: '上', sequence: 4, globalSequence: 68, title: '题临安邸', author: '林升', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 上 册' },
  { id: 'g5-上-05', grade: 5, semester: '上', sequence: 5, globalSequence: 69, title: '己亥杂诗', author: '龚自珍', dynasty: '清', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 上 册' },
  { id: 'g5-上-06', grade: 5, semester: '上', sequence: 6, globalSequence: 70, title: '山居秋暝', author: '王维', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 上 册' },
  { id: 'g5-上-07', grade: 5, semester: '上', sequence: 7, globalSequence: 71, title: '枫桥夜泊', author: '张继', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 上 册' },
  { id: 'g5-上-08', grade: 5, semester: '上', sequence: 8, globalSequence: 72, title: '长相思', author: '纳兰性德', dynasty: '清', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 上 册' },
  { id: 'g5-上-09', grade: 5, semester: '上', sequence: 9, globalSequence: 73, title: '渔歌子', author: '张志和', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 上 册' },
  { id: 'g5-上-10', grade: 5, semester: '上', sequence: 10, globalSequence: 74, title: '观书有感（其一）', author: '朱熹', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 上 册' },
  { id: 'g5-上-11', grade: 5, semester: '上', sequence: 11, globalSequence: 75, title: '观书有感（其二）', author: '朱熹', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 上 册' },
  // ===== 五 年级 下 册 =====
  { id: 'g5-下-01', grade: 5, semester: '下', sequence: 1, globalSequence: 76, title: '四时田园杂兴（其三十一）', author: '范成大', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 下 册' },
  { id: 'g5-下-02', grade: 5, semester: '下', sequence: 2, globalSequence: 77, title: '稚子弄冰', author: '杨万里', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 下 册' },
  { id: 'g5-下-03', grade: 5, semester: '下', sequence: 3, globalSequence: 78, title: '村晚', author: '雷震', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 下 册' },
  { id: 'g5-下-04', grade: 5, semester: '下', sequence: 4, globalSequence: 79, title: '游子吟', author: '孟郊', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 下 册' },
  { id: 'g5-下-05', grade: 5, semester: '下', sequence: 5, globalSequence: 80, title: '鸟鸣涧', author: '王维', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 下 册' },
  { id: 'g5-下-06', grade: 5, semester: '下', sequence: 6, globalSequence: 81, title: '从军行', author: '王昌龄', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 下 册' },
  { id: 'g5-下-07', grade: 5, semester: '下', sequence: 7, globalSequence: 82, title: '秋夜将晓出篱门迎凉有感', author: '陆游', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 下 册' },
  { id: 'g5-下-08', grade: 5, semester: '下', sequence: 8, globalSequence: 83, title: '闻官军收河南河北', author: '杜甫', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 下 册' },
  { id: 'g5-下-09', grade: 5, semester: '下', sequence: 9, globalSequence: 84, title: '凉州词', author: '王之涣', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 下 册' },
  { id: 'g5-下-10', grade: 5, semester: '下', sequence: 10, globalSequence: 85, title: '黄鹤楼送孟浩然之广陵', author: '李白', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 下 册' },
  { id: 'g5-下-11', grade: 5, semester: '下', sequence: 11, globalSequence: 86, title: '乡村四月', author: '翁卷', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 五 年级 下 册' },
  // ===== 六 年级 上 册 =====
  { id: 'g6-上-01', grade: 6, semester: '上', sequence: 1, globalSequence: 87, title: '宿建德江', author: '孟浩然', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 上 册' },
  { id: 'g6-上-02', grade: 6, semester: '上', sequence: 2, globalSequence: 88, title: '六月二十七日望湖楼醉书', author: '苏轼', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 上 册' },
  { id: 'g6-上-03', grade: 6, semester: '上', sequence: 3, globalSequence: 89, title: '西江月·夜行黄沙道中', author: '辛弃疾', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 上 册' },
  { id: 'g6-上-04', grade: 6, semester: '上', sequence: 4, globalSequence: 90, title: '过故人庄', author: '孟浩然', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 上 册' },
  { id: 'g6-上-05', grade: 6, semester: '上', sequence: 5, globalSequence: 91, title: '春日', author: '朱熹', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 上 册' },
  { id: 'g6-上-06', grade: 6, semester: '上', sequence: 6, globalSequence: 92, title: '回乡偶书（其一）', author: '贺知章', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 上 册' },
  { id: 'g6-上-07', grade: 6, semester: '上', sequence: 7, globalSequence: 93, title: '浪淘沙（其一）', author: '刘禹锡', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 上 册' },
  { id: 'g6-上-08', grade: 6, semester: '上', sequence: 8, globalSequence: 94, title: '江南春', author: '杜牧', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 上 册' },
  { id: 'g6-上-09', grade: 6, semester: '上', sequence: 9, globalSequence: 95, title: '书湖阴先生壁', author: '王安石', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 上 册' },
  // ===== 六 年级 下 册 =====
  { id: 'g6-下-01', grade: 6, semester: '下', sequence: 1, globalSequence: 96, title: '寒食', author: '韩翃', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-02', grade: 6, semester: '下', sequence: 2, globalSequence: 97, title: '迢迢牵牛星', author: '佚名', dynasty: '古诗十九首', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-03', grade: 6, semester: '下', sequence: 3, globalSequence: 98, title: '十五夜望月', author: '王建', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-04', grade: 6, semester: '下', sequence: 4, globalSequence: 99, title: '长歌行', author: '佚名', dynasty: '汉', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-05', grade: 6, semester: '下', sequence: 5, globalSequence: 100, title: '马诗', author: '李贺', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-06', grade: 6, semester: '下', sequence: 6, globalSequence: 101, title: '石灰吟', author: '于谦', dynasty: '明', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-07', grade: 6, semester: '下', sequence: 7, globalSequence: 102, title: '竹石', author: '郑燮', dynasty: '清', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-08', grade: 6, semester: '下', sequence: 8, globalSequence: 103, title: '采薇（节选）', author: '佚名', dynasty: '诗经', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-09', grade: 6, semester: '下', sequence: 9, globalSequence: 104, title: '送元二使安西', author: '王维', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-10', grade: 6, semester: '下', sequence: 10, globalSequence: 105, title: '春夜喜雨', author: '杜甫', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-11', grade: 6, semester: '下', sequence: 11, globalSequence: 106, title: '早春呈水部张十八员外', author: '韩愈', dynasty: '唐', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-12', grade: 6, semester: '下', sequence: 12, globalSequence: 107, title: '江上渔者', author: '范仲淹', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-13', grade: 6, semester: '下', sequence: 13, globalSequence: 108, title: '泊船瓜洲', author: '王安石', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-14', grade: 6, semester: '下', sequence: 14, globalSequence: 109, title: '游园不值', author: '叶绍翁', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-15', grade: 6, semester: '下', sequence: 15, globalSequence: 110, title: '卜算子·送鲍浩然之浙东', author: '王观', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-16', grade: 6, semester: '下', sequence: 16, globalSequence: 111, title: '浣溪沙', author: '苏轼', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
  { id: 'g6-下-17', grade: 6, semester: '下', sequence: 17, globalSequence: 112, title: '清平乐', author: '黄庭坚', dynasty: '宋', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· 六 年级 下 册' },
];

// 各年级诗词数量（与教材一致）
export const GRADE_COUNTS = {"1":13,"2":14,"3":18,"4":19,"5":22,"6":26};
export const GRADES = [1, 2, 3, 4, 5, 6];
export const SEMESTERS = ["上", "下"];

export function getPoemsByGrade(grade) { return POEMS_META.filter(p => p.grade === grade); }
export function getPoemsBySemester(grade, semester) { return POEMS_META.filter(p => p.grade === grade && p.semester === semester); }
export function getPoemsByDynasty(dynasty) { return POEMS_META.filter(p => p.dynasty === dynasty); }
export function getPoemsByAuthor(author) { return POEMS_META.filter(p => p.author === author); }
export function searchPoems(keyword) {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return [...POEMS_META];
  return POEMS_META.filter(p => p.title.toLowerCase().includes(kw) || p.author.toLowerCase().includes(kw));
}
export function getAllDynasties() { return [...new Set(POEMS_META.map(p => p.dynasty).filter(Boolean))].sort(); }
export function getAllAuthors() { return [...new Set(POEMS_META.map(p => p.author).filter(Boolean))].sort(); }
