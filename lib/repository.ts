import { fitnessDataExportSchema } from "./schemas";
import { starterPlan } from "./starterPlan";
import { createApiRepository } from "./apiRepository";
import type {
  AIInsight,
  BodyMetric,
  ExercisePR,
  FitnessDataExport,
  TrainingPlan,
  WorkoutRecord,
} from "./types";

const DB_NAME = "form-fitness";
const DB_VERSION = 1;

const stores = {
  bodyMetrics: "bodyMetrics",
  trainingPlans: "trainingPlans",
  workoutRecords: "workoutRecords",
  exercisePRs: "exercisePRs",
  aiInsights: "aiInsights",
} as const;

type StoreName = keyof typeof stores;
type StoreRecord = {
  bodyMetrics: BodyMetric;
  trainingPlans: TrainingPlan;
  workoutRecords: WorkoutRecord;
  exercisePRs: ExercisePR;
  aiInsights: AIInsight;
};

const requestToPromise = <T,>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const transactionDone = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      Object.values(stores).forEach((store) => {
        if (!database.objectStoreNames.contains(store)) {
          database.createObjectStore(store, { keyPath: "id" });
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const getAll = async <T extends StoreName>(storeName: T): Promise<StoreRecord[T][]> => {
  const database = await openDatabase();
  const transaction = database.transaction(stores[storeName], "readonly");
  const result = await requestToPromise(
    transaction.objectStore(stores[storeName]).getAll() as IDBRequest<StoreRecord[T][]>,
  );
  database.close();
  return result;
};

const put = async <T extends StoreName>(storeName: T, value: StoreRecord[T]) => {
  const database = await openDatabase();
  const transaction = database.transaction(stores[storeName], "readwrite");
  transaction.objectStore(stores[storeName]).put(value);
  await transactionDone(transaction);
  database.close();
};

const remove = async (storeName: StoreName, id: string) => {
  const database = await openDatabase();
  const transaction = database.transaction(stores[storeName], "readwrite");
  transaction.objectStore(stores[storeName]).delete(id);
  await transactionDone(transaction);
  database.close();
};

export interface FitnessRepository {
  listBodyMetrics(): Promise<BodyMetric[]>;
  saveBodyMetric(metric: BodyMetric): Promise<void>;
  listTrainingPlans(): Promise<TrainingPlan[]>;
  saveTrainingPlan(plan: TrainingPlan): Promise<void>;
  deleteTrainingPlan(id: string): Promise<void>;
  listWorkoutRecords(): Promise<WorkoutRecord[]>;
  saveWorkoutRecord(record: WorkoutRecord): Promise<void>;
  deleteWorkoutRecord(id: string): Promise<void>;
  listExercisePRs(): Promise<ExercisePR[]>;
  saveExercisePR(record: ExercisePR): Promise<void>;
  listAIInsights(): Promise<AIInsight[]>;
  saveAIInsight(insight: AIInsight): Promise<void>;
  exportData(): Promise<FitnessDataExport>;
  importData(data: unknown): Promise<void>;
  ensureStarterData(): Promise<void>;
}

const indexedDbRepository: FitnessRepository = {
  listBodyMetrics: () => getAll("bodyMetrics"),
  saveBodyMetric: (metric) => put("bodyMetrics", metric),
  listTrainingPlans: () => getAll("trainingPlans"),
  saveTrainingPlan: (plan) => put("trainingPlans", plan),
  deleteTrainingPlan: (id) => remove("trainingPlans", id),
  listWorkoutRecords: () => getAll("workoutRecords"),
  saveWorkoutRecord: (record) => put("workoutRecords", record),
  deleteWorkoutRecord: (id) => remove("workoutRecords", id),
  listExercisePRs: () => getAll("exercisePRs"),
  saveExercisePR: (record) => put("exercisePRs", record),
  listAIInsights: () => getAll("aiInsights"),
  saveAIInsight: (insight) => put("aiInsights", insight),
  async exportData() {
    const [bodyMetrics, trainingPlans, workoutRecords, exercisePRs, aiInsights] =
      await Promise.all([
        getAll("bodyMetrics"),
        getAll("trainingPlans"),
        getAll("workoutRecords"),
        getAll("exercisePRs"),
        getAll("aiInsights"),
      ]);
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      bodyMetrics,
      trainingPlans,
      workoutRecords,
      exercisePRs,
      aiInsights,
    };
  },
  async importData(data) {
    const parsed = fitnessDataExportSchema.parse(data);
    const database = await openDatabase();
    const transaction = database.transaction(Object.values(stores), "readwrite");

    for (const storeName of Object.keys(stores) as StoreName[]) {
      const store = transaction.objectStore(stores[storeName]);
      store.clear();
      parsed[storeName].forEach((record) => store.put(record));
    }

    await transactionDone(transaction);
    database.close();
  },
  async ensureStarterData() {
    const plans = await getAll("trainingPlans");
    if (plans.length === 0) await put("trainingPlans", starterPlan);
  },
};

export const repositoryMode = process.env.NEXT_PUBLIC_DATA_MODE === "cloud" ? "cloud" : "local";
export const fitnessRepository: FitnessRepository = repositoryMode === "cloud"
  ? createApiRepository()
  : indexedDbRepository;
