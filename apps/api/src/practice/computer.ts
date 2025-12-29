export type ComputerExamOverviewItem = {
  label: string;
  value: string;
};

export type ComputerScoreItem = {
  label: string;
  value: string;
  note: string;
};

export type ComputerLearningBlock = {
  id: string;
  title: string;
  score: string;
  focus: string;
  topics: string[];
};

export type ComputerResource = {
  title: string;
  url: string;
  note?: string;
};

export type ComputerContentSection = {
  title: string;
  points: string[];
};

export type ComputerTopic = {
  id: string;
  label: string;
  summary: string;
  keyPoints: string[];
  examFocus: string[];
  contentSections: ComputerContentSection[];
  resources: ComputerResource[];
  questions: string[];
};

export type ComputerQuestionType =
  | "single"
  | "multi"
  | "judge"
  | "blank"
  | "short";

export type ComputerQuestion = {
  id: string;
  topicId: string;
  type: ComputerQuestionType;
  stem: string;
  options?: string[];
  answer: string | string[] | boolean;
  analysis: string;
};

export type ComputerQuestionPublic = Omit<ComputerQuestion, "answer">;

export type ComputerCTaskBlank = {
  id: string;
  label: string;
  placeholder: string;
};

export type ComputerCTask = {
  id: string;
  title: string;
  description: string;
  template: string;
  blanks: ComputerCTaskBlank[];
};

export type ComputerSqlDataset = {
  table: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
};

export type ComputerSqlTask = {
  id: string;
  title: string;
  description: string;
  dataset: ComputerSqlDataset;
  hint: string;
  sampleQuery: string;
};

type ParsedSqlQuery = {
  resolvedColumns: string[];
  conditions: Array<{ column: string; operator: string; value: string | number }>;
  orderBy: { column: string; direction: "asc" | "desc" } | null;
};

type SqlResult = {
  columns: string[];
  rows: Array<Array<string | number>>;
};

type SqlRunResult = SqlResult | { error: string };

const EXAM_OVERVIEW: ComputerExamOverviewItem[] = [
  { label: "考试时长", value: "120 分钟" },
  { label: "总分", value: "100 分" },
  { label: "题型", value: "单选/多选、填空、判断、简答、程序设计" },
  {
    label: "考查目标",
    value: "计算机基础 + 软件应用 + 专业理论 + 安全技术"
  }
];

const SCORE_DISTRIBUTION: ComputerScoreItem[] = [
  { label: "计算机基础", value: "约 25 分", note: "编码/硬件/OS/安全" },
  { label: "软件应用", value: "约 15 分", note: "Windows + Office" },
  { label: "计算机网络", value: "约 20 分", note: "模型/协议/设备" },
  { label: "C 语言与数据结构", value: "约 20 分", note: "语法 + 常见结构" },
  { label: "数据库理论", value: "约 15 分", note: "SQL/事务/范式" },
  { label: "软件工程", value: "约 5 分", note: "流程/测试/质量" }
];

const FOCUS_TIPS = [
  "进制转换、补码、位运算是必考基础题。",
  "Windows 10 与 Office 2016 高频操作要能口述步骤。",
  "C 语言指针、数组、函数调用细节容易失分。",
  "SQL 查询与事务隔离级别是高频主观题。",
  "OSI/TCP/IP 与常见网络安全防护要能写简答。"
];

const LEARNING_BLOCKS: ComputerLearningBlock[] = [
  {
    id: "base",
    title: "计算机基础与安全",
    score: "约 25 分",
    focus: "基础概念、编码、硬件、OS 与信息安全",
    topics: [
      "computer-basics",
      "encoding",
      "hardware",
      "multimedia",
      "os-basics",
      "emerging",
      "security-basics",
      "virus",
      "intrusion"
    ]
  },
  {
    id: "software",
    title: "软件应用与系统操作",
    score: "约 15 分",
    focus: "Windows 10 + Office 2016",
    topics: ["windows", "office"]
  },
  {
    id: "c-data",
    title: "C 语言与数据结构",
    score: "约 20 分",
    focus: "基础语法 + 常用结构",
    topics: ["c-language", "data-structures"]
  },
  {
    id: "database",
    title: "数据库理论",
    score: "约 15 分",
    focus: "关系模型、SQL 与事务",
    topics: ["database"]
  },
  {
    id: "network",
    title: "计算机网络",
    score: "约 20 分",
    focus: "模型、协议、设备与安全",
    topics: ["network"]
  },
  {
    id: "software-engineering",
    title: "软件工程",
    score: "约 5 分",
    focus: "生命周期与质量保证",
    topics: ["software-engineering"]
  }
];

