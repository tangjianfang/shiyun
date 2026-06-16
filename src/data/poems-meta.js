/**
 * 部编版小学语文 1-6 年级 112 首必背古诗词元数据
 * 数据来源：教育部《义务教育语文课程标准》+ 部编版（人教社）小学语文教材
 *
 * 字段说明：
 * - id: 唯一 ID（年级-序号）
 * - title: 标题
 * - author: 作者
 * - dynasty: 朝代
 * - grade: 年级（1-6）
 * - type: 诗体（五言绝句/七言绝句/五言律诗/七言律诗/词/其他）
 * - content: 分句数组（去标点）
 * - sequence: 教材中顺序
 * - source: 内容来源标注
 */

export const POEMS_META = [
  // ===== 1 年级（12 首）=====
  { id: 'g1-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 1,
    type: '五言绝句', sequence: 1, source: '部编版 1 年级上 P8',
    content: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'] },
  { id: 'g1-02', title: '咏鹅', author: '骆宾王', dynasty: '唐', grade: 1,
    type: '七言绝句', sequence: 2, source: '部编版 1 年级上 P13',
    content: ['鹅鹅鹅', '曲项向天歌', '白毛浮绿水', '红掌拨清波'] },
  { id: 'g1-03', title: '江南', author: '汉乐府', dynasty: '汉', grade: 1,
    type: '其他', sequence: 3, source: '部编版 1 年级上 P14',
    content: ['江南可采莲', '莲叶何田田', '鱼戏莲叶间', '鱼戏莲叶东', '鱼戏莲叶西', '鱼戏莲叶南', '鱼戏莲叶北'] },
  { id: 'g1-04', title: '画', author: '王维', dynasty: '唐', grade: 1,
    type: '五言绝句', sequence: 4, source: '部编版 1 年级上 P16',
    content: ['远看山有色', '近听水无声', '春去花还在', '人来鸟不惊'] },
  { id: 'g1-05', title: '悯农·其二', author: '李绅', dynasty: '唐', grade: 1,
    type: '五言绝句', sequence: 5, source: '部编版 1 年级上 P19',
    content: ['锄禾日当午', '汗滴禾下土', '谁知盘中餐', '粒粒皆辛苦'] },
  { id: 'g1-06', title: '古朗月行（节选）', author: '李白', dynasty: '唐', grade: 1,
    type: '其他', sequence: 6, source: '部编版 1 年级上 P20',
    content: ['小时不识月', '呼作白玉盘', '又疑瑶台镜', '飞在青云端'] },
  { id: 'g1-07', title: '风', author: '李峤', dynasty: '唐', grade: 1,
    type: '其他', sequence: 7, source: '部编版 1 年级上 P21',
    content: ['解落三秋叶', '能开二月花', '过江千尺浪', '入竹万竿斜'] },
  { id: 'g1-08', title: '春晓', author: '孟浩然', dynasty: '唐', grade: 1,
    type: '五言绝句', sequence: 8, source: '部编版 1 年级下 P2',
    content: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'] },
  { id: 'g1-09', title: '赠汪伦', author: '李白', dynasty: '唐', grade: 1,
    type: '七言绝句', sequence: 9, source: '部编版 1 年级下 P8',
    content: ['李白乘舟将欲行', '忽闻岸上踏歌声', '桃花潭水深千尺', '不及汪伦送我情'] },
  { id: 'g1-10', title: '绝句', author: '杜甫', dynasty: '唐', grade: 1,
    type: '五言绝句', sequence: 10, source: '部编版 1 年级下 P12',
    content: ['两个黄鹂鸣翠柳', '一行白鹭上青天', '窗含西岭千秋雪', '门泊东吴万里船'] },
  { id: 'g1-11', title: '寻隐者不遇', author: '贾岛', dynasty: '唐', grade: 1,
    type: '其他', sequence: 11, source: '部编版 1 年级下 P16',
    content: ['松下问童子', '言师采药去', '只在此山中', '云深不知处'] },
  { id: 'g1-12', title: '登鹳雀楼', author: '王之涣', dynasty: '唐', grade: 1,
    type: '五言绝句', sequence: 12, source: '部编版 1 年级下 P18',
    content: ['白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼'] },

  // ===== 2 年级（14 首）=====
  { id: 'g2-01', title: '村居', author: '高鼎', dynasty: '清', grade: 2,
    type: '七言绝句', sequence: 1, source: '部编版 2 年级上 P2',
    content: ['草长莺飞二月天', '拂堤杨柳醉春烟', '儿童散学归来早', '忙趁东风放纸鸢'] },
  { id: 'g2-02', title: '咏柳', author: '贺知章', dynasty: '唐', grade: 2,
    type: '七言绝句', sequence: 2, source: '部编版 2 年级上 P4',
    content: ['碧玉妆成一树高', '万条垂下绿丝绦', '不知细叶谁裁出', '二月春风似剪刀'] },
  { id: 'g2-03', title: '晓出净慈寺送林子方', author: '杨万里', dynasty: '宋', grade: 2,
    type: '七言绝句', sequence: 3, source: '部编版 2 年级上 P6',
    content: ['毕竟西湖六月中', '风光不与四时同', '接天莲叶无穷碧', '映日荷花别样红'] },
  { id: 'g2-04', title: '绝句·两个黄鹂', author: '杜甫', dynasty: '唐', grade: 2,
    type: '五言绝句', sequence: 4, source: '部编版 2 年级上 P10',
    content: ['两个黄鹂鸣翠柳', '一行白鹭上青天', '窗含西岭千秋雪', '门泊东吴万里船'] },
  { id: 'g2-05', title: '枫桥夜泊', author: '张继', dynasty: '唐', grade: 2,
    type: '七言绝句', sequence: 5, source: '部编版 2 年级上 P22',
    content: ['月落乌啼霜满天', '江枫渔火对愁眠', '姑苏城外寒山寺', '夜半钟声到客船'] },
  { id: 'g2-06', title: '江南春', author: '杜牧', dynasty: '唐', grade: 2,
    type: '七言绝句', sequence: 6, source: '部编版 2 年级上 P26',
    content: ['千里莺啼绿映红', '水村山郭酒旗风', '南朝四百八十寺', '多少楼台烟雨中'] },
  { id: 'g2-07', title: '敕勒歌', author: '北朝民歌', dynasty: '南北朝', grade: 2,
    type: '其他', sequence: 7, source: '部编版 2 年级上 P30',
    content: ['敕勒川', '阴山下', '天似穹庐', '笼盖四野', '天苍苍', '野茫茫', '风吹草低见牛羊'] },
  { id: 'g2-08', title: '赋得古原草送别（节选）', author: '白居易', dynasty: '唐', grade: 2,
    type: '五言绝句', sequence: 8, source: '部编版 2 年级下 P2',
    content: ['离离原上草', '一岁一枯荣', '野火烧不尽', '春风吹又生'] },
  { id: 'g2-09', title: '书湖阴先生壁', author: '王安石', dynasty: '宋', grade: 2,
    type: '七言绝句', sequence: 9, source: '部编版 2 年级下 P6',
    content: ['茅檐长扫净无苔', '花木成畦手自栽', '一水护田将绿绕', '两山排闼送青来'] },
  { id: 'g2-10', title: '游子吟', author: '孟郊', dynasty: '唐', grade: 2,
    type: '其他', sequence: 10, source: '部编版 2 年级下 P10',
    content: ['慈母手中线', '游子身上衣', '临行密密缝', '意恐迟迟归', '谁言寸草心', '报得三春晖'] },
  { id: 'g2-11', title: '江雪', author: '柳宗元', dynasty: '唐', grade: 2,
    type: '五言绝句', sequence: 11, source: '部编版 2 年级下 P16',
    content: ['千山鸟飞绝', '万径人踪灭', '孤舟蓑笠翁', '独钓寒江雪'] },
  { id: 'g2-12', title: '江上渔者', author: '范仲淹', dynasty: '宋', grade: 2,
    type: '其他', sequence: 12, source: '部编版 2 年级下 P20',
    content: ['江上往来人', '但爱鲈鱼美', '君看一叶舟', '出没风波里'] },
  { id: 'g2-13', title: '望庐山瀑布', author: '李白', dynasty: '唐', grade: 2,
    type: '七言绝句', sequence: 13, source: '部编版 2 年级下 P26',
    content: ['日照香炉生紫烟', '遥看瀑布挂前川', '飞流直下三千尺', '疑是银河落九天'] },
  { id: 'g2-14', title: '早发白帝城', author: '李白', dynasty: '唐', grade: 2,
    type: '七言绝句', sequence: 14, source: '部编版 2 年级下 P30',
    content: ['朝辞白帝彩云间', '千里江陵一日还', '两岸猿声啼不住', '轻舟已过万重山'] },

  // ===== 3 年级（20 首）=====
  // 3 年级上（10 首）
  { id: 'g3-01', title: '赠刘景文', author: '苏轼', dynasty: '宋', grade: 3,
    type: '七言绝句', sequence: 1, source: '部编版 3 年级上 P3',
    content: ['荷尽已无擎雨盖', '菊残犹有傲霜枝', '一年好景君须记', '最是橙黄橘绿时'] },
  { id: 'g3-02', title: '夜书所见', author: '叶绍翁', dynasty: '宋', grade: 3,
    type: '七言绝句', sequence: 2, source: '部编版 3 年级上 P3',
    content: ['萧萧梧叶送寒声', '江上秋风动客情', '知有儿童挑促织', '夜深篱落一灯明'] },
  { id: 'g3-03', title: '九月九日忆山东兄弟', author: '王维', dynasty: '唐', grade: 3,
    type: '七言绝句', sequence: 3, source: '部编版 3 年级上 P3',
    content: ['独在异乡为异客', '每逢佳节倍思亲', '遥知兄弟登高处', '遍插茱萸少一人'] },
  { id: 'g3-04', title: '望天门山', author: '李白', dynasty: '唐', grade: 3,
    type: '七言绝句', sequence: 4, source: '部编版 3 年级上 P13',
    content: ['天门中断楚江开', '碧水东流至此回', '两岸青山相对出', '孤帆一片日边来'] },
  { id: 'g3-05', title: '饮湖上初晴后雨', author: '苏轼', dynasty: '宋', grade: 3,
    type: '七言绝句', sequence: 5, source: '部编版 3 年级上 P13',
    content: ['水光潋滟晴方好', '山色空蒙雨亦奇', '欲把西湖比西子', '淡妆浓抹总相宜'] },
  { id: 'g3-06', title: '望洞庭', author: '刘禹锡', dynasty: '唐', grade: 3,
    type: '七言绝句', sequence: 6, source: '部编版 3 年级上 P19',
    content: ['湖光秋月两相和', '潭面无风镜未磨', '遥望洞庭山水翠', '白银盘里一青螺'] },
  { id: 'g3-07', title: '早春呈水部张十八员外', author: '韩愈', dynasty: '唐', grade: 3,
    type: '七言绝句', sequence: 7, source: '部编版 3 年级上 P19',
    content: ['天街小雨润如酥', '草色遥看近却无', '最是一年春好处', '绝胜烟柳满皇都'] },
  { id: 'g3-08', title: '山行', author: '杜牧', dynasty: '唐', grade: 3,
    type: '七言绝句', sequence: 8, source: '部编版 3 年级上 P21',
    content: ['远上寒山石径斜', '白云生处有人家', '停车坐爱枫林晚', '霜叶红于二月花'] },
  { id: 'g3-09', title: '回乡偶书', author: '贺知章', dynasty: '唐', grade: 3,
    type: '七言绝句', sequence: 9, source: '部编版 3 年级上 P21',
    content: ['少小离家老大回', '乡音无改鬓毛衰', '儿童相见不相识', '笑问客从何处来'] },
  { id: 'g3-10', title: '长歌行', author: '汉乐府', dynasty: '汉', grade: 3,
    type: '其他', sequence: 10, source: '部编版 3 年级上 P21',
    content: ['青青园中葵', '朝露待日晞', '阳春布德泽', '万物生光辉', '常恐秋节至', '焜黄华叶衰', '百川东到海', '何时复西归', '少壮不努力', '老大徒伤悲'] },
  // 3 年级下（10 首）
  { id: 'g3-11', title: '绝句·迟日江山丽', author: '杜甫', dynasty: '唐', grade: 3,
    type: '五言绝句', sequence: 11, source: '部编版 3 年级下 P2',
    content: ['迟日江山丽', '春风花草香', '泥融飞燕子', '沙暖睡鸳鸯'] },
  { id: 'g3-12', title: '惠崇春江晚景', author: '苏轼', dynasty: '宋', grade: 3,
    type: '七言绝句', sequence: 12, source: '部编版 3 年级下 P2',
    content: ['竹外桃花三两枝', '春江水暖鸭先知', '蒌蒿满地芦芽短', '正是河豚欲上时'] },
  { id: 'g3-13', title: '三衢道中', author: '曾几', dynasty: '宋', grade: 3,
    type: '七言绝句', sequence: 13, source: '部编版 3 年级下 P2',
    content: ['梅子黄时日日晴', '小溪泛尽却山行', '绿阴不减来时路', '添得黄鹂四五声'] },
  { id: 'g3-14', title: '春日', author: '朱熹', dynasty: '宋', grade: 3,
    type: '七言绝句', sequence: 14, source: '部编版 3 年级下 P13',
    content: ['胜日寻芳泗水滨', '无边光景一时新', '等闲识得东风面', '万紫千红总是春'] },
  { id: 'g3-15', title: '游园不值', author: '叶绍翁', dynasty: '宋', grade: 3,
    type: '七言绝句', sequence: 15, source: '部编版 3 年级下 P13',
    content: ['应怜屐齿印苍苔', '小扣柴扉久不开', '春色满园关不住', '一枝红杏出墙来'] },
  { id: 'g3-16', title: '乡村四月', author: '翁卷', dynasty: '宋', grade: 3,
    type: '七言绝句', sequence: 16, source: '部编版 3 年级下 P17',
    content: ['绿遍山原白满川', '子规声里雨如烟', '乡村四月闲人少', '才了蚕桑又插田'] },
  { id: 'g3-17', title: '四时田园杂兴', author: '范成大', dynasty: '宋', grade: 3,
    type: '七言绝句', sequence: 17, source: '部编版 3 年级下 P17',
    content: ['昼出耘田夜绩麻', '村庄儿女各当家', '童孙未解供耕织', '也傍桑阴学种瓜'] },
  { id: 'g3-18', title: '宿新市徐公店', author: '杨万里', dynasty: '宋', grade: 3,
    type: '七言绝句', sequence: 18, source: '部编版 3 年级下 P17',
    content: ['篱落疏疏小径深', '树头新绿未成阴', '儿童急走追黄蝶', '飞入菜花无处寻'] },
  { id: 'g3-19', title: '竹里馆', author: '王维', dynasty: '唐', grade: 3,
    type: '五言绝句', sequence: 19, source: '部编版 3 年级下 P24',
    content: ['独坐幽篁里', '弹琴复长啸', '深林人不知', '明月来相照'] },
  { id: 'g3-20', title: '滁州西涧', author: '韦应物', dynasty: '唐', grade: 3,
    type: '七言绝句', sequence: 20, source: '部编版 3 年级下 P24',
    content: ['独怜幽草涧边生', '上有黄鹂深树鸣', '春潮带雨晚来急', '野渡无人舟自横'] },

  // ===== 4 年级（20 首）=====
  // 4 年级上（10 首）
  { id: 'g4-01', title: '浪淘沙·其一', author: '刘禹锡', dynasty: '唐', grade: 4,
    type: '七言绝句', sequence: 1, source: '部编版 4 年级上 P3',
    content: ['九曲黄河万里沙', '浪淘风簸自天涯', '如今直上银河去', '同到牵牛织女家'] },
  { id: 'g4-02', title: '鹿柴', author: '王维', dynasty: '唐', grade: 4,
    type: '五言绝句', sequence: 2, source: '部编版 4 年级上 P3',
    content: ['空山不见人', '但闻人语响', '返景入深林', '复照青苔上'] },
  { id: 'g4-03', title: '凉州词·葡萄美酒', author: '王翰', dynasty: '唐', grade: 4,
    type: '七言绝句', sequence: 3, source: '部编版 4 年级上 P17',
    content: ['葡萄美酒夜光杯', '欲饮琵琶马上催', '醉卧沙场君莫笑', '古来征战几人回'] },
  { id: 'g4-04', title: '出塞', author: '王昌龄', dynasty: '唐', grade: 4,
    type: '七言绝句', sequence: 4, source: '部编版 4 年级上 P17',
    content: ['秦时明月汉时关', '万里长征人未还', '但使龙城飞将在', '不教胡马度阴山'] },
  { id: 'g4-05', title: '凉州词·黄河远上', author: '王之涣', dynasty: '唐', grade: 4,
    type: '七言绝句', sequence: 5, source: '部编版 4 年级上 P17',
    content: ['黄河远上白云间', '一片孤城万仞山', '羌笛何须怨杨柳', '春风不度玉门关'] },
  { id: 'g4-06', title: '夏日绝句', author: '李清照', dynasty: '宋', grade: 4,
    type: '七言绝句', sequence: 6, source: '部编版 4 年级上 P21',
    content: ['生当作人杰', '死亦为鬼雄', '至今思项羽', '不肯过江东'] },
  { id: 'g4-07', title: '别董大', author: '高适', dynasty: '唐', grade: 4,
    type: '七言绝句', sequence: 7, source: '部编版 4 年级上 P21',
    content: ['千里黄云白日曛', '北风吹雁雪纷纷', '莫愁前路无知己', '天下谁人不识君'] },
  { id: 'g4-08', title: '蜂', author: '罗隐', dynasty: '唐', grade: 4,
    type: '七言绝句', sequence: 8, source: '部编版 4 年级上 P21',
    content: ['不论平地与山尖', '无限风光尽被占', '采得百花成蜜后', '为谁辛苦为谁甜'] },
  { id: 'g4-09', title: '暮江吟', author: '白居易', dynasty: '唐', grade: 4,
    type: '七言绝句', sequence: 9, source: '部编版 4 年级上 P21',
    content: ['一道残阳铺水中', '半江瑟瑟半江红', '可怜九月初三夜', '露似真珠月似弓'] },
  { id: 'g4-10', title: '嫦娥', author: '李商隐', dynasty: '唐', grade: 4,
    type: '七言绝句', sequence: 10, source: '部编版 4 年级上 P21',
    content: ['云母屏风烛影深', '长河渐落晓星沉', '嫦娥应悔偷灵药', '碧海青天夜夜心'] },
  // 4 年级下（10 首）
  { id: 'g4-11', title: '芙蓉楼送辛渐', author: '王昌龄', dynasty: '唐', grade: 4,
    type: '七言绝句', sequence: 11, source: '部编版 4 年级下 P6',
    content: ['寒雨连江夜入吴', '平明送客楚山孤', '洛阳亲友如相问', '一片冰心在玉壶'] },
  { id: 'g4-12', title: '塞下曲·月黑雁飞高', author: '卢纶', dynasty: '唐', grade: 4,
    type: '五言绝句', sequence: 12, source: '部编版 4 年级下 P6',
    content: ['月黑雁飞高', '单于夜遁逃', '欲将轻骑逐', '大雪满弓刀'] },
  { id: 'g4-13', title: '墨梅', author: '王冕', dynasty: '元', grade: 4,
    type: '七言绝句', sequence: 13, source: '部编版 4 年级下 P12',
    content: ['我家洗砚池头树', '朵朵花开淡墨痕', '不要人夸好颜色', '只留清气满乾坤'] },
  { id: 'g4-14', title: '竹石', author: '郑燮', dynasty: '清', grade: 4,
    type: '七言绝句', sequence: 14, source: '部编版 4 年级下 P12',
    content: ['咬定青山不放松', '立根原在破岩中', '千磨万击还坚劲', '任尔东西南北风'] },
  { id: 'g4-15', title: '石灰吟', author: '于谦', dynasty: '明', grade: 4,
    type: '七言绝句', sequence: 15, source: '部编版 4 年级下 P12',
    content: ['千锤万凿出深山', '烈火焚烧若等闲', '粉骨碎身浑不怕', '要留清白在人间'] },
  { id: 'g4-16', title: '江畔独步寻花·其六', author: '杜甫', dynasty: '唐', grade: 4,
    type: '七言绝句', sequence: 16, source: '部编版 4 年级下 P17',
    content: ['黄四娘家花满蹊', '千朵万朵压枝低', '留连戏蝶时时舞', '自在娇莺恰恰啼'] },
  { id: 'g4-17', title: '渔歌子', author: '张志和', dynasty: '唐', grade: 4,
    type: '词', sequence: 17, source: '部编版 4 年级下 P17',
    content: ['西塞山前白鹭飞', '桃花流水鳜鱼肥', '青箬笠', '绿蓑衣', '斜风细雨不须归'] },
  { id: 'g4-18', title: '山中', author: '王维', dynasty: '唐', grade: 4,
    type: '五言绝句', sequence: 18, source: '部编版 4 年级下 P17',
    content: ['荆溪白石出', '天寒红叶稀', '山路元无雨', '空翠湿人衣'] },
  { id: 'g4-19', title: '雪梅', author: '卢钺', dynasty: '宋', grade: 4,
    type: '七言绝句', sequence: 19, source: '部编版 4 年级下 P17',
    content: ['梅雪争春未肯降', '骚人阁笔费评章', '梅须逊雪三分白', '雪却输梅一段香'] },
  { id: 'g4-20', title: '终南望余雪', author: '祖咏', dynasty: '唐', grade: 4,
    type: '五言绝句', sequence: 20, source: '部编版 4 年级下 P17',
    content: ['终南阴岭秀', '积雪浮云端', '林表明霁色', '城中增暮寒'] },

  // ===== 5 年级（20 首）=====
  // 5 年级上（10 首）
  { id: 'g5-01', title: '蝉', author: '虞世南', dynasty: '唐', grade: 5,
    type: '五言绝句', sequence: 1, source: '部编版 5 年级上 P3',
    content: ['垂緌饮清露', '流响出疏桐', '居高声自远', '非是藉秋风'] },
  { id: 'g5-02', title: '乞巧', author: '林杰', dynasty: '唐', grade: 5,
    type: '七言绝句', sequence: 2, source: '部编版 5 年级上 P3',
    content: ['七夕今宵看碧霄', '牵牛织女渡河桥', '家家乞巧望秋月', '穿尽红丝几万条'] },
  { id: 'g5-03', title: '示儿', author: '陆游', dynasty: '宋', grade: 5,
    type: '七言绝句', sequence: 3, source: '部编版 5 年级上 P5',
    content: ['死去元知万事空', '但悲不见九州同', '王师北定中原日', '家祭无忘告乃翁'] },
  { id: 'g5-04', title: '题临安邸', author: '林升', dynasty: '宋', grade: 5,
    type: '七言绝句', sequence: 4, source: '部编版 5 年级上 P5',
    content: ['山外青山楼外楼', '西湖歌舞几时休', '暖风熏得游人醉', '直把杭州作汴州'] },
  { id: 'g5-05', title: '己亥杂诗', author: '龚自珍', dynasty: '清', grade: 5,
    type: '七言绝句', sequence: 5, source: '部编版 5 年级上 P5',
    content: ['九州生气恃风雷', '万马齐喑究可哀', '我劝天公重抖擞', '不拘一格降人才'] },
  { id: 'g5-06', title: '闻官军收河南河北', author: '杜甫', dynasty: '唐', grade: 5,
    type: '七言律诗', sequence: 6, source: '部编版 5 年级上 P10',
    content: ['剑外忽传收蓟北', '初闻涕泪满衣裳', '却看妻子愁何在', '漫卷诗书喜欲狂', '白日放歌须纵酒', '青春作伴好还乡', '即从巴峡穿巫峡', '便下襄阳向洛阳'] },
  { id: 'g5-07', title: '宿建德江', author: '孟浩然', dynasty: '唐', grade: 5,
    type: '五言绝句', sequence: 7, source: '部编版 5 年级上 P13',
    content: ['移舟泊烟渚', '日暮客愁新', '野旷天低树', '江清月近人'] },
  { id: 'g5-08', title: '山居秋暝', author: '王维', dynasty: '唐', grade: 5,
    type: '五言律诗', sequence: 8, source: '部编版 5 年级上 P13',
    content: ['空山新雨后', '天气晚来秋', '明月松间照', '清泉石上流', '竹喧归浣女', '莲动下渔舟', '随意春芳歇', '王孙自可留'] },
  { id: 'g5-09', title: '黄鹤楼送孟浩然之广陵', author: '李白', dynasty: '唐', grade: 5,
    type: '七言绝句', sequence: 9, source: '部编版 5 年级上 P13',
    content: ['故人西辞黄鹤楼', '烟花三月下扬州', '孤帆远影碧空尽', '唯见长江天际流'] },
  { id: 'g5-10', title: '春日偶成', author: '程颢', dynasty: '宋', grade: 5,
    type: '七言绝句', sequence: 10, source: '部编版 5 年级上 P13',
    content: ['云淡风轻近午天', '傍花随柳过前川', '时人不识余心乐', '将谓偷闲学少年'] },
  // 5 年级下（10 首）
  { id: 'g5-11', title: '稚子弄冰', author: '杨万里', dynasty: '宋', grade: 5,
    type: '七言绝句', sequence: 11, source: '部编版 5 年级下 P3',
    content: ['稚子金盆脱晓冰', '彩丝穿取当银钲', '敲成玉磬穿林响', '忽作玻璃碎地声'] },
  { id: 'g5-12', title: '村晚', author: '雷震', dynasty: '宋', grade: 5,
    type: '七言绝句', sequence: 12, source: '部编版 5 年级下 P3',
    content: ['草满池塘水满陂', '山衔落日浸寒漪', '牧童归去横牛背', '短笛无腔信口吹'] },
  { id: 'g5-13', title: '从军行', author: '王昌龄', dynasty: '唐', grade: 5,
    type: '七言绝句', sequence: 13, source: '部编版 5 年级下 P6',
    content: ['青海长云暗雪山', '孤城遥望玉门关', '黄沙百战穿金甲', '不破楼兰终不还'] },
  { id: 'g5-14', title: '秋夜将晓出篱门迎凉有感', author: '陆游', dynasty: '宋', grade: 5,
    type: '七言绝句', sequence: 14, source: '部编版 5 年级下 P6',
    content: ['三万里河东入海', '五千仞岳上摩天', '遗民泪尽胡尘里', '南望王师又一年'] },
  { id: 'g5-15', title: '十一月四日风雨大作', author: '陆游', dynasty: '宋', grade: 5,
    type: '七言绝句', sequence: 15, source: '部编版 5 年级下 P6',
    content: ['僵卧孤村不自哀', '尚思为国戍轮台', '夜阑卧听风吹雨', '铁马冰河入梦来'] },
  { id: 'g5-16', title: '望岳', author: '杜甫', dynasty: '唐', grade: 5,
    type: '其他', sequence: 16, source: '部编版 5 年级下 P12',
    content: ['岱宗夫如何', '齐鲁青未了', '造化钟神秀', '阴阳割昏晓', '荡胸生曾云', '决眦入归鸟', '会当凌绝顶', '一览众山小'] },
  { id: 'g5-17', title: '春望', author: '杜甫', dynasty: '唐', grade: 5,
    type: '五言律诗', sequence: 17, source: '部编版 5 年级下 P12',
    content: ['国破山河在', '城春草木深', '感时花溅泪', '恨别鸟惊心', '烽火连三月', '家书抵万金', '白头搔更短', '浑欲不胜簪'] },
  { id: 'g5-18', title: '题西林壁', author: '苏轼', dynasty: '宋', grade: 5,
    type: '七言绝句', sequence: 18, source: '部编版 5 年级下 P17',
    content: ['横看成岭侧成峰', '远近高低各不同', '不识庐山真面目', '只缘身在此山中'] },
  { id: 'g5-19', title: '泊船瓜洲', author: '王安石', dynasty: '宋', grade: 5,
    type: '七言绝句', sequence: 19, source: '部编版 5 年级下 P17',
    content: ['京口瓜洲一水间', '钟山只隔数重山', '春风又绿江南岸', '明月何时照我还'] },
  { id: 'g5-20', title: '黄鹤楼', author: '崔颢', dynasty: '唐', grade: 5,
    type: '七言律诗', sequence: 20, source: '部编版 5 年级下 P20',
    content: ['昔人已乘黄鹤去', '此地空余黄鹤楼', '黄鹤一去不复返', '白云千载空悠悠', '晴川历历汉阳树', '芳草萋萋鹦鹉洲', '日暮乡关何处是', '烟波江上使人愁'] },

  // ===== 6 年级（26 首）=====
  // 6 年级上（13 首）
  { id: 'g6-01', title: '宿业师山房待丁大不至', author: '孟浩然', dynasty: '唐', grade: 6,
    type: '五言绝句', sequence: 1, source: '部编版 6 年级上 P3',
    content: ['夕阳度西岭', '群壑倏已暝', '松月生夜凉', '风泉满清听', '樵人归欲尽', '烟鸟栖初定', '之子期宿来', '孤琴候萝径'] },
  { id: 'g6-02', title: '六月二十七日望湖楼醉书', author: '苏轼', dynasty: '宋', grade: 6,
    type: '七言绝句', sequence: 2, source: '部编版 6 年级上 P3',
    content: ['黑云翻墨未遮山', '白雨跳珠乱入船', '卷地风来忽吹散', '望湖楼下水如天'] },
  { id: 'g6-03', title: '西江月·夜行黄沙道中', author: '辛弃疾', dynasty: '宋', grade: 6,
    type: '词', sequence: 3, source: '部编版 6 年级上 P3',
    content: ['明月别枝惊鹊', '清风半夜鸣蝉', '稻花香里说丰年', '听取蛙声一片', '七八个星天外', '两三点雨山前', '旧时茅店社林边', '路转溪桥忽见'] },
  { id: 'g6-04', title: '长相思', author: '纳兰性德', dynasty: '清', grade: 6,
    type: '词', sequence: 4, source: '部编版 6 年级上 P6',
    content: ['山一程', '水一程', '身向榆关那畔行', '夜深千帐灯', '风一更', '雪一更', '聒碎乡心梦不成', '故园无此声'] },
  { id: 'g6-05', title: '忆江南', author: '白居易', dynasty: '唐', grade: 6,
    type: '词', sequence: 5, source: '部编版 6 年级上 P6',
    content: ['江南好', '风景旧曾谙', '日出江花红胜火', '春来江水绿如蓝', '能不忆江南'] },
  { id: 'g6-06', title: '浪淘沙·九曲黄河', author: '刘禹锡', dynasty: '唐', grade: 6,
    type: '七言绝句', sequence: 6, source: '部编版 6 年级上 P10',
    content: ['九曲黄河万里沙', '浪淘风簸自天涯', '如今直上银河去', '同到牵牛织女家'] },
  { id: 'g6-07', title: '乐游原', author: '李商隐', dynasty: '唐', grade: 6,
    type: '五言绝句', sequence: 7, source: '部编版 6 年级上 P10',
    content: ['向晚意不适', '驱车登古原', '夕阳无限好', '只是近黄昏'] },
  { id: 'g6-08', title: '题都城南庄', author: '崔护', dynasty: '唐', grade: 6,
    type: '七言绝句', sequence: 8, source: '部编版 6 年级上 P13',
    content: ['去年今日此门中', '人面桃花相映红', '人面不知何处去', '桃花依旧笑春风'] },
  { id: 'g6-09', title: '闻王昌龄左迁龙标遥有此寄', author: '李白', dynasty: '唐', grade: 6,
    type: '七言绝句', sequence: 9, source: '部编版 6 年级上 P13',
    content: ['杨花落尽子规啼', '闻道龙标过五溪', '我寄愁心与明月', '随风直到夜郎西'] },
  { id: 'g6-10', title: '行路难', author: '李白', dynasty: '唐', grade: 6,
    type: '其他', sequence: 10, source: '部编版 6 年级上 P17',
    content: ['金樽清酒斗十千', '玉盘珍羞直万钱', '停杯投箸不能食', '拔剑四顾心茫然', '欲渡黄河冰塞川', '将登太行雪满山', '闲来垂钓碧溪上', '忽复乘舟梦日边', '行路难', '行路难', '多歧路', '今安在', '长风破浪会有时', '直挂云帆济沧海'] },
  { id: 'g6-11', title: '渔家傲·秋思', author: '范仲淹', dynasty: '宋', grade: 6,
    type: '词', sequence: 11, source: '部编版 6 年级上 P19',
    content: ['塞下秋来风景异', '衡阳雁去无留意', '四面边声连角起', '千嶂里', '长烟落日孤城闭', '浊酒一杯家万里', '燕然未勒归无计', '羌管悠悠霜满地', '人不寐', '将军白发征夫泪'] },
  { id: 'g6-12', title: '浣溪沙', author: '晏殊', dynasty: '宋', grade: 6,
    type: '词', sequence: 12, source: '部编版 6 年级上 P19',
    content: ['一曲新词酒一杯', '去年天气旧亭台', '夕阳西下几时回', '无可奈何花落去', '似曾相识燕归来', '小园香径独徘徊'] },
  { id: 'g6-13', title: '卜算子·送鲍浩然之浙东', author: '王观', dynasty: '宋', grade: 6,
    type: '词', sequence: 13, source: '部编版 6 年级上 P19',
    content: ['水是眼波横', '山是眉峰聚', '欲问行人去那边', '眉眼盈盈处', '才始送春归', '又送君归去', '若到江南赶上春', '千万和春住'] },
  // 6 年级下（13 首）
  { id: 'g6-14', title: '元日', author: '王安石', dynasty: '宋', grade: 6,
    type: '七言绝句', sequence: 14, source: '部编版 6 年级下 P2',
    content: ['爆竹声中一岁除', '春风送暖入屠苏', '千门万户曈曈日', '总把新桃换旧符'] },
  { id: 'g6-15', title: '天竺寺八月十五日夜桂子', author: '皮日休', dynasty: '唐', grade: 6,
    type: '七言绝句', sequence: 15, source: '部编版 6 年级下 P2',
    content: ['玉颗珊珊下月轮', '殿前拾得露华新', '至今不会天中事', '应是嫦娥掷与人'] },
  { id: 'g6-16', title: '清明', author: '杜牧', dynasty: '唐', grade: 6,
    type: '七言绝句', sequence: 16, source: '部编版 6 年级下 P8',
    content: ['清明时节雨纷纷', '路上行人欲断魂', '借问酒家何处有', '牧童遥指杏花村'] },
  { id: 'g6-17', title: '池上', author: '白居易', dynasty: '唐', grade: 6,
    type: '五言绝句', sequence: 17, source: '部编版 6 年级下 P8',
    content: ['小娃撑小艇', '偷采白莲回', '不解藏踪迹', '浮萍一道开'] },
  { id: 'g6-18', title: '小儿垂钓', author: '胡令能', dynasty: '唐', grade: 6,
    type: '七言绝句', sequence: 18, source: '部编版 6 年级下 P8',
    content: ['蓬头稚子学垂纶', '侧坐莓苔草映身', '路人借问遥招手', '怕得鱼惊不应人'] },
  { id: 'g6-19', title: '春夜喜雨', author: '杜甫', dynasty: '唐', grade: 6,
    type: '五言律诗', sequence: 19, source: '部编版 6 年级下 P14',
    content: ['好雨知时节', '当春乃发生', '随风潜入夜', '润物细无声', '野径云俱黑', '江船火独明', '晓看红湿处', '花重锦官城'] },
  { id: 'g6-20', title: '所见', author: '袁枚', dynasty: '清', grade: 6,
    type: '五言绝句', sequence: 20, source: '部编版 6 年级下 P14',
    content: ['牧童骑黄牛', '歌声振林樾', '意欲捕鸣蝉', '忽然闭口立'] },
  { id: 'g6-21', title: '采薇（节选）', author: '诗经', dynasty: '先秦', grade: 6,
    type: '其他', sequence: 21, source: '部编版 6 年级下 P14',
    content: ['昔我往矣', '杨柳依依', '今我来思', '雨雪霏霏', '行道迟迟', '载渴载饥', '我心伤悲', '莫知我哀'] },
  { id: 'g6-22', title: '十五夜望月', author: '王建', dynasty: '唐', grade: 6,
    type: '七言绝句', sequence: 22, source: '部编版 6 年级下 P14',
    content: ['中庭地白树栖鸦', '冷露无声湿桂花', '今夜月明人尽望', '不知秋思落谁家'] },
  { id: 'g6-23', title: '春夜洛城闻笛', author: '李白', dynasty: '唐', grade: 6,
    type: '七言绝句', sequence: 23, source: '部编版 6 年级下 P18',
    content: ['谁家玉笛暗飞声', '散入春风满洛城', '此夜曲中闻折柳', '何人不起故园情'] },
  { id: 'g6-24', title: '送元二使安西', author: '王维', dynasty: '唐', grade: 6,
    type: '七言绝句', sequence: 24, source: '部编版 6 年级下 P18',
    content: ['渭城朝雨浥轻尘', '客舍青青柳色新', '劝君更尽一杯酒', '西出阳关无故人'] },
  { id: 'g6-25', title: '约客', author: '赵师秀', dynasty: '宋', grade: 6,
    type: '七言绝句', sequence: 25, source: '部编版 6 年级下 P18',
    content: ['黄梅时节家家雨', '青草池塘处处蛙', '有约不来过夜半', '闲敲棋子落灯花'] },
  { id: 'g6-26', title: '竹枝词', author: '刘禹锡', dynasty: '唐', grade: 6,
    type: '七言绝句', sequence: 26, source: '部编版 6 年级下 P18',
    content: ['杨柳青青江水平', '闻郎江上唱歌声', '东边日出西边雨', '道是无晴却有晴'] },
];

export const GRADES = [1, 2, 3, 4, 5, 6];
export const DYNASTIES = ['唐', '宋', '元', '明', '清', '汉', '南北朝', '先秦'];

/**
 * 按年级取诗
 * @param {number} grade - 年级（1-6）
 * @returns {Array} 该年级的所有诗词
 */
export function getPoemsByGrade(grade) {
  return POEMS_META.filter(p => p.grade === grade);
}

/**
 * 按朝代取诗
 * @param {string} dynasty - 朝代
 * @returns {Array} 该朝代的所有诗词
 */
export function getPoemsByDynasty(dynasty) {
  return POEMS_META.filter(p => p.dynasty === dynasty);
}

/**
 * 按作者取诗
 * @param {string} author - 作者
 * @returns {Array} 该作者的所有诗词
 */
export function getPoemsByAuthor(author) {
  return POEMS_META.filter(p => p.author === author);
}

/**
 * 搜索（标题 + 作者）
 * @param {string} keyword - 关键词
 * @returns {Array} 匹配的诗词
 */
export function searchPoems(keyword) {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return [...POEMS_META];
  return POEMS_META.filter(p =>
    p.title.toLowerCase().includes(kw) ||
    p.author.toLowerCase().includes(kw)
  );
}

/**
 * 获取所有不重复的朝代
 * @returns {string[]} 朝代列表（按字母排序）
 */
export function getAllDynasties() {
  return [...new Set(POEMS_META.map(p => p.dynasty))].sort();
}

/**
 * 获取所有不重复的作者
 * @returns {string[]} 作者列表（按字母排序）
 */
export function getAllAuthors() {
  return [...new Set(POEMS_META.map(p => p.author))].sort();
}
