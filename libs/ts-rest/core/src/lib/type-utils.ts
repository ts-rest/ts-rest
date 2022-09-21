import { z, ZodType, ZodTypeAny } from 'zod';

type GetIndexedField<T, K> = K extends keyof T
  ? T[K]
  : K extends `${number}`
  ? '0' extends keyof T
    ? undefined
    : number extends keyof T
    ? T[number]
    : undefined
  : undefined;

type FieldWithPossiblyUndefined<T, Key> =
  | GetFieldType<Exclude<T, undefined>, Key>
  | Extract<T, undefined>;

type IndexedFieldWithPossiblyUndefined<T, Key> =
  | GetIndexedField<Exclude<T, undefined>, Key>
  | Extract<T, undefined>;

export type GetFieldType<T, P> = P extends `${infer Left}.${infer Right}`
  ? Left extends keyof T
    ? FieldWithPossiblyUndefined<T[Left], Right>
    : Left extends `${infer FieldKey}[${infer IndexKey}]`
    ? FieldKey extends keyof T
      ? FieldWithPossiblyUndefined<
          IndexedFieldWithPossiblyUndefined<T[FieldKey], IndexKey>,
          Right
        >
      : undefined
    : undefined
  : P extends keyof T
  ? T[P]
  : P extends `${infer FieldKey}[${infer IndexKey}]`
  ? FieldKey extends keyof T
    ? IndexedFieldWithPossiblyUndefined<T[FieldKey], IndexKey>
    : undefined
  : undefined;

export function getValue<
  TData,
  TPath extends string,
  TDefault = GetFieldType<TData, TPath>
>(
  data: TData,
  path: TPath,
  defaultValue?: TDefault
): GetFieldType<TData, TPath> | TDefault {
  const value = path
    .split(/[.[\]]/)
    .filter(Boolean)
    .reduce<GetFieldType<TData, TPath>>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value, key) => (value as any)?.[key],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data as any
    );

  return value !== undefined ? value : (defaultValue as TDefault);
}

// https://stackoverflow.com/questions/63447660/typescript-remove-all-properties-with-particular-type
// Nested solution also available ^
type ExcludeKeysWithTypeOf<T, V> = {
  [K in keyof T]: Exclude<T[K], undefined> extends V ? never : K;
}[keyof T];

export type Without<T, V> = Pick<T, ExcludeKeysWithTypeOf<T, V>>;

export type ZodInferOrType<T> = T extends ZodTypeAny ? z.infer<T> : T;

type Try<A, B, C> = A extends B ? A : C;

type NarrowRaw<T> =
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (T extends Function ? T : never)
  | (T extends string | number | bigint | boolean ? T : never)
  | (T extends [] ? [] : never)
  | {
      [K in keyof T]: K extends 'description' ? T[K] : NarrowNotZod<T[K]>;
    };

type NarrowNotZod<T> = Try<T, ZodType, NarrowRaw<T>>;

export type Narrow<T> = Try<T, [], NarrowNotZod<T>>;