const TOPICS: ComputerTopic[] = [
  {
    id: "computer-basics",
    label: "计算机特点与应用",
    summary: "掌握计算机核心特点、分类方式与主要应用场景。",
    keyPoints: ["高速/准确/自动化", "通用性与可编程", "分类与应用领域"],
    examFocus: ["区分微型机/服务器/嵌入式", "列举典型应用场景"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "特点：高速、准确、自动化、可编程、存储容量大。",
          "分类：按规模/用途/处理方式（微型机、服务器、嵌入式等）。",
          "应用：数据处理、自动控制、辅助设计、网络与多媒体。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "对比：通用机通过软件切换任务，专用机面向单一场景。",
          "发展：真空管→晶体管→集成电路→超大规模集成。",
          "性能指标：主频、字长、吞吐量、存储容量。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "“通用性”不是硬件可拆卸，而是程序可替换。",
          "“自动化”需依赖程序与数据，不代表无需人工维护。"
        ]
      }
    ],
    resources: [
      {
        title: "CS-Notes（总览）",
        url: "https://github.com/CyC2018/CS-Notes",
        note: "目录中查找计算机基础相关章节"
      },
      {
        title: "免费计算机书籍合集",
        url: "https://github.com/justjavac/free-programming-books-zh_CN",
        note: "综合教材索引"
      }
    ],
    questions: [
      "计算机通用性与专用性的差异？",
      "衡量计算机性能的关键指标有哪些？"
    ]
  },
  {
    id: "encoding",
    label: "信息编码与数制转换",
    summary: "掌握数制转换、编码方式、补码与逻辑运算。",
    keyPoints: ["二/八/十六进制转换", "ASCII/Unicode", "补码/位运算"],
    examFocus: ["进制换算步骤", "补码与符号位判断"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "常用数制：二进制/八进制/十六进制的换算规则。",
          "字符编码：ASCII 为 7 位编码，Unicode 统一编码体系。",
          "补码：负数用补码表示，便于统一加减法。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "二进制转十进制：按位权展开求和。",
          "十进制转二进制：除 2 取余或拆分位权。",
          "位运算：与/或/异或常用于掩码与奇偶校验。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "补码最高位是符号位，溢出判断要看符号变化。",
          "ASCII 与 Unicode 是编码体系，不是字符集大小概念。"
        ]
      }
    ],
    resources: [
      {
        title: "CS-Notes（编码/组成原理）",
        url: "https://github.com/CyC2018/CS-Notes",
        note: "目录中查找计算机组成原理章节"
      }
    ],
    questions: [
      "补码为何能统一加减法？",
      "二进制 1011 转十进制的方法？"
    ]
  },
  {
    id: "hardware",
    label: "硬件组成与功能",
    summary: "理解 CPU、存储、总线与外设的作用及层次结构。",
    keyPoints: ["CPU 组成", "存储层次", "总线/外设"],
    examFocus: ["寄存器/缓存/内存区别", "I/O 设备分类"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "CPU 由运算器、控制器、寄存器组成。",
          "存储层次：寄存器→缓存→内存→外存。",
          "总线包括数据总线、地址总线、控制总线。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "缓存命中率越高，整体性能越好。",
          "RAM 断电丢失数据，ROM 可保存固件。",
          "I/O 设备分输入、输出与双向设备。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "CPU 主频不是唯一性能指标。",
          "外存速度低但容量大，内存相反。"
        ]
      }
    ],
    resources: [
      {
        title: "CS-Notes（计算机组成原理）",
        url: "https://github.com/CyC2018/CS-Notes",
        note: "硬件结构梳理"
      }
    ],
    questions: [
      "缓存命中率对性能的影响？",
      "CPU 控制器与运算器职责是什么？"
    ]
  },
  {
    id: "multimedia",
    label: "多媒体与数据压缩",
    summary: "理解采样、量化、编码与常见压缩标准。",
    keyPoints: ["采样/量化", "有损/无损压缩", "常见格式"],
    examFocus: ["奈奎斯特采样定理", "JPEG/MP3/MP4"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "采样频率至少为信号最高频率的 2 倍。",
          "量化位数决定音频/图像的精细程度。",
          "有损压缩牺牲部分信息换取更高压缩比。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "JPEG 常用于图片，有损；PNG 为无损。",
          "MP3 为有损音频压缩，WAV 为无损。",
          "视频压缩需要时域 + 空域冗余消除。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "采样频率与比特率不是同一概念。",
          "有损压缩不是“错误压缩”，是可接受损失。"
        ]
      }
    ],
    resources: [
      {
        title: "Digital Video Introduction",
        url: "https://github.com/leandromoreira/digital_video_introduction",
        note: "多媒体编码入门"
      }
    ],
    questions: [
      "奈奎斯特采样定理的意义？",
      "JPEG 与 PNG 的区别是什么？"
    ]
  },
  {
    id: "os-basics",
    label: "操作系统基础",
    summary: "掌握操作系统功能、进程管理与内存管理基础。",
    keyPoints: ["进程/线程", "内存管理", "文件系统"],
    examFocus: ["进程状态转换", "分页与置换算法"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "操作系统负责进程、内存、文件与设备管理。",
          "进程是资源分配单位，线程是调度单位。",
          "常见调度：先来先服务、时间片轮转。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "进程状态：就绪、运行、阻塞三态。",
          "分页/分段解决内存碎片问题，页表映射地址。",
          "文件系统关注目录结构、权限与磁盘管理。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "线程共享进程资源，进程之间相互独立。",
          "死锁四个必要条件要能背诵。"
        ]
      }
    ],
    resources: [
      {
        title: "CS-Notes（操作系统）",
        url: "https://github.com/CyC2018/CS-Notes",
        note: "进程/内存/文件系统"
      },
      {
        title: "OSTEP 在线书",
        url: "https://pages.cs.wisc.edu/~remzi/OSTEP/",
        note: "操作系统经典教材"
      }
    ],
    questions: [
      "进程与线程的区别？",
      "操作系统四大管理功能是什么？"
    ]
  },
  {
    id: "emerging",
    label: "云计算/大数据/AI 基础",
    summary: "理解云服务模型、大数据特征与 AI 基本概念。",
    keyPoints: ["IaaS/PaaS/SaaS", "大数据 5V", "AI/ML 基础"],
    examFocus: ["云服务模型对比", "大数据流程"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "IaaS 提供基础设施，PaaS 提供开发平台，SaaS 提供软件服务。",
          "大数据 5V：海量、快速、多样、价值、真实性。",
          "AI/机器学习通过数据训练模型完成预测或决策。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "云计算强调资源池化与按需付费。",
          "大数据处理流程：采集→存储→计算→分析→应用。",
          "AI 与自动化区别：AI 能从数据中学习规则。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "SaaS 是直接面向用户的软件服务，不是系统开发环境。",
          "大数据不是单纯“数据量大”，还有速度与价值。"
        ]
      }
    ],
    resources: [
      {
        title: "Apache Spark",
        url: "https://github.com/apache/spark",
        note: "大数据处理框架"
      }
    ],
    questions: [
      "IaaS、PaaS、SaaS 的主要区别？",
      "大数据 5V 分别指什么？"
    ]
  },
  {
    id: "security-basics",
    label: "信息安全与等级保护",
    summary: "掌握 CIA 三要素、安全策略与常见 Web 漏洞。",
    keyPoints: ["保密性/完整性/可用性", "访问控制", "等级保护"],
    examFocus: ["安全等级分类", "SQL 注入与 XSS"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "CIA 三要素：保密性、完整性、可用性。",
          "访问控制模型：自主控制、强制控制、基于角色。",
          "等级保护强调安全建设与合规评测。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "身份认证常见方式：口令、多因素、数字证书。",
          "对称加密速度快，非对称加密便于密钥分发。",
          "Web 安全重点：SQL 注入、XSS、CSRF。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "加密解决保密性，不等于完整性与不可否认。",
          "等级保护是国家标准，与企业内部级别不同。"
        ]
      }
    ],
    resources: [
      {
        title: "OWASP Cheat Sheet",
        url: "https://github.com/OWASP/CheatSheetSeries",
        note: "Web 安全速查"
      }
    ],
    questions: [
      "CIA 三要素分别是什么？",
      "SQL 注入的基本原理是什么？"
    ]
  },
  {
    id: "virus",
    label: "计算机病毒与防治",
    summary: "掌握病毒特性、分类与防治流程。",
    keyPoints: ["传染性/潜伏性", "病毒分类", "防治措施"],
    examFocus: ["病毒与蠕虫区别", "防病毒三步法"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "病毒特性：传染性、潜伏性、破坏性。",
          "分类：文件型、引导型、宏病毒、蠕虫、木马。",
          "传播：U 盘、邮件附件、漏洞利用。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "防治流程：预防→检测→清除→恢复。",
          "蠕虫不依赖宿主文件，可自我传播。",
          "木马主要用于隐蔽控制而非自我复制。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "病毒不一定立即破坏，潜伏期更常见。",
          "蠕虫与病毒最核心差别在传播方式。"
        ]
      }
    ],
    resources: [
      {
        title: "TheZoo 恶意样本库",
        url: "https://github.com/ytisf/theZoo",
        note: "样本与分类参考"
      }
    ],
    questions: [
      "蠕虫与病毒的区别？",
      "防病毒常用措施有哪些？"
    ]
  },
  {
    id: "intrusion",
    label: "入侵检测与防火墙",
    summary: "理解 IDS/IPS 与防火墙策略。",
    keyPoints: ["IDS/IPS", "防火墙类型", "攻击防护"],
    examFocus: ["包过滤/状态检测", "常见攻击"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "IDS 负责检测与告警，IPS 可阻断攻击。",
          "防火墙类型：包过滤、状态检测、应用代理。",
          "常见攻击：DoS、ARP 欺骗、口令爆破。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "入侵检测方法：特征匹配、异常检测、混合检测。",
          "防火墙常见策略：默认拒绝或默认允许。",
          "IPS 部署位置常在网络出口或关键服务器前。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "IDS 不等于防火墙；一个是检测一个是控制。",
          "包过滤主要工作在网络层/传输层。"
        ]
      }
    ],
    resources: [
      {
        title: "Zeek 网络监测",
        url: "https://github.com/zeek/zeek",
        note: "入侵检测实践"
      }
    ],
    questions: [
      "IDS 与 IPS 有何区别？",
      "防火墙的包过滤作用在哪一层？"
    ]
  },
  {
    id: "windows",
    label: "Windows 10 操作系统",
    summary: "熟悉 Windows 10 基本操作与维护方式。",
    keyPoints: ["系统安装维护", "文件与权限", "进程与服务"],
    examFocus: ["常见工具与快捷键", "系统更新与恢复"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "常见文件系统：NTFS 支持权限与大文件。",
          "系统工具：任务管理器、事件查看器、磁盘管理。",
          "账户体系：本地账户与 Microsoft 账户。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "维护手段：系统更新、磁盘清理、系统还原。",
          "常用快捷键：Win+E、Win+R、Ctrl+Shift+Esc。",
          "服务管理：可通过 services.msc 管理开机服务。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "文件隐藏/权限设置要分清共享与本地权限。",
          "任务管理器可结束进程但不等于卸载软件。"
        ]
      }
    ],
    resources: [
      {
        title: "Windows 官方支持",
        url: "https://support.microsoft.com/zh-cn/windows",
        note: "操作指南"
      }
    ],
    questions: [
      "Windows 10 常见维护步骤？",
      "任务管理器能完成哪些操作？"
    ]
  },
  {
    id: "office",
    label: "Office 2016（Word/Excel/PPT）",
    summary: "掌握 Word 排版、Excel 函数与 PPT 母版设置。",
    keyPoints: ["Word 样式/目录", "Excel 常用函数", "PPT 母版"],
    examFocus: ["VLOOKUP/IF", "数据透视表"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "Word 样式是自动生成目录与统一格式的基础。",
          "Excel 函数：SUM/IF/COUNTIF/VLOOKUP。",
          "PPT 母版控制整套模板的统一样式。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "数据透视表：行列字段+数值字段+筛选字段。",
          "页眉页脚与分节符是 Word 排版易考点。",
          "动画与切换要区分：对象动画 vs 幻灯片切换。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "VLOOKUP 只支持从左到右查找。",
          "PPT 母版修改后需应用到相应版式。"
        ]
      }
    ],
    resources: [
      {
        title: "Office 官方支持",
        url: "https://support.microsoft.com/zh-cn/office",
        note: "功能操作说明"
      }
    ],
    questions: [
      "Excel 中 VLOOKUP 的作用？",
      "Word 样式与目录如何联动？"
    ]
  },
  {
    id: "c-language",
    label: "C 语言基础",
    summary: "熟悉语法、指针、数组与常用输入输出。",
    keyPoints: ["数据类型/运算符", "指针与数组", "函数调用"],
    examFocus: ["指针运算", "scanf/printf 格式"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "基本类型：int、char、float、double。",
          "数组名在表达式中通常衰变为首元素指针。",
          "函数参数传递为值传递，需指针才能修改外部变量。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "常用格式符：%d、%f、%c、%s。",
          "指针与数组：a[i] 等价于 *(a+i)。",
          "字符串常以 '\\0' 结束，注意缓冲区溢出。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "printf/scanf 需要匹配格式与变量类型。",
          "指针未初始化就解引用会导致崩溃。"
        ]
      }
    ],
    resources: [
      {
        title: "C 语言教程",
        url: "https://github.com/wangdoc/clang",
        note: "系统化学习"
      }
    ],
    questions: [
      "指针与数组下标的关系？",
      "scanf 和 printf 的格式化规则？"
    ]
  },
  {
    id: "database",
    label: "关系数据库理论",
    summary: "掌握关系模型、SQL 语句与事务机制。",
    keyPoints: ["主键/外键", "SQL DDL/DML", "事务与并发"],
    examFocus: ["范式判断", "ACID 与隔离级别"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "关系模型以表表示数据，主键唯一标识记录。",
          "SQL 分 DDL、DML、DCL 三类。",
          "事务具备 ACID：原子性、一致性、隔离性、持久性。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "第一范式：字段不可再分；第二范式消除部分依赖。",
          "隔离级别：读未提交→读已提交→可重复读→串行化。",
          "锁类型：共享锁/排他锁，用于并发控制。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "SQL 查询要注意 WHERE 与 GROUP BY 的先后。",
          "事务一致性强调业务规则满足，不是数据格式。"
        ]
      }
    ],
    resources: [
      {
        title: "CS-Notes（数据库）",
        url: "https://github.com/CyC2018/CS-Notes",
        note: "事务与索引"
      },
      {
        title: "CS-Notes SQL 练习题库",
        url: "https://github.com/CyC2018/CS-Notes/blob/master/notes/SQL%20练习.md",
        note: "题库来源"
      },
      {
        title: "SQL Tutorial",
        url: "https://github.com/wangdoc/sql-tutorial",
        note: "SQL 实操"
      }
    ],
    questions: [
      "第二范式的核心要求？",
      "事务隔离级别如何区分？"
    ]
  },
  {
    id: "network",
    label: "网络技术基础",
    summary: "掌握 OSI/TCP/IP 模型、设备与安全基础。",
    keyPoints: ["OSI 七层模型", "TCP/IP 协议", "网络设备"],
    examFocus: ["端口与协议", "局域网/广域网区别"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "OSI 七层：物理/数据链路/网络/传输/会话/表示/应用。",
          "TCP/IP 四层：网络接口/网际/传输/应用。",
          "常见设备：交换机(二层)、路由器(三层)。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "常见端口：HTTP 80、HTTPS 443、FTP 21、DNS 53。",
          "TCP 面向连接，UDP 无连接但更快。",
          "NAT 用于内网地址转换，VPN 用于加密隧道。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "交换机不是路由器，工作层次不同。",
          "IP 地址是网络层概念，MAC 地址是链路层概念。"
        ]
      }
    ],
    resources: [
      {
        title: "CS-Notes（计算机网络）",
        url: "https://github.com/CyC2018/CS-Notes",
        note: "模型与协议"
      },
      {
        title: "小林coding TCP/IP 模型",
        url: "https://xiaolincoding.com/network/1_base/tcp_ip_model.html",
        note: "基础教学文章"
      }
    ],
    questions: [
      "OSI 七层模型各层职责？",
      "TCP 与 UDP 的区别是什么？"
    ]
  },
  {
    id: "software-engineering",
    label: "软件工程基础",
    summary: "掌握软件生命周期、模型与测试质量保证。",
    keyPoints: ["生命周期阶段", "开发模型", "测试与质量"],
    examFocus: ["瀑布 vs 敏捷", "测试类型"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "生命周期：需求→设计→编码→测试→维护。",
          "开发模型：瀑布、原型、增量、敏捷。",
          "质量保证贯穿全流程，测试是关键手段。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "瀑布模型顺序性强，需求变更成本高。",
          "敏捷强调迭代交付、持续反馈。",
          "测试分单元、集成、系统、验收。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "需求分析产物是需求规格说明书而非代码。",
          "验收测试由用户或第三方完成。"
        ]
      }
    ],
    resources: [
      {
        title: "OSSU 课程路线",
        url: "https://github.com/ossu/computer-science",
        note: "软件工程课程集合"
      }
    ],
    questions: [
      "软件生命周期包括哪些阶段？",
      "瀑布模型的优缺点是什么？"
    ]
  },
  {
    id: "data-structures",
    label: "数据结构与算法",
    summary: "掌握栈/队列/链表等结构与复杂度分析。",
    keyPoints: ["线性表/树", "复杂度分析", "排序/查找"],
    examFocus: ["时间复杂度判断", "典型应用"],
    contentSections: [
      {
        title: "核心概念",
        points: [
          "栈：后进先出；队列：先进先出。",
          "链表适合频繁插入删除，数组适合随机访问。",
          "复杂度常用 O(1)、O(log n)、O(n)。"
        ]
      },
      {
        title: "考点拆解",
        points: [
          "常见排序：冒泡/选择/插入 O(n^2)，快速/归并 O(n log n)。",
          "哈希表平均查找复杂度 O(1)。",
          "树遍历：先序、中序、后序、层序。"
        ]
      },
      {
        title: "易错提醒",
        points: [
          "时间复杂度关注增长趋势，不是具体运行时间。",
          "链表长度无法 O(1) 随机访问。"
        ]
      }
    ],
    resources: [
      {
        title: "TheAlgorithms/C",
        url: "https://github.com/TheAlgorithms/C",
        note: "数据结构实现"
      }
    ],
    questions: [
      "栈和队列的区别？",
      "快速排序的平均复杂度是多少？"
    ]
  }
];

