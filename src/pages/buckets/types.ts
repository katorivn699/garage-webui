//

export type GetBucketRes = Bucket[];

export type Bucket = {
  id: string;
  globalAliases: string[];
  localAliases: LocalAlias[];
  websiteAccess: boolean;
  websiteConfig?: WebsiteConfig | null;
  keys: Key[];
  objects: number;
  bytes: number;
  unfinishedUploads: number;
  unfinishedMultipartUploads: number;
  unfinishedMultipartUploadParts: number;
  unfinishedMultipartUploadBytes: number;
  quotas: Quotas;
};

export type LocalAlias = {
  accessKeyId: string;
  alias: string;
};

export type Key = {
  accessKeyId: string;
  name: string;
  permissions: Permissions;
  bucketLocalAliases: string[];
};

export type Permissions = {
  read: boolean;
  write: boolean;
  owner: boolean;
};

export type WebsiteConfig = {
  indexDocument: string;
  errorDocument: string;
};

export type Quotas = {
  maxSize: null;
  maxObjects: null;
};

// Lifecycle Configuration Types
export type LifecycleConfiguration = {
  rules: LifecycleRule[];
};

export type LifecycleRule = {
  id: string;
  status: 'Enabled' | 'Disabled';
  prefix?: string;
  filter?: LifecycleFilter;
  expiration?: LifecycleExpiration;
  noncurrentVersionExpiration?: NoncurrentVersionExpiration;
  abortIncompleteMultipartUpload?: AbortIncompleteMultipartUpload;
};

export type LifecycleFilter = {
  prefix?: string;
  tags?: LifecycleTag[];
  and?: LifecycleFilterAnd;
};

export type LifecycleFilterAnd = {
  prefix?: string;
  tags?: LifecycleTag[];
};

export type LifecycleTag = {
  key: string;
  value: string;
};

export type LifecycleExpiration = {
  days?: number;
  date?: string;
  expiredObjectDeleteMarker?: boolean;
};

export type NoncurrentVersionExpiration = {
  noncurrentDays?: number;
};

export type AbortIncompleteMultipartUpload = {
  daysAfterInitiation?: number;
};
