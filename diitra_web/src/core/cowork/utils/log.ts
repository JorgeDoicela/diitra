const __DEV__ = import.meta.env.DEV;

export function coworkLog(...args: any[]): void {
    if (__DEV__ && typeof window !== 'undefined' && localStorage.getItem('DEBUG_COWORK') === 'true') {
        console.log(...args);
    }
}

