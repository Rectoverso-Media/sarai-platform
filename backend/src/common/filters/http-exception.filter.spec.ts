import { HttpExceptionFilter } from './http-exception.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';

// Helper untuk membuat mock ArgumentsHost
function createMockHost(overrides?: { responseJson?: jest.Mock }) {
  const mockJson = overrides?.responseJson ?? jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
  const mockResponse = { status: mockStatus };
  const mockRequest = { url: '/test-url' };

  return {
    host: {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost,
    mockStatus,
    mockJson,
  };
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  // ─── HttpException handling ───────────────────────────────────────────────

  it('should mengembalikan status code dan message dari HttpException', () => {
    const { host, mockStatus, mockJson } = createMockHost();
    const exception = new HttpException('Resource tidak ditemukan', HttpStatus.NOT_FOUND);

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resource tidak ditemukan',
        path: '/test-url',
      }),
    );
  });

  it('should mengambil pesan pertama dari array validation errors', () => {
    const { host, mockStatus, mockJson } = createMockHost();
    const validationError = new HttpException(
      { message: ['email harus berupa email yang valid', 'password minimal 8 karakter'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(validationError, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    // Harus mengambil pesan PERTAMA dari array
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'email harus berupa email yang valid' }),
    );
  });

  it('should menggunakan pesan string dari HttpException object response', () => {
    const { host, mockJson } = createMockHost();
    const exception = new HttpException(
      { message: 'Custom error message', statusCode: 422 },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    filter.catch(exception, host);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Custom error message' }),
    );
  });

  // ─── Non-HttpException handling ───────────────────────────────────────────

  it('should return 500 untuk non-HttpException errors', () => {
    const { host, mockStatus } = createMockHost();
    const error = new Error('Database connection failed');

    filter.catch(error, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('should log error ke console untuk unexpected errors', () => {
    const { host } = createMockHost();
    const error = new Error('Unexpected server crash');

    filter.catch(error, host);

    expect(console.error).toHaveBeenCalledWith('CRITICAL ERROR:', error);
  });

  it('should response mengandung timestamp dan path', () => {
    const { host, mockJson } = createMockHost();
    const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

    filter.catch(exception, host);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(String),
        path: '/test-url',
      }),
    );
  });

  it('should TIDAK expose stack trace ke client', () => {
    const { host, mockJson } = createMockHost();
    const error = new Error('Internal error with sensitive data');

    filter.catch(error, host);

    const response = mockJson.mock.calls[0][0];
    // Stack trace tidak boleh ada di response
    expect(JSON.stringify(response)).not.toContain('at Object.');
    expect(response).not.toHaveProperty('stack');
  });
});
