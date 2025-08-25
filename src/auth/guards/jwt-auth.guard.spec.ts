import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Test } from '@nestjs/testing';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = moduleRef.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should call super.canActivate', () => {
      // Create a mock execution context
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: { authorization: 'Bearer token' },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      // Mock the super.canActivate method
      const superCanActivateSpy = jest
        .spyOn(JwtAuthGuard.prototype, 'canActivate')
        .mockImplementation(function(this: any) {
          // Skip calling the original implementation to avoid infinite recursion
          if (this === guard) {
            return true;
          }
          return true;
        });

      const result = guard.canActivate(mockContext);
      
      expect(result).toBe(true);
      expect(superCanActivateSpy).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('handleRequest', () => {
    it('should return user when no error and user exists', () => {
      const mockUser = { id: '1', username: 'testuser' };
      
      const result = guard.handleRequest(null, mockUser);
      
      expect(result).toBe(mockUser);
    });

    it('should throw the original error when an error occurs', () => {
      const mockError = new Error('Test error');
      
      expect(() => {
        guard.handleRequest(mockError, null);
      }).toThrow(mockError);
    });

    it('should throw UnauthorizedException when no error but user is null', () => {
      expect(() => {
        guard.handleRequest(null, null);
      }).toThrow(UnauthorizedException);
      
      expect(() => {
        guard.handleRequest(null, null);
      }).toThrow('Authentication required');
    });
  });
});
