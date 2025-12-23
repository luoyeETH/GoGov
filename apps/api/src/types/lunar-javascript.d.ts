declare module "lunar-javascript" {
  export class Solar {
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number
    ): Solar;
    getSolarTime(longitude: number): Solar;
    getLunar(): Lunar;
    toYmdHms(): string;
    getHour(): number;
    getMinute(): number;
  }

  export class Lunar {
    getEightChar(): EightChar;
    toString(): string;
    getYearInChinese(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    isLeap(): boolean;
  }

  export class EightChar {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getTimeZhi(): string;
    setSect(sect: number): void;
    getYun(gender: number): Yun;
  }

  export class Yun {
    getDaYun(): DaYun[];
    getStartAge?(): number;
    isForward?(): boolean;
    getForward?(): boolean;
    getDirection?(): number | string;
    getStartYear?(): number;
    getStartMonth?(): number;
    getStartSolar?(): Solar;
    getGender?(): number;
  }

  export class DaYun {
    getStartAge(): number;
    getGanZhi(): string;
  }
}