const QUESTIONS: ComputerQuestion[] = [
  {
    id: "computer-basics-1",
    topicId: "computer-basics",
    type: "single",
    stem: "关于计算机特点，下列说法正确的是：",
    options: [
      "无需程序即可自动完成任何任务",
      "处理速度快且可编程自动运行",
      "不依赖硬件结构即可运行",
      "只能用于科学计算"
    ],
    answer: "处理速度快且可编程自动运行",
    analysis: "计算机核心优势在于高速、准确与可编程自动处理。"
  },
  {
    id: "computer-basics-2",
    topicId: "computer-basics",
    type: "judge",
    stem: "计算机的通用性指同一台机器通过不同程序可完成不同任务。",
    answer: true,
    analysis: "通用性依赖软件程序切换，而非硬件重新配置。"
  },
  {
    id: "encoding-1",
    topicId: "encoding",
    type: "single",
    stem: "十六进制 A 对应的十进制数是：",
    options: ["10", "11", "12", "15"],
    answer: "10",
    analysis: "十六进制 A 表示十进制 10。"
  },
  {
    id: "encoding-2",
    topicId: "encoding",
    type: "blank",
    stem: "二进制 1011 对应的十进制数是 ____ 。",
    answer: "11",
    analysis: "1*8 + 0*4 + 1*2 + 1*1 = 11。"
  },
  {
    id: "hardware-1",
    topicId: "hardware",
    type: "single",
    stem: "高速缓存（Cache）的主要作用是：",
    options: [
      "扩大外存容量",
      "弥补 CPU 与内存速度差",
      "存放操作系统",
      "提供永久数据保存"
    ],
    answer: "弥补 CPU 与内存速度差",
    analysis: "缓存用于减少 CPU 等待内存数据的时间。"
  },
  {
    id: "hardware-2",
    topicId: "hardware",
    type: "judge",
    stem: "内存断电后数据仍可保存。",
    answer: false,
    analysis: "RAM 断电数据丢失，只有 ROM 可保存。"
  },
  {
    id: "multimedia-1",
    topicId: "multimedia",
    type: "single",
    stem: "奈奎斯特采样定理要求采样频率至少是最高频率的：",
    options: ["1 倍", "1.5 倍", "2 倍", "4 倍"],
    answer: "2 倍",
    analysis: "采样频率至少为最高频率的 2 倍才能无失真重建。"
  },
  {
    id: "multimedia-2",
    topicId: "multimedia",
    type: "judge",
    stem: "JPEG 属于无损压缩格式。",
    answer: false,
    analysis: "JPEG 是典型的有损压缩格式。"
  },
  {
    id: "os-basics-1",
    topicId: "os-basics",
    type: "single",
    stem: "操作系统管理功能不包括：",
    options: ["进程管理", "存储管理", "文件管理", "算法管理"],
    answer: "算法管理",
    analysis: "操作系统四大管理功能是进程、存储、文件、设备。"
  },
  {
    id: "os-basics-2",
    topicId: "os-basics",
    type: "multi",
    stem: "以下属于操作系统管理功能的有：",
    options: ["进程管理", "设备管理", "文件管理", "需求分析"],
    answer: ["进程管理", "设备管理", "文件管理"],
    analysis: "需求分析是软件工程内容，不属于 OS 管理功能。"
  },
  {
    id: "emerging-1",
    topicId: "emerging",
    type: "single",
    stem: "SaaS 指的是：",
    options: ["软件即服务", "平台即服务", "基础设施即服务", "存储即服务"],
    answer: "软件即服务",
    analysis: "SaaS 直接向用户提供软件服务。"
  },
  {
    id: "emerging-2",
    topicId: "emerging",
    type: "blank",
    stem: "大数据 5V 中，代表真实性/可信度的英文词是 ____ 。",
    answer: "Veracity",
    analysis: "大数据 5V：Volume、Velocity、Variety、Value、Veracity。"
  },
  {
    id: "security-1",
    topicId: "security-basics",
    type: "single",
    stem: "信息安全 CIA 三要素中 I 代表：",
    options: ["完整性", "保密性", "可用性", "可靠性"],
    answer: "完整性",
    analysis: "CIA 为保密性(Confidentiality)、完整性(Integrity)、可用性(Availability)。"
  },
  {
    id: "security-2",
    topicId: "security-basics",
    type: "judge",
    stem: "SQL 注入属于 Web 安全漏洞。",
    answer: true,
    analysis: "SQL 注入是通过拼接 SQL 执行非法操作的漏洞。"
  },
  {
    id: "virus-1",
    topicId: "virus",
    type: "single",
    stem: "计算机病毒的基本特性不包括：",
    options: ["传染性", "潜伏性", "免疫性", "破坏性"],
    answer: "免疫性",
    analysis: "病毒常见特性是传染性、潜伏性、破坏性等。"
  },
  {
    id: "virus-2",
    topicId: "virus",
    type: "judge",
    stem: "蠕虫必须依附宿主文件才能传播。",
    answer: false,
    analysis: "蠕虫可自我复制，通过网络独立传播。"
  },
  {
    id: "intrusion-1",
    topicId: "intrusion",
    type: "single",
    stem: "IDS 的主要作用是：",
    options: ["直接阻断所有攻击", "检测并告警可疑行为", "替代杀毒软件", "进行数据备份"],
    answer: "检测并告警可疑行为",
    analysis: "IDS 侧重检测，IPS 才具备主动阻断能力。"
  },
  {
    id: "intrusion-2",
    topicId: "intrusion",
    type: "judge",
    stem: "包过滤防火墙主要工作在网络层/传输层。",
    answer: true,
    analysis: "包过滤依据 IP、端口等网络层/传输层信息。"
  },
  {
    id: "windows-1",
    topicId: "windows",
    type: "single",
    stem: "Windows 10 默认的文件系统是：",
    options: ["FAT16", "FAT32", "NTFS", "ext4"],
    answer: "NTFS",
    analysis: "Windows 10 默认采用 NTFS 文件系统。"
  },
  {
    id: "windows-2",
    topicId: "windows",
    type: "judge",
    stem: "任务管理器可以结束进程并查看资源占用。",
    answer: true,
    analysis: "任务管理器支持查看 CPU/内存等并结束进程。"
  },
  {
    id: "office-1",
    topicId: "office",
    type: "single",
    stem: "Excel 中 VLOOKUP 函数的作用是：",
    options: ["横向查找", "垂直查找", "求平均值", "生成图表"],
    answer: "垂直查找",
    analysis: "VLOOKUP 用于在表格第一列查找并返回对应列值。"
  },
  {
    id: "office-2",
    topicId: "office",
    type: "blank",
    stem: "PPT 中统一版式和字体通常通过 ____ 设置。",
    answer: "母版",
    analysis: "PPT 母版用于统一全局样式。"
  },
  {
    id: "c-language-1",
    topicId: "c-language",
    type: "single",
    stem: "C 语言中输出整数的格式符是：",
    options: ["%d", "%f", "%c", "%s"],
    answer: "%d",
    analysis: "%d 用于输出 int 类型。"
  },
  {
    id: "c-language-2",
    topicId: "c-language",
    type: "judge",
    stem: "数组名在大多数表达式中会衰变为指向首元素的指针。",
    answer: true,
    analysis: "除 sizeof 和取地址等少数场景外，数组名会衰变。"
  },
  {
    id: "database-1",
    topicId: "database",
    type: "single",
    stem: "事务 ACID 中 I 表示：",
    options: ["原子性", "一致性", "隔离性", "持久性"],
    answer: "隔离性",
    analysis: "I 为 Isolation，表示事务间相互隔离。"
  },
  {
    id: "database-2",
    topicId: "database",
    type: "judge",
    stem: "第二范式要求消除部分函数依赖。",
    answer: true,
    analysis: "第二范式在第一范式基础上消除非主属性对主键的部分依赖。"
  },
  {
    id: "network-1",
    topicId: "network",
    type: "single",
    stem: "HTTP 协议默认端口号是：",
    options: ["21", "53", "80", "443"],
    answer: "80",
    analysis: "HTTP 默认端口为 80。"
  },
  {
    id: "network-2",
    topicId: "network",
    type: "judge",
    stem: "交换机主要工作在数据链路层。",
    answer: true,
    analysis: "交换机基于 MAC 地址转发，属于二层设备。"
  },
  {
    id: "software-engineering-1",
    topicId: "software-engineering",
    type: "single",
    stem: "瀑布模型的典型特点是：",
    options: ["需求变更成本低", "阶段顺序严格", "持续交付", "快速迭代"],
    answer: "阶段顺序严格",
    analysis: "瀑布模型强调阶段顺序执行，需求变更成本高。"
  },
  {
    id: "software-engineering-2",
    topicId: "software-engineering",
    type: "short",
    stem: "简述软件生命周期的主要阶段。",
    answer: "需求分析、总体/详细设计、编码实现、测试、运行维护。",
    analysis: "短答题可围绕生命周期阶段与产出描述。"
  },
  {
    id: "data-structures-1",
    topicId: "data-structures",
    type: "single",
    stem: "栈的基本特性是：",
    options: ["先进先出", "后进先出", "随机访问", "按优先级出栈"],
    answer: "后进先出",
    analysis: "栈是 LIFO 结构。"
  },
  {
    id: "data-structures-2",
    topicId: "data-structures",
    type: "blank",
    stem: "链式队列的入队和出队操作时间复杂度通常是 ____ 。",
    answer: "O(1)",
    analysis: "链式队列在头尾操作都是常数时间。"
  }
];

