import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CityDto } from './dto/city.dto';
import { getMockCities } from '../mocks/catalog.mock-data';

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCities(): Promise<CityDto[]> {
    if (!this.prisma.isDatabaseAvailable) {
      this.logger.warn('Database is unavailable. Serving mock cities.');
      return getMockCities();
    }

    try {
      const cities = await this.prisma.city.findMany({
        orderBy: { name: 'asc' },
      });

      return cities.map((city) => ({
        id: city.id,
        name: city.name,
        slug: city.slug,
      }));
    } catch (error) {
      this.logger.error(
        'Failed to load cities from the database. Falling back to mock data.',
        error instanceof Error ? error.stack : undefined,
      );
      return getMockCities();
    }
  }
}
