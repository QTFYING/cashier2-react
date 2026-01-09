/**
 * 仿照Zustand实现一个最小的Store
 */

export class Store<T> {
  private state: T;
  private listeners = new Set<(state: T) => void>();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState(): T {
    return this.state;
  }

  setState(partial: Partial<T> | ((prev: T) => Partial<T>)) {
    const update = typeof partial === 'function' ? (partial as any)(this.state) : partial;
    this.state = { ...this.state, ...update };
    this.listeners.forEach((cb) => cb(this.state));
  }

  subscribe(callback: (state: T) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  destroy() {
    this.listeners.clear();
  }
}
