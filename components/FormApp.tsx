"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Database, Dumbbell, Home, LoaderCircle } from "lucide-react";
import { BodyMetricForm } from "./BodyMetricForm";
import { BodyMetricHistory } from "./BodyMetricHistory";
import { Drawer } from "./Drawer";
import { HomeTab } from "./HomeTab";
import { PlanTab } from "./PlanTab";
import { PRTab } from "./PRTab";
import { WorkoutForm } from "./WorkoutForm";
import { createPRFallbackInsight, createWorkoutFallbackInsight } from "@/lib/insights";
import { fitnessRepository, repositoryMode } from "@/lib/repository";
import { createId, type AIInsight, type BodyMetric, type ExercisePR, type TabId, type TrainingDay, type TrainingPlan, type WorkoutDraft, type WorkoutRecord } from "@/lib/types";

interface AppData {
  bodyMetrics: BodyMetric[];
  plans: TrainingPlan[];
  workouts: WorkoutRecord[];
  prs: ExercisePR[];
  insights: AIInsight[];
}

const emptyData: AppData = { bodyMetrics: [], plans: [], workouts: [], prs: [], insights: [] };

type DrawerId = "body" | "bodyHistory" | "workout" | "data" | null;

export function FormApp() {
  const [tab, setTab] = useState<TabId>("home");
  const [drawer, setDrawer] = useState<DrawerId>(null);
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [workoutDraft, setWorkoutDraft] = useState<WorkoutDraft | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutRecord | undefined>();
  const importRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const [bodyMetrics, plans, workouts, prs, insights] = await Promise.all([
      fitnessRepository.listBodyMetrics(),
      fitnessRepository.listTrainingPlans(),
      fitnessRepository.listWorkoutRecords(),
      fitnessRepository.listExercisePRs(),
      fitnessRepository.listAIInsights(),
    ]);
    setData({ bodyMetrics, plans, workouts, prs, insights });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await fitnessRepository.ensureStarterData();
        await refresh();
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "无法读取数据");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const saveBodyMetric = async (values: { date: string; weight: number; bodyFat: number }) => {
    const now = new Date().toISOString();
    await fitnessRepository.saveBodyMetric({ ...values, id: createId(), createdAt: now, updatedAt: now });
    await refresh();
    setDrawer(null);
    setToast("身体数据已记录");
  };

  const openWorkout = (date: string, existing?: WorkoutRecord, plannedDay?: TrainingDay) => {
    setEditingWorkout(existing);
    setWorkoutDraft(
      existing
        ? {
            date: existing.date,
            planName: existing.planName,
            exercises: existing.exercises.map((exercise) => ({ ...exercise })),
            calories: existing.calories,
            notes: existing.notes,
          }
        : {
            date,
            planName: plannedDay?.name ?? "自由训练",
            exercises: plannedDay?.exercises.map((exercise) => ({ ...exercise, id: createId() })) ?? [
              { id: createId(), name: "", sets: 3, reps: 8, weight: 0 },
            ],
            calories: 0,
            notes: "",
          },
    );
    setDrawer("workout");
  };

  const requestWorkoutInsight = async (record: WorkoutRecord) => {
    const fallback = createWorkoutFallbackInsight(record);
    let result = fallback;
    let source: AIInsight["source"] = "local";
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "workout", record }),
      });
      if (response.ok) {
        result = await response.json();
        source = "ai";
      }
    } catch {
      source = "local";
    }
    const now = new Date().toISOString();
    await fitnessRepository.saveAIInsight({
      id: createId(),
      kind: "workout",
      relatedId: record.id,
      summary: result.summary,
      suggestion: result.suggestion,
      source,
      createdAt: now,
      updatedAt: now,
    });
    await refresh();
  };

  const saveWorkout = async (draft: WorkoutDraft, existingId?: string) => {
    const now = new Date().toISOString();
    const existing = existingId ? data.workouts.find((record) => record.id === existingId) : undefined;
    const record: WorkoutRecord = {
      ...draft,
      id: existingId ?? createId(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await fitnessRepository.saveWorkoutRecord(record);
    await refresh();
    setDrawer(null);
    setToast(existing ? "训练记录已更新" : "训练记录已保存");
    void requestWorkoutInsight(record);
  };

  const deleteWorkout = async (id: string) => {
    if (!window.confirm("确定删除这条训练记录吗？")) return;
    await fitnessRepository.deleteWorkoutRecord(id);
    await refresh();
    setDrawer(null);
    setToast("训练记录已删除");
  };

  const savePR = async (values: Omit<ExercisePR, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const record: ExercisePR = { ...values, id: createId(), createdAt: now, updatedAt: now };
    await fitnessRepository.saveExercisePR(record);
    await refresh();
    setToast("真实 PR 已记录");

    const fallback = createPRFallbackInsight(record, data.prs);
    let summary = fallback.summary;
    let source: AIInsight["source"] = "local";
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "pr", record, recentPRs: data.prs.slice(-10) }),
      });
      if (response.ok) {
        const result = await response.json();
        summary = result.summary;
        source = "ai";
      }
    } catch {
      source = "local";
    }
    await fitnessRepository.saveAIInsight({
      id: createId(),
      kind: "pr",
      relatedId: record.id,
      summary,
      source,
      createdAt: now,
      updatedAt: now,
    });
    await refresh();
  };

  const savePlan = async (plan: TrainingPlan) => {
    if (plan.active) {
      await Promise.all(
        data.plans
          .filter((existing) => existing.id !== plan.id && existing.active)
          .map((existing) => fitnessRepository.saveTrainingPlan({ ...existing, active: false, updatedAt: new Date().toISOString() })),
      );
    }
    await fitnessRepository.saveTrainingPlan(plan);
    await refresh();
    setToast("训练计划已保存");
  };

  const deletePlan = async (id: string) => {
    if (!window.confirm("确定删除这个训练计划吗？过去的训练记录不会受影响。")) return;
    await fitnessRepository.deleteTrainingPlan(id);
    await refresh();
    setToast("训练计划已删除");
  };

  const exportData = async () => {
    const payload = await fitnessRepository.exportData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `form-backup-${payload.exportedAt.slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast("备份文件已导出");
  };

  const importData = async (file?: File) => {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (!window.confirm("导入会替换当前浏览器中的全部 FORM 数据，是否继续？")) return;
      await fitnessRepository.importData(payload);
      await refresh();
      setDrawer(null);
      setToast("数据恢复完成");
    } catch {
      setToast("无法导入：文件格式不正确");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  if (loading) {
    return <main className="loading-screen"><LoaderCircle className="spin" /><span>正在打开 FORM</span></main>;
  }

  if (loadError) {
    return (
      <main className="loading-screen error-screen">
        <span>数据连接失败</span>
        <p>{loadError}</p>
        <button className="button primary" type="button" onClick={() => window.location.reload()}>重新连接</button>
      </main>
    );
  }

  const navItems: { id: TabId; label: string; icon: typeof Home }[] = [
    { id: "home", label: "首页", icon: Home },
    { id: "pr", label: "极限力量", icon: Dumbbell },
    { id: "plan", label: "训练计划", icon: CalendarDays },
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" type="button" onClick={() => setTab("home")} aria-label="返回首页">
          <span>FORM</span><i />
        </button>
        <nav className="desktop-nav" aria-label="主导航">
          {navItems.map((item) => (
            <button className={tab === item.id ? "active" : ""} type="button" key={item.id} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <button className="data-button" type="button" onClick={() => setDrawer("data")}>
          <Database size={17} /><span>数据</span>
        </button>
      </header>

      <main className="app-content">
        {tab === "home" ? (
          <HomeTab
            bodyMetrics={data.bodyMetrics}
            plans={data.plans}
            workouts={data.workouts}
            prs={data.prs}
            insights={data.insights}
            onOpenBody={() => setDrawer("body")}
            onOpenBodyHistory={() => setDrawer("bodyHistory")}
            onOpenWorkout={openWorkout}
            onNavigate={setTab}
          />
        ) : null}
        {tab === "pr" ? <PRTab prs={data.prs} insights={data.insights} onSave={savePR} /> : null}
        {tab === "plan" ? <PlanTab plans={data.plans} onSave={savePlan} onDelete={deletePlan} /> : null}
      </main>

      <nav className="mobile-nav" aria-label="主导航">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button className={tab === item.id ? "active" : ""} type="button" key={item.id} onClick={() => setTab(item.id)}>
              <Icon size={19} /><span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <Drawer open={drawer === "body"} title="记录身体数据" eyebrow="身体状态" onClose={() => setDrawer(null)}>
        <BodyMetricForm onSubmit={saveBodyMetric} onCancel={() => setDrawer(null)} />
      </Drawer>

      <Drawer open={drawer === "bodyHistory"} title="历史身体数据" eyebrow="体重与体脂" onClose={() => setDrawer(null)}>
        <BodyMetricHistory metrics={data.bodyMetrics} onAdd={() => setDrawer("body")} />
      </Drawer>

      <Drawer open={drawer === "workout"} title={editingWorkout ? "修改训练记录" : "记录这次训练"} eyebrow="训练日历" onClose={() => setDrawer(null)}>
        {workoutDraft ? (
          <WorkoutForm
            initial={workoutDraft}
            existing={editingWorkout}
            onSubmit={saveWorkout}
            onDelete={deleteWorkout}
            onCancel={() => setDrawer(null)}
          />
        ) : null}
      </Drawer>

      <Drawer open={drawer === "data"} title={repositoryMode === "cloud" ? "云端数据" : "本地数据"} eyebrow="备份与恢复" onClose={() => setDrawer(null)}>
        <div className="data-panel">
          <div>
            <h3>{repositoryMode === "cloud" ? "已启用云端用户隔离" : "数据只保存在这个浏览器"}</h3>
            <p>
              {repositoryMode === "cloud"
                ? "当前匿名用户的数据保存在 Supabase，并由行级安全策略隔离。导出 JSON 仍可作为独立备份。"
                : "配置 Supabase 后可切换为云端保存；当前请定期导出 JSON 备份。恢复会替换全部记录。"}
            </p>
          </div>
          <button className="button primary wide" type="button" onClick={exportData}>导出完整备份</button>
          <input ref={importRef} className="sr-only" type="file" accept="application/json" onChange={(event) => importData(event.target.files?.[0])} />
          <button className="button secondary wide" type="button" onClick={() => importRef.current?.click()}>从备份恢复</button>
        </div>
      </Drawer>

      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </div>
  );
}