const SQL_ANALYSIS = "参考答案示例，等价写法也可。";
const SQL_ANALYSIS_CS = "参考答案 · 来源：CS-Notes SQL 练习。";

const SQL_QUESTION_BANK: ComputerQuestion[] = [
  {
    id: "database-sql-001",
    topicId: "database",
    type: "short",
    stem: "在 students(id, name, age, gender, major, score) 表中查询所有字段。",
    answer: "SELECT * FROM students;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-002",
    topicId: "database",
    type: "short",
    stem: "查询 students 表中的姓名和专业。",
    answer: "SELECT name, major FROM students;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-003",
    topicId: "database",
    type: "short",
    stem: "查询 students 表中所有不同的专业（去重）。",
    answer: "SELECT DISTINCT major FROM students;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-004",
    topicId: "database",
    type: "short",
    stem: "查询成绩 >= 90 的学生姓名与成绩。",
    answer: "SELECT name, score FROM students WHERE score >= 90;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-005",
    topicId: "database",
    type: "short",
    stem: "查询专业为“计算机”且成绩 >= 80 的学生姓名与成绩。",
    answer: "SELECT name, score FROM students WHERE major = '计算机' AND score >= 80;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-006",
    topicId: "database",
    type: "short",
    stem: "查询年龄在 18~22 之间的学生姓名与年龄。",
    answer: "SELECT name, age FROM students WHERE age BETWEEN 18 AND 22;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-007",
    topicId: "database",
    type: "short",
    stem: "查询专业属于“计算机”或“软件工程”的学生姓名与专业。",
    answer: "SELECT name, major FROM students WHERE major IN ('计算机', '软件工程');",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-008",
    topicId: "database",
    type: "short",
    stem: "查询姓名以“张”开头的学生姓名。",
    answer: "SELECT name FROM students WHERE name LIKE '张%';",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-009",
    topicId: "database",
    type: "short",
    stem: "按成绩降序、年龄升序查询学生姓名/成绩/年龄。",
    answer: "SELECT name, score, age FROM students ORDER BY score DESC, age ASC;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-010",
    topicId: "database",
    type: "short",
    stem: "查询成绩最高的前 5 名学生姓名与成绩。",
    answer: "SELECT name, score FROM students ORDER BY score DESC LIMIT 5;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-011",
    topicId: "database",
    type: "short",
    stem: "统计 students 表的总人数。",
    answer: "SELECT COUNT(*) AS total FROM students;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-012",
    topicId: "database",
    type: "short",
    stem: "统计 students 表中不同专业数量。",
    answer: "SELECT COUNT(DISTINCT major) AS major_count FROM students;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-013",
    topicId: "database",
    type: "short",
    stem: "统计各专业的平均成绩。",
    answer: "SELECT major, AVG(score) AS avg_score FROM students GROUP BY major;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-014",
    topicId: "database",
    type: "short",
    stem: "统计平均成绩 >= 85 的专业及其平均成绩。",
    answer:
      "SELECT major, AVG(score) AS avg_score FROM students GROUP BY major HAVING AVG(score) >= 85;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-015",
    topicId: "database",
    type: "short",
    stem: "查询 students 表的最高成绩和最低成绩。",
    answer: "SELECT MAX(score) AS max_score, MIN(score) AS min_score FROM students;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-016",
    topicId: "database",
    type: "short",
    stem: "统计每个专业的人数并按人数降序排序。",
    answer:
      "SELECT major, COUNT(*) AS student_count FROM students GROUP BY major ORDER BY student_count DESC;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-017",
    topicId: "database",
    type: "short",
    stem: "查询选课记录：students 与 enrollments(student_id, course_id, grade) 关联，输出姓名与成绩。",
    answer:
      "SELECT s.name, e.grade FROM students s JOIN enrollments e ON s.id = e.student_id;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-018",
    topicId: "database",
    type: "short",
    stem: "查询学生选修课程：students、enrollments、courses(id, name) 联表输出姓名与课程名。",
    answer:
      "SELECT s.name, c.name AS course_name FROM students s JOIN enrollments e ON s.id = e.student_id JOIN courses c ON e.course_id = c.id;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-019",
    topicId: "database",
    type: "short",
    stem: "查询未选课的学生姓名（students 左连接 enrollments）。",
    answer:
      "SELECT s.name FROM students s LEFT JOIN enrollments e ON s.id = e.student_id WHERE e.student_id IS NULL;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-020",
    topicId: "database",
    type: "short",
    stem: "查询成绩高于全表平均分的学生姓名与成绩。",
    answer:
      "SELECT name, score FROM students WHERE score > (SELECT AVG(score) FROM students);",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-021",
    topicId: "database",
    type: "short",
    stem: "查询至少有一门课程成绩 >= 90 的学生姓名（EXISTS）。",
    answer:
      "SELECT s.name FROM students s WHERE EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.grade >= 90);",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-022",
    topicId: "database",
    type: "short",
    stem: "输出 students 表中姓名、成绩及是否及格（>=60 为及格）。",
    answer:
      "SELECT name, score, CASE WHEN score >= 60 THEN '及格' ELSE '不及格' END AS result FROM students;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-023",
    topicId: "database",
    type: "short",
    stem: "查询性别为“女”的学生姓名并按姓名排序。",
    answer: "SELECT name FROM students WHERE gender = '女' ORDER BY name ASC;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-024",
    topicId: "database",
    type: "short",
    stem: "查询成绩为空的学生姓名。",
    answer: "SELECT name FROM students WHERE score IS NULL;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-025",
    topicId: "database",
    type: "short",
    stem: "查询成绩不为空的学生姓名。",
    answer: "SELECT name FROM students WHERE score IS NOT NULL;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-026",
    topicId: "database",
    type: "short",
    stem: "查询专业不等于“网络工程”的学生姓名。",
    answer: "SELECT name FROM students WHERE major <> '网络工程';",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-027",
    topicId: "database",
    type: "short",
    stem: "查询成绩在 60~69 的学生姓名与成绩。",
    answer: "SELECT name, score FROM students WHERE score >= 60 AND score < 70;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-028",
    topicId: "database",
    type: "short",
    stem: "查询姓名包含“明”的学生姓名。",
    answer: "SELECT name FROM students WHERE name LIKE '%明%';",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-029",
    topicId: "database",
    type: "short",
    stem: "统计每个学生的选课数量（students 左连接 enrollments）。",
    answer:
      "SELECT s.id, s.name, COUNT(e.course_id) AS course_count FROM students s LEFT JOIN enrollments e ON s.id = e.student_id GROUP BY s.id, s.name;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-030",
    topicId: "database",
    type: "short",
    stem: "统计选课人数 >= 10 的课程及选课人数（courses + enrollments）。",
    answer:
      "SELECT c.id, c.name, COUNT(e.student_id) AS student_count FROM courses c LEFT JOIN enrollments e ON c.id = e.course_id GROUP BY c.id, c.name HAVING COUNT(e.student_id) >= 10;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-031",
    topicId: "database",
    type: "short",
    stem: "查询 employees(id, name, dept_id, salary, hire_date) 与 departments(id, name) 的员工及部门名称。",
    answer:
      "SELECT e.name, d.name AS dept_name FROM employees e JOIN departments d ON e.dept_id = d.id;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-032",
    topicId: "database",
    type: "short",
    stem: "统计各部门平均薪资。",
    answer:
      "SELECT d.name, AVG(e.salary) AS avg_salary FROM departments d JOIN employees e ON d.id = e.dept_id GROUP BY d.id, d.name;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-033",
    topicId: "database",
    type: "short",
    stem: "查询薪资高于全公司平均薪资的员工姓名。",
    answer:
      "SELECT name FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-034",
    topicId: "database",
    type: "short",
    stem: "查询没有员工的部门名称。",
    answer:
      "SELECT d.name FROM departments d WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.id);",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-035",
    topicId: "database",
    type: "short",
    stem: "查询入职最早的员工姓名。",
    answer: "SELECT name FROM employees ORDER BY hire_date ASC LIMIT 1;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-036",
    topicId: "database",
    type: "short",
    stem: "统计已完成订单的客户总金额（orders: customer_id, amount, status）。",
    answer:
      "SELECT customer_id, SUM(amount) AS total_amount FROM orders WHERE status = '已完成' GROUP BY customer_id;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-037",
    topicId: "database",
    type: "short",
    stem: "查询订单金额 >= 1000 的订单 id、客户名、金额（orders + customers）。",
    answer:
      "SELECT o.id, c.name, o.amount FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.amount >= 1000 ORDER BY o.amount DESC;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-038",
    topicId: "database",
    type: "short",
    stem: "查询没有订单的客户姓名。",
    answer:
      "SELECT c.name FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE o.id IS NULL;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-039",
    topicId: "database",
    type: "short",
    stem: "查询库存 < 10 的商品 id、名称、库存。",
    answer: "SELECT id, name, stock FROM products WHERE stock < 10 ORDER BY stock ASC;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-040",
    topicId: "database",
    type: "short",
    stem: "统计各商品分类数量。",
    answer: "SELECT category, COUNT(*) AS product_count FROM products GROUP BY category;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-ddl-001",
    topicId: "database",
    type: "short",
    stem: "创建 users 表：id(主键自增)、username(非空)、password(非空)、created_at(默认当前时间)。",
    answer:
      "CREATE TABLE users (id INT PRIMARY KEY AUTO_INCREMENT, username VARCHAR(50) NOT NULL, password VARCHAR(100) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-dcl-001",
    topicId: "database",
    type: "short",
    stem: "给用户 exam_user 授予 examdb 库的 SELECT、INSERT 权限。",
    answer: "GRANT SELECT, INSERT ON examdb.* TO 'exam_user'@'%';",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-dml-001",
    topicId: "database",
    type: "short",
    stem: "将 students 表中 id=3 的成绩加 5 分。",
    answer: "UPDATE students SET score = score + 5 WHERE id = 3;",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-dml-002",
    topicId: "database",
    type: "short",
    stem: "删除 orders 表中状态为“取消”的记录。",
    answer: "DELETE FROM orders WHERE status = '取消';",
    analysis: SQL_ANALYSIS
  },
  {
    id: "database-sql-cs-595",
    topicId: "database",
    type: "short",
    stem: "World 表中查询面积 > 3000000 或人口 > 25000000 的国家名称、人口与面积。",
    answer:
      "SELECT name, population, area FROM World WHERE area > 3000000 OR population > 25000000;",
    analysis: SQL_ANALYSIS_CS
  },
  {
    id: "database-sql-cs-627",
    topicId: "database",
    type: "short",
    stem: "salary 表中用一条 SQL 交换 sex 字段的 'm' 与 'f'。",
    answer:
      "UPDATE salary SET sex = CHAR(ASCII(sex) ^ ASCII('m') ^ ASCII('f'));",
    analysis: SQL_ANALYSIS_CS
  },
  {
    id: "database-sql-cs-620",
    topicId: "database",
    type: "short",
    stem: "cinema 表中查询 id 为奇数且 description != 'boring' 的电影，按 rating 降序。",
    answer:
      "SELECT * FROM cinema WHERE id % 2 = 1 AND description != 'boring' ORDER BY rating DESC;",
    analysis: SQL_ANALYSIS_CS
  },
  {
    id: "database-sql-cs-596",
    topicId: "database",
    type: "short",
    stem: "courses 表中查询学生数 >= 5 的 class。",
    answer: "SELECT class FROM courses GROUP BY class HAVING COUNT(DISTINCT student) >= 5;",
    analysis: SQL_ANALYSIS_CS
  },
  {
    id: "database-sql-cs-182",
    topicId: "database",
    type: "short",
    stem: "Person 表中查找重复的 email。",
    answer: "SELECT email FROM Person GROUP BY email HAVING COUNT(*) > 1;",
    analysis: SQL_ANALYSIS_CS
  },
  {
    id: "database-sql-cs-196",
    topicId: "database",
    type: "short",
    stem: "Person 表中删除重复 email，仅保留 id 最小记录。",
    answer:
      "DELETE p1 FROM Person p1, Person p2 WHERE p1.email = p2.email AND p1.id > p2.id;",
    analysis: SQL_ANALYSIS_CS
  },
  {
    id: "database-sql-cs-175",
    topicId: "database",
    type: "short",
    stem: "Person 与 Address 表左连接，输出姓名与地址信息。",
    answer:
      "SELECT p.FirstName, p.LastName, a.City, a.State FROM Person p LEFT JOIN Address a ON p.PersonId = a.PersonId;",
    analysis: SQL_ANALYSIS_CS
  },
  {
    id: "database-sql-cs-181",
    topicId: "database",
    type: "short",
    stem: "Employee 表中找出工资高于直属经理的员工姓名。",
    answer:
      "SELECT e.Name AS Employee FROM Employee e JOIN Employee m ON e.ManagerId = m.Id WHERE e.Salary > m.Salary;",
    analysis: SQL_ANALYSIS_CS
  },
  {
    id: "database-sql-cs-183",
    topicId: "database",
    type: "short",
    stem: "Customers 表中查找从未下单的客户姓名。",
    answer:
      "SELECT c.Name AS Customers FROM Customers c LEFT JOIN Orders o ON c.Id = o.CustomerId WHERE o.Id IS NULL;",
    analysis: SQL_ANALYSIS_CS
  },
  {
    id: "database-sql-cs-184",
    topicId: "database",
    type: "short",
    stem: "查询每个部门的最高薪资员工（Department + Employee）。",
    answer:
      "SELECT d.Name AS Department, e.Name AS Employee, e.Salary FROM Employee e JOIN Department d ON e.DepartmentId = d.Id WHERE (e.DepartmentId, e.Salary) IN (SELECT DepartmentId, MAX(Salary) FROM Employee GROUP BY DepartmentId);",
    analysis: SQL_ANALYSIS_CS
  },
  {
    id: "database-sql-cs-176",
    topicId: "database",
    type: "short",
    stem: "Employee 表中查询第二高薪资，若不存在返回 NULL。",
    answer:
      "SELECT (SELECT DISTINCT Salary FROM Employee ORDER BY Salary DESC LIMIT 1, 1) AS SecondHighestSalary;",
    analysis: SQL_ANALYSIS_CS
  },
  {
    id: "database-sql-cs-177",
    topicId: "database",
    type: "short",
    stem: "Employee 表中查询第 N 高薪资（用 N 变量）。",
    answer:
      "SELECT (SELECT DISTINCT Salary FROM Employee ORDER BY Salary DESC LIMIT N - 1, 1) AS NthHighestSalary;",
    analysis: SQL_ANALYSIS_CS
  },
  {
    id: "database-sql-cs-178",
    topicId: "database",
    type: "short",
    stem: "Scores 表中输出分数与排名（相同分数同名次）。",
    answer:
      "SELECT s1.Score, (SELECT COUNT(DISTINCT s2.Score) FROM Scores s2 WHERE s2.Score >= s1.Score) AS Rank FROM Scores s1 ORDER BY s1.Score DESC;",
    analysis: SQL_ANALYSIS_CS
  },
  {
    id: "database-sql-cs-180",
    topicId: "database",
    type: "short",
    stem: "Logs 表中查找连续出现三次的数字。",
    answer:
      "SELECT DISTINCT l1.Num AS ConsecutiveNums FROM Logs l1 JOIN Logs l2 ON l1.Id = l2.Id - 1 JOIN Logs l3 ON l2.Id = l3.Id - 1 WHERE l1.Num = l2.Num AND l2.Num = l3.Num;",
    analysis: SQL_ANALYSIS_CS
  },
  {
    id: "database-sql-cs-626",
    topicId: "database",
    type: "short",
    stem: "seat 表中交换相邻座位，最后一个座位若为奇数则不交换。",
    answer:
      "SELECT s1.id - 1 AS id, s1.student FROM seat s1 WHERE s1.id MOD 2 = 0 UNION SELECT s2.id + 1 AS id, s2.student FROM seat s2 WHERE s2.id MOD 2 = 1 AND s2.id != (SELECT MAX(s3.id) FROM seat s3) UNION SELECT s4.id AS id, s4.student FROM seat s4 WHERE s4.id MOD 2 = 1 AND s4.id = (SELECT MAX(s5.id) FROM seat s5) ORDER BY id;",
    analysis: SQL_ANALYSIS_CS
  }
];

