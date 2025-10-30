export interface ProviderCatalogServiceVersionDto {
  id: string;
  versionNumber: number;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  providerPrice?: number;
}

export interface ProviderCatalogServiceDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  latestVersion: ProviderCatalogServiceVersionDto | null;
}

export interface ProviderCatalogCategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  services: ProviderCatalogServiceDto[];
}
