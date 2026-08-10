"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  History,
  Plus,
} from "lucide-react";
import { formatDisplayDate, formatMonth, getMonthGrid, shiftMonth, todayISO } from "@/lib/date";
import type {
  AIInsight,
  BodyMetric,
  ExercisePR,
  TabId,
  TrainingDay,
  TrainingPlan,
  WorkoutRecord,
} from "@/lib/types";

interface HomeTabProps {
  bodyMetrics: BodyMetric[];
  plans: TrainingPlan[];
  workouts: WorkoutRecord[];
  prs: ExercisePR[];
  insights: AIInsight[];
  onOpenBody: () => void;
  onOpenBodyHistory: () => void;
  onOpenWorkout: (date: string, existing?: WorkoutRecord, plannedDay?: TrainingDay) => void;
  onNavigate: (tab: TabId) => void;
}

const weekdays = ["一", "二", "三", "四", "五", "六", "日"];

export function HomeTab({
  bodyMetrics,
  plans,
  workouts,
  prs,
  insights,
  onOpenBody,
  onOpenBodyHistory,
  onOpenWorkout,
  onNavigate,
}: HomeTabProps) {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const days = useMemo(() => getMonthGrid(month), [month]);
  const activePlans = plans.filter((plan) => plan.active);
  const latestMetric = [...bodyMetrics].sort((a, b) => b.date.localeCompare(a.date))[0];
  const latestWorkout = [...workouts].sort((a, b) => b.date.localeCompare(a.date))[0];
  const latestPR = [...prs].sort((a, b) => b.date.localeCompare(a.date))[0];
  const selectedWorkout = workouts.find((workout) => workout.date === selectedDate);
  const selectedWeekday = (() => {
    const [year, monthNumber, day] = selectedDate.split("-").map(Number);
    return new Date(year, monthNumber - 1, day).getDay();
  })();
  const selectedPlanDay = activePlans.flatMap((plan) => plan.days).find((day) => day.weekday === selectedWeekday);
  const latestWorkoutInsight = latestWorkout
    ? [...insights]
        .filter((insight) => insight.kind === "workout" && insight.relatedId === latestWorkout.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    : undefined;

  const planForDate = (weekday: number) =>
    activePlans.flatMap((plan) => plan.days).find((day) => day.weekday === weekday);

  return (
    <div className="page-enter home-page">
      <section className="status-strip" aria-labelledby="body-status-title">
        <div className="status-heading">
          <p className="eyebrow">身体状态</p>
          <h1 id="body-status-title">今天，继续向前。</h1>
        </div>
        <div className="status-metric">
          <span>当前体重</span>
          <strong>{latestMetric ? latestMetric.weight.toFixed(1) : "—"}</strong>
          <small>kg</small>
        </div>
        <div className="status-metric">
          <span>当前体脂</span>
          <strong>{latestMetric ? latestMetric.bodyFat.toFixed(1) : "—"}</strong>
          <small>%</small>
        </div>
        <div className="status-metric recent-session">
          <span>最近训练</span>
          <strong>{latestWorkout?.planName ?? "尚未记录"}</strong>
          <small>{formatDisplayDate(latestWorkout?.date)}</small>
        </div>
        <div className="status-actions">
          <button className="button ghost" type="button" onClick={onOpenBodyHistory}>
            <History size={16} /> 历史数据
          </button>
          <button className="button primary" type="button" onClick={onOpenBody}>
            <Plus size={17} /> 记录身体数据
          </button>
        </div>
      </section>

      <section className="calendar-workspace" aria-labelledby="calendar-title">
        <div className="calendar-main">
          <header className="calendar-header">
            <div>
              <p className="eyebrow">训练日历</p>
              <h2 id="calendar-title">{formatMonth(month)}</h2>
            </div>
            <div className="calendar-controls">
              <button className="icon-button" type="button" aria-label="上个月" onClick={() => setMonth(shiftMonth(month, -1))}>
                <ChevronLeft size={19} />
              </button>
              <button className="today-button" type="button" onClick={() => { setMonth(new Date()); setSelectedDate(todayISO()); }}>
                今天
              </button>
              <button className="icon-button" type="button" aria-label="下个月" onClick={() => setMonth(shiftMonth(month, 1))}>
                <ChevronRight size={19} />
              </button>
            </div>
          </header>

          <div className="calendar-weekdays" aria-hidden="true">
            {weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
          </div>
          <div className="calendar-grid">
            {days.map((day) => {
              const workout = workouts.find((record) => record.date === day.iso);
              const planned = planForDate(day.date.getDay());
              const selected = selectedDate === day.iso;
              return (
                <button
                  className={`calendar-day ${day.isCurrentMonth ? "" : "muted"} ${selected ? "selected" : ""} ${workout ? "completed" : ""}`}
                  key={day.iso}
                  type="button"
                  onClick={() => setSelectedDate(day.iso)}
                  aria-label={`${day.iso}${workout ? "，已完成训练" : planned ? "，有训练计划" : ""}`}
                >
                  <span>{day.date.getDate()}</span>
                  {workout ? <i className="day-status completed"><Check size={11} /></i> : planned ? <i className="day-status planned" /> : null}
                  {day.isToday ? <em>今日</em> : null}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="day-inspector">
          <div>
            <p className="eyebrow">{formatDisplayDate(selectedDate)}</p>
            <h3>{selectedWorkout?.planName ?? selectedPlanDay?.name ?? "自由训练"}</h3>
          </div>
          {selectedWorkout ? (
            <div className="day-detail">
              <div className="completion-label"><Check size={15} /> 已完成</div>
              <ul>
                {selectedWorkout.exercises.slice(0, 4).map((exercise) => (
                  <li key={exercise.id}>
                    <span>{exercise.name}</span>
                    <small>{exercise.sets} × {exercise.reps} · {exercise.weight} kg</small>
                  </li>
                ))}
              </ul>
              <p>{selectedWorkout.calories} kcal</p>
            </div>
          ) : selectedPlanDay ? (
            <div className="day-detail planned-detail">
              <p>{selectedPlanDay.exercises.length} 个动作等待完成</p>
              <ul>
                {selectedPlanDay.exercises.slice(0, 4).map((exercise) => (
                  <li key={exercise.id}>
                    <span>{exercise.name}</span>
                    <small>{exercise.sets} × {exercise.reps}</small>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="empty-copy">这一天还没有安排。你仍然可以记录一次自由训练。</p>
          )}
          <button
            className="button primary wide"
            type="button"
            onClick={() => onOpenWorkout(selectedDate, selectedWorkout, selectedPlanDay)}
          >
            {selectedWorkout ? "修改训练记录" : "记录这次训练"}
          </button>
        </aside>
      </section>

      {latestWorkoutInsight ? (
        <section className="inline-insight" aria-label="最近训练建议">
          <span>FORM NOTE</span>
          <p>{latestWorkoutInsight.summary} {latestWorkoutInsight.suggestion}</p>
        </section>
      ) : null}

      <section className="feature-links" aria-label="更多功能">
        <button type="button" onClick={() => onNavigate("pr")}>
          <span className="feature-icon"><Dumbbell size={21} /></span>
          <span>
            <small>极限力量</small>
            <strong>{latestPR ? `${latestPR.exerciseName} · ${latestPR.weight} kg` : "记录你的第一个 PR"}</strong>
          </span>
          <ArrowRight size={20} />
        </button>
        <button type="button" onClick={() => onNavigate("plan")}>
          <span className="feature-icon"><CalendarDays size={21} /></span>
          <span>
            <small>训练计划</small>
            <strong>{activePlans[0]?.name ?? "创建每周训练节奏"}</strong>
          </span>
          <ArrowRight size={20} />
        </button>
      </section>
    </div>
  );
}
