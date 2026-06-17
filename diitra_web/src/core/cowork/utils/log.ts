const __DEV__ = import.meta.env.DEV;

export function coworkLog(...args: any[]): void {
    if (__DEV__) console.log(...args);
}
