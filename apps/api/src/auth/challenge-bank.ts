export type ChallengeOptionLabel = "A" | "B" | "C" | "D";

export type ChallengeQuestion = {
  id: string;
  question: string;
  options: [string, string, string, string];
  answer: ChallengeOptionLabel;
};

export const challengeQuestionBank: ChallengeQuestion[] = [
  {
    id: "analogy-001",
    question: "三顾茅庐∶刘备",
    options: ["负荆请罪∶蔺相如", "请君入瓮∶周兴", "雪中送炭∶宋太宗", "程门立雪：程颐"],
    answer: "C"
  },
  {
    id: "analogy-002",
    question: "报名：培训：结业",
    options: ["高考：招生：毕业", "设计：产品：使用", "驾驶：公路：旅行", "挂号：看病：痊愈"],
    answer: "D"
  },
  {
    id: "analogy-003",
    question: "民歌 对于（ ）相当于（ ）对于 航天器",
    options: ["民谣；飞机", "民间；太空", "舞曲；宇航员", "歌曲；飞船"],
    answer: "D"
  },
  {
    id: "analogy-004",
    question: "纺车 之于（ ）相当于（ ）之于 联合收割机",
    options: ["手摇；蒸汽机", "织布；传动带", "3D 织布机；曲辕犁", "自动打线车；发动机"],
    answer: "C"
  },
  {
    id: "analogy-005",
    question: "爆胎∶事故∶保险",
    options: ["论坛∶交流∶学术", "前卫∶时尚∶流行", "能源∶电力∶生产", "旱灾∶减产∶补贴"],
    answer: "D"
  },
  {
    id: "analogy-006",
    question: "钟表 之于（ ）相当于（ ）之于 排字工",
    options: ["时间；印刷工", "刻度；线装书", "更夫；打印机", "油纸；修理工"],
    answer: "C"
  },
  {
    id: "analogy-007",
    question: "进士：状元",
    options: ["河水：海水", "银河：天文", "学位：博士", "宪法：民法"],
    answer: "C"
  },
  {
    id: "analogy-008",
    question: "著作∶书∶丛书",
    options: ["裙子∶衣服∶服装", "树∶树林∶森林", "成语∶词语∶词汇", "人∶人群∶人民"],
    answer: "B"
  },
  {
    id: "analogy-009",
    question: "风霜雨雪：雾里看花",
    options: ["春夏秋冬：踏雪寻梅", "金木火土：水中望月", "桃李杏橘：青梅煮酒", "梅兰竹菊：茜窗画眉"],
    answer: "B"
  },
  {
    id: "analogy-010",
    question: "讨论：会议：方案",
    options: ["合作：课题：计划", "研究：手机：销量", "分析：汽车：技术", "调研：基层：实情"],
    answer: "D"
  },
  {
    id: "analogy-011",
    question: "港湾∶停泊",
    options: ["基因∶遗传", "法庭∶诉讼", "电缆∶发电", "公路∶运输"],
    answer: "D"
  },
  {
    id: "analogy-012",
    question: "鸭子：河",
    options: ["摩天轮：过山车", "喜剧：话剧", "飞机：飞机场", "火车：轨道"],
    answer: "D"
  },
  {
    id: "analogy-013",
    question: "正方形：立方体",
    options: ["三角形：棱形", "直线：平面", "圆：球", "四边形：八面体"],
    answer: "C"
  },
  {
    id: "analogy-014",
    question: "井底蛙：三脚猫：智慧",
    options: ["笑面虎：变色龙：真诚", "千里马：孺子牛：可靠", "替罪羊：铁公鸡：坚强", "地头蛇：纸老虎：勇敢"],
    answer: "A"
  },
  {
    id: "analogy-015",
    question: "谎言∶欺骗",
    options: ["谣言∶抱怨", "谗言∶无知", "佯言∶委婉", "诤言∶劝诫"],
    answer: "D"
  },
  {
    id: "analogy-016",
    question: "鸿雁：笺札：书信",
    options: ["月老：红娘：媒人", "乾坤：天地：宇宙", "红豆：相思：恋人", "东宫：王子：储君"],
    answer: "A"
  },
  {
    id: "analogy-017",
    question: "犹疑：深信",
    options: ["晚造：提前", "老到：幼稚", "婉拒：褒扬", "爽利：强横"],
    answer: "B"
  },
  {
    id: "analogy-018",
    question: "水：冻：冰",
    options: ["牛：耕：田", "纸张：书写：书籍", "单身：结婚：已婚", "衣服：缝制：布"],
    answer: "C"
  },
  {
    id: "analogy-019",
    question: "为虎添翼：如虎添翼",
    options: ["耸人听闻：骇人听闻", "一字不差：一字不落", "无所不至：无所不知", "好为人师：善为人师"],
    answer: "D"
  },
  {
    id: "analogy-020",
    question: "电动汽车：电动车：汽车",
    options: ["航天飞机：宇宙飞船：飞行器", "军医：医生：军人", "研究生：研究：学生", "法官：法律：官员"],
    answer: "B"
  },
  {
    id: "analogy-021",
    question: "经济赤字：收入：开支",
    options: ["债务纠纷：还钱：借钱", "胜劣汰：适应：淘汰", "销售利润：进价：售价", "背信弃义：诺言：谎言"],
    answer: "C"
  },
  {
    id: "analogy-022",
    question: "电：手机",
    options: ["风：风车", "螺旋桨：直升机", "水：船", "光：植物"],
    answer: "A"
  },
  {
    id: "analogy-023",
    question: "作茧自缚：化蛹成蝶",
    options: ["灯蛾扑火：化羽归尘", "雨润花开：春华秋实", "鱼翔浅底：鹰击长空", "凤凰浴火：涅槃重生"],
    answer: "D"
  },
  {
    id: "analogy-024",
    question: "酶：蛋白质：氨基酸",
    options: ["醋：弱酸：氢元素", "基因：DNA：染色体", "行政机关：公务员：基层公务员", "纤维素：多糖：单糖"],
    answer: "D"
  },
  {
    id: "analogy-025",
    question: "火柴：打火机：取火",
    options: ["煤炉：燃气灶：煮饭", "锄头：马车：耕地", "镜子：梳子：梳妆", "皂角：浣纱：洗衣"],
    answer: "A"
  },
  {
    id: "analogy-026",
    question: "太阳：（ ）相当于（ ）：相机",
    options: ["手表；倒影", "能源；科技", "烛光；胶卷", "向日葵；望远镜"],
    answer: "A"
  },
  {
    id: "analogy-027",
    question: "肖洛霍夫：静静的顿河：葛利高里",
    options: ["司汤达：红与黑：于连", "雨果：悲惨世界：冉·阿让", "路遥：平凡的世界：孙少安", "马尔克斯：百年孤独：布恩迪亚"],
    answer: "D"
  },
  {
    id: "analogy-028",
    question: "水泥：建房",
    options: ["水杯：解渴", "船桨：船帆", "瓢：舀水", "血：循环"],
    answer: "C"
  },
  {
    id: "analogy-029",
    question: "无机物：化合物",
    options: ["中草药：野菜", "二氧化碳：有机盐", "空间：时间", "原子：电子"],
    answer: "A"
  },
  {
    id: "analogy-030",
    question: "演员：公园：演出",
    options: ["谣言：微信：查处", "股民：股市：投资", "士兵：战争：升迁", "信息：卫星：定位"],
    answer: "B"
  },
  {
    id: "analogy-031",
    question: "河流：水",
    options: ["沙漠：泥", "森林：树木", "草原：动物", "山脉：冰雪"],
    answer: "B"
  },
  {
    id: "analogy-032",
    question: "燕子：春天",
    options: ["知了：夏天", "山鸡：高原", "蟋蟀：冬天", "白药：云南"],
    answer: "A"
  },
  {
    id: "analogy-033",
    question: "黄色：红色：白色",
    options: ["忧伤：高兴：愤怒", "女医生：男医生：医生", "科学：非科学：伪科学", "左手：右手：举手"],
    answer: "A"
  },
  {
    id: "analogy-034",
    question: "三角形之于平面相当于（ ）之于（ ）",
    options: ["菱形——四面体", "棱柱——空间", "点——直线", "曲线——椭圆"],
    answer: "B"
  },
  {
    id: "analogy-035",
    question: "歇斯底里：癔症",
    options: ["买单：结账", "脚踏车：自行车", "引擎：发动机", "可口可乐：饮料"],
    answer: "C"
  },
  {
    id: "analogy-036",
    question: "经济特区：珠海",
    options: ["南沙群岛：黄岩岛", "乐器：陶笛", "海军：航空母舰", "飞禽：蝙蝠"],
    answer: "B"
  },
  {
    id: "analogy-037",
    question: "逻辑学：光学",
    options: ["芝士：奶酪", "教师：医生", "黄瓜：萝卜", "男人：女人"],
    answer: "C"
  },
  {
    id: "analogy-038",
    question: "土地：地租",
    options: ["工资：劳动", "厂房：工人", "资本：利润", "学历：知识"],
    answer: "C"
  },
  {
    id: "analogy-039",
    question: "法律：法盲",
    options: ["地图：路盲", "黑暗：夜盲", "文字：文盲", "雪地：雪盲"],
    answer: "C"
  },
  {
    id: "analogy-040",
    question: "（ ）对于名垂千古相当于廉洁奉公对于（ ）",
    options: ["身败名裂 贪赃枉法", "德高望重 见利忘义", "流芳百世 乐善好施", "嫉恶如仇 独断专行"],
    answer: "A"
  },
  {
    id: "analogy-041",
    question: "考试：学生：成绩",
    options: ["网络：网民：电子邮件", "汽车：司机：驾驶执照", "工作：职员：工资待遇", "饭菜：厨师：色美味美"],
    answer: "C"
  },
  {
    id: "analogy-042",
    question: "老人：回忆：怀旧",
    options: ["游子：思念：乡愁", "工人：制造：创意", "农民：耕种：收获", "学生：学习：毕业"],
    answer: "A"
  },
  {
    id: "analogy-043",
    question: "手机：座机：联络",
    options: ["飞船：火箭：导弹", "空调：冰箱：温度", "广告：标语：宣传", "原子弹：氢弹：科学家"],
    answer: "C"
  },
  {
    id: "analogy-044",
    question: "大漠对于（ ）相当于草原对于（ ）",
    options: ["黄沙 蒙古包", "干旱 牧场", "骆驼 羊", "绿洲 雪山"],
    answer: "C"
  },
  {
    id: "analogy-045",
    question: "《窦娥冤》对于（ ）相当于（ ）对于马致远",
    options: ["关汉卿 《汉宫秋》", "郑光祖 《望江亭》", "王实甫 《西厢记》", "颜真卿 《天净沙·秋思》"],
    answer: "A"
  }
];
