export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminServiceVersion {
  id: string;
  serviceTemplateId: string;
  versionNumber: number;
  title: string;
  description: string;
  whatsIncluded: unknown;
  whatsNotIncluded: unknown;
  unitOfMeasure: string;
  requiredTools: unknown;
  customerRequirements: unknown;
  media: unknown;
  estimatedTime: string | null;
  maxTimeIncluded: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminServiceTemplate {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  description: string | null;
  medianPrice: number | null;
  authorId: string | null;
  keeperId: string | null;
  createdAt: string;
  updatedAt: string;
  versions: AdminServiceVersion[];
  latestVersion: AdminServiceVersion | null;
}

export interface ServiceFormPayload {
  categoryId: string;
  name: string;
  slug: string;
  description?: string | null;
  medianPrice?: number | null;
  authorId?: string | null;
  keeperId?: string | null;
  version: {
    title: string;
    description: string;
    whatsIncluded: string[];
    whatsNotIncluded: string[];
    unitOfMeasure: string;
    requiredTools: string[];
    customerRequirements: string[];
    estimatedTime?: string | null;
    maxTimeIncluded?: number | null;
    media?: unknown[];
  };
}
