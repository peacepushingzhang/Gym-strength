const mondayFirst = [1, 2, 3, 4, 5, 6, 0];

export const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const todayISO = () => toISODate(new Date());

export const formatDisplayDate = (isoDate?: string) => {
  if (!isoDate) return "尚未记录";
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(year, month - 1, day));
};

export const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(date);

export const getMonthGrid = (monthDate: Date) => {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const offset = mondayFirst.indexOf(first.getDay());
  const start = new Date(first);
  start.setDate(first.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      iso: toISODate(date),
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      isToday: toISODate(date) === todayISO(),
    };
  });
};

export const shiftMonth = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

export const weekdayLabel = (weekday: number) =>
  ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][weekday] ?? "";
