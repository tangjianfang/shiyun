/**
 * 诗云 · 作者年代与关联数据
 *
 * 为部编版 112 首古诗涉及的 62 位作者补充「生卒年 / 朝代 / 简介 / 关联」，
 * 用于「诗云」时代关联可视化（按年代漂浮分布 + 师承/交游连线）。
 *
 * 字段说明：
 * - name:    作者名（与 poems-meta.js 中 author 完全一致）
 * - dynasty: 朝代
 * - birth:   出生年（公元，公元前为负）；集体/匿名作品用代表年代
 * - death:   卒年（公元）；不详者留 null
 * - approx:  true = 生卒为约数/推定
 * - collective: true = 集体或匿名（如诗经、汉乐府）
 * - bio:     一句话简介
 * - relations: 与其他作者的关联 [{ to, type, label }]
 *     type: 'friend'(交游挚友) | 'school'(流派同道) | 'mentor'(师承赏识)
 *   仅在「本数据集存在的作者」之间建立连线，避免悬空。
 */

export const AUTHORS_META = [
  // ===== 先秦 / 汉 / 南北朝（集体、匿名）=====
  { name: '诗经', dynasty: '先秦', birth: -800, death: null, approx: true, collective: true,
    bio: '中国最早的诗歌总集，收录西周至春秋的民歌与雅颂。', relations: [] },
  { name: '汉乐府', dynasty: '汉', birth: -50, death: null, approx: true, collective: true,
    bio: '汉代官方采集整理的民间乐歌，质朴而生动。', relations: [] },
  { name: '北朝民歌', dynasty: '南北朝', birth: 500, death: null, approx: true, collective: true,
    bio: '北朝时期流传的民间歌谣，雄浑刚健。', relations: [] },

  // ===== 隋唐之交 / 初唐 =====
  { name: '虞世南', dynasty: '唐', birth: 558, death: 638,
    bio: '初唐书法家、文学家，凌烟阁功臣之一。', relations: [] },
  { name: '骆宾王', dynasty: '唐', birth: 619, death: 687, approx: true,
    bio: '“初唐四杰”之一，七岁咏鹅传为佳话。', relations: [] },
  { name: '贺知章', dynasty: '唐', birth: 659, death: 744,
    bio: '盛唐诗人，性格旷达，曾赞李白为“谪仙人”。',
    relations: [{ to: '李白', type: 'mentor', label: '赏识李白' }] },
  { name: '李峤', dynasty: '唐', birth: 645, death: 714,
    bio: '初唐宫廷诗人，与苏味道并称“苏李”。', relations: [] },
  { name: '王翰', dynasty: '唐', birth: 687, death: 726, approx: true,
    bio: '盛唐边塞诗人，《凉州词》豪迈传世。', relations: [] },
  { name: '王之涣', dynasty: '唐', birth: 688, death: 742,
    bio: '盛唐边塞诗人，《登鹳雀楼》气象开阔。', relations: [] },
  { name: '孟浩然', dynasty: '唐', birth: 689, death: 740,
    bio: '盛唐山水田园派代表，与王维并称“王孟”。',
    relations: [{ to: '王维', type: 'school', label: '王孟·山水田园' }] },
  { name: '王昌龄', dynasty: '唐', birth: 698, death: 757,
    bio: '盛唐“七绝圣手”，边塞与闺怨皆工。', relations: [] },
  { name: '祖咏', dynasty: '唐', birth: 699, death: 746, approx: true,
    bio: '盛唐诗人，与王维交好，工于写景。', relations: [] },

  // ===== 盛唐 =====
  { name: '王维', dynasty: '唐', birth: 701, death: 761,
    bio: '“诗佛”，山水田园派宗师，诗画双绝。', relations: [] },
  { name: '李白', dynasty: '唐', birth: 701, death: 762,
    bio: '“诗仙”，浪漫主义高峰，想象奇绝。',
    relations: [
      { to: '杜甫', type: 'friend', label: '李杜·挚友' },
      { to: '孟浩然', type: 'friend', label: '忘年之交' },
    ] },
  { name: '高适', dynasty: '唐', birth: 704, death: 765,
    bio: '盛唐边塞诗派代表，与岑参并称“高岑”。',
    relations: [{ to: '杜甫', type: 'friend', label: '同游交好' }] },
  { name: '崔颢', dynasty: '唐', birth: 704, death: 754,
    bio: '盛唐诗人，《黄鹤楼》被誉七律绝唱。', relations: [] },
  { name: '杜甫', dynasty: '唐', birth: 712, death: 770,
    bio: '“诗圣”，沉郁顿挫，诗史般记录时代。', relations: [] },
  { name: '张继', dynasty: '唐', birth: 715, death: 779, approx: true,
    bio: '盛唐诗人，《枫桥夜泊》千古传诵。', relations: [] },

  // ===== 中唐 =====
  { name: '张志和', dynasty: '唐', birth: 730, death: 810, approx: true,
    bio: '中唐词人，自号“烟波钓徒”，《渔歌子》清丽。', relations: [] },
  { name: '韦应物', dynasty: '唐', birth: 737, death: 791,
    bio: '中唐山水田园诗人，冲淡高远。', relations: [] },
  { name: '卢纶', dynasty: '唐', birth: 739, death: 799,
    bio: '“大历十才子”之一，边塞诗刚健。', relations: [] },
  { name: '孟郊', dynasty: '唐', birth: 751, death: 814,
    bio: '中唐“苦吟”诗人，与贾岛并称“郊寒岛瘦”。',
    relations: [
      { to: '韩愈', type: 'friend', label: '韩孟诗派' },
      { to: '贾岛', type: 'school', label: '郊寒岛瘦' },
    ] },
  { name: '王建', dynasty: '唐', birth: 768, death: 835, approx: true,
    bio: '中唐乐府诗人，《十五夜望月》清远。', relations: [] },
  { name: '韩愈', dynasty: '唐', birth: 768, death: 824,
    bio: '“唐宋八大家”之首，古文运动领袖。',
    relations: [
      { to: '柳宗元', type: 'school', label: '韩柳·古文运动' },
      { to: '贾岛', type: 'mentor', label: '点拨“推敲”' },
    ] },
  { name: '刘禹锡', dynasty: '唐', birth: 772, death: 842,
    bio: '“诗豪”，刚健豪迈，晚年与白居易唱和。',
    relations: [{ to: '白居易', type: 'friend', label: '刘白·唱和' }] },
  { name: '白居易', dynasty: '唐', birth: 772, death: 846,
    bio: '中唐新乐府运动倡导者，诗风通俗。', relations: [] },
  { name: '李绅', dynasty: '唐', birth: 772, death: 846,
    bio: '中唐诗人，《悯农》悲悯农人辛劳。', relations: [] },
  { name: '崔护', dynasty: '唐', birth: 772, death: 846, approx: true,
    bio: '中唐诗人，《题都城南庄》“人面桃花”动人。', relations: [] },
  { name: '柳宗元', dynasty: '唐', birth: 773, death: 819,
    bio: '“唐宋八大家”之一，山水游记与寓言皆精。', relations: [] },
  { name: '贾岛', dynasty: '唐', birth: 779, death: 843,
    bio: '中唐“苦吟”诗人，“推敲”典故由其而来。', relations: [] },
  { name: '胡令能', dynasty: '唐', birth: 785, death: 826, approx: true,
    bio: '中唐民间诗人，《小儿垂钓》生动有趣。', relations: [] },

  // ===== 晚唐 =====
  { name: '杜牧', dynasty: '唐', birth: 803, death: 852,
    bio: '晚唐诗人，与李商隐并称“小李杜”。',
    relations: [{ to: '李商隐', type: 'school', label: '小李杜' }] },
  { name: '李商隐', dynasty: '唐', birth: 813, death: 858,
    bio: '晚唐诗人，无题诗朦胧深婉。', relations: [] },
  { name: '温庭筠', dynasty: '唐', birth: 812, death: 866, approx: true,
    bio: '晚唐词人，花间派鼻祖（参照人物）。', relations: [] },
  { name: '林杰', dynasty: '唐', birth: 831, death: 847,
    bio: '晚唐神童诗人，《乞巧》写七夕风俗。', relations: [] },
  { name: '罗隐', dynasty: '唐', birth: 833, death: 910,
    bio: '晚唐诗人，讽喻犀利，《蜂》寓意深。', relations: [] },
  { name: '皮日休', dynasty: '唐', birth: 838, death: 883, approx: true,
    bio: '晚唐诗人、文学家，关注民生。', relations: [] },

  // ===== 北宋 =====
  { name: '范仲淹', dynasty: '宋', birth: 989, death: 1052,
    bio: '北宋名臣，“先天下之忧而忧”千古名句。',
    relations: [{ to: '王安石', type: 'friend', label: '北宋名臣' }] },
  { name: '晏殊', dynasty: '宋', birth: 991, death: 1055,
    bio: '北宋婉约词宗，词风雍容含蓄。', relations: [] },
  { name: '王安石', dynasty: '宋', birth: 1021, death: 1086,
    bio: '北宋政治家、文学家，“唐宋八大家”之一，主持变法。',
    relations: [{ to: '苏轼', type: 'friend', label: '政见之争而相惜' }] },
  { name: '程颢', dynasty: '宋', birth: 1032, death: 1085,
    bio: '北宋理学家，“二程”之一，开理学之风。',
    relations: [{ to: '朱熹', type: 'school', label: '理学传承' }] },
  { name: '王观', dynasty: '宋', birth: 1035, death: 1100, approx: true,
    bio: '北宋词人，《卜算子》以水山喻别情。', relations: [] },
  { name: '苏轼', dynasty: '宋', birth: 1037, death: 1101,
    bio: '北宋文坛巨擘，豪放词派开创者，诗书画俱绝。',
    relations: [{ to: '辛弃疾', type: 'school', label: '苏辛·豪放词派' }] },

  // ===== 两宋之交 / 南宋 =====
  { name: '李清照', dynasty: '宋', birth: 1084, death: 1155,
    bio: '婉约词宗，“千古第一才女”，南渡词风转沉郁。',
    relations: [{ to: '辛弃疾', type: 'school', label: '济南二安' }] },
  { name: '曾几', dynasty: '宋', birth: 1085, death: 1166,
    bio: '南宋诗人，陆游之师，诗风清新。',
    relations: [{ to: '陆游', type: 'mentor', label: '陆游之师' }] },
  { name: '林升', dynasty: '宋', birth: 1123, death: 1189, approx: true,
    bio: '南宋诗人，《题临安邸》讽南宋偏安。', relations: [] },
  { name: '陆游', dynasty: '宋', birth: 1125, death: 1210,
    bio: '南宋爱国诗人，存诗近万首，至死念北伐。', relations: [] },
  { name: '范成大', dynasty: '宋', birth: 1126, death: 1193,
    bio: '南宋“中兴四大诗人”之一，田园诗集大成。',
    relations: [{ to: '杨万里', type: 'school', label: '中兴四大诗人' }] },
  { name: '杨万里', dynasty: '宋', birth: 1127, death: 1206,
    bio: '南宋“诚斋体”创立者，写景活泼自然。', relations: [] },
  { name: '朱熹', dynasty: '宋', birth: 1130, death: 1200,
    bio: '南宋理学集大成者，《观书有感》寓哲理。', relations: [] },
  { name: '辛弃疾', dynasty: '宋', birth: 1140, death: 1207,
    bio: '南宋豪放词派代表，文武兼资，词中之龙。', relations: [] },
  { name: '翁卷', dynasty: '宋', birth: 1163, death: 1245, approx: true,
    bio: '南宋“永嘉四灵”之一，诗风清苦。',
    relations: [{ to: '赵师秀', type: 'school', label: '永嘉四灵' }] },
  { name: '赵师秀', dynasty: '宋', birth: 1170, death: 1219,
    bio: '南宋“永嘉四灵”之一，《约客》闲淡。', relations: [] },
  { name: '叶绍翁', dynasty: '宋', birth: 1194, death: 1269, approx: true,
    bio: '南宋江湖派诗人，《游园不值》一枝红杏出墙。', relations: [] },
  { name: '卢钺', dynasty: '宋', birth: 1230, death: 1280, approx: true,
    bio: '南宋诗人，《雪梅》梅雪争春别有趣。', relations: [] },
  { name: '雷震', dynasty: '宋', birth: 1200, death: 1260, approx: true,
    bio: '南宋诗人，《村晚》写牧童归牛之趣。', relations: [] },

  // ===== 元 =====
  { name: '王冕', dynasty: '元', birth: 1287, death: 1359,
    bio: '元代画家、诗人，画梅咏梅托高洁之志。', relations: [] },

  // ===== 明 =====
  { name: '于谦', dynasty: '明', birth: 1398, death: 1457,
    bio: '明代名臣、民族英雄，《石灰吟》以石灰自喻。', relations: [] },

  // ===== 清 =====
  { name: '纳兰性德', dynasty: '清', birth: 1655, death: 1685,
    bio: '清代第一词人，情真意切，哀感顽艳。', relations: [] },
  { name: '郑燮', dynasty: '清', birth: 1693, death: 1766,
    bio: '“扬州八怪”郑板桥，画竹咏竹刚劲。',
    relations: [{ to: '袁枚', type: 'friend', label: '清代文人交游' }] },
  { name: '袁枚', dynasty: '清', birth: 1716, death: 1798,
    bio: '清代“性灵派”领袖，主张诗写真性情。', relations: [] },
  { name: '龚自珍', dynasty: '清', birth: 1792, death: 1841,
    bio: '清代思想家、诗人，《己亥杂诗》呼唤变革。', relations: [] },
  { name: '高鼎', dynasty: '清', birth: 1821, death: 1861, approx: true,
    bio: '晚清诗人，《村居》写早春放纸鸢之乐。', relations: [] },
];

/** 朝代时间带（用于时间轴背景分层） */
export const DYNASTY_BANDS = [
  { name: '先秦', start: -1046, end: -221, color: '#cdbfa6' },
  { name: '汉',   start: -206,  end: 220,  color: '#b9c7b0' },
  { name: '南北朝', start: 420, end: 589,  color: '#c2b8cc' },
  { name: '唐',   start: 618,  end: 907,  color: '#d8b08a' },
  { name: '宋',   start: 960,  end: 1279, color: '#9fb6c4' },
  { name: '元',   start: 1271, end: 1368, color: '#b0a99a' },
  { name: '明',   start: 1368, end: 1644, color: '#c9a98a' },
  { name: '清',   start: 1644, end: 1912, color: '#b3aabf' },
];

/** 取作者代表年份（用于排序/定位）：有生年用生年，否则用死年。 */
export function authorYear(a) {
  if (typeof a.birth === 'number') return a.birth;
  if (typeof a.death === 'number') return a.death;
  return 0;
}

/** 构建 name -> author 映射 */
export function authorIndex(list = AUTHORS_META) {
  const map = new Map();
  for (const a of list) map.set(a.name, a);
  return map;
}
