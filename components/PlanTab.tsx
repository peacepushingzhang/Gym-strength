"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Save, Trash2 } from "lucide-react";
import { createId, type PlanExercise, type TrainingPlan } from "@/lib/types";
import { weekdayLabel } from "@/lib/date";

interface PlanTabProps {
  plans: TrainingPlan[];
  onSave: (plan: TrainingPlan) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const blankPlan = (): TrainingPlan => {
  const now = new Date().toISOString();
  return {
    id: createId(),
    name: "新训练计划",
    active: false,
    days: [],
    createdAt: now,
    updatedAt: now,
  };
};

const copyPlan = (plan: TrainingPlan) => JSON.parse(JSON.stringify(plan)) as TrainingPlan;

export function PlanTab({ plans, onSave, onDelete }: PlanTabProps) {
  const firstPlan = useMemo(() => plans.find((plan) => plan.active) ?? plans[0], [plans]);
  const [selectedId, setSelectedId] = useState<string | null>(firstPlan?.id ?? null);
  const [draft, setDraft] = useState<TrainingPlan | null>(firstPlan ? copyPlan(firstPlan) : null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if ((!selectedId || !plans.some((plan) => plan.id === selectedId)) && firstPlan) {
      setSelectedId(firstPlan.id);
      setDraft(copyPlan(firstPlan));
      return;
    }
    if (!firstPlan) {
      setSelectedId(null);
      setDraft(null);
      return;
    }
    const selected = plans.find((plan) => plan.id === selectedId);
    if (selected) setDraft(copyPlan(selected));
  }, [plans, firstPlan, selectedId]);

  const choosePlan = (plan: TrainingPlan) => {
    setSelectedId(plan.id);
    setDraft(copyPlan(plan));
  };

  const updateExercise = (dayIndex: number, exerciseIndex: number, patch: Partial<PlanExercise>) => {
    if (!draft) return;
    const next = copyPlan(draft);
    next.days[dayIndex].exercises[exerciseIndex] = {
      ...next.days[dayIndex].exercises[exerciseIndex],
      ...patch,
    };
    setDraft(next);
  };

  const moveExercise = (dayIndex: number, exerciseIndex: number, direction: -1 | 1) => {
    if (!draft) return;
    const nextIndex = exerciseIndex + direction;
    if (nextIndex < 0 || nextIndex >= draft.days[dayIndex].exercises.length) return;
    const next = copyPlan(draft);
    const [exercise] = next.days[dayIndex].exercises.splice(exerciseIndex, 1);
    next.days[dayIndex].exercises.splice(nextIndex, 0, exercise);
    setDraft(next);
  };

  const save = async () => {
    if (!draft || !draft.name.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...draft, name: draft.name.trim(), updatedAt: new Date().toISOString() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter subpage plan-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">训练计划</p>
          <h1>把每周节奏安排清楚。</h1>
          <p>计划只影响未来，完成过的训练不会改变。</p>
        </div>
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            const next = blankPlan();
            setSelectedId(next.id);
            setDraft(next);
          }}
        >
          <Plus size={17} /> 新建计划
        </button>
      </header>

      <div className="plan-workspace">
        <aside className="plan-list">
          <p className="eyebrow">我的计划</p>
          {plans.map((plan) => (
            <button className={selectedId === plan.id ? "active" : ""} type="button" key={plan.id} onClick={() => choosePlan(plan)}>
              <span>{plan.name}</span>
              <small>{plan.active ? "使用中" : `${plan.days.length} 个训练日`}</small>
            </button>
          ))}
        </aside>

