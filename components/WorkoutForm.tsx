"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ChevronDown, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { createId, type WorkoutDraft, type WorkoutRecord } from "@/lib/types";

interface WorkoutFormProps {
  initial: WorkoutDraft;
  existing?: WorkoutRecord;
  onSubmit: (draft: WorkoutDraft, existingId?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onCancel: () => void;
}

export function WorkoutForm({ initial, existing, onSubmit, onDelete, onCancel }: WorkoutFormProps) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(initial), [initial]);

  const updateExercise = (index: number, field: string, value: string) => {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index
          ? {
              ...exercise,
              [field]: field === "name" ? value : Number(value),
            }
          : exercise,
      ),
    }));
  };

  const parseScreenshot = async (file?: File) => {
    if (!file) return;
    setParsing(true);
    setParseMessage("");
    try {
      const payload = new FormData();
      payload.append("image", file);
      const response = await fetch("/api/ai/parse-workout", { method: "POST", body: payload });
      if (!response.ok) throw new Error("parse-failed");
      const parsed = await response.json();
      setDraft((current) => ({
        date: parsed.date || current.date,
        planName: parsed.planName || current.planName,
        calories: Number(parsed.calories) || 0,
        notes: parsed.notes || "",
        exercises: Array.isArray(parsed.exercises)
          ? parsed.exercises.map((exercise: Record<string, unknown>) => ({
              id: createId(),
              name: String(exercise.name || ""),
              sets: Number(exercise.sets) || 1,
              reps: Number(exercise.reps) || 1,
              weight: Number(exercise.weight) || 0,
            }))
          : current.exercises,
      }));
      setParseMessage("识别完成，请检查后再保存。原图不会被保留。");
    } catch {
      setParseMessage("暂时无法识别截图，你仍可直接填写并保存。请确认已配置 AI 密钥。");
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (draft.exercises.length === 0) return;
    setSaving(true);
    try {
      await onSubmit(draft, existing?.id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-stack workout-form" onSubmit={submit}>
      <div className="upload-row">
        <input
          ref={fileRef}
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={(event) => parseScreenshot(event.target.files?.[0])}
        />
        <button className="upload-button" type="button" onClick={() => fileRef.current?.click()} disabled={parsing}>
          {parsing ? <LoaderCircle className="spin" size={18} /> : <Camera size={18} />}
          <span>{parsing ? "正在识别…" : "上传训练截图"}</span>
          <ChevronDown size={16} />
        </button>
        <p>或直接填写</p>
      </div>
      {parseMessage ? <p className="form-message">{parseMessage}</p> : null}

      <div className="field-pair">
        <label>
          <span>训练日期</span>
          <input
            type="date"
            value={draft.date}
            onChange={(event) => setDraft({ ...draft, date: event.target.value })}
            required
          />
        </label>
        <label>
          <span>计划名称</span>
          <input
            value={draft.planName}
            onChange={(event) => setDraft({ ...draft, planName: event.target.value })}
            placeholder="例如：上肢力量"
            required
          />
        </label>
      </div>

      <div className="exercise-form-heading">
        <div>
          <p className="eyebrow">动作明细</p>
          <p>每行记录同一重量和次数的一组动作。</p>
        </div>
        <button
          className="text-button"
          type="button"
          onClick={() =>
            setDraft({
              ...draft,
              exercises: [
                ...draft.exercises,
                { id: createId(), name: "", sets: 3, reps: 8, weight: 0 },
              ],
            })
          }
        >
          <Plus size={16} /> 添加动作
        </button>
      </div>

      <div className="exercise-form-list">
        {draft.exercises.map((exercise, index) => (
          <div className="exercise-form-row" key={exercise.id}>
            <label className="exercise-name-field">
              <span>动作</span>
              <input
                value={exercise.name}
                onChange={(event) => updateExercise(index, "name", event.target.value)}
                placeholder="动作名称"
                required
              />
            </label>
            <label>
              <span>组</span>
              <input
                type="number"
                min="1"
                value={exercise.sets}
                onChange={(event) => updateExercise(index, "sets", event.target.value)}
                required
              />
            </label>
            <label>
              <span>次</span>
              <input
                type="number"
                min="1"
                value={exercise.reps}
                onChange={(event) => updateExercise(index, "reps", event.target.value)}
                required
              />
            </label>
            <label>
              <span>kg</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={exercise.weight}
                onChange={(event) => updateExercise(index, "weight", event.target.value)}
                required
              />
            </label>
            <button
              className="icon-button row-delete"
              type="button"
              aria-label="删除动作"
              onClick={() =>
                setDraft({ ...draft, exercises: draft.exercises.filter((_, rowIndex) => rowIndex !== index) })
              }
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>

      <label>
        <span>消耗热量 / kcal</span>
        <input
          type="number"
          min="0"
          value={draft.calories}
          onChange={(event) => setDraft({ ...draft, calories: Number(event.target.value) })}
        />
      </label>
      <label>
        <span>备注（可选）</span>
        <textarea
          rows={3}
          value={draft.notes ?? ""}
          onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
          placeholder="今天的状态、动作感受…"
        />
      </label>

      <div className="form-actions spread">
        <div>
          {existing && onDelete ? (
            <button className="button danger" type="button" onClick={() => onDelete(existing.id)}>
              删除记录
            </button>
          ) : null}
        </div>
        <div className="button-group">
          <button className="button ghost" type="button" onClick={onCancel}>
            取消
          </button>
          <button className="button primary" type="submit" disabled={saving || draft.exercises.length === 0}>
            {saving ? "保存中…" : existing ? "更新训练" : "保存训练"}
          </button>
        </div>
      </div>
    </form>
  );
}
