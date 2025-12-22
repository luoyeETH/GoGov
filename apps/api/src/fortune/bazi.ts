type Gender = "male" | "female";
type ZiHourMode = "late" | "early";

export type BaziInput = {
  birthDate: string;
  birthTime?: string | null;
  gender?: Gender | null;
  province?: string | null;
  longitude?: number | null;
  ziHourMode?: ZiHourMode | null;
};

export type BaziResult = {
  year_pillar: string;
  month_pillar: string;
  day_pillar: string;
  hour_pillar: string;
  bazi: [string, string, string, string];
  dayun_start_age: number;
  dayun_direction: "顺行" | "逆行";
  dayun_sequence: string[];
  first_dayun: string;
  true_solar_time: string;
  hour_branch_name: string;
  lunar_date: string;
};

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const MONTH_BRANCHES = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];

const DAY_MS = 86400000;
const SOLAR_SPEED = 0.98564736;
const DAY_CYCLE_OFFSET = 50;

const PROVINCE_LONGITUDES: Record<string, number> = {
  北京: 116.4074,
  天津: 117.2000,
  河北: 114.5149,
  山西: 112.5492,
  内蒙古: 111.6708,
  辽宁: 123.4291,
  吉林: 125.3235,
  黑龙江: 126.6424,
  上海: 121.4737,
  江苏: 118.7969,
  浙江: 120.1551,
  安徽: 117.2830,
  福建: 119.3062,
  江西: 115.8582,
  山东: 117.0009,
  河南: 113.6254,
  湖北: 114.3054,
  湖南: 112.9388,
  广东: 113.2644,
  广西: 108.3200,
  海南: 110.3312,
  重庆: 106.5516,
  四川: 104.0665,
  贵州: 106.6302,
  云南: 102.7123,
  西藏: 91.1721,
  陕西: 108.9398,
  甘肃: 103.8343,
  青海: 101.7782,
  宁夏: 106.2782,
  新疆: 87.6177,
  香港: 114.1694,
  澳门: 113.5439,
  台湾: 121.5654
};

const LUNAR_MONTH_MAP: Record<string, number> = {
  正月: 1,
  二月: 2,
  三月: 3,
  四月: 4,
  五月: 5,
  六月: 6,
  七月: 7,
  八月: 8,
  九月: 9,
  十月: 10,
  十一月: 11,
  十二月: 12,
  腊月: 12
};

function mod(value: number, modValue: number) {
  return ((value % modValue) + modValue) % modValue;
}

function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

function normalizeAngle(value: number) {
  return mod(value, 360);
}

function angleDiff(current: number, target: number) {
  const diff = normalizeAngle(current - target);
  return diff > 180 ? diff - 360 : diff;
}

function parseDateParts(value: string) {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim());
  if (!match) {
    throw new Error("出生日期格式应为 YYYY-MM-DD");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    throw new Error("出生日期无效");
  }
  if (month < 1 || month > 12) {
    throw new Error("出生月份无效");
  }
  const days = new Date(year, month, 0).getDate();
  if (day < 1 || day > days) {
    throw new Error("出生日期无效");
  }
  return { year, month, day };
}

function parseTimeParts(value?: string | null) {
  if (!value) {
    return { hour: 0, minute: 0 };
  }
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new Error("出生时间格式应为 HH:mm");
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error("出生时间无效");
  }
  return { hour, minute };
}

function getJulianDay(date: Date) {
  return date.getTime() / DAY_MS + 2440587.5;
}

function getJulianDayNumber(date: Date) {
  return Math.floor(getJulianDay(date) + 0.5);
}

function getDayOfYear(year: number, month: number, day: number) {
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  return Math.floor((current - start) / DAY_MS) + 1;
}

function getEquationOfTimeMinutes(dayOfYear: number) {
  const angle = degToRad((360 / 365) * (dayOfYear - 81));
  return 9.87 * Math.sin(2 * angle) - 7.53 * Math.cos(angle) - 1.5 * Math.sin(angle);
}

function normalizeMinutes(value: number) {
  let minutes = value;
  let dayOffset = 0;
  while (minutes < 0) {
    minutes += 1440;
    dayOffset -= 1;
  }
  while (minutes >= 1440) {
    minutes -= 1440;
    dayOffset += 1;
  }
  return { minutes, dayOffset };
}

