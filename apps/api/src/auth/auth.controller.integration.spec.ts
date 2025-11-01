import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';

const ACCESS_TOKEN_STUB = { access_token: 'test-token' } as const;

describe('AuthController (integration)', () => {
  let app: INestApplication;

  const authServiceMock = {
    signup: jest.fn().mockResolvedValue(ACCESS_TOKEN_STUB),
    signin: jest.fn().mockResolvedValue(ACCESS_TOKEN_STUB),
  } satisfies Record<string, jest.Mock>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(AuthService)
      .useValue(authServiceMock)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/signin returns an access token', async () => {
    await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: 'user@example.com', password: 'secret' })
      .expect(200)
      .expect(ACCESS_TOKEN_STUB);

    expect(authServiceMock.signin).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret',
    });
  });

  it('POST /auth/signup returns an access token', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'user@example.com',
        password: 'secret',
        role: 'CUSTOMER',
      })
      .expect(201)
      .expect(ACCESS_TOKEN_STUB);

    expect(authServiceMock.signup).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret',
      role: 'CUSTOMER',
    });
  });
});