QUESTIONS.push(...SQL_QUESTION_BANK);

const MAIN_SIGNATURES = [
  "int main(void) {",
  "int main(void){",
  "int main() {",
  "int main(){"
];

const RETURN_ZERO = ["return 0;", "return 0 ;"];

const C_TASKS: Array<ComputerCTask & { answers: Record<string, string[]> }> = [
  {
    id: "c-max",
    title: "C 语言 · 求最大值",
    description: "补全程序框架，实现输入两个整数输出较大值。",
    template: [
      "#include <stdio.h>",
      "",
      "{{1}}",
      "    int a, b;",
      "    scanf(\"%d %d\", &a, &b);",
      "    if (a {{2}} b) {",
      "        printf(\"%d\", a);",
      "    } else {",
      "        printf(\"%d\", b);",
      "    }",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全 main 函数定义", placeholder: "main 函数定义" },
      { id: "2", label: "补全比较符号", placeholder: "比较符号" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": MAIN_SIGNATURES,
      "2": [">"],
      "3": RETURN_ZERO
    }
  },
  {
    id: "c-sum",
    title: "C 语言 · 1~n 求和",
    description: "补全程序框架，实现 1 到 n 的求和。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int n;",
      "    scanf(\"%d\", &n);",
      "    int sum = 0;",
      "    for (int i = 1; i {{1}} n; i++) {",
      "        sum {{2}} i;",
      "    }",
      "    printf(\"%d\", sum);",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全循环条件", placeholder: "循环条件" },
      { id: "2", label: "补全累加表达式", placeholder: "累加符号" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": ["<="],
      "2": ["+="],
      "3": RETURN_ZERO
    }
  },
  {
    id: "c-even-odd",
    title: "C 语言 · 判断奇偶",
    description: "补全程序框架，判断输入整数的奇偶性。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int n;",
      "    scanf(\"%d\", &n);",
      "    if (n {{1}} 2 {{2}} 0) {",
      "        printf(\"even\");",
      "    } else {",
      "        printf(\"odd\");",
      "    }",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全取模运算符", placeholder: "取模运算符" },
      { id: "2", label: "补全比较符号", placeholder: "比较符号" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": ["%"],
      "2": ["=="],
      "3": RETURN_ZERO
    }
  },
  {
    id: "c-factorial",
    title: "C 语言 · 阶乘",
    description: "补全程序框架，计算 n! 的结果。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int n;",
      "    scanf(\"%d\", &n);",
      "    long long fact = 1;",
      "    for (int i = 1; i {{1}} n; i++) {",
      "        fact {{2}} i;",
      "    }",
      "    printf(\"%lld\", fact);",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全循环条件", placeholder: "循环条件" },
      { id: "2", label: "补全累乘表达式", placeholder: "累乘符号" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": ["<="],
      "2": ["*="],
      "3": RETURN_ZERO
    }
  },
  {
    id: "c-swap-temp",
    title: "C 语言 · 交换两数",
    description: "补全程序框架，使用临时变量交换两个整数。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int a, b;",
      "    scanf(\"%d %d\", &a, &b);",
      "    int temp = {{1}};",
      "    {{2}} = b;",
      "    b = temp;",
      "    printf(\"%d %d\", a, b);",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全临时变量赋值", placeholder: "变量名" },
      { id: "2", label: "补全交换语句中的左值", placeholder: "变量名" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": ["a"],
      "2": ["a"],
      "3": RETURN_ZERO
    }
  },
  {
    id: "c-swap-pointer",
    title: "C 语言 · 指针交换",
    description: "补全程序框架，使用指针函数交换两个整数。",
    template: [
      "#include <stdio.h>",
      "",
      "void swap({{1}}) {",
      "    int t = *x;",
      "    *x = *y;",
      "    {{2}}",
      "}",
      "",
      "int main(void) {",
      "    int a, b;",
      "    scanf(\"%d %d\", &a, &b);",
      "    {{3}};",
      "    printf(\"%d %d\", a, b);",
      "    return 0;",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全函数参数列表", placeholder: "参数列表" },
      { id: "2", label: "补全指针赋值", placeholder: "赋值语句" },
      { id: "3", label: "补全函数调用", placeholder: "调用语句" }
    ],
    answers: {
      "1": ["int *x, int *y", "int* x, int* y", "int *x, int* y", "int* x, int *y"],
      "2": ["*y = t;", "*y=t;"],
      "3": ["swap(&a, &b)", "swap(&a,&b)"]
    }
  },
  {
    id: "c-array-sum",
    title: "C 语言 · 数组求和",
    description: "补全程序框架，计算 n 个整数的总和。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int n;",
      "    scanf(\"%d\", &n);",
      "    int a[100];",
      "    for (int i = 0; i < n; i++) {",
      "        scanf(\"%d\", &a[i]);",
      "    }",
      "    int sum = 0;",
      "    for (int i = 0; i {{1}} n; i++) {",
      "        sum {{2}} a[i];",
      "    }",
      "    printf(\"%d\", sum);",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全循环条件", placeholder: "循环条件" },
      { id: "2", label: "补全累加表达式", placeholder: "累加符号" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": ["<"],
      "2": ["+="],
      "3": RETURN_ZERO
    }
  },
  {
    id: "c-array-max",
    title: "C 语言 · 数组最大值",
    description: "补全程序框架，找出数组中的最大值。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int n;",
      "    scanf(\"%d\", &n);",
      "    int a[100];",
      "    for (int i = 0; i < n; i++) {",
      "        scanf(\"%d\", &a[i]);",
      "    }",
      "    int max = a[0];",
      "    for (int i = 1; i < n; i++) {",
      "        if (a[i] {{1}} max) {",
      "            max = a[i];",
      "        }",
      "    }",
      "    printf(\"%d\", max);",
      "    {{2}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全比较符号", placeholder: "比较符号" },
      { id: "2", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": [">"],
      "2": RETURN_ZERO
    }
  },
  {
    id: "c-array-avg",
    title: "C 语言 · 数组平均值",
    description: "补全程序框架，计算数组平均值。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int n;",
      "    scanf(\"%d\", &n);",
      "    int a[100];",
      "    for (int i = 0; i < n; i++) {",
      "        scanf(\"%d\", &a[i]);",
      "    }",
      "    double sum = 0;",
      "    for (int i = 0; i < n; i++) {",
      "        sum += a[i];",
      "    }",
      "    double avg = sum / {{1}};",
      "    printf(\"%.2f\", avg);",
      "    {{2}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全平均值分母", placeholder: "分母" },
      { id: "2", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": ["n"],
      "2": RETURN_ZERO
    }
  },
  {
    id: "c-count-positive",
    title: "C 语言 · 统计正数",
    description: "补全程序框架，统计数组中的正数个数。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int n;",
      "    scanf(\"%d\", &n);",
      "    int a[100];",
      "    for (int i = 0; i < n; i++) {",
      "        scanf(\"%d\", &a[i]);",
      "    }",
      "    int count = 0;",
      "    for (int i = 0; i < n; i++) {",
      "        if (a[i] {{1}} 0) {",
      "            count{{2}};",
      "        }",
      "    }",
      "    printf(\"%d\", count);",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全比较符号", placeholder: "比较符号" },
      { id: "2", label: "补全自增表达式", placeholder: "自增符号" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": [">"],
      "2": ["++", " += 1"],
      "3": RETURN_ZERO
    }
  },
  {
    id: "c-linear-search",
    title: "C 语言 · 线性查找",
    description: "补全程序框架，查找元素首次出现的位置。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int n;",
      "    scanf(\"%d\", &n);",
      "    int a[100];",
      "    for (int i = 0; i < n; i++) {",
      "        scanf(\"%d\", &a[i]);",
      "    }",
      "    int key;",
      "    scanf(\"%d\", &key);",
      "    int pos = -1;",
      "    for (int i = 0; i < n; i++) {",
      "        if (a[i] {{1}} key) {",
      "            pos = i;",
      "            {{2}}",
      "        }",
      "    }",
      "    printf(\"%d\", pos);",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全比较符号", placeholder: "比较符号" },
      { id: "2", label: "补全跳出循环语句", placeholder: "break 语句" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": ["=="],
      "2": ["break;", "break ;"],
      "3": RETURN_ZERO
    }
  },
  {
    id: "c-reverse-array",
    title: "C 语言 · 反转数组",
    description: "补全程序框架，将数组元素原地反转。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int n;",
      "    scanf(\"%d\", &n);",
      "    int a[100];",
      "    for (int i = 0; i < n; i++) {",
      "        scanf(\"%d\", &a[i]);",
      "    }",
      "    for (int i = 0; {{1}}; i++) {",
      "        int t = a[i];",
      "        a[i] = a[{{2}}];",
      "        a[n - 1 - i] = t;",
      "    }",
      "    for (int i = 0; i < n; i++) {",
      "        printf(\"%d \", a[i]);",
      "    }",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全循环条件", placeholder: "循环条件" },
      { id: "2", label: "补全对称下标", placeholder: "数组下标" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": ["i < n / 2", "i < n/2"],
      "2": ["n - 1 - i", "n-1-i"],
      "3": RETURN_ZERO
    }
  },
  {
    id: "c-string-length",
    title: "C 语言 · 字符串长度",
    description: "补全程序框架，统计字符串长度。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    char s[100];",
      "    scanf(\"%s\", s);",
      "    int len = 0;",
      "    while (s[{{1}}] != '\\0') {",
      "        len{{2}};",
      "    }",
      "    printf(\"%d\", len);",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全索引变量", placeholder: "变量名" },
      { id: "2", label: "补全自增表达式", placeholder: "自增符号" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": ["len"],
      "2": ["++", " += 1"],
      "3": RETURN_ZERO
    }
  },
  {
    id: "c-count-vowels",
    title: "C 语言 · 统计元音",
    description: "补全程序框架，统计字符串中的元音字母个数。",
    template: [
      "#include <stdio.h>",
      "#include <string.h>",
      "",
      "int main(void) {",
      "    char s[100];",
      "    scanf(\"%s\", s);",
      "    int count = 0;",
      "    for (int i = 0; s[i] != '\\0'; i++) {",
      "        char c = s[i];",
      "        if (strchr(\"aeiouAEIOU\", c) {{1}} NULL) {",
      "            count{{2}};",
      "        }",
      "    }",
      "    printf(\"%d\", count);",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全比较符号", placeholder: "比较符号" },
      { id: "2", label: "补全自增表达式", placeholder: "自增符号" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": ["!="],
      "2": ["++", " += 1"],
      "3": RETURN_ZERO
    }
  },
  {
    id: "c-gcd",
    title: "C 语言 · 最大公约数",
    description: "补全程序框架，使用欧几里得算法求最大公约数。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int a, b;",
      "    scanf(\"%d %d\", &a, &b);",
      "    while ({{1}}) {",
      "        int t = a {{2}} b;",
      "        a = b;",
      "        b = t;",
      "    }",
      "    printf(\"%d\", a);",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全循环条件", placeholder: "循环条件" },
      { id: "2", label: "补全取模运算", placeholder: "运算符" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": ["b != 0", "b!=0"],
      "2": ["%"],
      "3": RETURN_ZERO
    }
  },
  {
    id: "c-power",
    title: "C 语言 · 幂运算",
    description: "补全程序框架，计算 base 的 exp 次方。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int base, exp;",
      "    scanf(\"%d %d\", &base, &exp);",
      "    int result = 1;",
      "    for (int i = 0; i {{1}} exp; i++) {",
      "        result {{2}} base;",
      "    }",
      "    printf(\"%d\", result);",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全循环条件", placeholder: "循环条件" },
      { id: "2", label: "补全乘法赋值", placeholder: "赋值符号" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": ["<"],
      "2": ["*="],
      "3": RETURN_ZERO
    }
  },
  {
    id: "c-sum-digits",
    title: "C 语言 · 数位求和",
    description: "补全程序框架，计算整数各位数字之和。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int n;",
      "    scanf(\"%d\", &n);",
      "    int sum = 0;",
      "    while (n {{1}} 0) {",
      "        sum {{2}} n % 10;",
      "        n {{3}} 10;",
      "    }",
      "    printf(\"%d\", sum);",
      "    return 0;",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全循环条件", placeholder: "比较符号" },
      { id: "2", label: "补全累加表达式", placeholder: "累加符号" },
      { id: "3", label: "补全除法赋值", placeholder: "赋值符号" }
    ],
    answers: {
      "1": [">"],
      "2": ["+="],
      "3": ["/="]
    }
  },
  {
    id: "c-prime-check",
    title: "C 语言 · 素数判断",
    description: "补全程序框架，判断输入整数是否为素数。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int n;",
      "    scanf(\"%d\", &n);",
      "    int isPrime = 1;",
      "    for (int i = 2; i * i {{1}} n; i++) {",
      "        if (n % i == 0) {",
      "            isPrime = 0;",
      "            {{2}}",
      "        }",
      "    }",
      "    printf(\"%s\", isPrime ? \"yes\" : \"no\");",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全循环条件", placeholder: "循环条件" },
      { id: "2", label: "补全跳出循环语句", placeholder: "break 语句" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": ["<=", "< ="],
      "2": ["break;", "break ;"],
      "3": RETURN_ZERO
    }
  },
  {
    id: "c-array-min",
    title: "C 语言 · 数组最小值",
    description: "补全程序框架，找出数组中的最小值。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int n;",
      "    scanf(\"%d\", &n);",
      "    int a[100];",
      "    for (int i = 0; i < n; i++) {",
      "        scanf(\"%d\", &a[i]);",
      "    }",
      "    int min = a[0];",
      "    for (int i = 1; i < n; i++) {",
      "        if (a[i] {{1}} min) {",
      "            min = a[i];",
      "        }",
      "    }",
      "    printf(\"%d\", min);",
      "    {{2}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全比较符号", placeholder: "比较符号" },
      { id: "2", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": ["<"],
      "2": RETURN_ZERO
    }
  },
  {
    id: "c-max-three",
    title: "C 语言 · 三数最大值",
    description: "补全程序框架，输出三个整数中的最大值。",
    template: [
      "#include <stdio.h>",
      "",
      "int main(void) {",
      "    int a, b, c;",
      "    scanf(\"%d %d %d\", &a, &b, &c);",
      "    int max = a;",
      "    if (b {{1}} max) {",
      "        max = b;",
      "    }",
      "    if (c {{2}} max) {",
      "        max = c;",
      "    }",
      "    printf(\"%d\", max);",
      "    {{3}}",
      "}"
    ].join("\n"),
    blanks: [
      { id: "1", label: "补全比较符号", placeholder: "比较符号" },
      { id: "2", label: "补全比较符号", placeholder: "比较符号" },
      { id: "3", label: "补全返回语句", placeholder: "返回语句" }
    ],
    answers: {
      "1": [">"],
      "2": [">"],
      "3": RETURN_ZERO
    }
  }
];

