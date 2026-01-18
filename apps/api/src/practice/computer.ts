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
        title: "NCRE 计算机基础题库",
        url: "https://github.com/dengcao/ncre",
        note: "题库来源（MulanPSL-2.0）"
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

const NCRE_BASE_QUESTIONS: ComputerQuestion[] = [
  {
    id: "ncre-base-0001",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是（　　）。",
    options: ["CPU能直接读取硬盘上的数据","CPU能直接存取内存储器","CPU由存储器、运算器和控制器组成","CPU主要用来存储程序和数据"],
    answer: "CPU能直接存取内存储器",
    analysis: "CPU不能读取硬盘上的数据，但是能直接访问内存储器；CPU主要包括运算器和控制器；CPU是整个计算机的核心部件，主要用于控制计算机的操作。"
  },
  {
    id: "ncre-base-0002",
    topicId: "computer-basics",
    type: "single",
    stem: "是系统部件之间传送信息的公共通道，各部件由总线连接并通过它传递数据和控制信号。",
    options: ["总线","I/O接口","电缆","扁缆"],
    answer: "总线",
    analysis: "总线是系统部件之间传递信息的公共通道,各部件由总线连接并通过它传递数据和控制信号。"
  },
  {
    id: "ncre-base-0003",
    topicId: "computer-basics",
    type: "single",
    stem: "是一种符号化的机器语言。",
    options: ["C语言","汇编语言","机器语言","计算机语言"],
    answer: "汇编语言",
    analysis: "汇编语言是用能反映指令功能的助记符描述的计算机语言,也称符号语言,实际上是一种符号化的机器语言。"
  },
  {
    id: "ncre-base-0004",
    topicId: "computer-basics",
    type: "single",
    stem: "12. 下面关于操作系统的叙述中，正确的是_______。",
    options: ["操作系统是计算机软件系统中的核心软件","操作系统属于应用软件","Windows是PC机唯一的操作系统","操作系统的五大功能是：启动、打印、显示、文件存取和关机"],
    answer: "操作系统是计算机软件系统中的核心软件",
    analysis: "系统软件主要包括操作系统、语言处理系统、系统性能检测和实用工具软件等，其中最主要的是操作系统。"
  },
  {
    id: "ncre-base-0005",
    topicId: "computer-basics",
    type: "single",
    stem: "1946年诞生的世界上公认的第一台电子计算机是________。",
    options: ["UNIVAC－I","EDVAC","ENIAC","IBM650"],
    answer: "ENIAC",
    analysis: "1946年世界上第一台名为ENIAC的电子计算机诞生于美国宾夕法尼亚大学。"
  },
  {
    id: "ncre-base-0006",
    topicId: "computer-basics",
    type: "single",
    stem: "1946年首台电子数字计算机ENIAC问世后，冯·诺依曼(Von Neumann)在研制EDVAC计算机时，提出两个重要的改进，它们是（　　）。",
    options: ["引入CPU和内存储器的概念","采用机器语言和十六进制","采用二进制和存储程序控制的概念","采用ASCII编码系统"],
    answer: "采用二进制和存储程序控制的概念",
    analysis: "和ENIAC相比，EDVAC的重大改进主要有两个方面，一是把十进制改成二进制，这可以充分发挥电子元件高速运算的优越性；二是把程序和数据一起存储在计算机内，这样就可以使全部运算成真正的自动过程."
  },
  {
    id: "ncre-base-0007",
    topicId: "computer-basics",
    type: "single",
    stem: "1GB的准确值是________。",
    options: ["1024×1024Bytes","1024KB","1024MB","1000×1000KB"],
    answer: "1024MB",
    analysis: "1GB＝1024MB＝1024×1024KB＝1024×1024×1024B。"
  },
  {
    id: "ncre-base-0008",
    topicId: "computer-basics",
    type: "single",
    stem: "1KB的准确数值是________。",
    options: ["1024Bytes","1000Bytes","1024bits","1000bits"],
    answer: "1024Bytes",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0009",
    topicId: "computer-basics",
    type: "single",
    stem: "5位二进制无符号数最大能表示的十进制整数是________。",
    options: ["64","63","32","31"],
    answer: "31",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0010",
    topicId: "computer-basics",
    type: "single",
    stem: "Cache的中文译名是________。",
    options: ["缓冲器","只读存储器","高速缓冲存储器","可编程只读存储器"],
    answer: "高速缓冲存储器",
    analysis: "ROM为只读存储器，PROM为可编程只读存储器"
  },
  {
    id: "ncre-base-0011",
    topicId: "computer-basics",
    type: "single",
    stem: "CAM的含义是　　　。",
    options: ["计算机辅助设计","计算机辅助教学","计算机辅助制造","计算机辅助测试"],
    answer: "计算机辅助制造",
    analysis: "计算机辅助制造简称CAM,计算机辅助教学简称CAI,计算机辅助设计简称CAD,计算机辅助检测简称CAE。"
  },
  {
    id: "ncre-base-0012",
    topicId: "computer-basics",
    type: "single",
    stem: "CD－ROM是________。",
    options: ["大容量可读可写外存储器","大容量只读外部存储器","可直接与CPU交换数据的存储器","只读内部存储器"],
    answer: "大容量只读外部存储器",
    analysis: "选项A大容量可读可写外存储器为CD－RW；选项C可直接与CPU交换数据的存储器为内存储器；选项D只读内部存储器为ROM。"
  },
  {
    id: "ncre-base-0013",
    topicId: "computer-basics",
    type: "single",
    stem: "CPU的指令系统又称为________。",
    options: ["汇编语言","机器语言","程序设计语言","符号语言"],
    answer: "机器语言",
    analysis: "机器语言是一种CPU的指令系统，是由二进制代码编写，能够直接被机器识别的程序设计语言。"
  },
  {
    id: "ncre-base-0014",
    topicId: "computer-basics",
    type: "single",
    stem: "CPU的中文名称是________。",
    options: ["控制器","不间断电源","算术逻辑部件","中央处理器"],
    answer: "中央处理器",
    analysis: "选项A控制器是CU；选项B不间断电源是UPS；选项C算术逻辑部件是ALU。"
  },
  {
    id: "ncre-base-0015",
    topicId: "computer-basics",
    type: "single",
    stem: "CPU中，除了内部总线和必要的寄存器外，主要的两大部件分别是运算器和________。",
    options: ["控制器","存储器","Cache","编辑器"],
    answer: "控制器",
    analysis: "CPU由运算器和控制器组成。"
  },
  {
    id: "ncre-base-0016",
    topicId: "computer-basics",
    type: "single",
    stem: "CPU中有一个程序计数器(又称指令计数器)，它用于存储______。",
    options: ["正在执行的指令的内容","下一条要执行的指令的内容","正在执行的指令的内存地址","下一条要执行的指令的内存地址"],
    answer: "下一条要执行的指令的内存地址",
    analysis: "为了保证程序能够连续地执行下去，CPU必须具有某些手段来确定下一条指令的地址。而程序计数器正是起到这种作用，所以通常又称为指令计数器。在程序开始执行前，必须将它的起始地址，即程序的一条指令所在的内存单元地址送入PC，因此程序计数器(PC)的内容即是从内存提取的下一条指令的地址。"
  },
  {
    id: "ncre-base-0017",
    topicId: "computer-basics",
    type: "single",
    stem: "CPU主要技术性能指标有________。",
    options: ["字长、运算速度和时钟主频","可靠性和精度","耗电量和效率","冷却效率"],
    answer: "字长、运算速度和时钟主频",
    analysis: "微型计算机CPU的主要技术指标包括字长、时钟主频、运算速度、存储容量、存取周期等。"
  },
  {
    id: "ncre-base-0018",
    topicId: "computer-basics",
    type: "single",
    stem: "DRAM存储器的中文含义是　　　。",
    options: ["静态随机存储器","动态随机存储器","动态只读存储器","静态只读存储器"],
    answer: "动态随机存储器",
    analysis: "随机存储器(RAM)分为静态随机存储器(SRAM)和动态随机存储器(DRAM)。 \n静态随机存储器(SRAM):读写速度快,生产成本高,多用于容量较小的高速缓冲存储器。 \n动态随机存储器(DRAM):读写速度较慢,集成度高,生产成本低,多用于容量较大的主存储器。"
  },
  {
    id: "ncre-base-0019",
    topicId: "computer-basics",
    type: "single",
    stem: "DVD－ROM属于________。",
    options: ["大容量可读可写外存储器","大容量只读外部存储器","CPU可直接存取的存储器","只读内存储器"],
    answer: "大容量只读外部存储器",
    analysis: "DVD是外接设备，ROM是只读存储。故合起来就是只读外部存储器"
  },
  {
    id: "ncre-base-0020",
    topicId: "computer-basics",
    type: "single",
    stem: "HTML的正式名称是　　　。",
    options: ["Internet编程语言","超文本标记语言","主页制作语言","WWW编程语言"],
    answer: "超文本标记语言",
    analysis: "HTML是HyperTextMarkupLanguage的简称,是超文本标记语言,是用于编写和格式化网页的代码。"
  },
  {
    id: "ncre-base-0021",
    topicId: "computer-basics",
    type: "single",
    stem: "IE浏览器收藏夹的作用是　　　。",
    options: ["收集感兴趣的页面地址","记忆感兴趣的页面的内容","收集感兴趣的文件内容","收集感兴趣的文件名"],
    answer: "收集感兴趣的页面地址",
    analysis: "IE浏览器中收藏夹的作用是保存网页地址。"
  },
  {
    id: "ncre-base-0022",
    topicId: "computer-basics",
    type: "single",
    stem: "Internet实现了分布在世界各地的各类网络的互联，其基础和核心的协议是________。",
    options: ["HTTP","TCP/IP","HTML","FTP"],
    answer: "TCP/IP",
    analysis: "Internet实现了分布在世界各地的各类网络的互联，其最基础和核心的协议是TCP/IP。HTTP是超文本传输协议，HTML是超文本标志语言，FTP是文件传输协议。"
  },
  {
    id: "ncre-base-0023",
    topicId: "computer-basics",
    type: "single",
    stem: "Internet是覆盖全球的大型互联网络，用于链接多个远程网和局域网的互联设备主要是　　　。",
    options: ["路由器","主机","网桥","防火墙"],
    answer: "路由器",
    analysis: "因特网(Internet)是通过路由器将世界不同地区、不同规模的LAN和MAN相互连接起来的大型网络,是全球计算机的互联网,属于广域网。"
  },
  {
    id: "ncre-base-0024",
    topicId: "computer-basics",
    type: "single",
    stem: "Internet提供的最常用、便捷的通信服务是________。",
    options: ["文件传输(FTP)","远程登录(Telnet)","电子邮件(E－mail)","万维网(WWW)"],
    answer: "电子邮件(E－mail)",
    analysis: "电子邮件是Internet提供的最常用、最便捷的通信服务。"
  },
  {
    id: "ncre-base-0025",
    topicId: "computer-basics",
    type: "single",
    stem: "Internet网中不同网络和不同计算机相互通讯的基础是________。",
    options: ["ATM","TCP/IP","Novell","X.25"],
    answer: "TCP/IP",
    analysis: "TCP/IP协议主要是供已连接因特网的计算机进行通信的通信协议"
  },
  {
    id: "ncre-base-0026",
    topicId: "computer-basics",
    type: "single",
    stem: "KB(千字节)是度量存储器容量大小的常用单位之一，1KB等于________。",
    options: ["1000个字节","1024个字节","1000个二进位","1024个字"],
    answer: "1024个字节",
    analysis: "1KB＝1024B＝1024×8bit。"
  },
  {
    id: "ncre-base-0027",
    topicId: "computer-basics",
    type: "single",
    stem: "Modem是计算机通过电话线接入Internet时所必需的硬件，它的功能是________。",
    options: ["只将数字信号转换为模拟信号","只将模拟信号转换为数字信号","为了在上网的同时能打电话","将模拟信号和数字信号互相转换"],
    answer: "将模拟信号和数字信号互相转换",
    analysis: "调制解调器(即Modem)，是计算机与电话线之间进行信号转换的装置，由调制器和解调器两部分组成，调制器是把计算机的数字信号调制成可在电话线上传输的声音信号的装置，在接收端，解调器再把声音信号转换成计算机能接收的数字信号。"
  },
  {
    id: "ncre-base-0028",
    topicId: "computer-basics",
    type: "single",
    stem: "Pentium(奔腾)微机的字长是（　　）。",
    options: ["8位","16位","32位","64位"],
    answer: "32位",
    analysis: "Pentium是32位微机。"
  },
  {
    id: "ncre-base-0029",
    topicId: "computer-basics",
    type: "single",
    stem: "RAM的特点是________。",
    options: ["海量存储器","存储在其中的信息可以永久保存","一旦断电，存储在其上的信息将全部消失，且无法恢复","只用来存储中间数据"],
    answer: "一旦断电，存储在其上的信息将全部消失，且无法恢复",
    analysis: "RAM有两个特点，一个是可读/写性；另一个是易失性，即断开电源时，RAM中的内容立即消失"
  },
  {
    id: "ncre-base-0030",
    topicId: "computer-basics",
    type: "single",
    stem: "ROM中的信息是________。",
    options: ["由生产厂家预先写入的","在安装系统时写入的","根据用户需求不同，由用户随时写入的","由程序临时存入的"],
    answer: "由生产厂家预先写入的",
    analysis: "ROM中的信息一般由计算机制造厂写入并经过固化处理，用户是无法修改的。"
  },
  {
    id: "ncre-base-0031",
    topicId: "computer-basics",
    type: "single",
    stem: "SRAM存储器是　　　。",
    options: ["静态只读存储器","静态随机存储器","动态只读存储器","动态随机存储器"],
    answer: "静态随机存储器",
    analysis: "随机存储器(RAM)分为静态随机存储器(SRAM)和动态随机存储器(DRAM)。 \n静态随机存储器(SRAM):读写速度快,生产成本高,多用于容量较小的高速缓冲存储器。 \n动态随机存储器(DRAM):读写速度较慢,集成度高,生产成本低,多用于容量较大的主存储器。"
  },
  {
    id: "ncre-base-0032",
    topicId: "computer-basics",
    type: "single",
    stem: "TCP协议的主要功能是________。",
    options: ["对数据进行分组","确保数据的可靠传输","确定数据传输路径","提高数据传输速度"],
    answer: "确保数据的可靠传输",
    analysis: "CP协议的主要功能是完成对数据报的确认、流量控制和网络拥塞；自动检测数据报，并提供错误重发的功能；将多条路径传送的数据报按照原来的顺序进行排列，并对重复数据进行择取；控制超时重发，自动调整超时值；提供自动恢复丢失数据的功能。"
  },
  {
    id: "ncre-base-0033",
    topicId: "computer-basics",
    type: "single",
    stem: "UPS的中文译名是________。",
    options: ["稳压电源","不间断电源","高能电源","调压电源"],
    answer: "不间断电源",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0034",
    topicId: "computer-basics",
    type: "single",
    stem: "USB1.1和USB2.0的区别之一在于传输率不同，USB1.1的传输率是________。",
    options: ["150KB/s","12MB/s","480MB/s","48MB/s"],
    answer: "12MB/s",
    analysis: "USB1.1标准接口的传输率是12MB/s，USB2.0的传输速率为480MB/s。"
  },
  {
    id: "ncre-base-0035",
    topicId: "computer-basics",
    type: "single",
    stem: "Word字处理软件属于　　　。",
    options: ["管理软件","网络软件","应用软件","系统软件"],
    answer: "应用软件",
    analysis: "应用软件是指人们为解决某一实际问题,达到某一应用目的而编制的程序。图形处理软件、字处理软件、表格处理软件等属于应用软件。Word是字处理软件,属于应用软件。"
  },
  {
    id: "ncre-base-0036",
    topicId: "computer-basics",
    type: "single",
    stem: "按操作系统的分类，UNIX操作系统是________。",
    options: ["批处理操作系统","实时操作系统","分时操作系统","单用户操作系统"],
    answer: "分时操作系统",
    analysis: "UNIX，是一个强大的多用户、多任务操作系统，支持多种处理器架构，按照操作系统的分类，属于分时操作系统。"
  },
  {
    id: "ncre-base-0037",
    topicId: "computer-basics",
    type: "single",
    stem: "按电子计算机传统的分代方法，第一代至第四代计算机依次是________。",
    options: ["机械计算机，电子管计算机，晶体管计算机，集成电路计算机","晶体管计算机，集成电路计算机，大规模集成电路计算机，光器件计算机","电子管计算机，晶体管计算机，小、中规模集成电路计算机，大规模和超大规模集成电路计算机","手摇机械计算机，电动机械计算机，电子管计算机，晶体管计算机"],
    answer: "电子管计算机，晶体管计算机，小、中规模集成电路计算机，大规模和超大规模集成电路计算机",
    analysis: "计算机采用的电子器件为：第一代是电子管，第二代是晶体管，第三代是中小规模集成电路，第四代是大规模、超大规模集成电路。"
  },
  {
    id: "ncre-base-0038",
    topicId: "computer-basics",
    type: "single",
    stem: "按照数的进位制概念，下列各个数中正确的八进制数是________。",
    options: ["1101","7081","1109","B03A"],
    answer: "1101",
    analysis: "八进制数只包括0～7。"
  },
  {
    id: "ncre-base-0039",
    topicId: "computer-basics",
    type: "single",
    stem: "把存储在硬盘上的程序传送到指定的内存区域中，这种操作称为________。",
    options: ["输出","写盘","输入","读盘"],
    answer: "读盘",
    analysis: "把内存中数据传送到计算机硬盘中去，称为写盘。把硬盘上的数据传送到计算机的内存中去，称为读盘。"
  },
  {
    id: "ncre-base-0040",
    topicId: "computer-basics",
    type: "single",
    stem: "把内存中的数据保存到硬盘上的操作称为________。",
    options: ["显示","写盘","输入","读盘"],
    answer: "写盘",
    analysis: "把内存中数据传送到计算机硬盘中去，称为写盘。把硬盘上的数据传送到计算机中的内存中去，称为读盘。"
  },
  {
    id: "ncre-base-0041",
    topicId: "computer-basics",
    type: "single",
    stem: "把用高级程序设计语言编写的源程序翻译成目标程序(.OBJ)的程序称为________。",
    options: ["汇编程序","编辑程序","编译程序","解释程序"],
    answer: "编译程序",
    analysis: "将高级语言源程序翻译成目标程序的软件称为编译程序。"
  },
  {
    id: "ncre-base-0042",
    topicId: "computer-basics",
    type: "single",
    stem: "把用高级语言编写的源程序转换为可执行程序(.exe)，要经过的过程叫做________。",
    options: ["汇编和解释","编辑和链接","编译和链接","解释和编译"],
    answer: "编译和链接",
    analysis: "高级语言程序编译成目标程序，通过链接将目标程序链接成可执行程序。"
  },
  {
    id: "ncre-base-0043",
    topicId: "computer-basics",
    type: "single",
    stem: "办公室自动化(OA)是计算机的一大应用领域，按计算机应用的分类，它属于________。",
    options: ["科学计算","辅助设计","实时控制","数据处理"],
    answer: "数据处理",
    analysis: "办公自动化包括网络化的大规模信息处理系统。"
  },
  {
    id: "ncre-base-0044",
    topicId: "computer-basics",
    type: "single",
    stem: "半导体只读存储器(ROM)与半导体随机存取存储器(RAM)的主要区别在于　　　。",
    options: ["ROM可以永久保存信息，RAM在断电后信息会丢失","ROM断电后，信息会丢失，RAM则不会","ROM是内存储器，RAM是外存储器","RAM是内存储器，ROM是外存储器"],
    answer: "ROM可以永久保存信息，RAM在断电后信息会丢失",
    analysis: "只读存储器(ROM)和随机存储器(RAM)都属于内存储器(内存)。只读存储器(ROM)特点是:只能读出(存储器中)原有的内容,而不能修改,即只能读,不能写。断电以后内容不会丢失,加电后会自动恢复,即具有非易失性。随机存储器(RAM)特点是:读写速度快,最大的不足是断电后,内容立即消失,即易失性。"
  },
  {
    id: "ncre-base-0045",
    topicId: "computer-basics",
    type: "single",
    stem: "奔腾(Pentium)是　　　公司生产的一种CPU的型号。",
    options: ["IBM","Microsoft","Intel","AMD"],
    answer: "Intel",
    analysis: "英特尔(Intel)公司生产的一种CPU的型号是奔腾(Pentium)系列的。"
  },
  {
    id: "ncre-base-0046",
    topicId: "computer-basics",
    type: "single",
    stem: "标准ASCII码用7位二进制位表示一个字符的编码，其不同的编码共有________。",
    options: ["127个","128个","256个","254个"],
    answer: "128个",
    analysis: "7位二进制编码，共有2^7＝128个不同的编码值。"
  },
  {
    id: "ncre-base-0047",
    topicId: "computer-basics",
    type: "single",
    stem: "标准ASCII码字符集有128个不同的字符代码，它所使用的二进制位数是________。",
    options: ["6","7","8","16"],
    answer: "7",
    analysis: "ASCII码采用7位编码表示128个字符。"
  },
  {
    id: "ncre-base-0048",
    topicId: "computer-basics",
    type: "single",
    stem: "操作系统的功能是　　　。",
    options: ["将源程序编译成目标程序","负责诊断计算机的故障","控制和管理计算机系统的各种硬件和软件资源的使用","负责外设与主机之间的信息交换"],
    answer: "控制和管理计算机系统的各种硬件和软件资源的使用",
    analysis: "操作系统是控制和管理计算机硬件和软件资源并为用户提供方便的操作环境的程序集合。"
  },
  {
    id: "ncre-base-0049",
    topicId: "computer-basics",
    type: "single",
    stem: "操作系统的主要功能是________。",
    options: ["对用户的数据文件进行管理，为用户提供管理文件方便","对计算机的所有资源进行统一控制和管理，为用户使用计算机提供方便","对源程序进行编译和运行","对汇编语言程序进行翻译"],
    answer: "对计算机的所有资源进行统一控制和管理，为用户使用计算机提供方便",
    analysis: "操作系统的主要功能是管理计算机的所有资源(硬件和软件)。"
  },
  {
    id: "ncre-base-0050",
    topicId: "computer-basics",
    type: "single",
    stem: "操作系统对磁盘进行读/写操作的单位是（　　）。",
    options: ["磁道","字节","扇区","KB"],
    answer: "扇区",
    analysis: "操作系统是以扇区为单位对磁盘进行读/写操作。"
  },
  {
    id: "ncre-base-0051",
    topicId: "computer-basics",
    type: "single",
    stem: "操作系统管理用户数据的单位是________。",
    options: ["扇区","文件","磁道","文件夹"],
    answer: "文件",
    analysis: "操作系统是以文件为单位进行数据管理。"
  },
  {
    id: "ncre-base-0052",
    topicId: "computer-basics",
    type: "single",
    stem: "操作系统将CPU的时间资源划分成极短的时间片，轮流分配给各终端用户，使终端用户单独分享CPU的时间片，有独占计算机的感觉，这种操作系统称为________。",
    options: ["实时操作系统","批处理操作系统","分时操作系统","分布式操作系统"],
    answer: "分时操作系统",
    analysis: "选项A是对有响应时间要求的快速处理，选项B是处理多个程序或多个作业。"
  },
  {
    id: "ncre-base-0053",
    topicId: "computer-basics",
    type: "single",
    stem: "操作系统是计算机的软件系统中________。",
    options: ["最常用的应用软件","最核心的系统软件","最通用的专用软件","最流行的通用软件"],
    answer: "最核心的系统软件",
    analysis: "系统软件主要包括操作系统、语言处理系统、系统性能检测和实用工具软件等，其中最主要的是操作系统。"
  },
  {
    id: "ncre-base-0054",
    topicId: "computer-basics",
    type: "single",
    stem: "操作系统中的文件管理系统为用户提供的功能是________。",
    options: ["按文件作者存取文件","按文件名管理文件","按文件创建日期存取文件","按文件大小存取文件"],
    answer: "按文件名管理文件",
    analysis: "用户通过文件名很方便的访问文件，无须知道文件的存储细节。"
  },
  {
    id: "ncre-base-0055",
    topicId: "computer-basics",
    type: "single",
    stem: "传播计算机病毒的两大可能途径之一是________。",
    options: ["通过键盘输入数据时传入","通过电源线传播","通过使用表面不清洁的光盘","通过Internet网络传播"],
    answer: "通过Internet网络传播",
    analysis: "计算机病毒主要通过移动存储介质(如U盘、移动硬盘)和计算机网络两大途径进行传播。"
  },
  {
    id: "ncre-base-0056",
    topicId: "computer-basics",
    type: "single",
    stem: "存储1024个24×24点阵的汉字字形码需要的字节数是________。",
    options: ["720B","72KB","7000B","7200B"],
    answer: "72KB",
    analysis: "在24×24的网格中描绘一个汉字，整个网格分为24行24列，每个小格用1位二进制编码表示，每一行需要24个二进制位，占3个字节，24行共占24×3＝72个字节。1024个需要1024×72＝73728字节。"
  },
  {
    id: "ncre-base-0057",
    topicId: "computer-basics",
    type: "single",
    stem: "存储计算机当前正在执行的应用程序和相应的数据的存储器是________。",
    options: ["硬盘","ROM","RAM","CD－ROM"],
    answer: "RAM",
    analysis: "存储计算机当前正在执行的应用程序和相应数据的存储器是RAM，ROM为只读存储器。"
  },
  {
    id: "ncre-base-0058",
    topicId: "computer-basics",
    type: "single",
    stem: "存储一个24×24点的汉字字形码需要________。",
    options: ["32字节","48字节","64字节","72字节"],
    answer: "72字节",
    analysis: "在24*24的网格中描绘一个汉字，整个网格分为24行24列，每个小格用1位二进制编码表示，每一行需要24个二进制位，占3个字节，24行共占24*3=72个字节"
  },
  {
    id: "ncre-base-0059",
    topicId: "computer-basics",
    type: "single",
    stem: "存储一个32×32点的汉字字形码需用的字节数是________。",
    options: ["256","128","72","16"],
    answer: "128",
    analysis: "在32×32的网格中描绘一个汉字，整个网格分为32行32列，每个小格用1位二进制编码表示，每一行需要32个二进制位，占4个字节，32行共占32×4＝128个字节。"
  },
  {
    id: "ncre-base-0060",
    topicId: "computer-basics",
    type: "single",
    stem: "存储一个48×48点的汉字字形码需要的字节数是________。",
    options: ["384","144","256","288"],
    answer: "288",
    analysis: "在48×48的网格中描绘一个汉字，整个网格分为48行48列，每个小格用1位二进制编码表示，每一行需要48个二进制位，占6个字节，4816行共占48×6＝288个字节。"
  },
  {
    id: "ncre-base-0061",
    topicId: "computer-basics",
    type: "single",
    stem: "当代微型机中所采用的电子元器件是________。",
    options: ["电子管","晶体管","小规模集成电路","大规模和超大规模集成电路"],
    answer: "大规模和超大规模集成电路",
    analysis: "计算机采用的电子器件为：第一代是电子管，第二代是晶体管，第三代是中、小规模集成电路，第四代是大规模、超大规模集成电路。当代计算机属于第四代计算机。"
  },
  {
    id: "ncre-base-0062",
    topicId: "computer-basics",
    type: "single",
    stem: "当电源关闭后，下列关于存储器的说法中，正确的是________。",
    options: ["存储在RAM中的数据不会丢失","存储在ROM中的数据不会丢失","存储在软盘中的数据会全部丢失","存储在硬盘中的数据会丢失"],
    answer: "存储在ROM中的数据不会丢失",
    analysis: "断电后RAM内的数据会丢失，ROM、硬盘、软盘中的数据不丢失。"
  },
  {
    id: "ncre-base-0063",
    topicId: "computer-basics",
    type: "single",
    stem: "当计算机病毒发作时，主要造成的破坏是________。",
    options: ["对磁盘片的物理损坏","对磁盘驱动器的损坏","对CPU的损坏","对存储在硬盘上的程序、数据甚至系统的破坏"],
    answer: "对存储在硬盘上的程序、数据甚至系统的破坏",
    analysis: "计算机病毒一般不对硬件进行破坏，而是对程序、数据或系统的破坏。"
  },
  {
    id: "ncre-base-0064",
    topicId: "computer-basics",
    type: "single",
    stem: "当前流行的Pentium 4 CPU的字长是________。",
    options: ["8bit","16bit","32bit","64bit"],
    answer: "32bit",
    analysis: "Pentium 4的CPU字长为32位。"
  },
  {
    id: "ncre-base-0065",
    topicId: "computer-basics",
    type: "single",
    stem: "当前流行的移动硬盘或优盘进行读/写利用的计算机接口是________。",
    options: ["串行接口","平行接口","USB","UBS"],
    answer: "USB",
    analysis: "USB为通用串行总线。"
  },
  {
    id: "ncre-base-0066",
    topicId: "computer-basics",
    type: "single",
    stem: "当前微机上运行的Windows属于________。",
    options: ["批处理操作系统","单任务操作系统","多任务操作系统","分时操作系统"],
    answer: "多任务操作系统",
    analysis: "Windows属于单用户多任务操作系统。"
  },
  {
    id: "ncre-base-0067",
    topicId: "computer-basics",
    type: "single",
    stem: "第二代电子计算机所采用的电子元件是________。",
    options: ["继电器","晶体管","电子管","集成电路"],
    answer: "晶体管",
    analysis: "计算机采用的电子器件为：第一代是电子管，第二代是晶体管，第三代是中、小规模集成电路，第四代是大规模、超大规模集成电路。"
  },
  {
    id: "ncre-base-0068",
    topicId: "computer-basics",
    type: "single",
    stem: "第三代计算机采用的电子元件是________。",
    options: ["晶体管","中、小规模集成电路","大规模集成电路","电子管"],
    answer: "中、小规模集成电路",
    analysis: "计算机采用的电子器件为：第一代是电子管，第二代是晶体管，第三代是中、小规模集成电路，第四代是大规模、超大规模集成电路。"
  },
  {
    id: "ncre-base-0069",
    topicId: "computer-basics",
    type: "single",
    stem: "电话拨号连接是计算机个人用户常用的接入因特网的方式。称为\"非对称数字用户线\"的接入技术的英文缩写是________。",
    options: ["ADSL","ISDN","ISP","TCP"],
    answer: "ADSL",
    analysis: "ADSL (Asymmetric Digital Subscriber Line )非对称数字用户线路，ISDN(Integrated Service Digital Network)综合业务数字网，ISP(Internet Services Provider)国际互联网络服务提供者，TCP(Transmission Control Protocol)传输控制协定。"
  },
  {
    id: "ncre-base-0070",
    topicId: "computer-basics",
    type: "single",
    stem: "电子计算机的最早的应用领域是________。",
    options: ["数据处理","数值计算","工业控制","文字处理"],
    answer: "数值计算",
    analysis: "计算机问世之初，主要用于数值计算，计算机也因此得名。"
  },
  {
    id: "ncre-base-0071",
    topicId: "computer-basics",
    type: "single",
    stem: "电子数字计算机最早的应用领域是________。",
    options: ["辅助制造工程","过程控制","信息处理","数值计算"],
    answer: "数值计算",
    analysis: "计算机问世之初，主要用于数值计算，计算机也因此得名。"
  },
  {
    id: "ncre-base-0072",
    topicId: "computer-basics",
    type: "single",
    stem: "度量处理器CPU时钟频率的单位是________。",
    options: ["MIPS","MB","MHz","Mbps"],
    answer: "MHz",
    analysis: "MIPS是运算速度，MB是存储容量，Mbps是传输速率。"
  },
  {
    id: "ncre-base-0073",
    topicId: "computer-basics",
    type: "single",
    stem: "度量计算机运算速度常用的单位是________。",
    options: ["MIPS","MHz","MB","Mbps"],
    answer: "MIPS",
    analysis: "计算机的运算速度通常是指每秒钟所能执行的加法指令数目，常用MIPS表示。"
  },
  {
    id: "ncre-base-0074",
    topicId: "computer-basics",
    type: "single",
    stem: "对CD－ROM可以进行的操作是________。",
    options: ["读或写","只能读不能写","只能写不能读","能存不能取"],
    answer: "只能读不能写",
    analysis: "CD－ROM为只读型光盘。"
  },
  {
    id: "ncre-base-0075",
    topicId: "computer-basics",
    type: "single",
    stem: "对计算机病毒的防治也应以\"预防为主\"。下列各项措施中，错误的预防措施是________。",
    options: ["将重要数据文件及时备份到移动存储设备上","用杀病毒软件定期检查计算机","不要随便打开/阅读身份不明的发件人发来的电子邮件","在硬盘中再备份一份"],
    answer: "在硬盘中再备份一份",
    analysis: "应备份到其他存储设备上。"
  },
  {
    id: "ncre-base-0076",
    topicId: "computer-basics",
    type: "single",
    stem: "对计算机操作系统的作用描述完整的是________。",
    options: ["管理计算机系统的全部软、硬件资源，合理组织计算机的工作流程，以充分发挥计算机资源的效率，为用户提供使用计算机的友好界面。","对用户存储的文件进行管理，方便用户","执行用户键入的各类命令","是为汉字操作系统提供运行的基础"],
    answer: "管理计算机系统的全部软、硬件资源，合理组织计算机的工作流程，以充分发挥计算机资源的效率，为用户提供使用计算机的友好界面。",
    analysis: "操作系统是人与计算机之间通信的桥梁，为用户提供了一个清晰、简洁、易用的工作界面，用户通过操作系统提供的命令和交互功能实现各种访问计算机的操作"
  },
  {
    id: "ncre-base-0077",
    topicId: "computer-basics",
    type: "single",
    stem: "对于微机用户来说，为了防止计算机意外故障而丢失重要数据，对重要数据应定期进行备份。下列移动存储器中，最不常用的一种是________。",
    options: ["软盘","USB移动硬盘","优盘","磁带"],
    answer: "磁带",
    analysis: "经常用于备份的移动存储器有优盘、移动硬盘、软盘。"
  },
  {
    id: "ncre-base-0078",
    topicId: "computer-basics",
    type: "single",
    stem: "对于众多个人用户来说，接入因特网最经济、最简单、采用最多的方式是　　　。",
    options: ["局域网连接","专线连接","电话拨号","无线连接"],
    answer: "电话拨号",
    analysis: "因特网的4种接入方式是:专线连接、局域网连接、无线连接和电话拨号连接。其中ADSL方式拨号连接对于个人用户和小单位是最经济、简单,也是采用最多的一种接入方式。"
  },
  {
    id: "ncre-base-0079",
    topicId: "computer-basics",
    type: "single",
    stem: "二进制数00111101转换成十进制数是　　　。",
    options: ["58","59","61","65"],
    answer: "61",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0080",
    topicId: "computer-basics",
    type: "single",
    stem: "二进制数1001001转换成十进制数是________。",
    options: ["72","71","75","73"],
    answer: "73",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0081",
    topicId: "computer-basics",
    type: "single",
    stem: "二进制数101110转换成等值的十六进制数是________。",
    options: ["2C","2D","2E","2F"],
    answer: "2E",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0082",
    topicId: "computer-basics",
    type: "single",
    stem: "二进制数110000转换成十六进制数是　　　。",
    options: ["77","D7","70","30"],
    answer: "30",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0083",
    topicId: "computer-basics",
    type: "single",
    stem: "二进制数110001转换成十进制数是（　　）。",
    options: ["47","48","49","51"],
    answer: "49",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0084",
    topicId: "computer-basics",
    type: "single",
    stem: "二进制数1100100等于十进制数________。",
    options: ["96","100","104","112"],
    answer: "100",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0085",
    topicId: "computer-basics",
    type: "single",
    stem: "冯·诺依曼(Von Neumann)型体系结构的计算机硬件系统的五大部件是________。",
    options: ["输入设备、运算器、控制器、存储器、输出设备","键盘和显示器、运算器、控制器、存储器和电源设备","输入设备、中央处理器、硬盘、存储器和输出设备","键盘、主机、显示器、硬盘和打印机"],
    answer: "输入设备、运算器、控制器、存储器、输出设备",
    analysis: "计算机硬件包括CPU(包括运算器和控制器)、存储器、输入设备、输出设备。"
  },
  {
    id: "ncre-base-0086",
    topicId: "computer-basics",
    type: "single",
    stem: "冯·诺依曼(Von Neumann)在总结ENIAC的研制过程和制订EDVAC计算机方案时，提出两点改进意见，它们是________。",
    options: ["采用ASCII编码集和指令系统","引入CPU和内存储器的概念","机器语言和十六进制","采用二进制和存储程序控制的概念"],
    answer: "采用二进制和存储程序控制的概念",
    analysis: "和ENIAC相比，EDVAC的重大改进主要有两方面，一是把十进位制改成二进位制，这可以充分发挥电子元件高速运算的优越性；二是把程序和数据一起存储在计算机内，这样就可以使全部运算成为真正的自动过程。"
  },
  {
    id: "ncre-base-0087",
    topicId: "computer-basics",
    type: "single",
    stem: "感染计算机病毒的原因之一是________。",
    options: ["不正常关机","光盘表面不清洁","错误操作","从网上下载文件"],
    answer: "从网上下载文件",
    analysis: "计算机病毒主要通过移动存储介质(如U盘、移动硬盘)和计算机网络两大途径进行传播。"
  },
  {
    id: "ncre-base-0088",
    topicId: "computer-basics",
    type: "single",
    stem: "个人计算机属于　　　。",
    options: ["小型计算机","巨型机算机","大型主机","微型计算机"],
    answer: "微型计算机",
    analysis: "从计算机的性能来看,计算机的发展经历了四个阶段:巨型机、大型机、小型机、微型机。个人计算机属于微型计算机。"
  },
  {
    id: "ncre-base-0089",
    topicId: "computer-basics",
    type: "single",
    stem: "根据国标GB2312－80的规定，总计有各类符号和一、二级汉字编码________。",
    options: ["7145个","7445个","3008个","3755个"],
    answer: "7445个",
    analysis: "在国际码的字符集中，收集了一级汉字3775个，二级汉字3008个，图形符号682个，一共是7445"
  },
  {
    id: "ncre-base-0090",
    topicId: "computer-basics",
    type: "single",
    stem: "根据汉字国标GB2312－80的规定，1KB存储容量可以存储汉字的内码个数是________。",
    options: ["1024","512","256","约341"],
    answer: "512",
    analysis: "一个汉字等于2B，也就是说，1KB＝1024B，所以可以放512个。"
  },
  {
    id: "ncre-base-0091",
    topicId: "computer-basics",
    type: "single",
    stem: "根据汉字国标GB2312－80的规定，存储一个汉字的内码需用的字节个数是________。",
    options: ["4","3","2","1"],
    answer: "2",
    analysis: "储存一个汉字内码需要用2个字节。"
  },
  {
    id: "ncre-base-0092",
    topicId: "computer-basics",
    type: "single",
    stem: "根据汉字国标GB2312－80的规定，二级次常用汉字个数是（　　）。",
    options: ["3000个","7445个","3008个","3755个"],
    answer: "3008个",
    analysis: "在国际码的字符集中，收集了一级汉字3775个，二级汉字3008个，图形符号682个"
  },
  {
    id: "ncre-base-0093",
    topicId: "computer-basics",
    type: "single",
    stem: "根据汉字国标GB2312－80的规定，一个汉字的机内码的码长是________。",
    options: ["8bit","12bit","16bit","24bit"],
    answer: "16bit",
    analysis: "一个汉字是两个字节，一字节是8bit，所以就是16bit。"
  },
  {
    id: "ncre-base-0094",
    topicId: "computer-basics",
    type: "single",
    stem: "根据汉字国标码GB2312－80的规定，将汉字分为常用汉字(一级)和非常用汉字(二级)两级汉字。一级常用汉字的排列是按________。",
    options: ["偏旁部首","汉语拼音字母","笔划多少","使用频率多少"],
    answer: "汉语拼音字母",
    analysis: "在国家汉字标准GB2312－80中，一级常用汉字按(汉语拼音)规律排列，二级次常用汉字按(偏旁部首)规律排列。"
  },
  {
    id: "ncre-base-0095",
    topicId: "computer-basics",
    type: "single",
    stem: "根据汉字国标码GB2312－80的规定，将汉字分为常用汉字和次常用汉字两级。次常用汉字的排列次序是按________。",
    options: ["偏旁部首","汉语拼音字母","笔划多少","使用频率多少"],
    answer: "偏旁部首",
    analysis: "在国家汉字标准GB2312－80中，一级常用汉字按(汉语拼音)规律排列，二级次常用汉字按(偏旁部首)规律排列。"
  },
  {
    id: "ncre-base-0096",
    topicId: "computer-basics",
    type: "single",
    stem: "根据汉字国标码GB2312－80的规定，一级常用汉字数是________。",
    options: ["3477个","3575个","3755个","7445个"],
    answer: "3755个",
    analysis: "在国标码的字符集中，收集了一级汉字3755个，二级汉字3008个，图形符号682个。"
  },
  {
    id: "ncre-base-0097",
    topicId: "computer-basics",
    type: "single",
    stem: "根据汉字国标码GB2312－80的规定，总计有各类符号和一、二级汉字个数是________。",
    options: ["6763个","7445个","3008个","3755个"],
    answer: "7445个",
    analysis: "在国标码的字符集中，收集了一级汉字3755个，二级汉字3008个，图形符号682个。"
  },
  {
    id: "ncre-base-0098",
    topicId: "computer-basics",
    type: "single",
    stem: "根据数制的基本概念，下列各进制的整数中，值最大的一个是________。",
    options: ["十六进制数10","十进制数10","八进制数10","二进制数10"],
    answer: "十六进制数10",
    analysis: "8进制10是十进制的8，十六进制的10是十进制的16，二进制的10是十进制的2，所以选A。"
  },
  {
    id: "ncre-base-0099",
    topicId: "computer-basics",
    type: "single",
    stem: "根据数制的基本概念，下列各进制的整数中，值最小的一个是________。",
    options: ["十进制数10","八进制数10","十六进制数10","二进制数10"],
    answer: "二进制数10",
    analysis: "8进制10是十进制的8，十六进制的10是十进制的16，二进制的10是十进制的2，所以选D。"
  },
  {
    id: "ncre-base-0100",
    topicId: "computer-basics",
    type: "single",
    stem: "根据域名代码规定，表示教育机构网站的域名代码是",
    options: ["net","com","edu","org"],
    answer: "edu",
    analysis: "商业组织的域名为.com，非营利性组织的域名为.org，从事互联网服务的机构的域名为.net。"
  },
  {
    id: "ncre-base-0101",
    topicId: "computer-basics",
    type: "single",
    stem: "根据域名代码规定，表示政府部门网站的域名代码是________。",
    options: ["net","com","gov","org"],
    answer: "gov",
    analysis: "政府机关域名为.gov，商业组织的域名为.com，非营利性组织的域名为.org，从事互联网服务的机构的域名为.net。"
  },
  {
    id: "ncre-base-0102",
    topicId: "computer-basics",
    type: "single",
    stem: "构成CPU的主要部件是（　　）。",
    options: ["内存和控制器","内存、控制器和运算器","高速缓存和运算器","控制器和运算器"],
    answer: "控制器和运算器",
    analysis: "CPU主要由运算器和控制器组成。"
  },
  {
    id: "ncre-base-0103",
    topicId: "computer-basics",
    type: "single",
    stem: "关于世界上第一台电子计算机ENIAC的叙述中，错误的是________。",
    options: ["ENIAC是1946年在美国诞生的","它主要采用电子管和继电器","它是首次采用存储程序和程序控制自动工作的电子计算机","研制它的主要目的是用来计算弹道"],
    answer: "它是首次采用存储程序和程序控制自动工作的电子计算机",
    analysis: "EDVAC出现时才使用存储程序。"
  },
  {
    id: "ncre-base-0104",
    topicId: "computer-basics",
    type: "single",
    stem: "汉字的区位码是由一个汉字在国标码表中的行号(即区号)和列号(即位号)组成。正确的区号、位号的范围是________。",
    options: ["区号1～95，位号1～95","区号1～94，位号1～94","区号0～94，位号0～94","区号0～95，位号0～95"],
    answer: "区号1～94，位号1～94",
    analysis: "区位码：94×94阵列，区号范围：1～94，位号范围：1～94。"
  },
  {
    id: "ncre-base-0105",
    topicId: "computer-basics",
    type: "single",
    stem: "汉字的区位码由一个汉字的区号和位号组成。其区号和位号的范围各为________。",
    options: ["区号1～95，位号1～95","区号1～94，位号1～94","区号0～94，位号0～94","区号0～95，位号0～95"],
    answer: "区号1～94，位号1～94",
    analysis: "区位码：94×94阵列，区号范围：1～94，位号范围：1～94。"
  },
  {
    id: "ncre-base-0106",
    topicId: "computer-basics",
    type: "single",
    stem: "汉字国标码(GB2312－80)把汉字分成________。",
    options: ["简化字和繁体字两个等级","一级汉字，二级汉字和三级汉字三个等级","一级常用汉字，二级次常用汉字两个等级","常用字，次常用字，罕见字三个等级"],
    answer: "一级常用汉字，二级次常用汉字两个等级",
    analysis: "在国标码的字符集中，收集了一级汉字3755个，二级汉字3008个，图形符号682个。"
  },
  {
    id: "ncre-base-0107",
    topicId: "computer-basics",
    type: "single",
    stem: "汉字国标码(GB2312－80)把汉字分成2个等级。其中一级常用汉字的排列顺序是按________。",
    options: ["汉语拼音字母顺序","偏旁部首","笔划多少","以上都不对"],
    answer: "汉语拼音字母顺序",
    analysis: "在国家汉字标准GB2312－80中，一级常用汉字按(汉语拼音)规律排列，二级次常用汉字按(偏旁部首)规律排列。"
  },
  {
    id: "ncre-base-0108",
    topicId: "computer-basics",
    type: "single",
    stem: "汉字区位码分别用十进制的区号和位号表示。其区号和位号的范围分别是________。",
    options: ["0～94,0～94","1～95,1～95","1～94,1～94","0～95,0～95"],
    answer: "1～94,1～94",
    analysis: "区位码：94×94阵列，区号范围：1～94，位号范围：1～94。"
  },
  {
    id: "ncre-base-0109",
    topicId: "computer-basics",
    type: "single",
    stem: "汉字输入码可分为有重码和无重码两类，下列属于无重码类的是________。",
    options: ["全拼码","自然码","区位码","简拼码"],
    answer: "区位码",
    analysis: "区位码属于无重码。"
  },
  {
    id: "ncre-base-0110",
    topicId: "computer-basics",
    type: "single",
    stem: "核爆炸和地震灾害之类的仿真模拟，其应用领域是　　　。",
    options: ["计算机辅助","科学计算","数据处理","实时控制"],
    answer: "计算机辅助",
    analysis: "计算机辅助的重要两个反面就是计算机模拟和仿真。核爆炸和地震灾害的模拟都可以通过计算机来实现,从而帮助科学家进一步认识被模拟对象的特征。"
  },
  {
    id: "ncre-base-0111",
    topicId: "computer-basics",
    type: "single",
    stem: "汇编语言是一种（　　）。",
    options: ["依赖于计算机的低级程序设计语言","计算机能直接执行的程序设计语言","独立于计算机的高级程序设计语言","面向问题的程序设计语言"],
    answer: "依赖于计算机的低级程序设计语言",
    analysis: "汇编语言无法直接执行，必须翻译成机器语言程序才能执行。汇编语言不能独立于计算机；面向问题的程序设计语言是高级语言。"
  },
  {
    id: "ncre-base-0112",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机病毒除通过读写或复制移动存储器上带病毒的文件传染外，另一条主要的传染途径是________。",
    options: ["网络","电源电缆","键盘","输入有逻辑错误的程序"],
    answer: "网络",
    analysis: "计算机病毒主要通过移动存储介质(如U盘、移动硬盘)和计算机网络两大途径进行传播。"
  },
  {
    id: "ncre-base-0113",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机病毒破坏的主要对象是　　　。",
    options: ["优盘","磁盘驱动器","CPU","程序和数据"],
    answer: "程序和数据",
    analysis: "计算机病毒主要破坏的对象是计算机的程序和数据。"
  },
  {
    id: "ncre-base-0114",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机病毒实际上是________。",
    options: ["一个完整的小程序","一段寄生在其他程序上的通过自我复制进行传染的，破坏计算机功能和数据的特殊程序","一个有逻辑错误的小程序","微生物病毒"],
    answer: "一段寄生在其他程序上的通过自我复制进行传染的，破坏计算机功能和数据的特殊程序",
    analysis: "计算机病毒是指编制或者在计算机程序中插入的破坏计算机功能或者破坏数据，影响计算机使用并且能够自我复制的一组计算机指令或者程序代码。"
  },
  {
    id: "ncre-base-0115",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机病毒是指\"能够侵入计算机系统并在计算机系统中潜伏、传播，破坏系统正常工作的一种具有繁殖能力的（　　）。",
    options: ["流行性感冒病毒","特殊小程序","特殊微生物","源程序"],
    answer: "特殊小程序",
    analysis: "计算机病毒是指编制或者在计算机程序中插入的破坏计算机功能或者破坏数据，影响计算机使用并且能够自我复制的一组计算机指令或者程序代码。"
  },
  {
    id: "ncre-base-0116",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机病毒是指______。",
    options: ["编制有错误的计算机程序","设计不完善的计算机程序","已被破坏的计算机程序","以危害系统为目的的特殊计算机程序"],
    answer: "以危害系统为目的的特殊计算机程序",
    analysis: "计算机病毒是指编制或者在计算机程序中插入的破坏计算机功能或者破坏数据，影响计算机使用并且能够自我复制的一组计算机指令或者程序代码。"
  },
  {
    id: "ncre-base-0117",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机采用的主机电子器件的发展顺序是　　　。",
    options: ["晶体管、电子管、中小规模集成电路、大规模和超大规模集成电路","电子管、晶体管、中小规模集成电路、大规模和超大规模集成电路","晶体管、电子管、集成电路、芯片","电子管、晶体管、集成电路、芯片"],
    answer: "电子管、晶体管、中小规模集成电路、大规模和超大规模集成电路",
    analysis: "计算机从诞生发展至今所采用的逻辑元件的发展顺序是电子管、晶体管、集成电路、大规模和超大规模集成电路。"
  },
  {
    id: "ncre-base-0118",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机操作系统的主要功能是________。",
    options: ["对计算机的所有资源进行控制和管理，为用户使用计算机提供方便","对源程序进行翻译","对用户数据文件进行管理","对汇编语言程序进行翻译"],
    answer: "对计算机的所有资源进行控制和管理，为用户使用计算机提供方便",
    analysis: "操作系统是人与计算机之间通信的桥梁，为用户提供了一个清晰、简洁、易用的工作界面，用户通过操作系统提供的命令和交互功能实现各种访问计算机的操作。"
  },
  {
    id: "ncre-base-0119",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机操作系统是________。",
    options: ["一种使计算机便于操作的硬件设备","计算机的操作规范","计算机系统中必不可少的系统软件","对源程序进行编辑和编译的软件"],
    answer: "计算机系统中必不可少的系统软件",
    analysis: "系统软件主要包括操作系统、语言处理系统、系统性能检测和实用工具软件等，其中最主要的是操作系统。"
  },
  {
    id: "ncre-base-0120",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机操作系统通常具有的五大功能是________。",
    options: ["CPU管理、显示器管理、键盘管理、打印机管理和鼠标器管理","硬盘管理、软盘驱动器管理、CPU的管理、显示器管理和键盘管理","处理器(CPU)管理、存储管理、文件管理、设备管理和作业管理","启动、打印、显示、文件存取和关机"],
    answer: "处理器(CPU)管理、存储管理、文件管理、设备管理和作业管理",
    analysis: "操作系统的主要功能：CPU管理、存储管理、文件管理、设备管理和作业管理。"
  },
  {
    id: "ncre-base-0121",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机存储器中，组成一个字节的二进制位数是________。",
    options: ["4bit","8bit","16bit","32bit"],
    answer: "8bit",
    analysis: "1Byte＝8bit。"
  },
  {
    id: "ncre-base-0122",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机的操作系统是________。",
    options: ["计算机中使用最广的应用软件","计算机系统软件的核心","微机的专用软件","微机的通用软件"],
    answer: "计算机系统软件的核心",
    analysis: "系统软件主要包括操作系统、语言处理系统、系统性能检测和实用工具软件等，其中最主要的是操作系统。"
  },
  {
    id: "ncre-base-0123",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机的存储器中，组成一个字节(Byte)的二进制位(bit)个数是________。",
    options: ["4","8","16","32"],
    answer: "8",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0124",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机的发展趋势是　　　、微型化、网络化和智能化。",
    options: ["大型化","小型化","精巧化","巨型化"],
    answer: "巨型化",
    analysis: "计算机未来的发展趋势是巨型化、微型化、网络化和智能化。"
  },
  {
    id: "ncre-base-0125",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机的技术性能指标主要是指________。",
    options: ["计算机所配备的语言、操作系统、外部设备","硬盘的容量和内存的容量","显示器的分辨率、打印机的性能等配置","字长、运算速度、内/外存容量和CPU的时钟频率"],
    answer: "字长、运算速度、内/外存容量和CPU的时钟频率",
    analysis: "微型计算机的主要技术性能指标包括字长、时钟主频、运算速度、存储容量、存取周期等。"
  },
  {
    id: "ncre-base-0126",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机的系统总线是计算机各部件间传递信息的公共通道，它分________。",
    options: ["数据总线和控制总线","地址总线和数据总线","数据总线、控制总线和地址总线","地址总线和控制总线"],
    answer: "数据总线、控制总线和地址总线",
    analysis: "系统总线分为三类：数据总线、地址总线、控制总线。"
  },
  {
    id: "ncre-base-0127",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机的硬件系统主要包括：运算器、存储器、输入设备、输出设备和________。",
    options: ["控制器","显示器","磁盘驱动器","打印机"],
    answer: "控制器",
    analysis: "计算机硬件包括CPU(包括运算器和控制器)、存储器、输入设备、输出设备。"
  },
  {
    id: "ncre-base-0128",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机的硬件系统主要包括：中央处理器(CPU)、存储器、输出设备和________。",
    options: ["键盘","鼠标","输入设备","扫描仪"],
    answer: "输入设备",
    analysis: "计算机硬件包括CPU、存储器、输入设备、输出设备。"
  },
  {
    id: "ncre-base-0129",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机辅助教育的英文缩写是　　　。",
    options: ["CAD","CAE","CAM","CAI"],
    answer: "CAI",
    analysis: "计算机辅助制造简称CAM;计算机辅助教学简称CAI;计算机辅助设计简称CAD;计算机辅助检测简称CAE。"
  },
  {
    id: "ncre-base-0130",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机辅助设计的简称是　　　。",
    options: ["CAT","CAM","CAI","CAD"],
    answer: "CAD",
    analysis: "计算机辅助制造简称CAM;计算机辅助教学简称CAI;计算机辅助设计简称CAD;计算机辅助检测简称CAE。"
  },
  {
    id: "ncre-base-0131",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机感染病毒的可能途径之一是________。",
    options: ["从键盘上输入数据","随意运行外来的、未经杀病毒软件严格审查的优盘上的软件","所使用的光盘表面不清洁","电源不稳定"],
    answer: "随意运行外来的、未经杀病毒软件严格审查的优盘上的软件",
    analysis: "计算机病毒主要通过移动存储介质(如U盘、移动硬盘)和计算机网络两大途径进行传播。"
  },
  {
    id: "ncre-base-0132",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机技术中，下列不是度量存储器容量的单位是________。",
    options: ["KB","MB","GHz","GB"],
    answer: "GHz",
    analysis: "GHz是主频的单位。"
  },
  {
    id: "ncre-base-0133",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机技术中，下列的英文缩写和中文名字的对照中，正确的是________。",
    options: ["CAD--计算机辅助制造","CAM--计算机辅助教育","CIMS--计算机集成制造系统","CAI--计算机辅助设计"],
    answer: "CIMS--计算机集成制造系统",
    analysis: "计算机辅助设计是CAD，计算机辅助教育是CAI，计算机辅助制造CAM。"
  },
  {
    id: "ncre-base-0134",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机技术中，下列度量存储器容量的单位中，最大的单位是________。",
    options: ["KB","MB","Byte","GB"],
    answer: "GB",
    analysis: "度量存储空间大小的单位有从小到大依次为：B、KB、MB、GB、TB。"
  },
  {
    id: "ncre-base-0135",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机技术中，英文缩写CPU的中文译名是________。",
    options: ["控制器","运算器","中央处理器","寄存器"],
    answer: "中央处理器",
    analysis: "控制器是CU，运算器是ALU。"
  },
  {
    id: "ncre-base-0136",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机内部采用的数制是________。",
    options: ["十进制","二进制","八进制","十六进制"],
    answer: "二进制",
    analysis: "计算机内部数据传输和数据处理都是使用二进制。"
  },
  {
    id: "ncre-base-0137",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机能直接识别、执行的语言是________。",
    options: ["汇编语言","机器语言","高级程序语言","C＋＋语言"],
    answer: "机器语言",
    analysis: "机器语言是计算机唯一能直接执行的语言。"
  },
  {
    id: "ncre-base-0138",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机软件包括________。",
    options: ["程序、数据和相关文档","操作系统和办公软件","数据库管理系统和编译系统","系统软件和应用软件"],
    answer: "系统软件和应用软件",
    analysis: "计算机软件包括系统软件和应用软件。"
  },
  {
    id: "ncre-base-0139",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机软件分系统软件和应用软件两大类，系统软件的核心是________。",
    options: ["数据库管理系统","操作系统","程序语言系统","财务管理系统"],
    answer: "操作系统",
    analysis: "系统软件主要包括操作系统、语言处理系统、系统性能检测和实用工具软件等，其中最主要的是操作系统。"
  },
  {
    id: "ncre-base-0140",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机软件系统包括　　　。",
    options: ["系统软件和应用软件","程序及其相关数据","数据库及其管理软件","编译系统和应用软件"],
    answer: "系统软件和应用软件",
    analysis: "计算机软件系统分为系统软件和应用软件两种,系统软件又分为操作系统、语言处理程序和服务程序。"
  },
  {
    id: "ncre-base-0141",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机网络按地理范围可分为　　　。",
    options: ["广域网、城域网和局域网","因特网、城域网和局域网","广域网、因特网和局域网","因特网、广域网和对等网"],
    answer: "广域网、城域网和局域网",
    analysis: "计算机网络有两种常用的分类方法:①按传输技术进行分类可分为广播式网络和点到点式网络。②按地理范围进行分类可分为局域网(LAN)、城域网(MAN)和广域网(WAN)。"
  },
  {
    id: "ncre-base-0142",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机网络的目标是实现________。",
    options: ["数据处理","文献检索","资源共享和信息传输","信息传输"],
    answer: "资源共享和信息传输",
    analysis: "计算机网络由通信子网和资源子网两部分组成。通信子网的功能：负责全网的数据通信；资源子网的功能：提供各种网络资源和网络服务，实现网络的资源共享。"
  },
  {
    id: "ncre-base-0143",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机网络分为局域网、城域网和广域网，下列属于局域网的是（　　）。",
    options: ["ChinaDDN网","Novell网","Chinanet网","Internet"],
    answer: "Novell网",
    analysis: "ChinaDDN网、Chinanet网、Internet为广域网"
  },
  {
    id: "ncre-base-0144",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机网络最突出的优点是________。",
    options: ["提高可靠性","提高计算机的存储容量","运算速度快","实现资源共享和快速通信"],
    answer: "实现资源共享和快速通信",
    analysis: "计算机网络由通信子网和资源子网两部分组成。通信子网的功能：负责全网的数据通信；资源子网的功能：提供各种网络资源和网络服务，实现网络的资源共享。"
  },
  {
    id: "ncre-base-0145",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机系统采用总线结构对存储器和外设进行协调。总线主要由　　　3部分组成。",
    options: ["数据总线、地址总线和控制总线","输入总线、输出总线和控制总线","外部总线、内部总线和中枢总线","通信总线、接收总线和发送总线"],
    answer: "数据总线、地址总线和控制总线",
    analysis: "计算机系统总线是由数据总线、地址总线和控制总线3部分组成。"
  },
  {
    id: "ncre-base-0146",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机系统软件中，最基本、最核心的软件是________。",
    options: ["操作系统","数据库系统","程序语言处理系统","系统维护工具"],
    answer: "操作系统",
    analysis: "系统软件主要包括操作系统、语言处理系统、系统性能检测、实用工具软件等，其中最主要的是操作系统。"
  },
  {
    id: "ncre-base-0147",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机系统软件中最核心、最重要的是________。",
    options: ["语言处理系统","数据库管理系统","操作系统","诊断程序"],
    answer: "操作系统",
    analysis: "系统软件主要包括操作系统、语言处理系统、系统性能检测、实用工具软件等，其中最主要的是操作系统。"
  },
  {
    id: "ncre-base-0148",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机系统由　　　组成。",
    options: ["主机和显示器","微处理器和软件","硬件系统和应用软件","硬件系统和软件系统"],
    answer: "硬件系统和软件系统",
    analysis: "计算机系统是由硬件系统和软件系统两部分组成的。"
  },
  {
    id: "ncre-base-0149",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机硬件能够直接识别和执行的语言是　　　。",
    options: ["C语言","汇编语言","机器语言","符号语言"],
    answer: "机器语言",
    analysis: "机器语言是计算机唯一可直接识别并执行的语言,不需要任何解释。"
  },
  {
    id: "ncre-base-0150",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机硬件系统主要包括：中央处理器(CPU)、存储器和________。",
    options: ["显示器和键盘","打印机和键盘","显示器和鼠标器","输入/输出设备"],
    answer: "输入/输出设备",
    analysis: "计算机硬件包括CPU、存储器、输入设备、输出设备。"
  },
  {
    id: "ncre-base-0151",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机运算部件一次能同时处理的二进制数据的位数称为　　　。",
    options: ["位","字节","字长","波特"],
    answer: "字长",
    analysis: "字长是指计算机一次能直接处理的二进制数据的位数,字长越长,计算机的整体性能越强。"
  },
  {
    id: "ncre-base-0152",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机之所以能按人们的意图自动进行工作，最直接的原因是因为采用了________。",
    options: ["二进制","高速电子元件","程序设计语言","存储程序控制"],
    answer: "存储程序控制",
    analysis: "电子计算机能够快速、自动、准确地按照人们地意图工作的基本思想最主要是存储程序和程序控制，这个思想是由冯·诺依曼在1946年提出的"
  },
  {
    id: "ncre-base-0153",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机指令由两部分组成，它们是________。",
    options: ["运算符和运算数","操作数和结果","操作码和操作数","数据和字符"],
    answer: "操作码和操作数",
    analysis: "计算机指令格式通常包含操作码和操作数两部分。"
  },
  {
    id: "ncre-base-0154",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机主要技术指标通常是指________。",
    options: ["所配备的系统软件的版本","CPU的时钟频率、运算速度、字长和存储容量","显示器的分辨率、打印机的配置","硬盘容量的大小"],
    answer: "CPU的时钟频率、运算速度、字长和存储容量",
    analysis: "微型计算机CPU的主要技术指标包括字长、时钟主频、运算速度、存储容量、存取周期等。"
  },
  {
    id: "ncre-base-0155",
    topicId: "computer-basics",
    type: "single",
    stem: "计算机最主要的工作特点是　　　。",
    options: ["有记忆能力","高精度与高速度","可靠性与可用性","存储程序与自动控制"],
    answer: "存储程序与自动控制",
    analysis: "计算机的主要工作特点是将需要进行的各种操作以程序方式存储,并在它的指挥、控制下自动执行其规定的各种操作。"
  },
  {
    id: "ncre-base-0156",
    topicId: "computer-basics",
    type: "single",
    stem: "假设ISP提供的邮件服务器为bj163.com，用户名为XUEJY的正确电子邮件地址是________。",
    options: ["XUEJY @ bj163.com","XUEJYbj163.com","XUEJY#bj163.com","XUEJY@bj163.com"],
    answer: "XUEJY@bj163.com",
    analysis: "电子邮件地址由以下几个部分组成：用户名@域名．后缀，地址中间不允许有空格或逗号。"
  },
  {
    id: "ncre-base-0157",
    topicId: "computer-basics",
    type: "single",
    stem: "假设某台式计算机的内存储器容量为128MB，硬盘容量为10GB。硬盘的容量是内存容量的（　　）。",
    options: ["40倍","60倍","80倍","100倍"],
    answer: "80倍",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0158",
    topicId: "computer-basics",
    type: "single",
    stem: "假设某台式计算机的内存储器容量为256MB，硬盘容量为20GB。硬盘的容量是内存容量的________。",
    options: ["40倍","60倍","80倍","100倍"],
    answer: "80倍",
    analysis: "1GB=1024MB=4*256MB，则20GB=80*256MB。"
  },
  {
    id: "ncre-base-0159",
    topicId: "computer-basics",
    type: "single",
    stem: "假设某台式计算机内存储器的容量为1KB，其最后一个字节的地址是（　　）。",
    options: ["1023H","1024H","0400H","03FFH"],
    answer: "03FFH",
    analysis: "1KB＝1024Bytes，内存地址为0～1023，用十六进制表示为0～03FFH。"
  },
  {
    id: "ncre-base-0160",
    topicId: "computer-basics",
    type: "single",
    stem: "假设邮件服务器的地址是email.bj163.com，则用户的正确的电子邮箱地址的格式是________。",
    options: ["用户名#email.bj163.com","用户名@email.bj163.com","用户名email.bj163.com","用户名$email.bj163.com"],
    answer: "用户名@email.bj163.com",
    analysis: "电子邮件地址由以下几个部分组成：用户名@域名.后缀。"
  },
  {
    id: "ncre-base-0161",
    topicId: "computer-basics",
    type: "single",
    stem: "将高级语言编写的程序翻译成机器语言程序，采用的两种翻译方法是　　　。",
    options: ["编译和解释","编译和汇编","编译和连接","解释和汇编"],
    answer: "编译和解释",
    analysis: "计算机不能直接识别并执行高级语言编写的源程序,必须借助另外一个翻译程序对它进行翻译,把它变成目标程序后,机器才能执行,在翻译过程中通常采用两种方式:解释和编译"
  },
  {
    id: "ncre-base-0162",
    topicId: "computer-basics",
    type: "single",
    stem: "将十进制257转换成十六进制数是　　　。",
    options: ["11","101","F1","FF"],
    answer: "101",
    analysis: "十进制数转换成十六进制数时,先将十进制数转换成二进制数,然后再由二进制数转换成十六进制数。十进制257转换成二进制数100000001,二进制数为100000001转换成十六进制数为101。"
  },
  {
    id: "ncre-base-0163",
    topicId: "computer-basics",
    type: "single",
    stem: "控制器(CU)的功能是________。",
    options: ["指挥计算机各部件自动、协调一致地工作","对数据进行算术运算或逻辑运算","控制对指令的读取和译码","控制数据的输入和输出"],
    answer: "指挥计算机各部件自动、协调一致地工作",
    analysis: "控制器的主要功能是指挥全机各个部件自动、协调的工作。"
  },
  {
    id: "ncre-base-0164",
    topicId: "computer-basics",
    type: "single",
    stem: "目前，PC机中所采用的主要功能部件(如CPU)是________。",
    options: ["小规模集成电路","大规模集成电路","晶体管","光器件"],
    answer: "大规模集成电路",
    analysis: "计算机采用的电子器件为：第一代是电子管，第二代是晶体管，第三代是中小规模集成电路，第四代是大规模、超大规模集成电路。目前PC机属于第四代。"
  },
  {
    id: "ncre-base-0165",
    topicId: "computer-basics",
    type: "single",
    stem: "目前，度量中央处理器CPU时钟频率的单位是________。",
    options: ["MIPS","GHz","GB","Mbps"],
    answer: "GHz",
    analysis: "MIPS是运算速度，GB是存储容量，Mbps是传输速率。"
  },
  {
    id: "ncre-base-0166",
    topicId: "computer-basics",
    type: "single",
    stem: "目前，在市场上销售的微型计算机中，标准配置的输入设备是________。",
    options: ["键盘＋CD－ROM驱动器","鼠标器＋键盘","显示器＋键盘","键盘＋扫描仪"],
    answer: "鼠标器＋键盘",
    analysis: "目前最常用的输入设备是鼠标和键盘。"
  },
  {
    id: "ncre-base-0167",
    topicId: "computer-basics",
    type: "single",
    stem: "目前市售的USB FLASH DISK(俗称优盘)是一种________。",
    options: ["输出设备","输入设备","存储设备","显示设备"],
    answer: "存储设备",
    analysis: "U盘，全称\"USB闪存盘\"，英文名\"USB flash disk\"。它是一个USB接口的无需物理驱动器的微型高容量移动存储产品，可以通过USB接口与电脑连接，实现即插即用。"
  },
  {
    id: "ncre-base-0168",
    topicId: "computer-basics",
    type: "single",
    stem: "能保存网页地址的文件夹是________。",
    options: ["收件箱","公文包","我的文档","收藏夹"],
    answer: "收藏夹",
    analysis: "收藏夹可以保存网页地址。"
  },
  {
    id: "ncre-base-0169",
    topicId: "computer-basics",
    type: "single",
    stem: "能直接与CPU交换信息的存储器是________。",
    options: ["硬盘存储器","CD－ROM","内存储器","软盘存储器"],
    answer: "内存储器",
    analysis: "CPU只能直接访问存储在内存中的数据。"
  },
  {
    id: "ncre-base-0170",
    topicId: "computer-basics",
    type: "single",
    stem: "区位码输入法的最大优点是________。",
    options: ["只用数码输入，方法简单、容易记忆","易记易用","一字一码，无重码","编码有规律，不易忘记"],
    answer: "一字一码，无重码",
    analysis: "区位码输入是利用国标码作为汉字编码，每个国标码对应一个汉字或一个符号，没有重码。"
  },
  {
    id: "ncre-base-0171",
    topicId: "computer-basics",
    type: "single",
    stem: "全拼或简拼汉字输入法的编码属于________。",
    options: ["音码","形声码","区位码","形码"],
    answer: "音码",
    analysis: "形码：根据字形结构进行编码(五笔)，音码：根据发音进行编码(全拼、双拼)，音形码：以拼音为主，辅以字形字义进行编码(自然码)。"
  },
  {
    id: "ncre-base-0172",
    topicId: "computer-basics",
    type: "single",
    stem: "如果删除一个非零无符号二进制偶整数后的2个0，则此数的值为原数________。",
    options: ["4倍","2倍","1/2","1/4"],
    answer: "1/4",
    analysis: "删除偶整数后的两个0等于前面所有位都除以4再相加，所以是1/4倍。"
  },
  {
    id: "ncre-base-0173",
    topicId: "computer-basics",
    type: "single",
    stem: "如果删除一个非零无符号二进制偶整数后的一个0，则此数的值为原数的________。",
    options: ["4倍","2倍","1/2","1/4"],
    answer: "1/2",
    analysis: "删除偶整数后的1个0等于前面所有位都除以2再相加，所以是1/2倍。"
  },
  {
    id: "ncre-base-0174",
    topicId: "computer-basics",
    type: "single",
    stem: "如果在一个非零无符号二进制整数后添加一个0，则此数的值为原数的________。",
    options: ["1/4","1/2","2倍","4倍"],
    answer: "2倍",
    analysis: "最后位加0等于前面所有位都乘以2再相加，所以是2倍。"
  },
  {
    id: "ncre-base-0175",
    topicId: "computer-basics",
    type: "single",
    stem: "如果在一个非零无符号二进制整数之后添加2个0，则此数的值为原数的________。",
    options: ["4倍","2倍","1/2","1/4"],
    answer: "4倍",
    analysis: "最后位加0等于前面所有位都乘以4再相加，所以是4倍。"
  },
  {
    id: "ncre-base-0176",
    topicId: "computer-basics",
    type: "single",
    stem: "如果在一个非零无符号二进制整数之后添加一个0，则此数的值为原数的________。",
    options: ["4倍","2倍","1/2","1/4"],
    answer: "2倍",
    analysis: "最后位加0等于前面所有位都乘以2再相加，所以是2倍。"
  },
  {
    id: "ncre-base-0177",
    topicId: "computer-basics",
    type: "single",
    stem: "若要将计算机与局域网连接，则至少需要具有的硬件是________。",
    options: ["集线器","网关","网卡","路由器"],
    answer: "网卡",
    analysis: "用于局域网的基本网络连接设备是网络适配器(网卡)。"
  },
  {
    id: "ncre-base-0178",
    topicId: "computer-basics",
    type: "single",
    stem: "若已知一汉字的国标码是5E38H，则其内码是（　　）。",
    options: ["DEB8H","DE38H","5EB8H","7E58H"],
    answer: "DEB8H",
    analysis: "汉字的内码＝汉字的国标码＋8080H，此题内码＝5E38H＋8080H＝DEB8H。"
  },
  {
    id: "ncre-base-0179",
    topicId: "computer-basics",
    type: "single",
    stem: "设任意一个十进制整数D，转换成对应的无符号二进制整数为B，那么就这两个数字的长度(即位数)而言，B与D相比________。",
    options: ["B的数字位数一定小于D的数字位数","B的数字位数一定大于D的数字位数","B的数字位数小于或等于D的数字位数","B的数字位数大于或等于D的数字位数"],
    answer: "B的数字位数大于或等于D的数字位数",
    analysis: "在数值转换中，基数越大，位数越少。当为0、1时，位数可以相等。"
  },
  {
    id: "ncre-base-0180",
    topicId: "computer-basics",
    type: "single",
    stem: "设任意一个十进制整数为D，转换成二进制数为B。根据数制的概念，下列叙述中正确的是________。",
    options: ["数字B的位数＜数字D的位数","数字B的位数≤数字D的位数","数字B的位数≥数字D的位数","数字B的位数＞数字D的位数"],
    answer: "数字B的位数≥数字D的位数",
    analysis: "在数值转换中，基数越大，位数越少。当为0、1时，位数可以相等。"
  },
  {
    id: "ncre-base-0181",
    topicId: "computer-basics",
    type: "single",
    stem: "设一个十进制整数为D>1，转换成十六进制数为H。根据数制的概念，下列叙述中正确的是________。",
    options: ["数字H的位数≥数字D的位数","数字H的位数≤数字D的位数","数字H的位数＜数字D的位数","数字H的位数＞数字D的位数"],
    answer: "数字H的位数＜数字D的位数",
    analysis: "在数值转换中，权越大，位数越少。"
  },
  {
    id: "ncre-base-0182",
    topicId: "computer-basics",
    type: "single",
    stem: "设已知一汉字的国标码是5E48H，则其内码应该是________。",
    options: ["DE48H","DEC8H","5EC8H","7E68H"],
    answer: "DEC8H",
    analysis: "汉字的内码＝汉字的国标码＋8080H，此题内码＝5E48H＋8080H＝DEC8H。"
  },
  {
    id: "ncre-base-0183",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数100转换成二进制数是　　　。",
    options: ["01100100","01100101","01100110","01101000"],
    answer: "01100100",
    analysis: "十进制数转换成二进制数,采用\"除二取余\"法,直到商为0,每次得到的余数,从最后一位余数读起就是二进制数表示的数,十进制数100转换成二进制数为01100100。"
  },
  {
    id: "ncre-base-0184",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数101转换成二进制数是________。",
    options: ["01101011","01100011","01100101","01101010"],
    answer: "01100101",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0185",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数111转换成无符号二进制整数是________。",
    options: ["01100101","01101001","01100111","01101111"],
    answer: "01100101",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0186",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数121转换成无符号二进制整数是________。",
    options: ["1111001","111001","1001111","100111"],
    answer: "1111001",
    analysis: "十进制转换为二进：121＝128－7＝10000000－111＝1111001。"
  },
  {
    id: "ncre-base-0187",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数32转换成无符号二进制整数是________。",
    options: ["100000","100100","100010","101000"],
    answer: "100000",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0188",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数39转换成无符号二进制整数是________。",
    options: ["100011","100101","100111","100011"],
    answer: "100111",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0189",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数50转换成无符号二进制整数是________。",
    options: ["0110110","0110100","0110010","0110101"],
    answer: "0110010",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0190",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数54转换成无符号二进制整数是________。",
    options: ["0110110","0110101","0111110","0111100"],
    answer: "0110110",
    analysis: "54＝64－10＝1000000－1010＝110110。"
  },
  {
    id: "ncre-base-0191",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数55转换成无符号二进制数等于________。",
    options: ["111111","110111","111001","111011"],
    answer: "110111",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0192",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数57转换成无符号二进制整数是________。",
    options: ["0111001","0110101","0110011","0110111"],
    answer: "0111001",
    analysis: "57＝64－7＝1000000－111＝111001，所以57转换为二进制是111001。"
  },
  {
    id: "ncre-base-0193",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数59转换成无符号二进制整数是________。",
    options: ["0111101","0111011","0111101","0111111"],
    answer: "0111011",
    analysis: "59＝64－5＝1000000－101＝111011。"
  },
  {
    id: "ncre-base-0194",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数60转换成二进制数是________。",
    options: ["0111010","0111110","0111100","0111101"],
    answer: "0111100",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0195",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数60转换成无符号二进制整数是________。",
    options: ["0111100","0111010","0111000","0110110"],
    answer: "0111100",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0196",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数75等于二进制数________。",
    options: ["1001011","1010101","1001101","1000111"],
    answer: "1001011",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0197",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数89转换成二进制数是________。",
    options: ["1010101","1011001","1011011","1010011"],
    answer: "1011001",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0198",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制数90转换成无符号二进制数是________。",
    options: ["1011010","1101010","1011110","1011100"],
    answer: "1011010",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0199",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制整数100转换成无符号二进制整数是________。",
    options: ["01100110","01101000","01100010","01100100"],
    answer: "01100100",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0200",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制整数101转换成无符号二进制整数是________。",
    options: ["00110101","01101011","01100101","01011011"],
    answer: "01100101",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0201",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制整数64转换为二进制整数等于________。",
    options: ["1100000","1000000","1000100","1000010"],
    answer: "1000000",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0202",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制整数75转换成无符号二进制整数是________。",
    options: ["01000111","01001011","01011101","01010001"],
    answer: "01001011",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0203",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制整数86转换成无符号二进制整数是________。",
    options: ["01011110","01010100","010100101","01010110"],
    answer: "01010110",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0204",
    topicId: "computer-basics",
    type: "single",
    stem: "十进制整数95转换成无符号二进制整数是________。",
    options: ["01011111","01100001","01011011","01100111"],
    answer: "01011111",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0205",
    topicId: "computer-basics",
    type: "single",
    stem: "世界上第一台电子数字计算机ENIAC是1946年研制成功的，其诞生的国家是________。",
    options: ["美国","英国","法国","瑞士"],
    answer: "美国",
    analysis: "1946年世界上第一台名为ENIAC的电子计算机诞生于美国宾夕法尼亚大学。"
  },
  {
    id: "ncre-base-0206",
    topicId: "computer-basics",
    type: "single",
    stem: "世界上第一台电子数字计算机ENIAC是在美国研制成功的，其诞生的年份是________。",
    options: ["1943","1946","1949","1950"],
    answer: "1946",
    analysis: "1946年世界上第一台名为ENIAC的电子计算机诞生于美国宾夕法尼亚大学。"
  },
  {
    id: "ncre-base-0207",
    topicId: "computer-basics",
    type: "single",
    stem: "世界上第一台计算机是1946年美国研制成功的，该计算机的英文缩写名为________。",
    options: ["MARK－II","ENIAC","EDSAC","EDVAC"],
    answer: "ENIAC",
    analysis: "1946年世界上第一台名为ENIAC的电子计算机诞生于美国宾夕法尼亚大学。"
  },
  {
    id: "ncre-base-0208",
    topicId: "computer-basics",
    type: "single",
    stem: "鼠标器是当前计算机中常用的________。",
    options: ["控制设备","输入设备","输出设备","浏览设备"],
    answer: "输入设备",
    analysis: "鼠标器是在多窗口环境下必不可少的输入设备。"
  },
  {
    id: "ncre-base-0209",
    topicId: "computer-basics",
    type: "single",
    stem: "数据在计算机内部传送、处理和存储时，采用的数制是________。",
    options: ["十进制","二进制","八进制","十六进制"],
    answer: "二进制",
    analysis: "计算机内部采用二进制进行数据交换和处理。"
  },
  {
    id: "ncre-base-0210",
    topicId: "computer-basics",
    type: "single",
    stem: "随机存储器中，有一种存储器需要周期性的补充电荷以保证所存储信息的正确，它称为________。",
    options: ["静态RAM[SRAM]","动态RAM[DRAM]","RAM","Cache"],
    answer: "动态RAM[DRAM]",
    analysis: "DRAM存在漏电现象，需要每隔一段固定时间就对存储信息刷新一下。"
  },
  {
    id: "ncre-base-0211",
    topicId: "computer-basics",
    type: "single",
    stem: "随机存取存储器(RAM)的最大特点是________。",
    options: ["存储量极大，属于海量存储器。","存储在其中的信息可以永久保存。","一旦断电，存储在其上的信息将全部消失，且无法恢复。","计算机中，只是用来存储数据的。"],
    answer: "一旦断电，存储在其上的信息将全部消失，且无法恢复。",
    analysis: "RAM有两个特点，一个是可读/写性，一个是易失性，即断开电源时，RAM中的内容立即消失。"
  },
  {
    id: "ncre-base-0212",
    topicId: "computer-basics",
    type: "single",
    stem: "随着Internet的发展，越来越多的计算机感染病毒的可能途径之一是________。",
    options: ["从键盘上输入数据","通过电源线","所使用的光盘表面不清洁","通过Internet的E－mail，附着在电子邮件的信息中"],
    answer: "通过Internet的E－mail，附着在电子邮件的信息中",
    analysis: "计算机病毒主要通过移动存储介质(如优盘、移动硬盘)和计算机网络两大途径进行传播。"
  },
  {
    id: "ncre-base-0213",
    topicId: "computer-basics",
    type: "single",
    stem: "所有与Internet相连接的计算机必须遵守的一个共同协议是　　　。",
    options: ["http","IEEE 802.11","TCP/IP","IPX"],
    answer: "TCP/IP",
    analysis: "TCP/IP协议叫做传输控制/网际协议,又叫网络通信协议,这个协议是Internet国际互联网的基础。TCP/IP是网络中使用的基本的通信协议"
  },
  {
    id: "ncre-base-0214",
    topicId: "computer-basics",
    type: "single",
    stem: "调制解调器(Modem)的功能是________。",
    options: ["将计算机的数字信号转换成模拟信号","将模拟信号转换成计算机的数字信号","将数字信号与模拟信号互相转换","为了上网与接电话两不误"],
    answer: "将数字信号与模拟信号互相转换",
    analysis: "调制解调器(即Modem)，是计算机与电话线之间进行信号转换的装置，由调制器和解调器两部分组成，调制器是把计算机的数字信号调制成可在电话线上传输的声音信号的装置，在接收端，解调器再把声音信号转换成计算机能接收的数字信号。"
  },
  {
    id: "ncre-base-0215",
    topicId: "computer-basics",
    type: "single",
    stem: "调制解调器(Modem)的主要技术指标是数据传输速率，它的度量单位是________。",
    options: ["MIPS","Mbps","dpi","KB"],
    answer: "Mbps",
    analysis: "MIPS是运算速度，KB是存储容量，Mbps是传输速率。"
  },
  {
    id: "ncre-base-0216",
    topicId: "computer-basics",
    type: "single",
    stem: "通常打印质量最好的打印机是________。",
    options: ["针式打印机","点阵打印机","喷墨打印机","激光打印机"],
    answer: "激光打印机",
    analysis: "打印机质量从高到低依次为激光打印机、喷墨打印机、点阵打印机、针式打印机。"
  },
  {
    id: "ncre-base-0217",
    topicId: "computer-basics",
    type: "single",
    stem: "通常所说的I/O设备是指　　　。",
    options: ["输入输出设备","通信设备","网络设备","控制设备"],
    answer: "输入输出设备",
    analysis: "I/O设备就是指输入输出设备。"
  },
  {
    id: "ncre-base-0218",
    topicId: "computer-basics",
    type: "single",
    stem: "通常所说的微型机主机是指________。",
    options: ["CPU和内存","CPU和硬盘","CPU、内存和硬盘","CPU、内存与CD－ROM"],
    answer: "CPU和内存",
    analysis: "微型机的主机一般包括CPU、内存、I/O接口电路、系统总线。"
  },
  {
    id: "ncre-base-0219",
    topicId: "computer-basics",
    type: "single",
    stem: "通常网络用户使用的电子邮箱建在________。",
    options: ["用户的计算机上","发件人的计算机上","ISP的邮件服务器上","收件人的计算机上"],
    answer: "ISP的邮件服务器上",
    analysis: "电子邮箱建在ISP的邮件服务器上。"
  },
  {
    id: "ncre-base-0220",
    topicId: "computer-basics",
    type: "single",
    stem: "通常用MIPS为单位来衡量计算机的性能，它指的是计算机的　　　。",
    options: ["传输速率","存储容量","字长","运算速度"],
    answer: "运算速度",
    analysis: "MIPS表示计算机每秒处理的百万级的机器语言指令数,是表示计算机运算速度的单位。"
  },
  {
    id: "ncre-base-0221",
    topicId: "computer-basics",
    type: "single",
    stem: "完整的计算机软件指的是________。",
    options: ["程序、数据与相应的文档","系统软件与应用软件","操作系统与应用软件","操作系统和办公软件"],
    answer: "系统软件与应用软件",
    analysis: "系统软件和应用软件组成了计算机软件系统的两个部分"
  },
  {
    id: "ncre-base-0222",
    topicId: "computer-basics",
    type: "single",
    stem: "王码五笔字型输入法属于________。",
    options: ["音码输入法","形码输入法","音形结合的输入法","联想输入法"],
    answer: "形码输入法",
    analysis: "形码：根据字形结构进行编码(五笔)，音码：根据发音进行编码(全拼、双拼)，音形码：以拼音为主，辅以字形字义进行编码(自然码)。"
  },
  {
    id: "ncre-base-0223",
    topicId: "computer-basics",
    type: "single",
    stem: "微机的销售广告中\"P42.4G/256M/80G\"中的2.4G是表示________。",
    options: ["CPU的运算速度为2.4GIPS","CPU为Pentium4的2.4代","CPU的时钟主频为2.4GHz","CPU与内存间的数据交换速率是2.4Gbps"],
    answer: "CPU的时钟主频为2.4GHz",
    analysis: "P代表奔腾系列，4代表此系列的第4代产品，2.4G是CPU的频率，单位是Hz。"
  },
  {
    id: "ncre-base-0224",
    topicId: "computer-basics",
    type: "single",
    stem: "微机的硬件系统中，最核心的部件是________。",
    options: ["内存储器","输入输出设备","CPU","硬盘"],
    answer: "CPU",
    analysis: "CPU是计算机的核心部件。"
  },
  {
    id: "ncre-base-0225",
    topicId: "computer-basics",
    type: "single",
    stem: "微机的主机指的是________。",
    options: ["CPU、内存和硬盘","CPU、内存、显示器和键盘","CPU和内存储器","CPU、内存、硬盘、显示器和键盘"],
    answer: "CPU和内存储器",
    analysis: "微型机的主机一般包括CPU、内存、I/O接口电路、系统总线。"
  },
  {
    id: "ncre-base-0226",
    topicId: "computer-basics",
    type: "single",
    stem: "微机上广泛使用的Windows XP是________。",
    options: ["多用户多任务操作系统","单用户多任务操作系统","实时操作系统","多用户分时操作系统"],
    answer: "单用户多任务操作系统",
    analysis: "Windows 7属于单用户多任务操作系统。"
  },
  {
    id: "ncre-base-0227",
    topicId: "computer-basics",
    type: "single",
    stem: "微机上广泛使用的Windows是________。",
    options: ["多任务操作系统","单任务操作系统","实时操作系统","批处理操作系统"],
    answer: "多任务操作系统",
    analysis: "Windows属于单用户多任务操作系统。"
  },
  {
    id: "ncre-base-0228",
    topicId: "computer-basics",
    type: "single",
    stem: "微机硬件系统中最核心的部件是________。",
    options: ["内存储器","输入输出设备","CPU","硬盘"],
    answer: "CPU",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0229",
    topicId: "computer-basics",
    type: "single",
    stem: "微机中，西文字符所采用的编码是________。",
    options: ["EBCDIC码","ASCII码","国标码","BCD码"],
    answer: "ASCII码",
    analysis: "西文字符采用7位ASCII码编码。"
  },
  {
    id: "ncre-base-0230",
    topicId: "computer-basics",
    type: "single",
    stem: "微机中访问速度最快的存储器是　　　。",
    options: ["CD－ROM","硬盘","U盘","内存"],
    answer: "内存",
    analysis: "】中央处理器(CPU)直接与内存打交道,即CPU可以直接访问内存。而外存储器只能先将数据指令先调入内存然后再由内存调入CPU,CPU不能直接访问外存储器。CD-ROM、硬盘和U盘都属于外存储器,因此,内存储器比外存储器的访问周期更短。"
  },
  {
    id: "ncre-base-0231",
    topicId: "computer-basics",
    type: "single",
    stem: "微型计算机，控制器的基本功能是______。",
    options: ["进行算术运算和逻辑运算","存储各种控制信息","保持各种控制状态","控制机器各个部件协调一致地工作"],
    answer: "控制机器各个部件协调一致地工作",
    analysis: "选项A为运算器的功能；选项B为存储器的功能。控制器中含有状态寄存器，主要用于保持程序运行状态；选项C是控制器的功能，但不是控制器的基本功能，控制器的基本功能为控制机器各个部件协调一致地工作，故选项D为正确答案。"
  },
  {
    id: "ncre-base-0232",
    topicId: "computer-basics",
    type: "single",
    stem: "微型计算机存储系统中，PROM是______。",
    options: ["可读写存储器","动态随机存储器","只读存储器","可编程只读存储器"],
    answer: "可编程只读存储器",
    analysis: "RAM为可读可写存储器，DROM为动态随机存储器，ROM为只读存储器。"
  },
  {
    id: "ncre-base-0233",
    topicId: "computer-basics",
    type: "single",
    stem: "微型计算机的硬件系统中最核心的部件是________。",
    options: ["内存储器","输入输出设备","CPU","硬盘"],
    answer: "CPU",
    analysis: "CPU是计算机的核心部件。"
  },
  {
    id: "ncre-base-0234",
    topicId: "computer-basics",
    type: "single",
    stem: "微型计算机的主机包括______。",
    options: ["运算器和控制器","CPU和内存储器","CPU和UPS","UPS和内存储器"],
    answer: "CPU和内存储器",
    analysis: "微型计算机的主机包括CPU和内存储器。UPS为不间断电源，它可以保障计算机系统在停电之后继续工作一段时间，以使用户能够紧急存盘，避免数据丢失，属于外部设备。运算器和控制器是CPU的组成部分。"
  },
  {
    id: "ncre-base-0235",
    topicId: "computer-basics",
    type: "single",
    stem: "微型计算机普遍采用的字符编码是　　　。",
    options: ["原码","补码","ASCII码","汉字编码"],
    answer: "ASCII码",
    analysis: "计算机中普遍采用的字符编码是ASCII码。"
  },
  {
    id: "ncre-base-0236",
    topicId: "computer-basics",
    type: "single",
    stem: "微型计算机硬件系统中最核心的部位是______。",
    options: ["主板","CPU","内存储器","I/O设备"],
    answer: "CPU",
    analysis: "微型计算机硬件系统由主板、中央处理器(CPU)、内存储器和输入输出(I/O)设备组成，其中，中央处理器(CPU)是硬件系统中最核心的部件。"
  },
  {
    id: "ncre-base-0237",
    topicId: "computer-basics",
    type: "single",
    stem: "为了提高软件开发效率，开发软件时应尽量采用________。",
    options: ["汇编语言","机器语言","指令系统","高级语言"],
    answer: "高级语言",
    analysis: "汇编语言的开发效率很低，但运行效率高；高级语言的开发效率高，但运行效率较低。"
  },
  {
    id: "ncre-base-0238",
    topicId: "computer-basics",
    type: "single",
    stem: "为了用ISDN技术实现电话拨号方式接入Internet，除了要具备一条直拨外线和一台性能合适的计算机外，另一个关键硬设备是________。",
    options: ["网卡","集线器","服务器","内置或外置调制解调器(Modem)"],
    answer: "内置或外置调制解调器(Modem)",
    analysis: "计算机以拨号接入Internet网时是用的电话线，但它只能传输模拟信号，如果要传输数字信号必须用调制解调器(Modem)把它转化为模拟信号。"
  },
  {
    id: "ncre-base-0239",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数00110011转换成十进制整数是________。",
    options: ["48","49","51","53"],
    answer: "51",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0240",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数01001001转换成十进制整数是________。",
    options: ["69","71","73","75"],
    answer: "73",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0241",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数01011010转换成十进制整数是________。",
    options: ["80","82","90","92"],
    answer: "90",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0242",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数01110101转换成十进制整数是________。",
    options: ["113","115","116","117"],
    answer: "117",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0243",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数10000001转换成十进制数是________。",
    options: ["119","121","127","129"],
    answer: "129",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0244",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数1000010转换成十进制数是________。",
    options: ["62","64","66","68"],
    answer: "66",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0245",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数1000110转换成十进制数是________。",
    options: ["68","70","72","74"],
    answer: "70",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0246",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数1001001转换成十进制数是________。",
    options: ["72","71","75","73"],
    answer: "73",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0247",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数1001111转换成十进制数是________。",
    options: ["79","89","91","93"],
    answer: "79",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0248",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数101001转换成十进制整数等于________。",
    options: ["41","43","45","39"],
    answer: "41",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0249",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数1011000转换成十进制数是________。",
    options: ["76","78","88","90"],
    answer: "88",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0250",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数1011010转换成十进制数是________。",
    options: ["88","90","92","93"],
    answer: "90",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0251",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数110111转换成十进制数是________。",
    options: ["49","51","53","55"],
    answer: "55",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0252",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数1111001转换成十进制数是________。",
    options: ["117","119","120","121"],
    answer: "121",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0253",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数111110转换成十进制数是________。",
    options: ["62","60","58","56"],
    answer: "62",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0254",
    topicId: "computer-basics",
    type: "single",
    stem: "无符号二进制整数111111转换成十进制数是________。",
    options: ["71","65","63","62"],
    answer: "63",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0255",
    topicId: "computer-basics",
    type: "single",
    stem: "五笔字型汉字输入法的编码属于________。",
    options: ["音码","形声码","区位码","形码"],
    answer: "形码",
    analysis: "形码：根据字形结构进行编码(五笔)，音码：根据发音进行编码(全拼、双拼)，音形码：以拼音为主，辅以字形字义进行编码(自然码)。"
  },
  {
    id: "ncre-base-0256",
    topicId: "computer-basics",
    type: "single",
    stem: "下列4个4位十进制数中，属于正确的汉字区位码的是________。",
    options: ["5601","9596","9678","8799"],
    answer: "5601",
    analysis: "区位码：94×94阵列，区号范围：1～94，位号范围：1～94。"
  },
  {
    id: "ncre-base-0257",
    topicId: "computer-basics",
    type: "single",
    stem: "下列URL的表示方法中，正确的是　　　。",
    options: ["http：//www.microsoft.com/index.html","http：\\www.microsoft.com/index.html","http：//www.microsoft.com\\index.html","http：www.microsoft.com/index.htmp"],
    answer: "http：//www.microsoft.com/index.html",
    analysis: "典型的统一资源定位器(URL)的基本格式:协议类型://IP地址或域名/路径/文件名。"
  },
  {
    id: "ncre-base-0258",
    topicId: "computer-basics",
    type: "single",
    stem: "下列编码中，属于正确的汉字内码的是________。",
    options: ["5EF6H","FB67H","A3B3H","C97DH"],
    answer: "A3B3H",
    analysis: "汉字内码两个字节的最高位必须为1。"
  },
  {
    id: "ncre-base-0259",
    topicId: "computer-basics",
    type: "single",
    stem: "下列编码中，正确的汉字机内码是________。",
    options: ["6EF6H","FB6FH","A3A3H","C97CH"],
    answer: "A3A3H",
    analysis: "国标码是汉字信息交换的标准编码，但因其前后字节的最高位为0，与ASCII码发生冲突，于是，汉字的机内码采用变形国标码，其变换方法为：将国标码的每个字节都加上128，即将两个字节的最高位由0改1，其余7位不变，因此机内码前后字节最高位都为1。"
  },
  {
    id: "ncre-base-0260",
    topicId: "computer-basics",
    type: "single",
    stem: "下列不是存储器容量度量单位的是________。",
    options: ["KB","MB","GB","GHz"],
    answer: "GHz",
    analysis: "GHz是主频单位。"
  },
  {
    id: "ncre-base-0261",
    topicId: "computer-basics",
    type: "single",
    stem: "下列不属于第二代计算机特点的一项是　　　。",
    options: ["采用电子管作为逻辑元件","运算速度为每秒几万～几十万条指令","内存主要采用磁芯","外存储器主要采用磁盘和磁带"],
    answer: "采用电子管作为逻辑元件",
    analysis: "第二代计算机采用晶体管作为主要逻辑元件。"
  },
  {
    id: "ncre-base-0262",
    topicId: "computer-basics",
    type: "single",
    stem: "下列不属于计算机特点的是________。",
    options: ["存储程序控制，工作自动化","具有逻辑推理和判断能力","处理速度快、存储量大","不可靠、故障率高"],
    answer: "不可靠、故障率高",
    analysis: "计算机可靠且故障率低。"
  },
  {
    id: "ncre-base-0263",
    topicId: "computer-basics",
    type: "single",
    stem: "下列不属于网络拓扑结构形式的是　　　。",
    options: ["星型","环型","总线型","分支型"],
    answer: "分支型",
    analysis: "计算机网络的拓扑结构是指网上计算机或设备与传输媒介形成的结点与线的物理构成模式。计算机网络的拓扑结构主要有:总线型结构、星型结构、环型结构、树型结构和混合型结构。"
  },
  {
    id: "ncre-base-0264",
    topicId: "computer-basics",
    type: "single",
    stem: "下列不属于微型计算机的技术指标的一项是　　　。",
    options: ["字节","时钟主频","运算速度","存取周期"],
    answer: "字节",
    analysis: "计算机主要技术指标有主频、字长、运算速度、存储容量和存取周期。字节是衡量计算机存储器存储容量的基本单位。"
  },
  {
    id: "ncre-base-0265",
    topicId: "computer-basics",
    type: "single",
    stem: "下列存储器中，存取周期最短的是________。",
    options: ["硬盘存储器","CD－ROM","DRAM","SRAM"],
    answer: "SRAM",
    analysis: "内存的存储速度比外部存储器快，SRAM比DRAM存储速度快。"
  },
  {
    id: "ncre-base-0266",
    topicId: "computer-basics",
    type: "single",
    stem: "下列的英文缩写和中文名字的对照中，错误的是________。",
    options: ["CAD--计算机辅助设计","CAM--计算机辅助制造","CIMS--计算机集成管理系统","CAI--计算机辅助教育"],
    answer: "CIMS--计算机集成管理系统",
    analysis: "选项C指的是计算机集成制造系统。"
  },
  {
    id: "ncre-base-0267",
    topicId: "computer-basics",
    type: "single",
    stem: "下列的英文缩写和中文名字的对照中，错误的是________。",
    options: ["CPU--控制程序部件","ALU--算术逻辑部件","CU--控制部件","OS--操作系统"],
    answer: "CPU--控制程序部件",
    analysis: "CPU为中央处理器。"
  },
  {
    id: "ncre-base-0268",
    topicId: "computer-basics",
    type: "single",
    stem: "下列的英文缩写和中文名字的对照中，错误的是________。",
    options: ["WAN--广域网","ISP--因特网服务提供商","USB--不间断电源","RAM--随机存取存储器"],
    answer: "USB--不间断电源",
    analysis: "USB为通用串行总线。"
  },
  {
    id: "ncre-base-0269",
    topicId: "computer-basics",
    type: "single",
    stem: "下列的英文缩写和中文名字的对照中，错误的是________。",
    options: ["URL--统一资源定位器","LAN--局域网","ISDN--综合业务数字网","ROM--随机存取存储器"],
    answer: "ROM--随机存取存储器",
    analysis: "ROM为只读存储器。"
  },
  {
    id: "ncre-base-0270",
    topicId: "computer-basics",
    type: "single",
    stem: "下列的英文缩写和中文名字的对照中，正确的是________。",
    options: ["CAD--计算机辅助设计","CAM--计算机辅助教育","CIMS--计算机集成管理系统","CAI--计算机辅助制造"],
    answer: "CAD--计算机辅助设计",
    analysis: "计算机辅助教育的缩写是CAI，计算机辅助制造的缩写是CAM，计算机集成制造的缩写是CIMS，计算机辅助设计的缩写是CAD。"
  },
  {
    id: "ncre-base-0271",
    topicId: "computer-basics",
    type: "single",
    stem: "下列的英文缩写和中文名字的对照中，正确的是________。",
    options: ["WAN--广域网","ISP--因特网服务程序","USB--不间断电源","RAM--只读存储器"],
    answer: "WAN--广域网",
    analysis: "ISP全称为Internet Service Provider，即因特网服务提供商，RAM为随机存取存储器，USB为通用串行总线。"
  },
  {
    id: "ncre-base-0272",
    topicId: "computer-basics",
    type: "single",
    stem: "下列的英文缩写和中文名字的对照中，正确的一个是________。",
    options: ["URL--用户报表清单","CAD--计算机辅助设计","USB--不间断电源","RAM--只读存储器"],
    answer: "CAD--计算机辅助设计",
    analysis: "URL为统一资源定位器，RAM为随机存取存储器，USB为通用串行总线。"
  },
  {
    id: "ncre-base-0273",
    topicId: "computer-basics",
    type: "single",
    stem: "下列度量单位中，用来度量CPU时钟主频的是________。",
    options: ["MB/s","MIPS","GHz","MB"],
    answer: "GHz",
    analysis: "MIPS是运算速度，MB是存储容量，MB/s是传输速率，GHz是主频单位。"
  },
  {
    id: "ncre-base-0274",
    topicId: "computer-basics",
    type: "single",
    stem: "下列度量单位中，用来度量计算机内存空间大小的是________。",
    options: ["MB/s","MIPS","GHz","MB"],
    answer: "MB",
    analysis: "MIPS是运算速度，MB是存储容量，MB/s是传输速率，GHz是主频单位。"
  },
  {
    id: "ncre-base-0275",
    topicId: "computer-basics",
    type: "single",
    stem: "下列度量单位中，用来度量计算机外部设备传输率的是________。",
    options: ["MB/s","MIPS","GHz","MB"],
    answer: "MB/s",
    analysis: "MIPS是运算速度，MB是存储容量，MB/s是传输速率，GHz是主频单位。"
  },
  {
    id: "ncre-base-0276",
    topicId: "computer-basics",
    type: "single",
    stem: "下列度量单位中，用来度量计算机网络数据传输速率(比特率)的是________。",
    options: ["MB/s","MIPS","GHz","Mbps"],
    answer: "Mbps",
    analysis: "MIPS是运算速度，Mbps是传输比特速率，MB/s是传输字节速率，GHz是主频单位。"
  },
  {
    id: "ncre-base-0277",
    topicId: "computer-basics",
    type: "single",
    stem: "下列度量单位中，用来度量计算机运算速度的是________。",
    options: ["MB/s","MIPS","GHz","MB"],
    answer: "MIPS",
    analysis: "MIPS是运算速度的衡量指标，MB是存储容量的衡量指标，MB/s是传输速率，GHz是主频单位。"
  },
  {
    id: "ncre-base-0278",
    topicId: "computer-basics",
    type: "single",
    stem: "下列各存储器中，存取速度最快的是________。",
    options: ["CD－ROM","内存储器","软盘","硬盘"],
    answer: "内存储器",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0279",
    topicId: "computer-basics",
    type: "single",
    stem: "下列各存储器中，存取速度最快的一种是________。",
    options: ["Cache","动态RAM[DRAM]","CD－ROM","硬盘"],
    answer: "Cache",
    analysis: "内存储器的存储速度最高，其中Cache的存储速度高于DRAM。"
  },
  {
    id: "ncre-base-0280",
    topicId: "computer-basics",
    type: "single",
    stem: "下列各类计算机程序语言中，不属于高级程序设计语言的是________。",
    options: ["Visual Basic","Visual C＋＋","C语言","汇编语言"],
    answer: "汇编语言",
    analysis: "汇编语言属于低级语言。"
  },
  {
    id: "ncre-base-0281",
    topicId: "computer-basics",
    type: "single",
    stem: "下列各条中，对计算机操作系统的作用完整描述的是________。",
    options: ["它是用户与计算机的界面","它对用户存储的文件进行管理，方便用户","它执行用户键入的各类命令","它管理计算机系统的全部软、硬件资源，合理组织计算机的工作流程，以达到充分发挥计算机资源的效率，为用户提供使用计算机的友好界面"],
    answer: "它管理计算机系统的全部软、硬件资源，合理组织计算机的工作流程，以达到充分发挥计算机资源的效率，为用户提供使用计算机的友好界面",
    analysis: "操作系统是人与计算机之间通信的桥梁，为用户提供了一个清晰、简洁、易用的工作界面，用户通过操作系统提供的命令和交互功能实现各种访问计算机的操作。"
  },
  {
    id: "ncre-base-0282",
    topicId: "computer-basics",
    type: "single",
    stem: "下列各项中，非法的Internet的IP地址是（　　）。",
    options: ["202.96.12.14","202.196.72.140","112.256.23.8","201.124.38.79"],
    answer: "112.256.23.8",
    analysis: "IP地址是由4个字节组成的，习惯写法是将每个字节作为一段并以十进制数来表示，而且段间用\".\"分隔。每个段的十进制范围是0～255，选项C中的第二个字节超出了范围，故答案选C。"
  },
  {
    id: "ncre-base-0283",
    topicId: "computer-basics",
    type: "single",
    stem: "下列各项中，正确的电子邮箱地址是________。",
    options: ["L202@sina.com","TT202#yahoo.com","A112.256.23.8","K201yahoo.com.cn"],
    answer: "L202@sina.com",
    analysis: "电子邮件地址由以下几个部分组成：用户名@域名.后缀。"
  },
  {
    id: "ncre-base-0284",
    topicId: "computer-basics",
    type: "single",
    stem: "下列各指标中，数据通信系统的主要技术指标之一的是________。",
    options: ["误码率","重码率","分辨率","频率"],
    answer: "误码率",
    analysis: "数据通信系统的主要技术指标有带宽、比特率、波特率、误码率。"
  },
  {
    id: "ncre-base-0285",
    topicId: "computer-basics",
    type: "single",
    stem: "下列各组软件中，全部属于系统软件的一组是________。",
    options: ["程序语言处理程序、操作系统、数据库管理系统","文字处理程序、编辑程序、操作系统","财务处理软件、金融软件、网络系统","WPS Office 2003、Excel2000、Windows98"],
    answer: "程序语言处理程序、操作系统、数据库管理系统",
    analysis: "系统软件包括操作系统、语言处理系统、系统性能检测、实用工具软件。"
  },
  {
    id: "ncre-base-0286",
    topicId: "computer-basics",
    type: "single",
    stem: "下列各组软件中，全部属于应用软件的是________。",
    options: ["程序语言处理程序、操作系统、数据库管理系统","文字处理程序、编辑程序、UNIX操作系统","财务处理软件、金融软件、WPS Office 2003","Word 2000、Photoshop、Windows 98"],
    answer: "财务处理软件、金融软件、WPS Office 2003",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0287",
    topicId: "computer-basics",
    type: "single",
    stem: "下列各组软件中，全部属于应用软件的一组是________。",
    options: ["Windows 2000，WPS Office 2003，Word 2000","UNIX，Visual FoxPro，AutoCAD","MS－DOS，用友财务软件，学籍管理系统","Word 2000，Excel 2000，金山词霸"],
    answer: "Word 2000，Excel 2000，金山词霸",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0288",
    topicId: "computer-basics",
    type: "single",
    stem: "下列各组软件中，完全属于系统软件的一组是________。",
    options: ["UNIX，WPS Office 2003，MS－DOS","AutoCAD，Photoshop，PowerPoint 2000","Oracle，FORTRAN编译系统，系统诊断程序","物流管理程序，Sybase，Windows 2000"],
    answer: "Oracle，FORTRAN编译系统，系统诊断程序",
    analysis: "选项A的WPS Office 2003是应用软件，选项B都是应用软件，选项D的物流管理程序是应用软件。"
  },
  {
    id: "ncre-base-0289",
    topicId: "computer-basics",
    type: "single",
    stem: "下列各组软件中，完全属于应用软件的一组是________。",
    options: ["UNIX，WPS Office 2003，MS－DOS","AutoCAD，Photoshop，PowerPoint 2000","Oracle，FORTRAN编译系统，系统诊断程序","物流管理程序，Sybase，Windows 2000"],
    answer: "AutoCAD，Photoshop，PowerPoint 2000",
    analysis: "选项A的UNIX，MS－DOS为系统软件，选项C的Oracle、FORTRAN编译系统、系统诊断程序为系统软件，选项D的Sybase、Windows 2000为系统软件。"
  },
  {
    id: "ncre-base-0290",
    topicId: "computer-basics",
    type: "single",
    stem: "下列各组设备中，全部属于输入设备的一组是　　　。",
    options: ["键盘、磁盘和打印机","键盘、扫描仪和鼠标","键盘、鼠标和显示器","硬盘、打印机和键盘"],
    answer: "键盘、扫描仪和鼠标",
    analysis: "输入设备包括键盘、鼠标、扫描仪、外存储器等;输出设备包括显示器、打印机、绘图仪、音响、外存储器等。外存储器既属于输出设备又属于输入设备。"
  },
  {
    id: "ncre-base-0291",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于ASCII编码的叙述中，正确的是（　　）。",
    options: ["一个字符的标准ASCII码占一个字节，其最高二进制位总为1","所有大写英文字母的ASCII码值都小于小写英文字母'a'的ASCII码值","所有大写英文字母的ASCII码值都大于小写英文字母'a'的ASCII码值","标准ASCII码表有256个不同的字符编码"],
    answer: "所有大写英文字母的ASCII码值都小于小写英文字母'a'的ASCII码值",
    analysis: "国际通用的ASCII码为7位，且最高位不总为1；所有大写字母的ASCII码都小于小写字母a的ASCII码；标准ASCII码表有128个不同的字符编码。"
  },
  {
    id: "ncre-base-0292",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于CD－R光盘的描述中，错误的是________。",
    options: ["只能写入一次，可以反复读出的一次性写入光盘","可多次擦除型光盘","以用来存储大量用户数据的，一次性写入的光盘","CD－R是Compact Disc Recordable的缩写"],
    answer: "可多次擦除型光盘",
    analysis: "选项B可多次擦除型光盘是CD－RW。"
  },
  {
    id: "ncre-base-0293",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于CPU的叙述中，正确的是________。",
    options: ["CPU能直接读取硬盘上的数据","CPU能直接与内存储器交换数据","CPU主要组成部分是存储器和控制器","CPU主要用来执行算术运算"],
    answer: "CPU能直接与内存储器交换数据",
    analysis: "CPU只能与内存储器直接交换数据，其主要组成部分是运算器和控制器。选项D是运算器的作用。"
  },
  {
    id: "ncre-base-0294",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于磁道的说法中，正确的是________。",
    options: ["盘面上的磁道是一组同心圆","由于每一磁道的周长不同，所以每一磁道的存储容量也不同","盘面上的磁道是一条阿基米德螺线","磁道的编号是最内圈为0，并次序由内向外逐渐增大，最外圈的编号最大"],
    answer: "盘面上的磁道是一组同心圆",
    analysis: "磁盘的磁道是一个个同心圆，最外边的磁道编号为0，并次序由外向内增大，磁道存储容量是电磁原理，和圆周、体积等大小无关"
  },
  {
    id: "ncre-base-0295",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于存储的叙述中，正确的是　　　。",
    options: ["CPU能直接访问存储在内存中的数据，也能直接访问存储在外存中的数据","CPU不能直接访问存储在内存中的数据，能直接访问存储在外存中的数据","CPU只能直接访问存储在内存中的数据，不能直接访问存储在外存中的数据","CPU既不能直接访问存储在内存中的数据，也不能直接访问存储在外存中的数据"],
    answer: "CPU只能直接访问存储在内存中的数据，不能直接访问存储在外存中的数据",
    analysis: "中央处理器(CPU)直接与内存打交道,即CPU可以直接访问内存。而外存储器只能先将数据指令先调入内存然后再由内存调入CPU,CPU不能直接访问外存储器。"
  },
  {
    id: "ncre-base-0296",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于电子邮件的说法，正确的是________。",
    options: ["收件人必须有E－mail地址，发件人可以没有E－mail地址","发件人必须有E－mail地址，收件人可以没有E－mail地址","发件人和收件人都必须有E－mail地址","发件人必须知道收件人住址的邮政编码"],
    answer: "发件人和收件人都必须有E－mail地址",
    analysis: "发件人和收件人必须都有邮件地址才能相互发送电子邮件。"
  },
  {
    id: "ncre-base-0297",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于电子邮件的说法中错误的是　　　。",
    options: ["发件人必须有自己的E-mail帐户","必须知道收件人的E-mail地址","收件人必须有自己的邮政编码","可使用Outlook Express管理联系人信息"],
    answer: "收件人必须有自己的邮政编码",
    analysis: "电子邮件是网路上使用较广泛的一种服务,它不受地理位置的限制,是一种既经济又快速的通信工具,收发电子邮件只需要知道对方的电子邮件地址,无需邮政编码。"
  },
  {
    id: "ncre-base-0298",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于电子邮件的叙述中，正确的是________。",
    options: ["如果收件人的计算机没有打开时，发件人发来的电子邮件将丢失","如果收件人的计算机没有打开时，发件人发来的电子邮件将退回","如果收件人的计算机没有打开时，当收件人的计算机打开时再重发","发件人发来的电子邮件保存在收件人的电子邮箱中，收件人可随时接收"],
    answer: "发件人发来的电子邮件保存在收件人的电子邮箱中，收件人可随时接收",
    analysis: "收件人的计算机是否打开，收件人都可以将发件人发来的邮件保存在电子邮箱中。"
  },
  {
    id: "ncre-base-0299",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于汉字编码的叙述中，错误的是________。",
    options: ["BIG5码是通行于香港和台湾地区的繁体汉字编码","一个汉字的区位码就是它的国标码","无论两个汉字的笔画数目相差多大，但它们的机内码的长度是相同的","同一汉字用不同的输入法输入时，其输入码不同但机内码却是相同的"],
    answer: "一个汉字的区位码就是它的国标码",
    analysis: "当汉字的区位号都为十六进制数时，汉字的国标码＝汉字的区位码＋2020H。"
  },
  {
    id: "ncre-base-0300",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于计算机病毒的说法中，正确的是________。",
    options: ["计算机病毒是一种有损计算机操作人员身体健康的生物病毒","计算机病毒发作后，将造成计算机硬件永久性的物理损坏","计算机病毒是一种通过自我复制进行传染的，破坏计算机程序和数据的小程序","计算机病毒是一种有逻辑错误的程序"],
    answer: "计算机病毒是一种通过自我复制进行传染的，破坏计算机程序和数据的小程序",
    analysis: "计算机病毒是指编制或者在计算机程序中插入的破坏计算机功能或者破坏数据，影响计算机使用并且能够自我复制的一组计算机指令或者程序代码。选项A计算机病毒不是生物病毒，选项B计算机病毒不能永久性破坏硬件。"
  },
  {
    id: "ncre-base-0301",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于计算机病毒的叙述中，错误的是________。",
    options: ["计算机病毒具有潜伏性","计算机病毒具有传染性","感染过计算机病毒的计算机具有对该病毒的免疫性","计算机病毒是一个特殊的寄生程序"],
    answer: "感染过计算机病毒的计算机具有对该病毒的免疫性",
    analysis: "计算机病毒的特点有寄生性、破坏性、传染性、潜伏性、隐蔽性"
  },
  {
    id: "ncre-base-0302",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于计算机病毒的叙述中，错误的是________。",
    options: ["反病毒软件可以查、杀任何种类的病毒","计算机病毒是人为制造的、企图破坏计算机功能或计算机数据的一段小程序","反病毒软件必须随着新病毒的出现而升级，提高查、杀病毒的功能","计算机病毒具有传染性"],
    answer: "反病毒软件可以查、杀任何种类的病毒",
    analysis: "反病毒软件并不能查杀全部病毒。"
  },
  {
    id: "ncre-base-0303",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于计算机病毒的叙述中，正确的是________。",
    options: ["计算机病毒只感染．exe或．com文件","计算机病毒可通过读写移动存储设备或通过Internet网络进行传播","计算机病毒是通过电网进行传播的","计算机病毒是由于程序中的逻辑错误造成的"],
    answer: "计算机病毒可通过读写移动存储设备或通过Internet网络进行传播",
    analysis: "计算机病毒主要通过移动存储介质(如优盘、移动硬盘)和计算机网络两大途径进行传播。计算机病毒可以感染很多文件，具有自我复制能力。"
  },
  {
    id: "ncre-base-0304",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于计算机病毒的叙述中，正确的是________。",
    options: ["计算机病毒的特点之一是具有免疫性","计算机病毒是一种有逻辑错误的小程序","反病毒软件必须随着新病毒的出现而升级，提高查、杀病毒的功能","感染过计算机病毒的计算机具有对该病毒的免疫性"],
    answer: "反病毒软件必须随着新病毒的出现而升级，提高查、杀病毒的功能",
    analysis: "计算机病毒是具有破坏性的程序，其本身没有逻辑错误，计算机本身对计算机病毒没有免疫性。计算机病毒的特点有寄生性、破坏性、传染性、潜伏性、隐蔽性。"
  },
  {
    id: "ncre-base-0305",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于计算机病毒的叙述中，正确的是________。",
    options: ["反病毒软件可以查、杀任何种类的病毒","计算机病毒发作后，将对计算机硬件造成永久性的物理损坏","反病毒软件必须随着新病毒的出现而升级，提高查、杀病毒的功能","感染过计算机病毒的计算机具有对该病毒的免疫性"],
    answer: "反病毒软件必须随着新病毒的出现而升级，提高查、杀病毒的功能",
    analysis: "选项A反病毒软件并不能查杀全部病毒；选项B计算机病毒是具有破坏性的程序；选项D计算机本身对计算机病毒没有免疫性。"
  },
  {
    id: "ncre-base-0306",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于计算机的主要特性，叙述错误的有　　　。",
    options: ["处理速度快，计算精度高","存储容量大","逻辑判断能力一般","网络和通信功能强"],
    answer: "逻辑判断能力一般",
    analysis: "计算机的主要特性:可靠性高、工作自动化、处理速度快、存储容量大、计算精度高、逻辑运算能力强、适用范围广和通用性强等。"
  },
  {
    id: "ncre-base-0307",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于软件的叙述中，错误的是________。",
    options: ["计算机软件系统由程序和相应的文档资料组成","Windows操作系统是系统软件","Word 2003是应用软件","软件具有知识产权，不可以随便复制使用"],
    answer: "计算机软件系统由程序和相应的文档资料组成",
    analysis: "所谓软件是指为方便使用计算机和提高使用效率而组织的程序以及用于开发、使用和维护的有关文档。软件系统可分为系统软件和应用软件两大类。"
  },
  {
    id: "ncre-base-0308",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于软件的叙述中，正确的是________。",
    options: ["计算机软件分为系统软件和应用软件两大类","Windows就是广泛使用的应用软件之一","所谓软件就是程序","软件可以随便复制使用，不用购买。"],
    answer: "计算机软件分为系统软件和应用软件两大类",
    analysis: "所谓软件是指为方便使用计算机和提高使用效率而组织的程序以及用于开发、使用和维护的有关文档。软件系统可分为系统软件和应用软件两大类。Windows为系统软件。"
  },
  {
    id: "ncre-base-0309",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于使用FTP下载文件的说法中错误的是　　　。",
    options: ["FTP即文件传输协议","使用FTP协议在因特网上传输文件，这两台计算必须使用同样的操作系统","可以使用专用的FTP客户端下载文件","FTP使用客户/服务器模式工作"],
    answer: "使用FTP协议在因特网上传输文件，这两台计算必须使用同样的操作系统",
    analysis: "FTP(FileTransferProtocal)是文件传输协议的简称。使用FTP协议的两台计算机无论是位置相距多远,各自用的是什么操作系统,也无论它们使用的是什么方式接入因特网,它们之间都能进行文件传输。"
  },
  {
    id: "ncre-base-0310",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于世界上第一台电子计算机ENIAC的叙述中，错误的是________。",
    options: ["它是1946年在美国诞生的","它主要采用电子管和继电器","它是首次采用存储程序控制使计算机自动工作","它主要用于弹道计算"],
    answer: "它是首次采用存储程序控制使计算机自动工作",
    analysis: "EDVAC出现时才使用存储程序"
  },
  {
    id: "ncre-base-0311",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于系统软件的四条叙述中，正确的一条是______。",
    options: ["系统软件与具体应用领域无关","系统软件与具体硬件逻辑功能无关","系统软件是在应用软件基础上开发的","系统软件并不是具体提供人机界面"],
    answer: "系统软件与具体应用领域无关",
    analysis: "系统软件和应用软件组成了计算机软件系统的两个部分。它可以直接支持用户使用计算机硬件，并非在应用软件基础上开发的，由排除法知，答案选A)。"
  },
  {
    id: "ncre-base-0312",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于因特网上收/发电子邮件优点的描述中，错误的是________。",
    options: ["不受时间和地域的限制，只要能接入因特网，就能收发电子邮件","方便、快速","费用低廉","收件人必须在原电子邮箱申请地接收电子邮件"],
    answer: "收件人必须在原电子邮箱申请地接收电子邮件",
    analysis: "收件人可以在其他电子邮箱申请地接收电子邮件。"
  },
  {
    id: "ncre-base-0313",
    topicId: "computer-basics",
    type: "single",
    stem: "下列关于硬盘的说法错误的是　　　。",
    options: ["硬盘中的数据断电后不会丢失","每个计算机主机有且只能有一块硬盘","硬盘可以进行格式化处理","CPU不能够直接访问硬盘中的数据"],
    answer: "每个计算机主机有且只能有一块硬盘",
    analysis: "硬盘的特点是存储容量大、存取速度快。硬盘可以进行格式化处理,格式化后,硬盘上的数据丢失。每台计算机可以安装一块以上的硬盘,扩大存储容量。CPU只能通过访问硬盘存储在内存中的信息来访问硬盘。断电后,硬盘中存储的数据不会丢失。"
  },
  {
    id: "ncre-base-0314",
    topicId: "computer-basics",
    type: "single",
    stem: "下列几种存储器，存取周期最短的是______。",
    options: ["内存储器","光盘存储器","硬盘存储器","软盘存储器"],
    answer: "内存储器",
    analysis: "内存是计算机写入和读取数据的中转站，它的速度是最快的。存取周期最短的是内存，其次是硬盘，再次是光盘，最慢的是软盘。"
  },
  {
    id: "ncre-base-0315",
    topicId: "computer-basics",
    type: "single",
    stem: "下列计算机技术词汇的英文缩写和中文名字对照中，错误的是________。",
    options: ["CPU--中央处理器","ALU--算术逻辑部件","CU--控制部件","OS--输出服务"],
    answer: "OS--输出服务",
    analysis: "系统总线包含有三种不同功能的总线，即数据总线DB(Data Bus)、地址总线AB(Address Bus)和控制总线CB(Control Bus)。"
  },
  {
    id: "ncre-base-0316",
    topicId: "computer-basics",
    type: "single",
    stem: "下列两个二进制数进行算术加运算，100001＋111＝________。",
    options: ["101110","101000","101010","100101"],
    answer: "101000",
    analysis: "100001＋111＝101000。"
  },
  {
    id: "ncre-base-0317",
    topicId: "computer-basics",
    type: "single",
    stem: "下列描述中不正确的是　　　。",
    options: ["多媒体技术最主要的两个特点是集成性和交互性","所有计算机的字长都是固定不变的，都是8位","计算机的存储容量是计算机的性能指标之一","各种高级语言的编译系统都属于系统软件"],
    answer: "所有计算机的字长都是固定不变的，都是8位",
    analysis: "字长是指计算机一次能直接处理二进制数据的位数,字长越长,计算机处理数据的精度越强,字长是衡量计算机运算精度的主要指标。字长一般为字节的整数倍,如8、16、32、64位等。"
  },
  {
    id: "ncre-base-0318",
    topicId: "computer-basics",
    type: "single",
    stem: "下列软件中，不是操作系统的是________。",
    options: ["Linux","UNIX","MS－DOS","MS－Office"],
    answer: "MS－Office",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0319",
    topicId: "computer-basics",
    type: "single",
    stem: "下列软件中，属于系统软件的是________。",
    options: ["C＋＋编译程序","Excel 2003","学籍管理系统","财务管理系统"],
    answer: "C＋＋编译程序",
    analysis: "Excel 2003、学籍管理系统、财务管理系统属于应用软件。"
  },
  {
    id: "ncre-base-0320",
    topicId: "computer-basics",
    type: "single",
    stem: "下列软件中，属于应用软件的是________。",
    options: ["Windows XP","UNIX","Linux","WPS Office 2003"],
    answer: "WPS Office 2003",
    analysis: "Windows 7、UNIX、Linux是系统软件。"
  },
  {
    id: "ncre-base-0321",
    topicId: "computer-basics",
    type: "single",
    stem: "下列设备中，可以作为微机输入设备的是（　　）。",
    options: ["打印机","显示器","鼠标器","绘图仪"],
    answer: "鼠标器",
    analysis: "打印机、显示器、绘图仪都属于输出设备。"
  },
  {
    id: "ncre-base-0322",
    topicId: "computer-basics",
    type: "single",
    stem: "下列设备组中，完全属于计算机输出设备的一组是（　　）。",
    options: ["喷墨打印机，显示器，键盘","激光打印机，键盘，鼠标器","键盘，鼠标器，扫描仪","打印机，绘图仪，显示器"],
    answer: "打印机，绘图仪，显示器",
    analysis: "其中键盘、鼠标器、扫描仪属于输入设备。"
  },
  {
    id: "ncre-base-0323",
    topicId: "computer-basics",
    type: "single",
    stem: "下列设备组中，完全属于输入设备的一组是________。",
    options: ["喷墨打印机，显示器，键盘","扫描仪，键盘，鼠标器","键盘，鼠标器，绘图仪","打印机，键盘，显示器"],
    answer: "扫描仪，键盘，鼠标器",
    analysis: "打印机、显示器、绘图仪属于输出设备。"
  },
  {
    id: "ncre-base-0324",
    topicId: "computer-basics",
    type: "single",
    stem: "下列设备组中，完全属于外部设备的一组是________。",
    options: ["CD－ROM驱动器，CPU，键盘，显示器","激光打印机，键盘，CD－ROM驱动器，鼠标器","内存储器，CD－ROM驱动器，扫描仪，显示器","打印机，CPU，内存储器，硬盘"],
    answer: "激光打印机，键盘，CD－ROM驱动器，鼠标器",
    analysis: "CPU、内存储器不是外部设备"
  },
  {
    id: "ncre-base-0325",
    topicId: "computer-basics",
    type: "single",
    stem: "下列设备组中，完全属于外部设备的一组是________。",
    options: ["激光打印机，移动硬盘，鼠标器","CPU，键盘，显示器","SRAM内存条，CD－ROM驱动器，扫描仪","优盘，内存储器，硬盘"],
    answer: "激光打印机，移动硬盘，鼠标器",
    analysis: "CPU、SRAM内存条、CD－ROM以及内存储器都不属于外部设备。"
  },
  {
    id: "ncre-base-0326",
    topicId: "computer-basics",
    type: "single",
    stem: "下列术语中，属于显示器性能指标的是______。",
    options: ["速度","可靠性","分辨率","精度"],
    answer: "分辨率",
    analysis: "显示器的性能指标包括：像素与点阵、分辨率、显存和显示器的尺寸。"
  },
  {
    id: "ncre-base-0327",
    topicId: "computer-basics",
    type: "single",
    stem: "下列说法中，错误的是________。",
    options: ["硬盘驱动器和盘片是密封在一起的，不能随意更换盘片","硬盘是由多张盘片组成的盘片组","硬盘的技术指标除容量外，另一个是转速","硬盘安装在机箱内，属于主机的组成部分"],
    answer: "硬盘的技术指标除容量外，另一个是转速",
    analysis: "硬盘的主要技术指标包括平均寻道时间、转速、平均访问时间、平均潜伏期、数据传输率、缓冲区容量，不包括容量，所以答案选C)。"
  },
  {
    id: "ncre-base-0328",
    topicId: "computer-basics",
    type: "single",
    stem: "下列说法中，正确的是________。",
    options: ["只要将高级程序语言编写的源程序文件(如try.c)的扩展名更改为．exe，则它就成为可执行文件了","高档计算机可以直接执行用高级程序语言编写的程序","源程序只有经过编译和链接后才能成为可执行程序","用高级程序语言编写的程序可移植性和可读性都很差"],
    answer: "源程序只有经过编译和链接后才能成为可执行程序",
    analysis: "计算机只能直接执行机器语言，高级语言要经过编译链接后才能被执行，高级语言的可移植性和可读性都很好。"
  },
  {
    id: "ncre-base-0329",
    topicId: "computer-basics",
    type: "single",
    stem: "下列说法中，正确的是________。",
    options: ["硬盘的容量远大于内存的容量","硬盘的盘片是可以随时更换的","优盘的容量远大于硬盘的容量","硬盘安装在机箱内，它是主机的组成部分"],
    answer: "硬盘的容量远大于内存的容量",
    analysis: "硬盘具有容量大的特点，硬盘不易更换盘片，主机包括CPU和内存储器，不包括硬盘。"
  },
  {
    id: "ncre-base-0330",
    topicId: "computer-basics",
    type: "single",
    stem: "下列说法中，正确的是________。",
    options: ["软盘片的容量远远小于硬盘的容量","硬盘的存取速度比软盘的存取速度慢","优盘的容量远大于硬盘的容量","软盘驱动器是唯一的外部存储设备"],
    answer: "硬盘的存取速度比软盘的存取速度慢",
    analysis: "硬盘、优盘、软盘的容量都可大可小，无法比较，外部存储设备还有优盘、移动硬盘等。"
  },
  {
    id: "ncre-base-0331",
    topicId: "computer-basics",
    type: "single",
    stem: "下列说法中，正确的是________。",
    options: ["同一个汉字的输入码的长度随输入方法不同而不同","一个汉字的区位码与它的国标码是相同的，且均为2字节","不同汉字的机内码的长度是不相同的","同一汉字用不同的输入法输入时，其机内码是不相同的"],
    answer: "同一个汉字的输入码的长度随输入方法不同而不同",
    analysis: "选项B一个汉字的区位码和国标码不同；选项C一个汉字机内码的长度均为2个字节；选项D同一汉字输入法不同时，机内码相同。"
  },
  {
    id: "ncre-base-0332",
    topicId: "computer-basics",
    type: "single",
    stem: "下列四个无符号十进制整数中，能用八个二进制位表示的是______。",
    options: ["257","201","313","296"],
    answer: "201",
    analysis: "257转换成二进制是100000001,201转换成二进制是11001001,313转换成二进制是100111001,296转换成二进制是100101000。四个数中只有选项B是8个二进制位，其他都是9个。"
  },
  {
    id: "ncre-base-0333",
    topicId: "computer-basics",
    type: "single",
    stem: "下列四条叙述中，正确的一条是______。",
    options: ["假若CPU向外输出20位地址，则它能直接访问的存储空间可达1MB","PC机在使用过程中突然断电，SRAM中存储的信息不会丢失","PC机在使用过程中突然断电，DRAM中存储的信息不会丢失","外存储器中的信息可以直接被CPU处理"],
    answer: "假若CPU向外输出20位地址，则它能直接访问的存储空间可达1MB",
    analysis: "RAM中的数据一旦断电就会消失；外存中信息要通过内存才能被计算机处理。"
  },
  {
    id: "ncre-base-0334",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，错误的是________。",
    options: ["把数据从内存传输到硬盘的操作称为写盘","WPS Office 2003属于系统软件","把高级语言源程序转换为等价的机器语言目标程序的过程叫编译","计算机内部对数据的传输、存储和处理都使用二进制"],
    answer: "WPS Office 2003属于系统软件",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0335",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，错误的是________。",
    options: ["计算机硬件主要包括：主机、键盘、显示器、鼠标器和打印机五大部件","计算机软件分系统软件和应用软件两大类","CPU主要由运算器和控制器组成","内存储器中存储当前正在执行的程序和处理的数据"],
    answer: "计算机硬件主要包括：主机、键盘、显示器、鼠标器和打印机五大部件",
    analysis: "计算机的硬件由输入、存储、运算、控制和输出五个部分组成。"
  },
  {
    id: "ncre-base-0336",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，错误的是________。",
    options: ["内存储器一般由ROM和RAM组成","RAM中存储的数据一旦断电就全部丢失","CPU可以直接存取硬盘中的数据","存储在ROM中的数据断电后也不会丢失"],
    answer: "CPU可以直接存取硬盘中的数据",
    analysis: "CPU只能直接存取内存中的数据。"
  },
  {
    id: "ncre-base-0337",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，错误的是________。",
    options: ["把数据从内存传输到硬盘叫写盘","WPS Office 2003属于系统软件","把源程序转换为机器语言的目标程序的过程叫编译","在计算机内部，数据的传输、存储和处理都使用二进制编码"],
    answer: "WPS Office 2003属于系统软件",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0338",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，错误的是________。",
    options: ["硬盘在主机箱内，它是主机的组成部分","硬盘属于外部存储器","硬盘驱动器既可做输入设备又可做输出设备用","硬盘与CPU之间不能直接交换数据"],
    answer: "硬盘在主机箱内，它是主机的组成部分",
    analysis: "硬盘虽然在主机箱内，但属于外存，不是主机的组成部分。"
  },
  {
    id: "ncre-base-0339",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，错误的是________。",
    options: ["内存储器RAM中主要存储当前正在运行的程序和数据","高速缓冲存储器(Cache)一般采用DRAM构成","外部存储器(如硬盘)用来存储必须永久保存的程序和数据","存储在RAM中的信息会因断电而全部丢失"],
    answer: "高速缓冲存储器(Cache)一般采用DRAM构成",
    analysis: "高速缓冲存储器一般由SRAM组成。"
  },
  {
    id: "ncre-base-0340",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["用高级程序语言编写的程序称为源程序","计算机能直接识别并执行用汇编语言编写的程序","机器语言编写的程序必须经过编译和链接后才能执行","机器语言编写的程序具有良好的可移植性"],
    answer: "用高级程序语言编写的程序称为源程序",
    analysis: "计算机只能直接识别机器语言，不用经过编译和链接，且机器语言不可移植。"
  },
  {
    id: "ncre-base-0341",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["内存中存放的是当前正在执行的程序和所需的数据","内存中存放的是当前暂时不用的程序和数据","外存中存放的是当前正在执行的程序和所需的数据","内存中只能存放指令"],
    answer: "内存中存放的是当前正在执行的程序和所需的数据",
    analysis: "存储计算机当前正在执行的应用程序和相应数据的存储器是内存。"
  },
  {
    id: "ncre-base-0342",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["所有计算机病毒只在可执行文件中传染","计算机病毒可通过读写移动存储器或Internet网络进行传播","只要把带毒优盘设置成只读状态，那么此盘上的病毒就不会因读盘而传染给另一台计算机","计算机病毒是由于光盘表面不清洁而造成的"],
    answer: "计算机病毒可通过读写移动存储器或Internet网络进行传播",
    analysis: "计算机病毒主要通过移动存储介质(如U盘、移动硬盘)和计算机网络两大途径进行传播。"
  },
  {
    id: "ncre-base-0343",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["C＋＋是高级程序设计语言的一种","用C＋＋程序设计语言编写的程序可以直接在机器上运行","当代最先进的计算机可以直接识别、执行任何语言编写的程序","机器语言和汇编语言是同一种语言的不同名称"],
    answer: "C＋＋是高级程序设计语言的一种",
    analysis: "计算机只能直接识别机器语言，且机器语言和汇编语言是两种不同的语言。"
  },
  {
    id: "ncre-base-0344",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["一个字符的标准ASCII码占一个字节的存储量，其最高位二进制总为0","大写英文字母的ASCII码值大于小写英文字母的ASCII码值","同一个英文字母(如A)的ASCII码和它在汉字系统下的全角内码是相同的","一个字符的ASCII码与它的内码是不同的。"],
    answer: "一个字符的ASCII码与它的内码是不同的。",
    analysis: "国际通用的ASCII码为7位，最高位不总为0，大写字母的ASCII码值小于小字字母的ASCII码值，ASCII码和内码不同。"
  },
  {
    id: "ncre-base-0345",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["计算机病毒只在可执行文件中传染","计算机病毒主要通过读/写移动存储器或Internet网络进行传播","只要删除所有感染了病毒的文件就可以彻底消除病毒","计算机杀病毒软件可以查出和清除任意已知的和未知的计算机病毒"],
    answer: "计算机病毒主要通过读/写移动存储器或Internet网络进行传播",
    analysis: "计算机病毒主要通过移动存储介质(如U盘、移动硬盘)和计算机网络两大途径进行传播。"
  },
  {
    id: "ncre-base-0346",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["计算机能直接识别并执行用高级程序语言编写的程序","用机器语言编写的程序可读性最差","机器语言就是汇编语言","高级语言的编译系统是应用程序"],
    answer: "用机器语言编写的程序可读性最差",
    analysis: "计算机只能直接识别机器语言，机器语言不同于汇编语言，高级语言的编译系统是编译器。"
  },
  {
    id: "ncre-base-0347",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["用高级程序语言编写的程序称为源程序","计算机能直接识别并执行用汇编语言编写的程序","机器语言编写的程序执行效率最低","高级语言编写的程序的可移植性最差"],
    answer: "用高级程序语言编写的程序称为源程序",
    analysis: "选项B汇编语言必须要经过翻译成机器语言后才能被计算机执行；选项C机器语言执行效率最高；选项D高级语言不依赖于计算机，所以可移植性好，故A项正确。"
  },
  {
    id: "ncre-base-0348",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["字长为16位表示这台计算机最大能计算一个16位的十进制数","字长为16位表示这台计算机的CPU一次能处理16位二进制数","运算器只能进行算术运算","SRAM的集成度高于DRAM"],
    answer: "字长为16位表示这台计算机的CPU一次能处理16位二进制数",
    analysis: "字长是指计算机运算部件一次能同时处理的二进制数据的位数，运算器可以进行算术运算和逻辑运算，DRAM集成度高于SRAM。"
  },
  {
    id: "ncre-base-0349",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["用高级语言编写的程序称为源程序","计算机能直接识别、执行用汇编语言编写的程序","机器语言编写的程序执行效率最低","不同型号的CPU具有相同的机器语言"],
    answer: "用高级语言编写的程序称为源程序",
    analysis: "计算机能直接识别机器语言，机器语言的执行效率高。"
  },
  {
    id: "ncre-base-0350",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["把数据从硬盘上传送到内存的操作称为输出","WPS Office 2003是一个国产的系统软件","扫描仪属于输出设备","将高级语言编写的源程序转换成为机器语言程序的程序叫编译程序"],
    answer: "将高级语言编写的源程序转换成为机器语言程序的程序叫编译程序",
    analysis: "选项A把数据从硬盘中传送到内存中操作是读盘；选项B的WPS Office 2003不是系统软件，是应用软件；选项C扫描仪是输入设备。"
  },
  {
    id: "ncre-base-0351",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["Word文档不会带计算机病毒","计算机病毒具有自我复制的能力，能迅速扩散到其他程序上","清除计算机病毒的最简单办法是删除所有感染了病毒的文件","计算机杀病毒软件可以查出和清除任何已知或未知的病毒"],
    answer: "计算机病毒具有自我复制的能力，能迅速扩散到其他程序上",
    analysis: "计算机病毒无法通过删除文件来清除，杀毒软件要经常更新，但不一定能完全杀掉所有病毒。"
  },
  {
    id: "ncre-base-0352",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["Cache一般由DRAM构成","汉字的机内码就是它的国标码","数据库管理系统Oracle是系统软件","指令由控制码和操作码组成"],
    answer: "数据库管理系统Oracle是系统软件",
    analysis: "高速缓冲存储器(Cache)一般由高速SRAM构成，汉字的内码＝汉字的国标码＋8080H，指令由操作码和操作数组成。"
  },
  {
    id: "ncre-base-0353",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["高级程序设计语言的编译系统属于应用软件","高速缓冲存储器(Cache)一般用SRAM来实现","CPU可以直接存取硬盘中的数据","存储在ROM中的信息断电后会全部丢失"],
    answer: "高速缓冲存储器(Cache)一般用SRAM来实现",
    analysis: "选项A编译系统属于系统软件；选项C中CPU只能与内存直接交换数据；选项D中ROM的数据断电后不消失。"
  },
  {
    id: "ncre-base-0354",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["一个字符的标准ASCII码占一个字节的存储量，其最高位二进制总为0","大写英文字母的ASCII码值大于小写英文字母的ASCII码值","同一个英文字母(如字母A)的ASCII码和它在汉字系统下的全角内码是相同的","标准ASCII码表的每一个ASCII码都能在屏幕上显示成一个相应的字符"],
    answer: "一个字符的标准ASCII码占一个字节的存储量，其最高位二进制总为0",
    analysis: "选项B大写英文字母ASCII码小于小写字母ASCII码；选项C字母的ASCII码和全角内码不同；选项D空格不能显示字符。"
  },
  {
    id: "ncre-base-0355",
    topicId: "computer-basics",
    type: "single",
    stem: "下列叙述中，正确的是________。",
    options: ["高级语言编写的程序的可移植性差","机器语言就是汇编语言，无非是名称不同而已","指令是由一串二进制数0、1组成的","用机器语言编写的程序可读性好"],
    answer: "指令是由一串二进制数0、1组成的",
    analysis: "高级语言的可移植性好，低级语言的可读性差，机器语言和汇编语言不同。"
  },
  {
    id: "ncre-base-0356",
    topicId: "computer-basics",
    type: "single",
    stem: "下列选项中，不属于计算机病毒特征的是　　　。",
    options: ["破坏性","潜优性","传染性","免疫性"],
    answer: "免疫性",
    analysis: "计算机病毒的特征:寄生性、传染性、隐蔽性、破坏性和可激发性。"
  },
  {
    id: "ncre-base-0357",
    topicId: "computer-basics",
    type: "single",
    stem: "下列选项中，不属于显示器主要技术指标的是________。",
    options: ["分辨率","重量","像素的点距","显示器的尺寸"],
    answer: "重量",
    analysis: "显示器的主要技术指标有扫描方式、刷新频率、点距、分辨率、带宽、亮度和对比度、尺寸。"
  },
  {
    id: "ncre-base-0358",
    topicId: "computer-basics",
    type: "single",
    stem: "下列选项中，既可作为输入设备又可作为输出设备的是________。",
    options: ["扫描仪","绘图仪","鼠标器","磁盘驱动器"],
    answer: "磁盘驱动器",
    analysis: "绘图仪是输出设备，扫描仪是输入设备，鼠标器是输入设备，磁盘驱动器既能将存储在磁盘上的信息读进内存中，又能将内存中的信息写到磁盘上。因此，就认为它既是输入设备，又是输出设备。"
  },
  {
    id: "ncre-base-0359",
    topicId: "computer-basics",
    type: "single",
    stem: "下列选项中不属于计算机的主要技术指标的是　　　。",
    options: ["字长","存储容量","重量","时钟主频"],
    answer: "重量",
    analysis: "计算机主要技术指标有主频、字长、运算速度、存储容量和存取周期。"
  },
  {
    id: "ncre-base-0360",
    topicId: "computer-basics",
    type: "single",
    stem: "下列用户XUEJY的电子邮件地址中，正确的是________。",
    options: ["XUEJY @ bj163.com","XUEJYbj163.com","XUEJY#bj163.com","XUEJY@bj163.com"],
    answer: "XUEJY@bj163.com",
    analysis: "电子邮件地址由以下几个部分组成：用户名@域名.后缀，地址中间不能有空格和字符，选项A)中有空格，所以不正确。"
  },
  {
    id: "ncre-base-0361",
    topicId: "computer-basics",
    type: "single",
    stem: "下列有关Internet的叙述中，错误的是　　　。",
    options: ["万维网就是因特网","因特网上提供了多种信息","因特网是计算机网络的网络","因特网是国际计算机互联网"],
    answer: "万维网就是因特网",
    analysis: "因特网(Internet)是通过路由器将世界不同地区、不同规模的网络相互连接起来的大型网络,是全球计算机的互联网,属于广域网,它信息资源丰富。而万维网是因特网上多媒体信息查询工具,是因特网上发展最快和使用最广的服务。"
  },
  {
    id: "ncre-base-0362",
    topicId: "computer-basics",
    type: "single",
    stem: "下列有关计算机的新技术的说法中，错误的是　　　。",
    options: ["嵌入式技术是将计算机作为一个信息处理部件，嵌入到应用系统中的一种技术，也就是说，它将软件固化集成到硬件系统中，将硬件系统与软件系统一体化","网格计算利用互联网把分散在不同地理位置的电脑组织成一个\"虚拟的超级计算机\"","网格计算技术能够提供资源共享，实现应用程序的互连互通，网格计算与计算机网络是一回事","中间件是介于应用软件和操作系统之间的系统软件"],
    answer: "网格计算技术能够提供资源共享，实现应用程序的互连互通，网格计算与计算机网络是一回事",
    analysis: "网络计算技术能够提供资源共享,实现应用程序的互联互通,但是,网络与计算机网络不同,计算机网络实现的是一种硬件的连通,而网络能实现应用层面的连通。"
  },
  {
    id: "ncre-base-0363",
    topicId: "computer-basics",
    type: "single",
    stem: "下列有关计算机结构的叙述中，错误的是　　　。",
    options: ["最早的计算机基本上采用直接连接的方式，冯·诺依曼研制的计算机IAS，基本上就采用了直接连接的结构","直接连接方式连接速度快，而且易于扩展","数据总线的位数，通常与CPU的位数相对应","现代计算机普遍采用总线结构"],
    answer: "直接连接方式连接速度快，而且易于扩展",
    analysis: "最早的计算机使用直接连接的方式,运算器、存储器、控制器和外部设备等各个部件之间都有单独的连接线路。这种结构可以获得最高的连接速度,但是不易扩展。"
  },
  {
    id: "ncre-base-0364",
    topicId: "computer-basics",
    type: "single",
    stem: "下列有关计算机网络的说法错误的是　　　。",
    options: ["组成计算机网络的计算机设备是分布在不同地理位置的多台独立的\"自治计算机\"","共享资源包括硬件资源和软件资源以及数据信息","计算机网络提供资源共享的功能","计算机网络中，每台计算机核心的基本部件，如CPU、系统总线、网络接口等都要求存在，但不一定独立"],
    answer: "计算机网络中，每台计算机核心的基本部件，如CPU、系统总线、网络接口等都要求存在，但不一定独立",
    analysis: "计算机网络中的计算机设备是分布在不同地理位置的多台独立的计算机。每台计算机核心的基本部件,如CPU、系统总线、网络接口等都要求存在并且独立,从而使得每台计算机可以联网使用,也可以脱离网络独立工作。"
  },
  {
    id: "ncre-base-0365",
    topicId: "computer-basics",
    type: "single",
    stem: "下列有关信息和数据的说法中，错误的是　　　。",
    options: ["数据是信息的载体","数值、文字、语言、图形、图像等都是不同形式的数据","数据处理之后产生的结果为信息，信息有意义，数据没有","数据具有针对性、时效性"],
    answer: "数据具有针对性、时效性",
    analysis: "数据包括数值、文字、语言、图形、图像等不同形式。数据是信息的载体。数据经过处理之后便成为了信息,信息具有针对性、时效性。所以信息有意义,而数据没有。"
  },
  {
    id: "ncre-base-0366",
    topicId: "computer-basics",
    type: "single",
    stem: "下列有关总线和主板的叙述中，错误的是　　　。",
    options: ["外设可以直接挂在总线上","总线体现在硬件上就是计算机主板","主板上配有插CPU、内存条、显示卡等的各类扩展槽或接口，而光盘驱动器和硬盘驱动器则通过扁缆与主板相连","在电脑维修中，把CPU、主板、内存、显卡加上电源所组成的系统叫最小化系统"],
    answer: "外设可以直接挂在总线上",
    analysis: "所有外部设备都通过各自的接口电路连接到计算机的系统总线上,而不能像内存一样直接挂在总线上。这是因为CPU只能处理数字的且是并行的信息,而且处理速度比外设快,故需要接口来转换和缓存信息。"
  },
  {
    id: "ncre-base-0367",
    topicId: "computer-basics",
    type: "single",
    stem: "下列字符中，其ASCII码值最大的是______。",
    options: ["9","D","a","y"],
    answer: "y",
    analysis: "ASCII码(用十六进制表示)为：9对应39，D对应44，a对应61，y对应79。"
  },
  {
    id: "ncre-base-0368",
    topicId: "computer-basics",
    type: "single",
    stem: "下面不是汉字输入码的是　　　。",
    options: ["五笔字形码","全拼编码","双拼编码","ASCII码"],
    answer: "ASCII码",
    analysis: "计算机中普遍采用的字符编码是ASCII码,它不是汉字码。"
  },
  {
    id: "ncre-base-0369",
    topicId: "computer-basics",
    type: "single",
    stem: "下面关于\"计算机系统\"的叙述中，最完整的是________。",
    options: ["\"计算机系统\"就是指计算机的硬件系统","\"计算机系统\"是指计算机上配置的操作系统","\"计算机系统\"由硬件系统和安装在上的操作系统组成","\"计算机系统\"由硬件系统和软件系统组成"],
    answer: "\"计算机系统\"由硬件系统和软件系统组成",
    analysis: "一个完整的计算机系统应该包括硬件和软件两部分"
  },
  {
    id: "ncre-base-0370",
    topicId: "computer-basics",
    type: "single",
    stem: "下面关于USB的叙述中，错误的是________。",
    options: ["USB的中文名为\"通用串行总线\"","USB2.0的数据传输率大大高于USB1.1","USB具有热插拔与即插即用的功能","USB接口连接的外部设备(如移动硬盘、U盘等)必须另外供应电源"],
    answer: "USB接口连接的外部设备(如移动硬盘、U盘等)必须另外供应电源",
    analysis: "不需要另供电源。"
  },
  {
    id: "ncre-base-0371",
    topicId: "computer-basics",
    type: "single",
    stem: "下面关于USB的叙述中，错误的是________。",
    options: ["USB接口的外表尺寸比并行接口大得多","USB2.0的数据传输率大大高于USB1.1","USB具有热插拔与即插即用的功能","在Windows XP下，使用USB接口连接的外部设备(如移动硬盘、U盘等)不需要驱动程序"],
    answer: "在Windows XP下，使用USB接口连接的外部设备(如移动硬盘、U盘等)不需要驱动程序",
    analysis: "有的外部设备需要装驱动程序，例如摄像头。"
  },
  {
    id: "ncre-base-0372",
    topicId: "computer-basics",
    type: "single",
    stem: "下面关于随机存取存储器(RAM)的叙述中，正确的是________。",
    options: ["静态RAM(SRAM)集成度低，但存取速度快且无须\"刷新\"","DRAM的集成度高且成本高，常做Cache用","DRAM的存取速度比SRAM快","DRAM中存储的数据断电后不会丢失"],
    answer: "静态RAM(SRAM)集成度低，但存取速度快且无须\"刷新\"",
    analysis: "选项B的DRAM集成度高、成本低，SRAM常用来做Cache；选项C的SRAM比DRAM存储速度快；选项D的DRAM断电后数据会消失。"
  },
  {
    id: "ncre-base-0373",
    topicId: "computer-basics",
    type: "single",
    stem: "下面关于随机存取存储器(RAM)的叙述中，正确的是________。",
    options: ["RAM分静态RAM(SRAM)和动态RAM(DRAM)两大类","SRAM的集成度比DRAM高","DRAM的存取速度比SRAM快","DRAM中存储的数据无须\"刷新\""],
    answer: "RAM分静态RAM(SRAM)和动态RAM(DRAM)两大类",
    analysis: "DRAM集成度比SRAM高，SRAM比DRAM存储速度快，DRAM数据要经常刷新。"
  },
  {
    id: "ncre-base-0374",
    topicId: "computer-basics",
    type: "single",
    stem: "下面关于优盘的描述中，错误的是________。",
    options: ["优盘有基本型、增强型和加密型三种","优盘的特点是重量轻、体积小","优盘多固定在机箱内，不便携带","断电后，优盘还能保持存储的数据不丢失"],
    answer: "优盘多固定在机箱内，不便携带",
    analysis: "U盘通过计算机的USB接口即插即用，使用方便。"
  },
  {
    id: "ncre-base-0375",
    topicId: "computer-basics",
    type: "single",
    stem: "下面设备中，既能向主机输入数据又能接收由主机输出数据的设备是______。",
    options: ["CD－ROM","显示器","软磁盘存储器","光笔"],
    answer: "软磁盘存储器",
    analysis: "CD－ROM和光笔只能向主机输入数据，显示器只能接收由主机输出的数据，软磁盘存储器是可读写的存储器，它既能向主机输入数据又能接收由主机输出的数据。"
  },
  {
    id: "ncre-base-0376",
    topicId: "computer-basics",
    type: "single",
    stem: "下面四条常用术语的叙述中，有错误的是______。",
    options: ["光标是显示屏上指示位置的标志","汇编语言是一种面向机器的低级程序设计语言，用汇编语言编写的程序计算机能直接执行","总线是计算机系统中各部件之间传输信息的公共通路","读写磁头是既能从磁表面存储器读出信息又能把信息写入磁表面存储器的装置"],
    answer: "汇编语言是一种面向机器的低级程序设计语言，用汇编语言编写的程序计算机能直接执行",
    analysis: "用汇编语言编制的程序称为汇编语言程序，汇编语言程序不能被机器直接识别和执行，必须由\"汇编程序\"(或汇编系统)翻译成机器语言程序才能运行。"
  },
  {
    id: "ncre-base-0377",
    topicId: "computer-basics",
    type: "single",
    stem: "下面四种存储器中，属于数据易失性的存储器是　　　。",
    options: ["RAM","ROM","PROM","CD－ROM"],
    answer: "RAM",
    analysis: "只读存储器(ROM)特点是:只能读出存储器中原有的内容,而不能修改,即只能读,不能写;掉电后内容不会丢失,加电后会自动恢复,即具有非易失性特点;随机存储器(RAM)特点是:读写速度快,最大的不足是断电后,内容立即消失,即具有易失性;PROM是可编程的制度存储器PROM。CD-ROM属于光盘存储器,其特点都是只能读不能写,即具有非易失性。"
  },
  {
    id: "ncre-base-0378",
    topicId: "computer-basics",
    type: "single",
    stem: "下面叙述中错误的是________。",
    options: ["移动硬盘的容量比优盘的容量大","移动硬盘和优盘均有重量轻、体积小的特点","闪存(Flash Memory)的特点是断电后还能保持存储的数据不丢失","移动硬盘和硬盘都不易携带"],
    answer: "移动硬盘和硬盘都不易携带",
    analysis: "移动硬盘方便携带。"
  },
  {
    id: "ncre-base-0379",
    topicId: "computer-basics",
    type: "single",
    stem: "显示或打印汉字时，系统使用的是汉字的________。",
    options: ["机内码","字形码","输入码","国标码"],
    answer: "字形码",
    analysis: "显示或打印汉字时使用汉字的字形码，在计算机内部时使用汉字的机内码。"
  },
  {
    id: "ncre-base-0380",
    topicId: "computer-basics",
    type: "single",
    stem: "显示器的主要技术指标之一是________。",
    options: ["分辨率","亮度","彩色","对比度"],
    answer: "分辨率",
    analysis: "显示器的主要技术指标有扫描方式、刷新频率、点距、分辨率、带宽、亮度和对比度、尺寸。"
  },
  {
    id: "ncre-base-0381",
    topicId: "computer-basics",
    type: "single",
    stem: "现代计算机中采用二进制数制是因为二进制数的优点是________。",
    options: ["代码表示简短，易读","物理上容易实现且简单可靠；运算规则简单；适合逻辑运算。","容易阅读，不易出错","只有0,1两个符号，容易书写"],
    answer: "物理上容易实现且简单可靠；运算规则简单；适合逻辑运算。",
    analysis: "二进制避免了那些基于其他数字系统的电子计算机中必须的复杂的进位机制，物理上便于实现，且适合逻辑运算。"
  },
  {
    id: "ncre-base-0382",
    topicId: "computer-basics",
    type: "single",
    stem: "现代计算机中采用二进制数字系统是因为它________。",
    options: ["代码表示简短，易读","物理上容易表示和实现、运算规则简单、可节省设备且便于设计","容易阅读，不易出错","只有0和1两个数字符号，容易书写"],
    answer: "物理上容易表示和实现、运算规则简单、可节省设备且便于设计",
    analysis: "二进制避免了那些基于其他数字系统的电子计算机中必须的复杂的进位机制，物理上便于实现，且适合逻辑运算。"
  },
  {
    id: "ncre-base-0383",
    topicId: "computer-basics",
    type: "single",
    stem: "现代微型计算机中所采用的电子器件是________。",
    options: ["电子管","晶体管","小规模集成电路","大规模和超大规模集成电路"],
    answer: "大规模和超大规模集成电路",
    analysis: "计算机采用的电子器件为：第一代是电子管，第二代是晶体管，第三代是中、小规模集成电路，第四代是大规模、超大规模集成电路。现代计算机属于第四代计算机。"
  },
  {
    id: "ncre-base-0384",
    topicId: "computer-basics",
    type: "single",
    stem: "相对而言，下列类型的文件中，不易感染病毒的是　　　。",
    options: ["*.txt","*.doc","*.com","*.exe"],
    answer: "*.txt",
    analysis: "计算机易感染病毒的文件:.com文件、.exe文件、.sys文件、.doc文件、.dot文件等类型文件;不易感染病毒的文本文件即.txt类型的文件。"
  },
  {
    id: "ncre-base-0385",
    topicId: "computer-basics",
    type: "single",
    stem: "写邮件时，除了发件人地址之外，另一项必须要填写的是________。",
    options: ["信件内容","收件人地址","主题","抄送"],
    answer: "收件人地址",
    analysis: "写邮件必须要写收件人地址才可以发送出去。"
  },
  {
    id: "ncre-base-0386",
    topicId: "computer-basics",
    type: "single",
    stem: "一般计算机硬件系统的主要组成部件有五大部分，下列选项中不属于这五部分的是　　　。",
    options: ["输入设备和输出设备","软件","运算器","控制器"],
    answer: "软件",
    analysis: "计算机硬件系统是由运算器、控制器、存储器、输入设备和输出设备五大部分组成的。"
  },
  {
    id: "ncre-base-0387",
    topicId: "computer-basics",
    type: "single",
    stem: "一个汉字的16×16点阵字形码长度的字节数是________。",
    options: ["16","24","32","40"],
    answer: "32",
    analysis: "在16×16的网格中描绘一个汉字，整个网格分为16行16列，每个小格用1位二进制编码表示，每一行需要16个二进制位，占2个字节，16行共占16×2＝32个字节。"
  },
  {
    id: "ncre-base-0388",
    topicId: "computer-basics",
    type: "single",
    stem: "一个汉字的国标码需用2字节存储，其每个字节的最高二进制位的值分别为（　　）。",
    options: ["0,0","1,0","0,1","1,1"],
    answer: "0,0",
    analysis: "国际码两个字节的最高位都为0，机内码两个字节的最高位都为1"
  },
  {
    id: "ncre-base-0389",
    topicId: "computer-basics",
    type: "single",
    stem: "一个汉字的机内码与国标码之间的差别是________。",
    options: ["前者各字节的最高位二进制值各为1，而后者为0","前者各字节的最高位二进制值各为0，而后者为1","前者各字节的最高位二进制值各为1、0，而后者为0、1","前者各字节的最高位二进制值各为0、1，而后者为1、0"],
    answer: "前者各字节的最高位二进制值各为1，而后者为0",
    analysis: "国标码是汉字信息交换的标准编码，但因其前后字节的最高位为0，与ASCII码发生冲突，于是，汉字的机内码采用变形国标码，其变换方法为：将国标码的每个字节都加上128，即将两个字节的最高位由0改1，其余7位不变，因此机内码前后字节最高位都为1。"
  },
  {
    id: "ncre-base-0390",
    topicId: "computer-basics",
    type: "single",
    stem: "一个汉字的机内码与它的国标码之间的差是________。",
    options: ["2020H","4040H","8080H","A0A0H"],
    answer: "8080H",
    analysis: "汉字的内码＝汉字的国标码＋8080H。"
  },
  {
    id: "ncre-base-0391",
    topicId: "computer-basics",
    type: "single",
    stem: "一个汉字的内码长度为2个字节，其每个字节的最高二进制位的值依次分别是________。",
    options: ["0,0","0,1","1,0","1,1"],
    answer: "1,1",
    analysis: "国标码是汉字信息交换的标准编码，但因其前后字节的最高位为0，与ASCII码发生冲突，于是，汉字的机内码采用变形国标码，其变换方法为：将国标码的每个字节都加上128，即将两个字节的最高位由0改1，其余7位不变，因此机内码前后字节最高位都为1。"
  },
  {
    id: "ncre-base-0392",
    topicId: "computer-basics",
    type: "single",
    stem: "一个计算机操作系统通常应具有的功能模块是________。",
    options: ["CPU的管理、显示器管理、键盘管理、打印机和鼠标器管理等五大功能","硬盘管理、软盘驱动器管理、CPU的管理、显示器管理和键盘管理等五大功能","处理器(CPU)管理、存储管理、文件管理、输入/输出管理和任务管理五大功能","计算机启动、打印、显示、文件存取和关机等五大功能"],
    answer: "处理器(CPU)管理、存储管理、文件管理、输入/输出管理和任务管理五大功能",
    analysis: "操作系统的主要功能：CPU管理、内存管理、信息管理、设备管理和用户接口。"
  },
  {
    id: "ncre-base-0393",
    topicId: "computer-basics",
    type: "single",
    stem: "一个完整的计算机软件应包含________。",
    options: ["系统软件和应用软件","编辑软件和应用软件","数据库软件和工具软件","程序、相应数据和文档"],
    answer: "系统软件和应用软件",
    analysis: "计算机软件包括系统软件和应用软件两部分。"
  },
  {
    id: "ncre-base-0394",
    topicId: "computer-basics",
    type: "single",
    stem: "一个完整的计算机系统就是指________。",
    options: ["主机、键盘、鼠标器和显示器","硬件系统和操作系统","主机和它的外部设备","软件系统和硬件系统"],
    answer: "软件系统和硬件系统",
    analysis: "一个完整的计算机系统应该包括硬件和软件两部分。"
  },
  {
    id: "ncre-base-0395",
    topicId: "computer-basics",
    type: "single",
    stem: "一个字符的标准ASCII码的长度是________。",
    options: ["7bit","8bit","16bit","6bit"],
    answer: "7bit",
    analysis: "ASCII码采用7位编码表示128个字符。"
  },
  {
    id: "ncre-base-0396",
    topicId: "computer-basics",
    type: "single",
    stem: "一个字长为5位的无符号二进制数能表示的十进制数值范围是（　　）。",
    options: ["1～32","0～31","1～31","0～32"],
    answer: "0～31",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0397",
    topicId: "computer-basics",
    type: "single",
    stem: "一个字长为6位的无符号二进制数能表示的十进制数值范围是（　　）。",
    options: ["0－64","1－64","1－63","0－63"],
    answer: "0－63",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0398",
    topicId: "computer-basics",
    type: "single",
    stem: "一个字长为7位的无符号二进制整数能表示的十进制数值范围是________。",
    options: ["0～256","0～255","0～128","0～127"],
    answer: "0～127",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0399",
    topicId: "computer-basics",
    type: "single",
    stem: "一个字长为8位的无符号二进制整数能表示的十进制数值范围是________。",
    options: ["0－256","0－255","1－256","1－255"],
    answer: "0－255",
    analysis: "无符号二进制数的第一位可为0，所以当全为0时最小值为0，当全为1时最大值为2^8－1＝255。"
  },
  {
    id: "ncre-base-0400",
    topicId: "computer-basics",
    type: "single",
    stem: "一台微机性能的好坏，主要取决于________。",
    options: ["内存储器的容量大小","CPU的性能","显示器的分辨率高低","硬盘的容量"],
    answer: "CPU的性能",
    analysis: "CPU的性能好坏决定了微机性能的好坏。"
  },
  {
    id: "ncre-base-0401",
    topicId: "computer-basics",
    type: "single",
    stem: "一台微型计算机要与局域网连接，必需具有的硬件是（　　）。",
    options: ["集线器","网关","网卡","路由器"],
    answer: "网卡",
    analysis: "用于局域网的基本网络连接设备是网络适配器(网卡)。"
  },
  {
    id: "ncre-base-0402",
    topicId: "computer-basics",
    type: "single",
    stem: "已知\"装\"字的拼音输入码是\"zhuang\"，而\"大\"字的拼音输入码是\"da\"，它们的国标码的长度的字节数分别是________。",
    options: ["6,2","3,1","2,2","4,2"],
    answer: "2,2",
    analysis: "国标码中每个汉字都是用两个字节，不管汉字的形状及拼写。"
  },
  {
    id: "ncre-base-0403",
    topicId: "computer-basics",
    type: "single",
    stem: "已知\"装\"字的拼音输入码是\"zhuang\"，而\"大\"字的拼音输入码是\"da\"，则存储它们内码分别需要的字节个数是________。",
    options: ["6,2","3,1","2,2","3,2"],
    answer: "2,2",
    analysis: "储存一个汉字内码需要用2个字节。"
  },
  {
    id: "ncre-base-0404",
    topicId: "computer-basics",
    type: "single",
    stem: "已知a＝00101010B和b＝40D，下列关系式成立的是________。",
    options: ["a>b","a＝b","a<b","不能比较"],
    answer: "a>b",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0405",
    topicId: "computer-basics",
    type: "single",
    stem: "已知a＝00111000B和b＝2FH，则两者比较的正确不等式是________。",
    options: ["a>b","a＝b","a<b","不能比较"],
    answer: "a>b",
    analysis: "2FH＝00101111B<00111000B，故a>b。"
  },
  {
    id: "ncre-base-0406",
    topicId: "computer-basics",
    type: "single",
    stem: "已知A＝10111110B，B＝AEH，C＝184D，关系成立的不等式是________。",
    options: ["A<B<C","B<C<A","B<A<C","C<B<A"],
    answer: "B<C<A",
    analysis: "A＝10111110B＝190D，B＝AEH＝174D，C＝184D，所以B<C<A。"
  },
  {
    id: "ncre-base-0407",
    topicId: "computer-basics",
    type: "single",
    stem: "已知汉字\"家\"的区位码是2850，则其国标码是________。",
    options: ["4870D","3C52H","9CB2H","A8D0H"],
    answer: "3C52H",
    analysis: "汉字的区位码分为区码和位码，\"家\"的区码是28，位码是50，将区码和位码分别化为十六进制得到1C32H。用1C32H＋2020H＝3C52H(国标码)。"
  },
  {
    id: "ncre-base-0408",
    topicId: "computer-basics",
    type: "single",
    stem: "已知汉字\"中\"的区位码是5448，则其国标码是________。",
    options: ["7468D","3630H","6862H","5650H"],
    answer: "5650H",
    analysis: "汉字的区位码分为区码和位码，\"中\"的区码是54，位码是48，将区码和位码分别化为十六进制得到3630H。用3630H＋2020H＝5650H(国标码)。"
  },
  {
    id: "ncre-base-0409",
    topicId: "computer-basics",
    type: "single",
    stem: "已知三个用不同数制表示的整数A＝00111101B，B＝3CH，C＝64D，则能成立的比较关系是________。",
    options: ["A<B<C","B<C<A","B<A<C","C<B<A"],
    answer: "B<A<C",
    analysis: "数字都转化为二进制数字：64D＝01000000B，3CH＝00111100B，故C>A>B。"
  },
  {
    id: "ncre-base-0410",
    topicId: "computer-basics",
    type: "single",
    stem: "已知三个字符为：a、X和5，按它们的ASCII码值升序排序，结果是________。",
    options: ["5，a，X","a,5，X","X，a,5","5，X，a"],
    answer: "5，X，a",
    analysis: "ASCII码(用十六进制表示)为：a对应61，X对应58，5对应35。"
  },
  {
    id: "ncre-base-0411",
    topicId: "computer-basics",
    type: "single",
    stem: "已知三个字符为：a、Z和8，按它们的ASCII码值升序排序，结果是________。",
    options: ["8，a，Z","a,8，Z","a，Z,8","8，Z，a"],
    answer: "8，Z，a",
    analysis: "ASCII码编码顺序从小到大为：数字、大写字母、小写字母。"
  },
  {
    id: "ncre-base-0412",
    topicId: "computer-basics",
    type: "single",
    stem: "已知一汉字的国标码是5E38，其内码应是________。",
    options: ["DEB8","DE38","5EB8","7E58"],
    answer: "DEB8",
    analysis: "汉字的内码＝汉字的国标码＋8080H，此题内码＝5E38H＋8080H＝DEB8H。"
  },
  {
    id: "ncre-base-0413",
    topicId: "computer-basics",
    type: "single",
    stem: "已知英文字母m的ASCII码值为109，那么英文字母p的ASCII码值是________。",
    options: ["112","113","111","114"],
    answer: "112",
    analysis: "m的ASCII码值为109，因为字母的ASCII码值是连续的，109＋3＝112，即p的ASCII码值为112。"
  },
  {
    id: "ncre-base-0414",
    topicId: "computer-basics",
    type: "single",
    stem: "已知英文字母m的ASCII码值为6DH，那么，码值为4DH的字母是________。",
    options: ["N","M","P","L"],
    answer: "M",
    analysis: "大小写字母的ASCII码相差20(用十六进制表示)。"
  },
  {
    id: "ncre-base-0415",
    topicId: "computer-basics",
    type: "single",
    stem: "已知英文字母m的ASCII码值为6DH，那么ASCII码值为70H的英文字母是________。",
    options: ["P","Q","p","j"],
    answer: "p",
    analysis: "70H－6DH＝3，则m向后数3个是p。"
  },
  {
    id: "ncre-base-0416",
    topicId: "computer-basics",
    type: "single",
    stem: "已知英文字母m的ASCII码值为6DH，那么字母q的ASCII码值是（　　）。",
    options: ["70H","71H","72H","6FH"],
    answer: "71H",
    analysis: "q的ASCII码(用十六进制表示)为：6D＋4＝71。"
  },
  {
    id: "ncre-base-0417",
    topicId: "computer-basics",
    type: "single",
    stem: "以下关于电子邮件的说法，不正确的是________。",
    options: ["电子邮件的英文简称是E－mail","加入因特网的每个用户通过申请都可以得到一个\"电子信箱\"","在一台计算机上申请的\"电子信箱\"，以后只有通过这台计算机上网才能收信","一个人可以申请多个电子信箱"],
    answer: "在一台计算机上申请的\"电子信箱\"，以后只有通过这台计算机上网才能收信",
    analysis: "在一台计算机上申请的电子信箱，不必一定要通过这台计算机收信，通过其他的计算机也可以。"
  },
  {
    id: "ncre-base-0418",
    topicId: "computer-basics",
    type: "single",
    stem: "以下关于流媒体技术的说法中，错误的是　　　。",
    options: ["实现流媒体需要合适的缓存","媒体文件全部下载完成才可以播放","流媒体可用于在线直播等方面","流媒体格式包括asf、rm、ra等"],
    answer: "媒体文件全部下载完成才可以播放",
    analysis: "流媒体指的是一种媒体格式,它采用流式传输方式在因特网播放。流式传输时,音/视频文件由流媒体服务器向用户计算机连续、实时地传送。用户无需等整个文件都下载完才观看,既可以\"边下载边播放\"。"
  },
  {
    id: "ncre-base-0419",
    topicId: "computer-basics",
    type: "single",
    stem: "以下说法中，正确的是________。",
    options: ["域名服务器(DNS)中存放Internet主机的IP地址","域名服务器(DNS)中存放Internet主机的域名","域名服务器(DNS)中存放Internet主机域名与IP地址的对照表","域名服务器(DNS)中存放Internet主机的电子邮箱的地址"],
    answer: "域名服务器(DNS)中存放Internet主机域名与IP地址的对照表",
    analysis: "域名服务器中存放Internet主机域名与IP地址的对照表。"
  },
  {
    id: "ncre-base-0420",
    topicId: "computer-basics",
    type: "single",
    stem: "因特网上的服务都是基于某一种协议的，Web服务是基于　　　。",
    options: ["SMTP协议","SNMP协议","HTTP协议","TELNET协议"],
    answer: "HTTP协议",
    analysis: "Web是建立在客户机/服务器模型之上的,以HTTP协议为基础。"
  },
  {
    id: "ncre-base-0421",
    topicId: "computer-basics",
    type: "single",
    stem: "因特网属于　　　。",
    options: ["万维网","广域网","城域网","局域网"],
    answer: "广域网",
    analysis: "因特网(Internet)是通过路由器将世界不同地区、不同规模的网络相互连接起来的大型网络,是全球计算机的互联网,属于广域网。"
  },
  {
    id: "ncre-base-0422",
    topicId: "computer-basics",
    type: "single",
    stem: "英文缩写CAI的中文意思是________。",
    options: ["计算机辅助教学","计算机辅助制造","计算机辅助设计","计算机辅助管理"],
    answer: "计算机辅助教学",
    analysis: "计算机辅助设计是CAD，计算机辅助教育是CAI，计算机辅助制造CAM。"
  },
  {
    id: "ncre-base-0423",
    topicId: "computer-basics",
    type: "single",
    stem: "英文缩写CAM的中文意思是________。",
    options: ["计算机辅助设计","计算机辅助制造","计算机辅助教学","计算机辅助管理"],
    answer: "计算机辅助制造",
    analysis: "选项A计算机辅助设计是CAD；选项C计算机辅助教学是CAI。"
  },
  {
    id: "ncre-base-0424",
    topicId: "computer-basics",
    type: "single",
    stem: "英文缩写ISP指的是________。",
    options: ["电子邮局","电信局","Internet服务商","供他人浏览的网页"],
    answer: "Internet服务商",
    analysis: "ISP(Internet Services Provider)国际互联网络服务提供商。"
  },
  {
    id: "ncre-base-0425",
    topicId: "computer-basics",
    type: "single",
    stem: "英文缩写ROM的中文名译名是________。",
    options: ["高速缓冲存储器","只读存储器","随机存取存储器","优盘"],
    answer: "只读存储器",
    analysis: "选项A高速缓冲存储器是Cache，选项C随机存取存储器为RAM。"
  },
  {
    id: "ncre-base-0426",
    topicId: "computer-basics",
    type: "single",
    stem: "影响一台计算机性能的关键部件是________。",
    options: ["CD－ROM","硬盘","CPU","显示器"],
    answer: "CPU",
    analysis: "CPU是计算机的核心部件。"
  },
  {
    id: "ncre-base-0427",
    topicId: "computer-basics",
    type: "single",
    stem: "硬盘属于________。",
    options: ["内部存储器","外部存储器","只读存储器","输出设备"],
    answer: "外部存储器",
    analysis: "硬盘是外部存储器。"
  },
  {
    id: "ncre-base-0428",
    topicId: "computer-basics",
    type: "single",
    stem: "拥有计算机并以拨号方式接入Internet网的用户需要使用________。",
    options: ["CD－ROM","鼠标","软盘","Modem"],
    answer: "Modem",
    analysis: "计算机以拨号接入Internet网时是用的电话线，但它只能传输模拟信号，如果要传输数字信号必须用调制解调器(Modem)把它转化为模拟信号。"
  },
  {
    id: "ncre-base-0429",
    topicId: "computer-basics",
    type: "single",
    stem: "用\"综合业务数字网\"(又称\"一线通\")接入因特网的优点是上网通话两不误，它的英文缩写是________。",
    options: ["ADSL","ISDN","ISP","TCP"],
    answer: "ISDN",
    analysis: "ISDN(Integrated Service Digital Network)综合业务数字网，ADSL (Asymmetric Digital Subscriber Line )非对称数字用户线路，ISP(Internet Services Provider)国际互联网络服务提供者，TCP(Transmission Control Protocol)传输控制协定。"
  },
  {
    id: "ncre-base-0430",
    topicId: "computer-basics",
    type: "single",
    stem: "用8位二进制数能表示的最大的无符号整数等于十进制整数________。",
    options: ["255","256","128","127"],
    answer: "255",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0431",
    topicId: "computer-basics",
    type: "single",
    stem: "用GHz来衡量计算机的性能，它指的是计算机的________。",
    options: ["CPU时钟主频","存储器容量","字长","CPU运算速度"],
    answer: "CPU时钟主频",
    analysis: "MIPS是运算速度，MB是存储容量。"
  },
  {
    id: "ncre-base-0432",
    topicId: "computer-basics",
    type: "single",
    stem: "用高级程序设计语言编写的程序（　　）。",
    options: ["计算机能直接执行","具有良好的可读性和可移植性","执行效率高但可读性差","依赖于具体机器，可移植性差"],
    answer: "具有良好的可读性和可移植性",
    analysis: "选项A高级语言必须要经过翻译成机器语言后才能被计算机执行；选项C高级语言执行效率低，可读性好；选项D高级语言不依赖于计算机，所以可移植性好，故B项正确。"
  },
  {
    id: "ncre-base-0433",
    topicId: "computer-basics",
    type: "single",
    stem: "用高级程序设计语言编写的程序，要转换成等价的可执行程序，必须经过________。",
    options: ["汇编","编辑","解释","编译和链接"],
    answer: "编译和链接",
    analysis: "高级语言程序编译成目标程序，通过链接将目标程序链接成可执行程序"
  },
  {
    id: "ncre-base-0434",
    topicId: "computer-basics",
    type: "single",
    stem: "用高级程序设计语言编写的程序________。",
    options: ["计算机能直接执行","可读性和可移植性好","可读性差但执行效率高","依赖于具体机器，不可移植"],
    answer: "可读性和可移植性好",
    analysis: "高级语言程序要经过编译链接后才能执行，执行效率低，具有良好的可读性和可移植性。"
  },
  {
    id: "ncre-base-0435",
    topicId: "computer-basics",
    type: "single",
    stem: "用高级程序设计语言编写的程序称为源程序，它________。",
    options: ["只能在专门的机器上运行","无需编译或解释，可直接在机器上运行","可读性不好","具有良好的可读性和可移植性"],
    answer: "具有良好的可读性和可移植性",
    analysis: "高级语言程序要经过编译链接后才能执行，执行效率低，具有良好的可读性和可移植性。"
  },
  {
    id: "ncre-base-0436",
    topicId: "computer-basics",
    type: "single",
    stem: "用户名为XUEJY的正确电子邮件地址是________。",
    options: ["XUEJY @ bj163.com","XUEJYbj163.com","XUEJY#bj163.com","XUEJY@bj163.com"],
    answer: "XUEJY@bj163.com",
    analysis: "电子邮件地址由以下几个部分组成：用户名@域名．后缀，且地址中间不允许有空格或逗号。"
  },
  {
    id: "ncre-base-0437",
    topicId: "computer-basics",
    type: "single",
    stem: "用来存储当前正在运行的应用程序的存储器是（　　）。",
    options: ["内存","硬盘","软盘","CD－ROM"],
    answer: "内存",
    analysis: "内存用来存储正在运行的程序和处理的数据。"
  },
  {
    id: "ncre-base-0438",
    topicId: "computer-basics",
    type: "single",
    stem: "用来存储当前正在运行的应用程序和其相应数据的存储器是________。",
    options: ["RAM","硬盘","ROM","CD－ROM"],
    answer: "RAM",
    analysis: "存储计算机当前正在执行的应用程序和相应数据的存储器是RAM，ROM为只读存储器。"
  },
  {
    id: "ncre-base-0439",
    topicId: "computer-basics",
    type: "single",
    stem: "用来存储当前正在运行的应用程序及相应数据的存储器是________。",
    options: ["ROM","硬盘","RAM","CD－ROM"],
    answer: "RAM",
    analysis: "存储计算机当前正在执行的应用程序和相应数据的存储器是RAM，ROM为只读存储器。"
  },
  {
    id: "ncre-base-0440",
    topicId: "computer-basics",
    type: "single",
    stem: "用来控制、指挥和协调计算机各部件工作的是________。",
    options: ["运算器","鼠标器","控制器","存储器"],
    answer: "控制器",
    analysis: "控制器的主要功能是指挥全机各个部件自动、协调的工作。"
  },
  {
    id: "ncre-base-0441",
    topicId: "computer-basics",
    type: "single",
    stem: "有关计算机软件，下列说法错误的是　　　。",
    options: ["操作系统的种类繁多，按照其功能和特性可分为批处理操作系统、分时操作系统和实时操作系统等；按照同时管理用户数的多少分为单用户操作系统和多用户操作系统","操作系统提供了一个软件运行的环境，是最重要的系统软件","Microsoft Office软件是Windows环境下的办公软件，但它并不能用于其他操作系统环境","操作系统的功能主要是管理，即管理计算机的所有软件资源，硬件资源不归操作系统管理"],
    answer: "操作系统的功能主要是管理，即管理计算机的所有软件资源，硬件资源不归操作系统管理",
    analysis: "操作系统是控制和管理计算机硬件和软件资源并为用户提供方便的操作环境的程序集合,它是计算机硬件和用户间的接口。"
  },
  {
    id: "ncre-base-0442",
    topicId: "computer-basics",
    type: "single",
    stem: "有一域名为bit.edu.cn，根据域名代码的规定，此域名表示（　　）。",
    options: ["政府机关","商业组织","军事部门","教育机构"],
    answer: "教育机构",
    analysis: "选项A政府机关的域名为.gov；选项B商业组织的域名为.com；选项C军事部门的域名为.mil。"
  },
  {
    id: "ncre-base-0443",
    topicId: "computer-basics",
    type: "single",
    stem: "与十进制数245等值的二进制数是______。",
    options: ["11111110","11101111","11111011","11101110"],
    answer: "11111110",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0444",
    topicId: "computer-basics",
    type: "single",
    stem: "与十六进制数CD等值的十进制数是______。",
    options: ["204","205","206","203"],
    answer: "205",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0445",
    topicId: "computer-basics",
    type: "single",
    stem: "域名MH.BIT.EDU.CN中主机名是________。",
    options: ["MH","EDU","CN","BIT"],
    answer: "MH",
    analysis: "域名标准的四个部分，依次是：服务器(主机名)、域、机构、国家。"
  },
  {
    id: "ncre-base-0446",
    topicId: "computer-basics",
    type: "single",
    stem: "运算器(ALU)的功能是________。",
    options: ["只能进行逻辑运算","对数据进行算术运算或逻辑运算","只能进行算术运算","做初等函数的计算"],
    answer: "对数据进行算术运算或逻辑运算",
    analysis: "运算器的主要功能是对二进制数码进行算术运算或逻辑运算。"
  },
  {
    id: "ncre-base-0447",
    topicId: "computer-basics",
    type: "single",
    stem: "在ASCII码表中，根据码值由小到大的排列顺序是________。",
    options: ["空格字符、数字符、大写英文字母、小写英文字母","数字符、空格字符、大写英文字母、小写英文字母","空格字符、数字符、小写英文字母、大写英文字母","数字符、大写英文字母、小写英文字母、空格字符"],
    answer: "空格字符、数字符、大写英文字母、小写英文字母",
    analysis: "ASCII码编码顺序从小到大为：空格、数字、大写字母、小写字母。"
  },
  {
    id: "ncre-base-0448",
    topicId: "computer-basics",
    type: "single",
    stem: "在CD光盘上标记有\"CD－RW\"字样，此标记表明这光盘（　　）。",
    options: ["只能写入一次，可以反复读出的一次性写入光盘","可多次擦除型光盘","只能读出，不能写入的只读光盘","RW是Read and Write的缩写"],
    answer: "可多次擦除型光盘",
    analysis: "CD－RW是可擦除型光盘，用户可以多次对其进行读/写。CD－RW的全称是CD－ReWritable。"
  },
  {
    id: "ncre-base-0449",
    topicId: "computer-basics",
    type: "single",
    stem: "在Internet中完成从域名到IP地址或者从IP到域名转换的是　　　服务。",
    options: ["DNS","FTP","WWW","ADSL"],
    answer: "DNS",
    analysis: "在Internet上域名与IP地址之间是一一对应的,域名虽然便于人们记忆,但机器之间只能互相认识IP地址,它们之间的转换工作称为域名解析,域名解析需要由专门的域名解析服务器来完成,DNS就是进行域名解析的服务器。"
  },
  {
    id: "ncre-base-0450",
    topicId: "computer-basics",
    type: "single",
    stem: "在标准ASCII编码表中，数字码、小写英文字母和大写英文字母的前后次序是________。",
    options: ["数字、小写英文字母、大写英文字母","小写英文字母、大写英文字母、数字","数字、大写英文字母、小写英文字母","大写英文字母、小写英文字母、数字"],
    answer: "数字、大写英文字母、小写英文字母",
    analysis: "ASCII码编码顺序从小到大为：数字、大写字母、小写字母。"
  },
  {
    id: "ncre-base-0451",
    topicId: "computer-basics",
    type: "single",
    stem: "在标准ASCII码表中，根据码值由小到大的排列原则，下列字符组的排列顺序是________。",
    options: ["空格字符、数字符、小写英文字母、大写英文字母","数字符、大写英文字母、小写英文字母、空格字符","空格字符、数字符、大写英文字母、小写英文字母","数字符、小写英文字母、大写英文字母、空格字符"],
    answer: "空格字符、数字符、大写英文字母、小写英文字母",
    analysis: "ASCII码编码顺序从小到大为：空格、数字、大写字母、小写字母。"
  },
  {
    id: "ncre-base-0452",
    topicId: "computer-basics",
    type: "single",
    stem: "在标准ASCII码表中，已知英文字母A的ASCII码是01000001，英文字母D的ASCII码是________。",
    options: ["01000011","01000100","01000101","01000110"],
    answer: "01000100",
    analysis: "D在A的后面，相差3，D的ASCII码＝A的ASCII码＋3＝01000001＋11＝01000100。"
  },
  {
    id: "ncre-base-0453",
    topicId: "computer-basics",
    type: "single",
    stem: "在标准ASCII码表中，已知英文字母A的ASCII码是01000001，英文字母F的ASCII码是________。",
    options: ["01000011","01000100","01000101","01000110"],
    answer: "01000110",
    analysis: "F在A的后面，相差5，F的ASCII码＝A的ASCII码＋5＝01000001＋101＝01000110。"
  },
  {
    id: "ncre-base-0454",
    topicId: "computer-basics",
    type: "single",
    stem: "在标准ASCII码表中，已知英文字母A的ASCII码是01000001，则英文字母E的ASCII码是________。",
    options: ["01000011","01000100","01000101","01000010"],
    answer: "01000101",
    analysis: "E在A的后面，相差4，E的ASCII码＝A的ASCII码＋4＝01000001＋100＝01000101。"
  },
  {
    id: "ncre-base-0455",
    topicId: "computer-basics",
    type: "single",
    stem: "在标准ASCII码表中，已知英文字母A的十进制码值是65，英文字母a的十进制码值是________。",
    options: ["95","96","97","91"],
    answer: "97",
    analysis: "ASCII码(用十六进制表示)为：A对应41，a对应61，二者相差20(十六进制)，换算为十进制即相差32，a的ASCII码(用十进制表示)为：65＋32＝97。"
  },
  {
    id: "ncre-base-0456",
    topicId: "computer-basics",
    type: "single",
    stem: "在标准ASCII码表中，已知英文字母D的ASCII码是01000100，英文字母A的ASCII码是________。",
    options: ["01000001","01000010","01000011","01000000"],
    answer: "01000001",
    analysis: "A在D前面3个，A的ASCII码＝D的ASCII码－3＝01000100－11＝01000001B。"
  },
  {
    id: "ncre-base-0457",
    topicId: "computer-basics",
    type: "single",
    stem: "在标准ASCII码表中，已知英文字母D的ASCII码是01000100，英文字母B的ASCII码是________。",
    options: ["01000001","01000010","01000011","01000000"],
    answer: "01000010",
    analysis: "B在D前2个数，所以，B的ASCII码＝D的ASCII码－2＝01000100－10＝01000010。"
  },
  {
    id: "ncre-base-0458",
    topicId: "computer-basics",
    type: "single",
    stem: "在标准ASCII码表中，已知英文字母K的十进制码值是75，英文字母k的十进制码值是________。",
    options: ["107","101","105","106"],
    answer: "107",
    analysis: "其中K和k的ASCII码二者相差20(十六进制)，换算为十进制即相差32，k的ASCII码(用十进制表示)为：75＋32＝107。"
  },
  {
    id: "ncre-base-0459",
    topicId: "computer-basics",
    type: "single",
    stem: "在标准ASCII码表中，英文字母a和A的码值之差的十进制值是________。",
    options: ["20","32","－20","－32"],
    answer: "32",
    analysis: "ASCII码(用十六进制表示)为：A对应41，a对应61，a与A之差为20(十六进制)，换算为十进制为2×16＝32。"
  },
  {
    id: "ncre-base-0460",
    topicId: "computer-basics",
    type: "single",
    stem: "在计算机的硬件技术中，构成存储器的最小单位是________。",
    options: ["字节(Byte)","二进制位(bit)","字(Word)","双字(Double Word)"],
    answer: "字节(Byte)",
    analysis: "度量存储空间大小的单位有B、KB、MB、GB、TB。"
  },
  {
    id: "ncre-base-0461",
    topicId: "computer-basics",
    type: "single",
    stem: "在计算机内部对汉字进行存储、处理和传输的汉字编码是　　　。",
    options: ["汉字信息交换码","汉字输入码","汉字内码","汉字字形码"],
    answer: "汉字字形码",
    analysis: "在计算机内部对汉字进行存储、处理和传输的汉字代码是汉字内码。"
  },
  {
    id: "ncre-base-0462",
    topicId: "computer-basics",
    type: "single",
    stem: "在计算机内部用来传送、存储、加工处理的数据或指令所采用的形式是________。",
    options: ["十进制码","二进制码","八进制码","十六进制码"],
    answer: "二进制码",
    analysis: "计算机内部采用二进制进行数据交换和处理。"
  },
  {
    id: "ncre-base-0463",
    topicId: "computer-basics",
    type: "single",
    stem: "在计算机术语中，bit的中文含义是　　　。",
    options: ["位","字节","字","字长"],
    answer: "位",
    analysis: "计算机中最小的数据单位称为位,英文名是bit。"
  },
  {
    id: "ncre-base-0464",
    topicId: "computer-basics",
    type: "single",
    stem: "在计算机网络中，英文缩写LAN的中文名是________。",
    options: ["局域网","城域网","广域网","无线网"],
    answer: "局域网",
    analysis: "WAN为广域网，MAN为城域网。"
  },
  {
    id: "ncre-base-0465",
    topicId: "computer-basics",
    type: "single",
    stem: "在计算机网络中，英文缩写WAN的中文名是________。",
    options: ["局域网","无线网","广域网","城域网"],
    answer: "广域网",
    analysis: "WAN为广域网，MAN为城域网，LAN为局域网。"
  },
  {
    id: "ncre-base-0466",
    topicId: "computer-basics",
    type: "single",
    stem: "在计算机硬件技术指标中，度量存储器空间大小的基本单位是________。",
    options: ["字节(Byte)","二进位(bit)","字(Word)","双字(Double Word)"],
    answer: "字节(Byte)",
    analysis: "度量存储空间大小的单位有B、KB、MB、GB、TB。"
  },
  {
    id: "ncre-base-0467",
    topicId: "computer-basics",
    type: "single",
    stem: "在计算机指令中，规定其所执行操作功能的部分称为________。",
    options: ["地址码","源操作数","操作数","操作码"],
    answer: "操作码",
    analysis: "计算机指令中操作码规定所执行的操作，操作数规定参与所执行操作的数据。"
  },
  {
    id: "ncre-base-0468",
    topicId: "computer-basics",
    type: "single",
    stem: "在计算机中，对汉字进行传输、处理和存储时使用汉字的________。",
    options: ["字形码","国标码","输入码","机内码"],
    answer: "机内码",
    analysis: "显示或打印汉字时使用汉字的字形码，在计算机内部时使用汉字的机内码。"
  },
  {
    id: "ncre-base-0469",
    topicId: "computer-basics",
    type: "single",
    stem: "在计算机中，每个存储单元都有一个连续的编号，此编号称为（　　）。",
    options: ["地址","位置号","门牌号","房号"],
    answer: "地址",
    analysis: "计算机中，每个存储单元的编号称为单元地址"
  },
  {
    id: "ncre-base-0470",
    topicId: "computer-basics",
    type: "single",
    stem: "在计算机中，鼠标器属于________。",
    options: ["输出设备","菜单选取设备","输入设备","应用程序的控制设备"],
    answer: "输入设备",
    analysis: "鼠标器是输入设备。"
  },
  {
    id: "ncre-base-0471",
    topicId: "computer-basics",
    type: "single",
    stem: "在计算机中，条码阅读器属于________。",
    options: ["输入设备","存储设备","输出设备","计算设备"],
    answer: "输入设备",
    analysis: "条形码阅读器属于输入设备。"
  },
  {
    id: "ncre-base-0472",
    topicId: "computer-basics",
    type: "single",
    stem: "在计算机中，信息的最小单位是________。",
    options: ["bit","Byte","Word","DoubleWord"],
    answer: "bit",
    analysis: "信息的最小单位是bit，信息存储的最小单位是Byte。"
  },
  {
    id: "ncre-base-0473",
    topicId: "computer-basics",
    type: "single",
    stem: "在所列出的：1、字处理软件，2、Linux,3、UNIX,4、学籍管理系统，5、Windows Xp和6、Office 2003这六个软件中，属于系统软件的有（　　）。",
    options: ["1,2,3","2,3,5","1,2,3,5","全部都不是"],
    answer: "2,3,5",
    analysis: "字处理软件、学籍管理系统、Office 2010属于应用软件。"
  },
  {
    id: "ncre-base-0474",
    topicId: "computer-basics",
    type: "single",
    stem: "在所列的软件中，1、WPS Office 2003；2、Windows 2000；3、财务管理软件；4、UNIX；5、学籍管理系统；6、MS－DOS；7、Linux；属于应用软件的有________。",
    options: ["1,2,3","1,3,5","1,3,5,7","2,4,6,7"],
    answer: "1,3,5",
    analysis: "Windows 7、UNIX、MS－DOS、Linux为系统软件。"
  },
  {
    id: "ncre-base-0475",
    topicId: "computer-basics",
    type: "single",
    stem: "在外部设备中，扫描仪属于________。",
    options: ["输出设备","存储设备","输入设备","特殊设备"],
    answer: "输入设备",
    analysis: "扫描仪属于输入设备。"
  },
  {
    id: "ncre-base-0476",
    topicId: "computer-basics",
    type: "single",
    stem: "在微机的配置中常看到\"P42.4G\"字样，其中数字\"2.4G\"表示________。",
    options: ["处理器的时钟频率是2.4GHz","处理器的运算速度是2.4GIPS","处理器是Pentium4第2.4代","处理器与内存间的数据交换速率是2.4GB/S"],
    answer: "处理器的时钟频率是2.4GHz",
    analysis: "P代表奔腾系列，4代表此系列的第4代产品，2.4G是CPU的频率，单位是Hz"
  },
  {
    id: "ncre-base-0477",
    topicId: "computer-basics",
    type: "single",
    stem: "在微机的硬件设备中，有一种设备在程序设计中既可以当做输出设备，又可以当做输入设备，这种设备是________。",
    options: ["绘图仪","扫描仪","手写笔","磁盘驱动器"],
    answer: "磁盘驱动器",
    analysis: "绘图仪是输出设备，扫描仪是输入设备，手写笔是输入设备，磁盘驱动器既能将存储在磁盘上的信息读进内存中，又能将内存中的信息写到磁盘上。因此，就认为它既是输入设备，又是输出设备。"
  },
  {
    id: "ncre-base-0478",
    topicId: "computer-basics",
    type: "single",
    stem: "在微机系统中，麦克风属于________。",
    options: ["输入设备","输出设备","放大设备","播放设备"],
    answer: "输入设备",
    analysis: "麦克风属于输入设备。"
  },
  {
    id: "ncre-base-0479",
    topicId: "computer-basics",
    type: "single",
    stem: "在微机中，1GB的等于________。",
    options: ["1024×1024Bytes","1024KB","1024MB","1000MB"],
    answer: "1024MB",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0480",
    topicId: "computer-basics",
    type: "single",
    stem: "在微机中，西文字符所采用的编码是________。",
    options: ["EBCDIC码","ASCII码","国标码","BCD码"],
    answer: "ASCII码",
    analysis: "西文字符采用ASCII码编码。"
  },
  {
    id: "ncre-base-0481",
    topicId: "computer-basics",
    type: "single",
    stem: "在微型计算机技术中，通过系统　　　把CPU、存储器、输入设备和输出设备连接起来，实现信息交换。",
    options: ["总线","I/O接口","电缆","通道"],
    answer: "总线",
    analysis: "在计算机的硬件系统中,通过总线将CPU、存储器、I/O连接起来进行信息交换。"
  },
  {
    id: "ncre-base-0482",
    topicId: "computer-basics",
    type: "single",
    stem: "在微型计算机内部，对汉字进行传输、处理和存储时使用汉字的________。",
    options: ["国标码","字形码","输入码","机内码"],
    answer: "机内码",
    analysis: "显示或打印汉字时使用汉字的字形码，在计算机内部时使用汉字的机内码。"
  },
  {
    id: "ncre-base-0483",
    topicId: "computer-basics",
    type: "single",
    stem: "在微型计算机内存储器中不能用指令修改其存储内容的部分是______。",
    options: ["RAM","DRAM","ROM","SRAM"],
    answer: "ROM",
    analysis: "ROM为只读存储器，一旦写入，不能对其内容进行修改。"
  },
  {
    id: "ncre-base-0484",
    topicId: "computer-basics",
    type: "single",
    stem: "在下列各种编码中，每个字节最高位均是\"1\"的是　　　。",
    options: ["外码","汉字机内码","汉字国标码","ASCII码"],
    answer: "汉字机内码",
    analysis: "汉字内码是计算机内部对汉字进行存储、处理和传输的汉字代码。在计算机中汉字系统普遍采用存储一个汉字内码用2个字节,并且每个字节的最高位都固定为\"1\"。"
  },
  {
    id: "ncre-base-0485",
    topicId: "computer-basics",
    type: "single",
    stem: "在下列设备中，不能作为微机输出设备的是（　　）。",
    options: ["打印机","显示器","鼠标器","绘图仪"],
    answer: "鼠标器",
    analysis: "鼠标器是输入设备。"
  },
  {
    id: "ncre-base-0486",
    topicId: "computer-basics",
    type: "single",
    stem: "在下列网络的传输介质中，抗干扰能力最好的一个是________。",
    options: ["光缆","同轴电缆","双绞线","电话线"],
    answer: "光缆",
    analysis: "光缆的抗干扰能力最好。"
  },
  {
    id: "ncre-base-0487",
    topicId: "computer-basics",
    type: "single",
    stem: "在下列叙述中，正确的选项是　　　。",
    options: ["用高级语言编写的程序称为源程序","计算机直接识别并执行的是汇编语言编写的程序","机器语言编写的程序需编译和链接后才能执行","机器语言编写的程序具有良好的可移植性"],
    answer: "用高级语言编写的程序称为源程序",
    analysis: "汇编语言无法直接执行,汇编语言写的程序必须先翻译成机器语言才能执行,故B的说法错误。机器语言是计算机唯一能直接理解和执行的语言,无需\"翻译\",所以C的说法错误。机器语言只是针对特定的机器,可移植性差,故D的说法错误。"
  },
  {
    id: "ncre-base-0488",
    topicId: "computer-basics",
    type: "single",
    stem: "在下列字符中，其ASCII码值最大的一个是（　　）。",
    options: ["9","Z","d","X"],
    answer: "d",
    analysis: "ASCII码(用十六进制表示)为：9对应39，Z对应5A，X对应58，d对应64。"
  },
  {
    id: "ncre-base-0489",
    topicId: "computer-basics",
    type: "single",
    stem: "在下列字符中，其ASCII码值最大的一个是________。",
    options: ["Z","9","空格字符","a"],
    answer: "a",
    analysis: "ASCII码(用十六进制表示)为：空格对应20，9对应39，Z对应5A，a对应61。"
  },
  {
    id: "ncre-base-0490",
    topicId: "computer-basics",
    type: "single",
    stem: "在下列字符中，其ASCII码值最大的一个是________。",
    options: ["空格字符","9","Z","a"],
    answer: "a",
    analysis: "ASCII码(用十六进制表示)为：空格对应20,9对应39，Z对应5A，a对应61。"
  },
  {
    id: "ncre-base-0491",
    topicId: "computer-basics",
    type: "single",
    stem: "在下列字符中，其ASCII码值最小的一个是________。",
    options: ["空格字符","0","A","a"],
    answer: "空格字符",
    analysis: "ASCII码(用十六进制表示)为：空格对应20，0对应30，A对应41，a对应61。"
  },
  {
    id: "ncre-base-0492",
    topicId: "computer-basics",
    type: "single",
    stem: "在下列字符中，其ASCII码值最小的一个是________。",
    options: ["9","p","Z","a"],
    answer: "9",
    analysis: "ASCII码(用十六进制表示)为：9对应39，p对应70，Z对应5A，a对应61。"
  },
  {
    id: "ncre-base-0493",
    topicId: "computer-basics",
    type: "single",
    stem: "在现代的CPU芯片中又集成了高速缓冲存储器(Cache)，其作用是________。",
    options: ["扩大内存储器的容量","解决CPU与RAM之间的速度不匹配问题","解决CPU与打印机的速度不匹配问题","保存当前的状态信息"],
    answer: "解决CPU与RAM之间的速度不匹配问题",
    analysis: "高速缓冲存储器负责整个CPU与内存之间的缓冲。"
  },
  {
    id: "ncre-base-0494",
    topicId: "computer-basics",
    type: "single",
    stem: "在一个非零无符号二进制整数之后添加一个0，则此数的值为原数的（　　）。",
    options: ["4倍","2倍","1/2倍","1/4倍"],
    answer: "2倍",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0495",
    topicId: "computer-basics",
    type: "single",
    stem: "在一间办公室内要实现所有计算机联网，一般应选择　　　网。",
    options: ["GAN","MAN","LAN","WAN"],
    answer: "LAN",
    analysis: "局域网一般位于一个建筑物或一个单位内,局域网在计算机数量配置上没有太多的限制,少的可以只有两台,多的可达几百台。一般来说在企业局域网中,工作站的数量在几十台到两百台左右。"
  },
  {
    id: "ncre-base-0496",
    topicId: "computer-basics",
    type: "single",
    stem: "在因特网技术中，缩写ISP的中文全名是________。",
    options: ["因特网服务提供商(Internet Service Provider)","因特网服务产品(Internet Service Product)","因特网服务协议(Internet Service Protocol)","因特网服务程序(Internet Service Program)"],
    answer: "因特网服务提供商(Internet Service Provider)",
    analysis: "ISP全称为Internet Service Provider，即因特网服务提供商，能提供上网服务、网上浏览、下载文件、收发电子邮件等服务，ISP是掌握Internet接口的机构。"
  },
  {
    id: "ncre-base-0497",
    topicId: "computer-basics",
    type: "single",
    stem: "在因特网上，一台计算机可以作为另一台主机的远程终端，使用该主机的资源，该项服务称为________。",
    options: ["Telnet","BBS","FTP","WWW"],
    answer: "FTP",
    analysis: "Telnet为远程登录，BBS为电子布告栏系统，WWW为全球资讯网。"
  },
  {
    id: "ncre-base-0498",
    topicId: "computer-basics",
    type: "single",
    stem: "正确的IP地址是________。",
    options: ["202.112.111.1","202.2.2.2.2","202.202.1","202.257.14.13"],
    answer: "202.112.111.1",
    analysis: "IP地址是由4个字节组成的，习惯写法是将每个字节作为一段并以十进制数来表示，而且段间用\".\"分隔。每个段的十进制数范围是0～255。"
  },
  {
    id: "ncre-base-0499",
    topicId: "computer-basics",
    type: "single",
    stem: "执行二进制逻辑乘运算(即逻辑与运算)01011001∧10100111其运算结果是______。",
    options: ["00000000","1111111","00000001","1111110"],
    answer: "00000001",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0500",
    topicId: "computer-basics",
    type: "single",
    stem: "执行二进制算术加运算001001＋00100111其运算结果是______。",
    options: ["11101111","11110000","00000001","10100010"],
    answer: "11110000",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0501",
    topicId: "computer-basics",
    type: "single",
    stem: "执行二进制算术加运算盘11001001＋00100111其运算结果是______。",
    options: ["11101111","11110000","00000001","10100010"],
    answer: "11110000",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0502",
    topicId: "computer-basics",
    type: "single",
    stem: "专门为某种用途而设计的计算机，称为　　　计算机。",
    options: ["专用","通用","特殊","模拟"],
    answer: "专用",
    analysis: "专用计算机是专门为某种用途而设计的特殊计算机。"
  },
  {
    id: "ncre-base-0503",
    topicId: "computer-basics",
    type: "single",
    stem: "字符比较大小实际是比较它们的ASCII码值，正确的比较是________。",
    options: ["'A'比'B'大","'H'比'h'小","'F'比'D'小","'9'比'D'大"],
    answer: "'H'比'h'小",
    analysis: "字符的ASCII码从小到大依次为数字、大写字母、小写字母。"
  },
  {
    id: "ncre-base-0504",
    topicId: "computer-basics",
    type: "single",
    stem: "字长是CPU的主要技术性能指标之一，它表示的是________。",
    options: ["CPU的计算结果的有效数字长度","CPU一次能处理二进制数据的位数","CPU能表示的最大的有效数字位数","CPU能表示的十进制整数的位数"],
    answer: "CPU一次能处理二进制数据的位数",
    analysis: "字长是指计算机运算部件一次能同时处理的二进制数据的位数。"
  },
  {
    id: "ncre-base-0505",
    topicId: "computer-basics",
    type: "single",
    stem: "字长是CPU的主要性能指标之一，它表示________。",
    options: ["CPU一次能处理二进制数据的位数","最长的十进制整数的位数","最大的有效数字位数","计算结果的有效数字长度"],
    answer: "CPU一次能处理二进制数据的位数",
    analysis: "字长是指计算机运算部件一次能同时处理的二进制数据的位数。"
  },
  {
    id: "ncre-base-0506",
    topicId: "computer-basics",
    type: "single",
    stem: "字长为6位的无符号二进制整数最大能表示的十进制整数是________。",
    options: ["64","63","32","31"],
    answer: "63",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0507",
    topicId: "computer-basics",
    type: "single",
    stem: "字长为7位的无符号二进制整数能表示的十进制整数的数值范围是________。",
    options: ["0～128","0～255","0～127","1～127"],
    answer: "0～127",
    analysis: "来源：全国计算机等级考试题库（NCRE）。"
  },
  {
    id: "ncre-base-0508",
    topicId: "computer-basics",
    type: "single",
    stem: "组成CPU的主要部件是________。",
    options: ["运算器和控制器","运算器和存储器","控制器和寄存器","运算器和寄存器"],
    answer: "运算器和控制器",
    analysis: "运算器和控制器是CPU的两大部件。"
  },
  {
    id: "ncre-base-0509",
    topicId: "computer-basics",
    type: "single",
    stem: "组成计算机系统的两大部分是________。",
    options: ["硬件系统和软件系统","主机和外部设备","系统软件和应用软件","输入设备和输出设备"],
    answer: "硬件系统和软件系统",
    analysis: "一个完整的计算机系统应该包括硬件和软件两部分。"
  },
  {
    id: "ncre-base-0510",
    topicId: "computer-basics",
    type: "single",
    stem: "组成计算机硬件系统的基本部分是________。",
    options: ["CPU、键盘和显示器","主机和输入/出设备","CPU和输入/出设备","CPU、硬盘、键盘和显示器"],
    answer: "主机和输入/出设备",
    analysis: "计算机的硬件由输入、存储、运算、控制和输出五个部分组成。"
  },
  {
    id: "ncre-base-0511",
    topicId: "computer-basics",
    type: "single",
    stem: "组成计算机指令的两部分是________。",
    options: ["数据和字符","操作码和地址码","运算符和运算数","运算符和运算结果"],
    answer: "操作码和地址码",
    analysis: "计算机指令格式通常包含操作码和操作数(地址码)两部分。"
  },
  {
    id: "ncre-base-0512",
    topicId: "computer-basics",
    type: "single",
    stem: "组成微型机主机的部件是（　　）。",
    options: ["CPU、内存和硬盘","CPU、内存、显示器和键盘","CPU和内存","CPU、内存、硬盘、显示器和键盘套"],
    answer: "CPU和内存",
    analysis: "微型机的主机一般包括CPU、内存、I\\O接口电路、系统总线"
  },
  {
    id: "ncre-base-0513",
    topicId: "computer-basics",
    type: "single",
    stem: "组成微型计算机主机的硬件除CPU外，还有________。",
    options: ["RAM","RAM、ROM和硬盘","RAM和ROM","硬盘和显示器"],
    answer: "RAM和ROM",
    analysis: "微型机的主机一般包括CPU、内存(包括ROM和RAM)、I/O接口电路、系统总线"
  },
  {
    id: "ncre-base-0514",
    topicId: "computer-basics",
    type: "single",
    stem: "组成一个计算机系统的两大部分是________。",
    options: ["系统软件和应用软件","主机和外部设备","硬件系统和软件系统","主机和输入/输出设备"],
    answer: "硬件系统和软件系统",
    analysis: "一个完整的计算机系统应该包括硬件和软件两部分。"
  },
  {
    id: "ncre-base-0515",
    topicId: "computer-basics",
    type: "single",
    stem: "组成一个完整的计算机系统应该包括________。",
    options: ["主机、鼠标器、键盘和显示器","系统软件和应用软件","主机、显示器、键盘和音箱等外部设备","硬件系统和软件系统"],
    answer: "硬件系统和软件系统",
    analysis: "一个完整的计算机系统应该包括硬件和软件两部分。"
  },
];

QUESTIONS.push(...NCRE_BASE_QUESTIONS);

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
