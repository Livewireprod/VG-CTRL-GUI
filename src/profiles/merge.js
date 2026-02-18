export function deepMerge(a,b) {
    if (Array.isArray(a) || Array.isArray(b)) return b ?? a;

    if (a && typeof a === "object" && b && typeof b === "object") {
        const out = { ...a };
        for (const k of Object.keys(b)) {
            out[k] = deepMerge(a[k], b[k]);
        }
        return out;
    }
    return b ?? a;
}