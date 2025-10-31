export interface ProviderProfileDto {
  id: string;
  displayName: string;
  description: string | null;
  cityId: string | null;
  cityName: string | null;
  createdAt: Date;
  updatedAt: Date;
}
