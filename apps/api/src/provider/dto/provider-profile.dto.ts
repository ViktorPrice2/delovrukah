export interface ProviderProfileDto {
  id: string;
  displayName: string;
  description: string | null;
  cityId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
