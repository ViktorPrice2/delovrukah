import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CityDto } from './dto/city.dto';

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async getCities(): Promise<CityDto[]> {
    const cities = await this.prisma.city.findMany({
      orderBy: { name: 'asc' },
    });

    return cities.map((city) => ({
      id: city.id,
      name: city.name,
      slug: city.slug,
    }));
  }
}
