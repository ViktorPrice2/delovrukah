import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CategoryDto } from './dto/category.dto';
import {
  ServiceDetailDto,
  ServiceSummaryDto,
} from './dto/service.dto';

describe('CatalogController (integration)', () => {
  let app: INestApplication;

  const categoryFixture: CategoryDto = {
    id: 'cat-1',
    name: 'Cleaning',
    slug: 'cleaning',
    description: null,
  };
  const categoryList: CategoryDto[] = [categoryFixture];
  const serviceSummaries: ServiceSummaryDto[] = [
    {
      id: 'service-1',
      name: 'Apartment cleaning',
      slug: 'apartment-cleaning',
      description: 'General apartment cleaning',
      categoryId: 'cat-1',
      latestVersion: null,
      medianPrice: 1000,
      estimatedTime: '2h',
      maxTimeIncluded: null,
    },
  ];
  const serviceDetail: ServiceDetailDto = {
    id: 'service-1',
    name: 'Apartment cleaning',
    slug: 'apartment-cleaning',
    description: 'Full cleaning package',
    categoryId: 'cat-1',
    latestVersion: null,
    medianPrice: 1200,
    estimatedTime: '2h',
    maxTimeIncluded: null,
    authorId: 'author-1',
    keeperId: 'keeper-1',
    category: categoryFixture,
    providers: [],
  };

  const catalogServiceMock = {
    getCategories: jest.fn().mockResolvedValue(categoryList),
    getServicesByCategory: jest.fn().mockResolvedValue(serviceSummaries),
    getServicesByCategorySlug: jest
      .fn()
      .mockResolvedValue([serviceDetail]),
    getServiceBySlugOrId: jest.fn().mockResolvedValue(serviceDetail),
  } satisfies Record<string, jest.Mock>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [{ provide: CatalogService, useValue: catalogServiceMock }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /categories returns available categories', async () => {
    await request(app.getHttpServer())
      .get('/categories')
      .expect(200)
      .expect(categoryList);

    expect(catalogServiceMock.getCategories).toHaveBeenCalledTimes(1);
  });

  it('GET /categories/:id/services returns services for category', async () => {
    await request(app.getHttpServer())
      .get('/categories/cat-1/services')
      .expect(200)
      .expect(serviceSummaries);

    expect(catalogServiceMock.getServicesByCategory).toHaveBeenCalledWith(
      'cat-1',
    );
  });

  it('GET /services filters services by category slug', async () => {
    await request(app.getHttpServer())
      .get('/services')
      .query({ citySlug: 'moscow', categorySlug: 'cleaning' })
      .expect(200)
      .expect([serviceDetail]);

    expect(catalogServiceMock.getServicesByCategorySlug).toHaveBeenCalledWith(
      'moscow',
      'cleaning',
    );
  });

  it('GET /services/:slug returns service details', async () => {
    await request(app.getHttpServer())
      .get('/services/apartment-cleaning')
      .query({ citySlug: 'moscow' })
      .expect(200)
      .expect(serviceDetail);

    expect(catalogServiceMock.getServiceBySlugOrId).toHaveBeenCalledWith(
      'apartment-cleaning',
      'moscow',
    );
  });
});
