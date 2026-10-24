export interface Todo {
  id: string;
  text: string;
  createdAt: number;
}

export interface OptimisticAction {
  id: number;
  shouldFail: boolean;
}
