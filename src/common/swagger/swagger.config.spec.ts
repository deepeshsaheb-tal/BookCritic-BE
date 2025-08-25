import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { setupSwagger } from './swagger.config';

// Mock @nestjs/swagger
jest.mock('@nestjs/swagger', () => {
  const documentBuilderMock = {
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    addBearerAuth: jest.fn().mockReturnThis(),
    addTag: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue('swagger-options'),
  };

  return {
    DocumentBuilder: jest.fn(() => documentBuilderMock),
    SwaggerModule: {
      createDocument: jest.fn().mockReturnValue('swagger-document'),
      setup: jest.fn(),
    },
  };
});

describe('Swagger Configuration', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Create a mock NestJS application
    const moduleRef = await Test.createTestingModule({}).compile();
    app = moduleRef.createNestApplication();
    
    // Mock app.use and other methods
    app.use = jest.fn();
    app.enableCors = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should configure Swagger correctly', () => {
    // Call the setupSwagger function
    setupSwagger(app);

    // Verify DocumentBuilder was configured correctly
    const documentBuilder = new DocumentBuilder();
    
    expect(documentBuilder.setTitle).toHaveBeenCalledWith('BookCritic API');
    expect(documentBuilder.setDescription).toHaveBeenCalledWith('API documentation for the BookCritic platform');
    expect(documentBuilder.setVersion).toHaveBeenCalledWith('1.0.0');
    
    // Verify bearer auth was added
    expect(documentBuilder.addBearerAuth).toHaveBeenCalledWith(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token WITHOUT Bearer prefix',
      },
      'access-token',
    );
    
    // Verify tags were added
    expect(documentBuilder.addTag).toHaveBeenCalledWith('auth', 'Authentication endpoints');
    expect(documentBuilder.addTag).toHaveBeenCalledWith('users', 'User management endpoints');
    expect(documentBuilder.addTag).toHaveBeenCalledWith('books', 'Book management endpoints');
    expect(documentBuilder.addTag).toHaveBeenCalledWith('reviews', 'Review management endpoints');
    expect(documentBuilder.addTag).toHaveBeenCalledWith('genres', 'Genre management endpoints');
    expect(documentBuilder.addTag).toHaveBeenCalledWith('recommendations', 'Book recommendation endpoints');
    expect(documentBuilder.addTag).toHaveBeenCalledWith('health', 'Health check endpoints');
    
    // Verify build was called
    expect(documentBuilder.build).toHaveBeenCalled();
    
    // Verify SwaggerModule methods were called
    expect(SwaggerModule.createDocument).toHaveBeenCalledWith(app, 'swagger-options');
    expect(SwaggerModule.setup).toHaveBeenCalledWith('api-docs', app, 'swagger-document', {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  });
});