const STUDENT_TABLE: ComputerSqlDataset = {
  table: "students",
  columns: ["id", "name", "score", "major"],
  rows: [
    { id: 1, name: "王宁", score: 92, major: "网络工程" },
    { id: 2, name: "李珊", score: 76, major: "软件工程" },
    { id: 3, name: "周凡", score: 88, major: "信息安全" },
    { id: 4, name: "陈悦", score: 95, major: "网络工程" },
    { id: 5, name: "赵凯", score: 83, major: "软件工程" }
  ]
};

const SQL_TASKS: Array<ComputerSqlTask & { expectedQuery: string }> = [
  {
    id: "sql-high-score",
    title: "SQL · 查询高分考生",
    description: "查询成绩 >= 85 的考生姓名与成绩，并按成绩降序排列。",
    dataset: STUDENT_TABLE,
    hint: "提示：使用 SELECT + WHERE + ORDER BY。",
    sampleQuery: "SELECT ... FROM students WHERE ...",
    expectedQuery: "SELECT name, score FROM students WHERE score >= 85 ORDER BY score DESC"
  },
  {
    id: "sql-major",
    title: "SQL · 指定专业查询",
    description: "查询信息安全专业的考生姓名与成绩，并按成绩降序排列。",
    dataset: STUDENT_TABLE,
    hint: "提示：字符串条件需要单引号。",
    sampleQuery: "SELECT ... FROM students WHERE ...",
    expectedQuery: "SELECT name, score FROM students WHERE major = '信息安全' ORDER BY score DESC"
  },
  {
    id: "sql-low-score",
    title: "SQL · 查询低分考生",
    description: "查询成绩 < 80 的考生姓名与成绩，并按成绩升序排列。",
    dataset: STUDENT_TABLE,
    hint: "提示：使用 < 与 ORDER BY。",
    sampleQuery: "SELECT ... FROM students WHERE ...",
    expectedQuery: "SELECT name, score FROM students WHERE score < 80 ORDER BY score ASC"
  },
  {
    id: "sql-score-range",
    title: "SQL · 区间成绩查询",
    description: "查询成绩在 80~90 之间的考生姓名与成绩。",
    dataset: STUDENT_TABLE,
    hint: "提示：用 AND 拼接两个条件。",
    sampleQuery: "SELECT ... FROM students WHERE ...",
    expectedQuery:
      "SELECT name, score FROM students WHERE score >= 80 AND score <= 90"
  },
  {
    id: "sql-major-score",
    title: "SQL · 专业 + 成绩筛选",
    description: "查询软件工程专业且成绩 >= 80 的考生姓名与成绩，并按成绩降序。",
    dataset: STUDENT_TABLE,
    hint: "提示：AND + ORDER BY。",
    sampleQuery: "SELECT ... FROM students WHERE ...",
    expectedQuery:
      "SELECT name, score FROM students WHERE major = '软件工程' AND score >= 80 ORDER BY score DESC"
  },
  {
    id: "sql-major-network",
    title: "SQL · 专业排序",
    description: "查询网络工程专业的考生姓名与成绩，并按成绩降序排列。",
    dataset: STUDENT_TABLE,
    hint: "提示：WHERE + ORDER BY。",
    sampleQuery: "SELECT ... FROM students WHERE ...",
    expectedQuery: "SELECT name, score FROM students WHERE major = '网络工程' ORDER BY score DESC"
  },
  {
    id: "sql-order-by-id",
    title: "SQL · 按学号排序",
    description: "查询所有考生的学号、姓名与成绩，并按学号升序排列。",
    dataset: STUDENT_TABLE,
    hint: "提示：无需 WHERE。",
    sampleQuery: "SELECT ... FROM students ORDER BY id",
    expectedQuery: "SELECT id, name, score FROM students ORDER BY id ASC"
  },
  {
    id: "sql-score-not-security",
    title: "SQL · 排除专业",
    description: "查询成绩 >= 85 且专业不为信息安全的考生姓名与成绩。",
    dataset: STUDENT_TABLE,
    hint: "提示：使用 != 或 <>。",
    sampleQuery: "SELECT ... FROM students WHERE ...",
    expectedQuery:
      "SELECT name, score FROM students WHERE score >= 85 AND major != '信息安全'"
  },
  {
    id: "sql-score-name",
    title: "SQL · 成绩区间 + 姓名排序",
    description: "查询成绩在 80~90 之间的考生姓名与成绩，并按姓名升序。",
    dataset: STUDENT_TABLE,
    hint: "提示：AND + ORDER BY name。",
    sampleQuery: "SELECT ... FROM students WHERE ...",
    expectedQuery:
      "SELECT name, score FROM students WHERE score >= 80 AND score <= 90 ORDER BY name ASC"
  },
  {
    id: "sql-major-software",
    title: "SQL · 软件工程筛选",
    description: "查询软件工程专业且成绩 >= 70 的考生姓名与成绩。",
    dataset: STUDENT_TABLE,
    hint: "提示：AND 条件。",
    sampleQuery: "SELECT ... FROM students WHERE ...",
    expectedQuery: "SELECT name, score FROM students WHERE major = '软件工程' AND score >= 70"
  }
];

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeAnswer(value: string | string[] | boolean) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item).toLowerCase()).sort();
  }
  return normalizeText(value).toLowerCase();
}