        <section className="plan-editor">
          {draft ? (
            <>
              <div className="plan-editor-header">
                <label>
                  <span>计划名称</span>
                  <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
                </label>
                <label className="switch-row">
                  <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />
                  <span>设为当前计划</span>
                </label>
              </div>

              <div className="training-days">
                {draft.days.map((day, dayIndex) => (
                  <article className="training-day" key={day.id}>
                    <header>
                      <select
                        aria-label="星期"
                        value={day.weekday}
                        onChange={(event) => {
                          const next = copyPlan(draft);
                          next.days[dayIndex].weekday = Number(event.target.value);
                          setDraft(next);
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 0].map((weekday) => <option key={weekday} value={weekday}>{weekdayLabel(weekday)}</option>)}
                      </select>
                      <input
                        aria-label="训练日名称"
                        value={day.name}
                        onChange={(event) => {
                          const next = copyPlan(draft);
                          next.days[dayIndex].name = event.target.value;
                          setDraft(next);
                        }}
                      />
                      <button
                        className="icon-button"
                        type="button"
                        aria-label="复制训练日"
                        onClick={() => {
                          const next = copyPlan(draft);
                          next.days.splice(dayIndex + 1, 0, {
                            ...copyPlan({ ...draft, days: [day] }).days[0],
                            id: createId(),
                            name: `${day.name} 副本`,
                            exercises: day.exercises.map((exercise) => ({ ...exercise, id: createId() })),
                          });
                          setDraft(next);
                        }}
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label="删除训练日"
                        onClick={() => setDraft({ ...draft, days: draft.days.filter((_, index) => index !== dayIndex) })}
                      >
                        <Trash2 size={16} />
                      </button>
                    </header>

                    <div className="plan-exercises">
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <div className="plan-exercise-row" key={exercise.id}>
                          <div className="move-actions">
                            <button type="button" aria-label="上移" onClick={() => moveExercise(dayIndex, exerciseIndex, -1)}><ArrowUp size={13} /></button>
                            <button type="button" aria-label="下移" onClick={() => moveExercise(dayIndex, exerciseIndex, 1)}><ArrowDown size={13} /></button>
                          </div>
                          <input
                            aria-label="动作名称"
                            value={exercise.name}
                            onChange={(event) => updateExercise(dayIndex, exerciseIndex, { name: event.target.value })}
                            placeholder="动作名称"
                          />
                          <label><span>组</span><input type="number" min="1" value={exercise.sets} onChange={(event) => updateExercise(dayIndex, exerciseIndex, { sets: Number(event.target.value) })} /></label>
                          <label><span>次</span><input type="number" min="1" value={exercise.reps} onChange={(event) => updateExercise(dayIndex, exerciseIndex, { reps: Number(event.target.value) })} /></label>
                          <label><span>kg</span><input type="number" min="0" step="0.5" value={exercise.weight} onChange={(event) => updateExercise(dayIndex, exerciseIndex, { weight: Number(event.target.value) })} /></label>
                          <button
                            className="icon-button"
                            type="button"
                            aria-label="删除动作"
                            onClick={() => {
                              const next = copyPlan(draft);
                              next.days[dayIndex].exercises.splice(exerciseIndex, 1);
                              setDraft(next);
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      className="text-button add-exercise"
                      type="button"
                      onClick={() => {
                        const next = copyPlan(draft);
                        next.days[dayIndex].exercises.push({ id: createId(), name: "", sets: 3, reps: 8, weight: 0 });
                        setDraft(next);
                      }}
                    >
                      <Plus size={15} /> 添加动作
                    </button>
                  </article>
                ))}
              </div>

              <button
                className="add-day-button"
                type="button"
                onClick={() => setDraft({
                  ...draft,
                  days: [...draft.days, { id: createId(), weekday: 1, name: "训练日", exercises: [] }],
                })}
              >
                <Plus size={17} /> 添加训练日
              </button>

              <footer className="plan-actions">
                {plans.some((plan) => plan.id === draft.id) ? (
                  <button
                    className="button danger"
                    type="button"
                    onClick={() => onDelete(draft.id)}
                  >
                    删除计划
                  </button>
                ) : <span />}
                <button className="button primary" type="button" onClick={save} disabled={saving}>
                  <Save size={17} /> {saving ? "保存中…" : "保存计划"}
                </button>
              </footer>
            </>
          ) : (
            <div className="empty-state compact-empty">
              <h2>创建一个每周计划</h2>
              <p>选择训练日，再添加动作。</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
