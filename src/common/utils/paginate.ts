export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function paginate<T>([items, total]: [T[], number], page: number, limit: number): Paginated<T> {
  return { items, total, page, limit };
}

export function offset(page: number, limit: number): number {
  return (page - 1) * limit;
}
