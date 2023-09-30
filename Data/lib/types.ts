import {
  DataRelationName,
  DataRelationType,
  DataTypeWithRelationDefsName,
} from './relations';
import { ConfigType, DataType, DataTypeName } from './schema';
export type { DataTypeName } from './schema';

export type DataMeta<T extends DataTypeName> = {
  __type: T;
  __id?: string;
  __rev?: string;
  __deleted?: boolean;
  __created_at?: number;
  __updated_at?: number;
  __raw?: unknown;
};

export type DataTypeWithID<T extends DataTypeName> = DataMeta<T> & DataType<T>;

export type ValidDataTypeWithID<T extends DataTypeName> = DataTypeWithID<T> & {
  __valid: true;
};

export type InvalidDataTypeWithID<T extends DataTypeName> = DataMeta<T> & {
  __valid: false;
  // TODO: type this
  __errors?: unknown;
  __error_details?: unknown;
} & { [key: string]: unknown };

export type GetConfig = (options?: {
  /** Set to true to not allow using the default, unsaved config. */
  ensureSaved?: boolean;
}) => Promise<ConfigType>;

type PartialWithExists<T> = {
  [K in keyof T]?: T[K] | { $exists: boolean };
};

type SortOrder = 'asc' | 'desc';

type DataDateProperties = '__created_at' | '__updated_at';
type Sort<T> =
  | {
      [K in keyof T]?: SortOrder;
    }
  | { [key in DataDateProperties]?: SortOrder };

export type SortOption<T> = ReadonlyArray<Sort<T>>;

export type GetData = <T extends DataTypeName>(
  type: T,
  /** Array of IDs, or a partial match of the data */
  conditions?: ReadonlyArray<string> | PartialWithExists<DataType<T>>,
  options?: {
    skip?: number;
    limit?: number;
    sort?: SortOption<DataType<T>>;
  },
) => Promise<Array<ValidDataTypeWithID<T> | InvalidDataTypeWithID<T>>>;

export type GetDatum = <T extends DataTypeName>(
  type: T,
  id: string,
) => Promise<ValidDataTypeWithID<T> | InvalidDataTypeWithID<T> | null>;

export type GetRelated = <
  T extends DataTypeWithRelationDefsName,
  N extends DataRelationName<T>,
>(
  d: DataMeta<T> & { [key: string]: unknown },
  relationName: N,
  {
    sort,
  }: {
    sort?: SortOption<DataRelationType<T, N>>;
  },
) => Promise<DataRelationType<T, N> | null>;