function formatTimeFromMinutes(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = Math.floor(minutes - hour * 60);
  return `${`${hour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}`;
}

function resolveLongitude(province?: string | null, longitude?: number | null) {
  if (typeof longitude === "number" && Number.isFinite(longitude)) {
    return longitude;
  }
  if (province && province in PROVINCE_LONGITUDES) {
    return PROVINCE_LONGITUDES[province];
  }
  return 120;
}

function getTrueSolarTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  longitude: number
) {
  const dayOfYear = getDayOfYear(year, month, day);
  const equation = getEquationOfTimeMinutes(dayOfYear);
  const meanOffset = 4 * (longitude - 120);
  const rawMinutes = hour * 60 + minute + meanOffset + equation;
  const normalized = normalizeMinutes(rawMinutes);
  return {
    minutes: normalized.minutes,
    dayOffset: normalized.dayOffset,
    formatted: formatTimeFromMinutes(normalized.minutes)
  };
}

function getSolarLongitude(jd: number) {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(degToRad(M)) +
    (0.019993 - 0.000101 * T) * Math.sin(degToRad(2 * M)) +
    0.000289 * Math.sin(degToRad(3 * M));
  const trueLongitude = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const apparentLongitude = trueLongitude - 0.00569 - 0.00478 * Math.sin(degToRad(omega));
  return normalizeAngle(apparentLongitude);
}

function getMonthBranchIndexFromLongitude(longitude: number) {
  const offset = normalizeAngle(longitude - 315);
  return Math.floor(offset / 30);
}

function getHourBranchIndex(hour: number) {
  return Math.floor(((hour + 1) % 24) / 2);
}

function getMonthStemStart(yearStemIndex: number) {
  const mapping = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];
  return mapping[yearStemIndex] ?? 0;
}

function buildLunarDate(date: Date) {
  const formatter = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai"
  });
  const parts = formatter.formatToParts(date) as Array<{ type: string; value: string }>;
  const relatedYear = parts.find((part) => part.type === "relatedYear")?.value ?? "";
  const monthName = parts.find((part) => part.type === "month")?.value ?? "";
  const dayValue = parts.find((part) => part.type === "day")?.value ?? "";
  const isLeap = monthName.includes("闰");
  const cleanMonth = monthName.replace("闰", "");
  const monthNumber = LUNAR_MONTH_MAP[cleanMonth] ?? Number.parseInt(cleanMonth, 10);
  const monthLabel = Number.isFinite(monthNumber) ? `${monthNumber}` : cleanMonth;
  const leapLabel = isLeap ? "闰" : "";
  return `${relatedYear}年${leapLabel}${monthLabel}月${dayValue}日`;
}

function getDayunDirection(yearStemIndex: number, gender: Gender) {
  const isYang = [0, 2, 4, 6, 8].includes(yearStemIndex);
  if ((isYang && gender === "male") || (!isYang && gender === "female")) {
    return "顺行";
  }
  return "逆行";
}

function buildDayunSequence(
  monthStemIndex: number,
  monthBranchIndex: number,
  direction: "顺行" | "逆行",
  count = 9
) {
  const baseIndex = getCycleIndex(monthStemIndex, monthBranchIndex);
  const step = direction === "顺行" ? 1 : -1;
  const sequence: string[] = [];
  for (let i = 1; i <= count; i += 1) {
    const idx = mod(baseIndex + step * i, 60);
    sequence.push(`${STEMS[idx % 10]}${BRANCHES[idx % 12]}`);
  }
  return sequence;
}

function getCycleIndex(stemIndex: number, branchIndex: number) {
  for (let i = 0; i < 60; i += 1) {
    if (i % 10 === stemIndex && i % 12 === branchIndex) {
      return i;
    }
  }
  return 0;
}

function getSolarTermTarget(longitude: number, direction: "next" | "prev") {
  const step = 15;
  const epsilon = 1e-6;
  const remainder = longitude % step;
  if (Math.abs(remainder) < epsilon || Math.abs(step - remainder) < epsilon) {
    return normalizeAngle(longitude + (direction === "next" ? step : -step));
  }
  if (direction === "next") {
    return normalizeAngle(Math.ceil(longitude / step) * step);
  }
  return normalizeAngle(Math.floor(longitude / step) * step);
}

function findSolarTermJD(startJD: number, direction: "next" | "prev") {
  const startLongitude = getSolarLongitude(startJD);
  const targetLongitude = getSolarTermTarget(startLongitude, direction);
  const delta =
    direction === "next"
      ? normalizeAngle(targetLongitude - startLongitude)
      : -normalizeAngle(startLongitude - targetLongitude);
  let guessJD = startJD + delta / SOLAR_SPEED;
  for (let i = 0; i < 8; i += 1) {
    const currentLongitude = getSolarLongitude(guessJD);
    const diff = angleDiff(currentLongitude, targetLongitude);
    if (Math.abs(diff) < 1e-7) {
      break;
    }
    guessJD -= diff / SOLAR_SPEED;
  }
  if (direction === "next" && guessJD < startJD) {
    guessJD = startJD + Math.abs(delta) / SOLAR_SPEED;
  }
  if (direction === "prev" && guessJD > startJD) {
    guessJD = startJD - Math.abs(delta) / SOLAR_SPEED;
  }
  return guessJD;
}

function getDayunStartAge(birthJD: number, direction: "顺行" | "逆行") {
  const termJD = findSolarTermJD(birthJD, direction === "顺行" ? "next" : "prev");
  const diffSeconds = Math.abs(termJD - birthJD) * 86400;
  const age = (diffSeconds / (365.2422 * 24 * 3600)) * 120;
  return Math.round(age * 10) / 10;
}

export function calculateBazi(input: BaziInput): BaziResult {
  const { year, month, day } = parseDateParts(input.birthDate);
  const { hour, minute } = parseTimeParts(input.birthTime ?? undefined);
  const gender: Gender = input.gender === "female" ? "female" : "male";
  const ziHourMode: ZiHourMode = input.ziHourMode === "early" ? "early" : "late";
  const longitude = resolveLongitude(input.province, input.longitude);

  const birthDateTime = new Date(
    `${input.birthDate}T${`${hour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}:00+08:00`
  );
  const birthJD = getJulianDay(birthDateTime);
  const solarLongitude = getSolarLongitude(birthJD);
  const yearCutoff = solarLongitude < 315;
  const yearForCycle = yearCutoff ? year - 1 : year;
  const yearCycleIndex = mod(yearForCycle - 1984, 60);
  const yearStemIndex = yearCycleIndex % 10;
  const yearBranchIndex = yearCycleIndex % 12;
  const yearPillar = `${STEMS[yearStemIndex]}${BRANCHES[yearBranchIndex]}`;

  const monthBranchIndex = getMonthBranchIndexFromLongitude(solarLongitude);
  const monthBranch = MONTH_BRANCHES[monthBranchIndex];
  const monthStemStart = getMonthStemStart(yearStemIndex);
  const monthStemIndex = mod(monthStemStart + monthBranchIndex, 10);
  const monthPillar = `${STEMS[monthStemIndex]}${monthBranch}`;

  const solarTime = getTrueSolarTime(year, month, day, hour, minute, longitude);
  let dayOffset = solarTime.dayOffset;
  if (ziHourMode === "late" && solarTime.minutes >= 1380) {
    dayOffset += 1;
  }
  const baseDate = new Date(`${input.birthDate}T00:00:00+08:00`);
  const solarDate = new Date(baseDate.getTime() + dayOffset * DAY_MS);
  const jdn = getJulianDayNumber(solarDate);
  const dayCycleIndex = mod(jdn + DAY_CYCLE_OFFSET, 60);
  const dayStemIndex = dayCycleIndex % 10;
  const dayBranchIndex = dayCycleIndex % 12;
  const dayPillar = `${STEMS[dayStemIndex]}${BRANCHES[dayBranchIndex]}`;

  const solarHour = Math.floor(solarTime.minutes / 60);
  const hourBranchIndex = getHourBranchIndex(solarHour);
  const ziStemIndexByDayStem = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];
  const hourStemIndex = mod(ziStemIndexByDayStem[dayStemIndex] + hourBranchIndex, 10);
  const hourBranchName = BRANCHES[hourBranchIndex];
  const hourPillar = `${STEMS[hourStemIndex]}${hourBranchName}`;

  const direction = getDayunDirection(yearStemIndex, gender);
  const dayunStartAge = getDayunStartAge(birthJD, direction);
  const dayunSequence = buildDayunSequence(monthStemIndex, monthBranchIndex, direction);

  const lunarDate = buildLunarDate(birthDateTime);

  return {
    year_pillar: yearPillar,
    month_pillar: monthPillar,
    day_pillar: dayPillar,
    hour_pillar: hourPillar,
    bazi: [yearPillar, monthPillar, dayPillar, hourPillar],
    dayun_start_age: dayunStartAge,
    dayun_direction: direction,
    dayun_sequence: dayunSequence,
    first_dayun: dayunSequence[0],
    true_solar_time: solarTime.formatted,
    hour_branch_name: hourBranchName,
    lunar_date: lunarDate
  };
}
