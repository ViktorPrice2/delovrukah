export interface ProviderProfileDto {
  id: string;
  displayName: string;
  description: string | null;
  cityId: string | null;
  cityName: string | null;
  hourlyRate: number | null;
  createdAt: Date;
  updatedAt: Date;
}
