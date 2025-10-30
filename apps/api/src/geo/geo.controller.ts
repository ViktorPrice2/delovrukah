import { Controller, Get } from '@nestjs/common';
import { GeoService } from './geo.service';
import { CityDto } from './dto/city.dto';

@Controller('cities')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get()
  getCities(): Promise<CityDto[]> {
    return this.geoService.getCities();
  }
}
