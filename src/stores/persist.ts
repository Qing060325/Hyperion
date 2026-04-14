import { createStore, produce } from "solid-js/store";

/**
 * 创建带持久化的 Solid Store
 *
 * 用法：
 * ```ts
 * const [state, setState] = createPersistedStore("my-key", { count: 0 });
 * // 自动持久化到 localStorage
 * setState("count", 1); // 自动保存
 * ```
 */
export function createPersistedStore<T extends Record<string, unknown>>(
  key: string,
  defaultValue: T,
) {
  // 从 localStorage 加载
  let initial = defaultValue;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      initial = { ...defaultValue, ...JSON.parse(saved) };
    }
  } catch {
    // 忽略解析错误
  }

  const [state, setState] = createStore<T>(initial);

  // 代理 setState，在每次更新后自动持久化
  const persistedSetState: typeof setState = (...args: unknown[]) => {
    // @ts-expect-error Solid Store 的 setState 签名复杂，这里做代理
    setState(...args);
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // 忽略存储错误（如 localStorage 已满）
    }
  };

  return [state, persistedSetState] as const;
}

/**
 * 深度合并两个对象
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sv = source[key];
    const tv = target[key];
    if (
      sv !== null &&
      typeof sv === "object" &&
      !Array.isArray(sv) &&
      tv !== null &&
      typeof tv === "object" &&
      !Array.isArray(tv)
    ) {
      result[key] = deepMerge(
        tv as Record<string, unknown>,
        sv as Record<string, unknown>,
      ) as T[keyof T];
    } else if (sv !== undefined) {
      result[key] = sv as T[keyof T];
    }
  }
  return result;
}
