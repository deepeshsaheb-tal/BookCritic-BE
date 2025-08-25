import { Test } from '@nestjs/testing';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthGuard } from '@nestjs/passport';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [LocalAuthGuard],
    }).compile();

    guard = moduleRef.get<LocalAuthGuard>(LocalAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard with local strategy', () => {
    // Verify that LocalAuthGuard is an instance of AuthGuard
    expect(guard).toBeInstanceOf(AuthGuard('local'));
  });
});
