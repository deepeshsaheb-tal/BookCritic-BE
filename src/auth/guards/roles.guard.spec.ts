import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Test } from '@nestjs/testing';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = moduleRef.get<RolesGuard>(RolesGuard);
    reflector = moduleRef.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: ExecutionContext;

    beforeEach(() => {
      mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: '1', username: 'testuser', role: 'user' },
          }),
        }),
      } as unknown as ExecutionContext;
    });

    it('should allow access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should allow access when empty roles array is required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['user', 'admin']);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      expect(() => {
        guard.canActivate(mockContext);
      }).toThrow(ForbiddenException);
      
      expect(() => {
        guard.canActivate(mockContext);
      }).toThrow('Insufficient permissions');
    });

    it('should handle case when user object is missing', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      
      const contextWithoutUser = {
        ...mockContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({}),
        }),
      } as unknown as ExecutionContext;

      expect(() => {
        guard.canActivate(contextWithoutUser);
      }).toThrow();
    });
  });
});
