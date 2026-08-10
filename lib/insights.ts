import type { ExercisePR, WorkoutRecord } from "./types";

export const createWorkoutFallbackInsight = (workout: WorkoutRecord) => {
  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const volume = workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets * exercise.reps * exercise.weight,
    0,
  );
  const level = totalSets >= 18 ? "偏高" : totalSets >= 10 ? "适中" : "偏轻";

  return {
    summary: `本次共完成 ${totalSets} 组，训练容量约 ${Math.round(volume).toLocaleString("zh-CN")} kg，整体强度${level}。`,
    suggestion:
      totalSets >= 18
        ? "下次优先保证动作质量；若恢复不足，可减少 1–2 组。"
        : "下次保持动作稳定，在状态良好时小幅增加重量或次数。",
  };
};

export const createPRFallbackInsight = (current: ExercisePR, history: ExercisePR[]) => {
  const previous = history
    .filter((record) => record.exerciseName === current.exerciseName && record.id !== current.id)
    .sort((a, b) => b.weight - a.weight)[0];

  if (!previous) {
    return { summary: `已建立 ${current.exerciseName} 的首个真实 PR：${current.weight} kg。` };
  }

  const change = current.weight - previous.weight;
  return {
    summary:
      change > 0
        ? `${current.exerciseName} 提升了 ${change.toFixed(1)} kg，新的真实 PR 为 ${current.weight} kg。`
        : `${current.exerciseName} 已记录 ${current.weight} kg，本次未超过历史最高值。`,
  };
};
