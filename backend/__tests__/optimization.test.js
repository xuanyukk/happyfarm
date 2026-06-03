// 文件名：optimization.test.js
// 作者：AI助手
// 日期：2026-04-26
// 版本：v1.0.0
// 功能描述：测试新的优化模块

const {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  errorHandler,
  asyncHandler
} = require('../src/utils/errors');
const { successResponse, createdResponse, paginatedResponse } = require('../src/utils/response');
const { config, validateConfig } = require('../src/config/index');

describe('Error Utils', () => {
  test('AppError should create error with correct properties', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.isOperational).toBe(true);
  });

  test('ValidationError should have correct default status code', () => {
    const error = new ValidationError('Validation failed');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  test('NotFoundError should have correct default status code', () => {
    const error = new NotFoundError('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  test('AppError should convert to JSON correctly', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR');
    const json = error.toJSON();
    expect(json).toEqual({
      success: false,
      message: 'Test error',
      code: 'TEST_ERROR',
      statusCode: 400
    });
  });
});

describe('Response Utils', () => {
  test('successResponse should return correct format', () => {
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn()
    };
    successResponse(mockRes, { id: 1 }, 'Success', 200);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Success',
      data: { id: 1 }
    });
  });

  test('createdResponse should return correct format', () => {
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn()
    };
    createdResponse(mockRes, { id: 1 }, 'Created');
    expect(mockRes.status).toHaveBeenCalledWith(201);
  });

  test('paginatedResponse should return correct format', () => {
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn()
    };
    const pagination = { page: 1, pageSize: 10, total: 100 };
    paginatedResponse(mockRes, [], pagination, 'Success');
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      pagination
    }));
  });
});

describe('Config Utils', () => {
  test('config should have required properties', () => {
    expect(config).toHaveProperty('env');
    expect(config).toHaveProperty('port');
    expect(config).toHaveProperty('database');
    expect(config).toHaveProperty('jwt');
    expect(config).toHaveProperty('cors');
  });

  test('config.jwt should have required properties', () => {
    expect(config.jwt).toHaveProperty('secret');
    expect(config.jwt).toHaveProperty('accessTokenExpiry');
    expect(config.jwt).toHaveProperty('refreshTokenExpiry');
  });
});

describe('Async Handler', () => {
  test('asyncHandler should wrap async function', () => {
    const asyncFn = async (req, res, next) => { return 'ok'; };
    const wrapped = asyncHandler(asyncFn);
    expect(typeof wrapped).toBe('function');
  });

  test('asyncHandler should catch errors and pass to next', async () => {
    const testError = new Error('Test error');
    const asyncFn = async (req, res, next) => { throw testError; };
    const wrapped = asyncHandler(asyncFn);
    const next = jest.fn();
    
    await wrapped({}, {}, next);
    expect(next).toHaveBeenCalledWith(testError);
  });
});