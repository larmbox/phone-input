const isObject = (item: unknown) =>
  typeof item === 'object' && !Array.isArray(item);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type A = Record<string, any>;
type B = A;

export function deepMerge(target: A, source: B): A & B {
  const isDeep = (prop: string) =>
    isObject(source[prop]) && target[prop] && isObject(target[prop]);
  const replaced = Object.getOwnPropertyNames(source)
    .map((prop) => ({
      [prop]: isDeep(prop)
        ? deepMerge(target[prop], source[prop])
        : source[prop],
    }))
    .reduce((a, b) => ({ ...a, ...b }), {});

  return {
    ...target,
    ...replaced,
  } as A & B;
}
