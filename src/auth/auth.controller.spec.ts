import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'user',
  };

  const mockAuthResponse = {
    accessToken: 'test_token',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return token with user info', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password',
        displayName: 'Test User',
      };

      jest.spyOn(service, 'register').mockResolvedValueOnce(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(service.register).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.displayName,
      );
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw UnauthorizedException when email is already in use', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password',
        displayName: 'Existing User',
      };

      jest.spyOn(service, 'register').mockRejectedValueOnce(
        new UnauthorizedException('Email already in use'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(UnauthorizedException);
      expect(service.register).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.displayName,
      );
    });
  });

  describe('login', () => {
    it('should login user and return token with user info', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      const req = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'user',
        },
      };

      jest.spyOn(service, 'login').mockResolvedValueOnce(mockAuthResponse);

      const result = await controller.login(req, loginDto);

      expect(service.login).toHaveBeenCalledWith(req.user);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('validate', () => {
    it('should validate JWT token and return user info', async () => {
      const req = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          role: 'user',
        },
      };

      const result = await controller.validate(req);

      expect(result).toEqual({
        valid: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
        },
      });
    });
  });
});