function parseBooleanAnswer(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (["true", "对", "正确", "yes", "y", "1"].includes(normalized)) {
    return true;
  }
  if (["false", "错", "错误", "no", "n", "0"].includes(normalized)) {
    return false;
  }
  return null;
}

function parseSqlQuery(sql: string, dataset: ComputerSqlDataset): ParsedSqlQuery | { error: string } {
  const trimmed = sql.trim().replace(/;$/, "");
  if (!trimmed) {
    return { error: "请先输入 SQL" };
  }
  const match = trimmed.match(
    /^select\s+(.+?)\s+from\s+([a-zA-Z_][\w]*)\s*(?:where\s+(.+?))?\s*(?:order\s+by\s+(.+?))?$/i
  );
  if (!match) {
    return { error: "仅支持 SELECT ... FROM ... WHERE ... ORDER BY ... 的单表查询" };
  }
  const [, selectPart, tablePart, wherePart, orderPart] = match;
  const tableName = tablePart.trim();
  if (tableName.toLowerCase() !== dataset.table.toLowerCase()) {
    return { error: `仅支持表 ${dataset.table}` };
  }
  const columnMap = new Map(
    dataset.columns.map((col) => [col.toLowerCase(), col])
  );
  const selectedColumns = selectPart
    .split(",")
    .map((col) => col.trim())
    .filter(Boolean);
  if (!selectedColumns.length) {
    return { error: "未解析到 SELECT 字段" };
  }
  const resolvedColumns =
    selectedColumns.length === 1 && selectedColumns[0] === "*"
      ? dataset.columns
      : selectedColumns.map((col) => {
          const key = col.replace(/`/g, "").toLowerCase();
          const actual = columnMap.get(key);
          if (!actual) {
            throw new Error(`字段 ${col} 不存在`);
          }
          return actual;
        });

  const conditions = wherePart
    ? wherePart.split(/\s+and\s+/i).map((condition) => {
        const conditionMatch = condition.match(
          /^(\w+)\s*(=|>=|<=|<>|!=|>|<)\s*(.+)$/
        );
        if (!conditionMatch) {
          throw new Error("WHERE 条件解析失败，仅支持 AND + 简单比较");
        }
        const [, column, operator, rawValue] = conditionMatch;
        const columnKey = column.toLowerCase();
        const actual = columnMap.get(columnKey);
        if (!actual) {
          throw new Error(`字段 ${column} 不存在`);
        }
        let value: string | number = rawValue.trim();
        if (
          (value.startsWith("'") && value.endsWith("'")) ||
          (value.startsWith('"') && value.endsWith('"'))
        ) {
          value = value.slice(1, -1);
        } else if (!Number.isNaN(Number(value))) {
          value = Number(value);
        }
        return { column: actual, operator, value };
      })
    : [];

  let orderBy: { column: string; direction: "asc" | "desc" } | null = null;
  if (orderPart) {
    const orderMatch = orderPart.trim().match(/^(\w+)(?:\s+(asc|desc))?$/i);
    if (!orderMatch) {
      throw new Error("ORDER BY 解析失败，仅支持单字段排序");
    }
    const [, column, direction] = orderMatch;
    const actual = columnMap.get(column.toLowerCase());
    if (!actual) {
      throw new Error(`字段 ${column} 不存在`);
    }
    orderBy = {
      column: actual,
      direction: (direction ?? "asc").toLowerCase() as "asc" | "desc"
    };
  }

  return { resolvedColumns, conditions, orderBy };
}

function runSqlQuery(sql: string, dataset: ComputerSqlDataset): SqlRunResult {
  try {
    const parsed = parseSqlQuery(sql, dataset);
    if ("error" in parsed) {
      return parsed;
    }
    const { resolvedColumns, conditions, orderBy } = parsed;
    let results = [...dataset.rows];
    if (conditions.length) {
      results = results.filter((row) =>
        conditions.every((condition) => {
          const left = row[condition.column];
          const right = condition.value;
          const leftValue = typeof left === "number" ? left : String(left).trim();
          const rightValue = typeof right === "number" ? right : String(right).trim();
          const leftNumeric = Number(leftValue);
          const rightNumeric = Number(rightValue);
          const useNumeric =
            !Number.isNaN(leftNumeric) && !Number.isNaN(rightNumeric);
          switch (condition.operator) {
            case "=":
              return useNumeric
                ? leftNumeric === rightNumeric
                : leftValue === rightValue;
            case ">":
              return useNumeric
                ? leftNumeric > rightNumeric
                : String(leftValue) > String(rightValue);
            case "<":
              return useNumeric
                ? leftNumeric < rightNumeric
                : String(leftValue) < String(rightValue);
            case ">=":
              return useNumeric
                ? leftNumeric >= rightNumeric
                : String(leftValue) >= String(rightValue);
            case "<=":
              return useNumeric
                ? leftNumeric <= rightNumeric
                : String(leftValue) <= String(rightValue);
            case "!=":
            case "<>":
              return useNumeric
                ? leftNumeric !== rightNumeric
                : leftValue !== rightValue;
            default:
              return false;
          }
        })
      );
    }
    if (orderBy) {
      results.sort((a, b) => {
        const aValue = a[orderBy.column];
        const bValue = b[orderBy.column];
        const aNumeric = Number(aValue);
        const bNumeric = Number(bValue);
        const diff =
          !Number.isNaN(aNumeric) && !Number.isNaN(bNumeric)
            ? aNumeric - bNumeric
            : String(aValue).localeCompare(String(bValue), "zh-CN");
        return orderBy.direction === "desc" ? -diff : diff;
      });
    }
    const rows = results.map((row) =>
      resolvedColumns.map((col) => row[col])
    );
    return { columns: resolvedColumns, rows };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "SQL 解析失败" };
  }
}

function compareSqlResults(a: SqlResult, b: SqlResult) {
  if (a.columns.length !== b.columns.length) {
    return false;
  }
  if (a.rows.length !== b.rows.length) {
    return false;
  }
  const normalize = (value: string | number) =>
    typeof value === "number" ? value : value.toString().trim();
  for (let i = 0; i < a.columns.length; i += 1) {
    if (a.columns[i] !== b.columns[i]) {
      return false;
    }
  }
  for (let i = 0; i < a.rows.length; i += 1) {
    const rowA = a.rows[i];
    const rowB = b.rows[i];
    if (rowA.length !== rowB.length) {
      return false;
    }
    for (let j = 0; j < rowA.length; j += 1) {
      if (normalize(rowA[j]) !== normalize(rowB[j])) {
        return false;
      }
    }
  }
  return true;
}

function formatAnswer(question: ComputerQuestion) {
  if (typeof question.answer === "boolean") {
    return question.answer ? "正确" : "错误";
  }
  if (Array.isArray(question.answer)) {
    return question.answer.join("、");
  }
  return question.answer;
}

function stripAnswer(question: ComputerQuestion): ComputerQuestionPublic {
  const { answer: _answer, ...rest } = question;
  return rest;
}

export function getComputerOverview() {
  return {
    examOverview: EXAM_OVERVIEW,
    scoreDistribution: SCORE_DISTRIBUTION,
    focusTips: FOCUS_TIPS,
    learningBlocks: LEARNING_BLOCKS
  };
}

export function listComputerTopics() {
  return TOPICS;
}

export function getComputerTopic(id: string) {
  return TOPICS.find((topic) => topic.id === id) ?? null;
}

export function getComputerQuestionById(id: string) {
  return QUESTIONS.find((question) => question.id === id) ?? null;
}

export function listComputerQuestions(filter?: {
  topicId?: string;
  type?: ComputerQuestionType;
  limit?: number;
}) {
  const filtered = QUESTIONS.filter((question) => {
    if (filter?.topicId && question.topicId !== filter.topicId) {
      return false;
    }
    if (filter?.type && question.type !== filter.type) {
      return false;
    }
    return true;
  });
  const limit = filter?.limit && filter.limit > 0 ? filter.limit : filtered.length;
  return filtered.slice(0, limit);
}

export function getRandomComputerQuestion(filter?: {
  topicId?: string;
  type?: ComputerQuestionType;
}) {
  const candidates = listComputerQuestions(filter);
  if (!candidates.length) {
    return null;
  }
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return stripAnswer(pick);
}

export function checkComputerAnswer(params: {
  questionId: string;
  userAnswer: string | string[] | boolean;
}) {
  const question = QUESTIONS.find((item) => item.id === params.questionId);
  if (!question) {
    return { error: "题目不存在" } as const;
  }
  if (question.type === "short") {
    return {
      correct: null,
      answer: formatAnswer(question),
      analysis: question.analysis,
      type: question.type
    } as const;
  }
  if (question.type === "judge") {
    const normalized = parseBooleanAnswer(params.userAnswer);
    if (normalized === null) {
      return { error: "请输入 正确/错误 或 true/false" } as const;
    }
    const correct = normalized === question.answer;
    return {
      correct,
      answer: formatAnswer(question),
      analysis: question.analysis,
      type: question.type
    } as const;
  }
  const expected = normalizeAnswer(question.answer);
  const actual = normalizeAnswer(params.userAnswer);
  const correct = Array.isArray(expected)
    ? Array.isArray(actual) && expected.join("|") === actual.join("|")
    : expected === actual;
  return {
    correct,
    answer: formatAnswer(question),
    analysis: question.analysis,
    type: question.type
  } as const;
}

export function listComputerQuestionPublic(filter?: {
  topicId?: string;
  type?: ComputerQuestionType;
  limit?: number;
}) {
  return listComputerQuestions(filter).map(stripAnswer);
}

export function listComputerCTasks() {
  return C_TASKS.map(({ answers, ...rest }) => rest);
}

export function getComputerCTaskById(id: string) {
  return C_TASKS.find((task) => task.id === id) ?? null;
}

export function checkComputerCTask(params: {
  taskId: string;
  answers: Record<string, string>;
}) {
  const task = C_TASKS.find((item) => item.id === params.taskId);
  if (!task) {
    return { error: "题目不存在" } as const;
  }
  const provided = params.answers ?? {};
  const details = task.blanks.map((blank) => {
    const expectedList = task.answers[blank.id] ?? [];
    const value = normalizeText(provided[blank.id] ?? "");
    const normalizedExpected = expectedList.map((item) => normalizeText(item));
    const correct = normalizedExpected.some((item) => item === value);
    return {
      id: blank.id,
      label: blank.label,
      correct,
      expected: correct ? undefined : expectedList[0] ?? ""
    };
  });
  const correct = details.every((item) => item.correct);
  return {
    correct,
    message: correct ? "全部填空正确。" : "仍有填空未完成或不正确。",
    details
  } as const;
}

export function listComputerSqlTasks() {
  return SQL_TASKS.map(({ expectedQuery, ...rest }) => rest);
}

export function getComputerSqlTaskById(id: string) {
  return SQL_TASKS.find((task) => task.id === id) ?? null;
}

export function checkComputerSqlTask(params: { taskId: string; query: string }) {
  const task = SQL_TASKS.find((item) => item.id === params.taskId);
  if (!task) {
    return { error: "题目不存在" } as const;
  }
  const result = runSqlQuery(params.query, task.dataset);
  if ("error" in result) {
    return { error: result.error } as const;
  }
  const expected = runSqlQuery(task.expectedQuery, task.dataset);
  if ("error" in expected) {
    return { error: "参考答案解析失败" } as const;
  }
  const correct = compareSqlResults(result, expected);
  return {
    correct,
    message: correct ? "查询结果正确。" : "结果不匹配，请检查条件或排序。",
    preview: result
  } as const;
}
