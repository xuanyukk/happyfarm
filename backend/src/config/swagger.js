/**
 * 文件名：swagger.js
 * 作者：开发者
 * 日期：2026-05-12
 * 版本：v1.2.0
 * 功能描述：Swagger API文档配置
 * 更新记录：
 *   2026-03-19 - v1.0.0 - Swagger API文档配置
 *   2026-03-22 - v1.1.0 - 统一文件头注释格式
 *   2026-05-12 - v1.2.0 - 添加数据库性能管理API完整注解
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '开心农场 API 文档',
      version: '1.0.0',
      description: '开心农场后端服务API接口文档',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: '开发服务器',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '用户ID',
            },
            username: {
              type: 'string',
              description: '用户名',
            },
            email: {
              type: 'string',
              format: 'email',
              description: '邮箱',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: '用户名',
            },
            password: {
              type: 'string',
              description: '密码',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              description: '用户名',
            },
            email: {
              type: 'string',
              format: 'email',
              description: '邮箱',
            },
            password: {
              type: 'string',
              description: '密码',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            token: {
              type: 'string',
              description: 'JWT访问令牌',
            },
            refreshToken: {
              type: 'string',
              description: '刷新令牌',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              default: false,
            },
            message: {
              type: 'string',
              description: '错误信息',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
            },
          },
        },
        CacheStatsResponse: {
          type: 'object',
          properties: {
            memoryCacheSize: {
              type: 'integer',
              description: '内存缓存大小',
            },
            loadingKeysCount: {
              type: 'integer',
              description: '正在加载的键数量',
            },
            redisConnected: {
              type: 'boolean',
              description: 'Redis连接状态',
            },
            redisInfo: {
              type: 'string',
              description: 'Redis信息',
            },
          },
        },
        IndexStats: {
          type: 'object',
          properties: {
            schemaname: {
              type: 'string',
              description: '架构名称',
            },
            tablename: {
              type: 'string',
              description: '表名称',
            },
            indexname: {
              type: 'string',
              description: '索引名称',
            },
            indexdef: {
              type: 'string',
              description: '索引定义',
            },
            idx_scan: {
              type: 'integer',
              description: '索引扫描次数',
            },
            idx_tup_read: {
              type: 'integer',
              description: '索引元组读取数',
            },
            idx_tup_fetch: {
              type: 'integer',
              description: '索引元组获取数',
            },
            index_size: {
              type: 'string',
              description: '索引大小',
            },
          },
        },
        TableStats: {
          type: 'object',
          properties: {
            schemaname: {
              type: 'string',
              description: '架构名称',
            },
            tablename: {
              type: 'string',
              description: '表名称',
            },
            total_size: {
              type: 'string',
              description: '总大小',
            },
            table_size: {
              type: 'string',
              description: '表大小',
            },
            index_size: {
              type: 'string',
              description: '索引大小',
            },
            n_tup_ins: {
              type: 'integer',
              description: '插入元组数量',
            },
            n_tup_upd: {
              type: 'integer',
              description: '更新元组数量',
            },
            n_tup_del: {
              type: 'integer',
              description: '删除元组数量',
            },
            n_live_tup: {
              type: 'integer',
              description: '活跃元组数量',
            },
            n_dead_tup: {
              type: 'integer',
              description: '死亡元组数量',
            },
          },
        },
        SlowQuery: {
          type: 'object',
          properties: {
            queryid: {
              type: 'integer',
              description: '查询ID',
            },
            query: {
              type: 'string',
              description: '查询语句',
            },
            calls: {
              type: 'integer',
              description: '调用次数',
            },
            total_time: {
              type: 'number',
              description: '总执行时间',
            },
            mean_time: {
              type: 'number',
              description: '平均执行时间',
            },
            rows: {
              type: 'integer',
              description: '返回行数',
            },
          },
        },
        DbHealthStatus: {
          type: 'object',
          properties: {
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '时间戳',
            },
            indexes: {
              type: 'object',
              properties: {
                total: { type: 'integer', description: '总索引数' },
                unused: { type: 'integer', description: '未使用索引数' },
                topUsed: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/IndexStats' },
                },
              },
            },
            tables: {
              type: 'array',
              items: { $ref: '#/components/schemas/TableStats' },
            },
            slowQueries: {
              type: 'array',
              items: { $ref: '#/components/schemas/SlowQuery' },
            },
          },
        },
        QueryCacheStats: {
          type: 'object',
          properties: {
            size: {
              type: 'integer',
              description: '当前缓存大小',
            },
            maxSize: {
              type: 'integer',
              description: '最大缓存大小',
            },
            enabled: {
              type: 'boolean',
              description: '缓存是否启用',
            },
          },
        },
      },
    },
    tags: [
      {
        name: '认证',
        description: '用户认证相关接口',
      },
      {
        name: '健康检查',
        description: '服务健康检查接口',
      },
      {
        name: '备份管理',
        description: '数据库备份管理接口',
      },
      {
        name: '缓存管理',
        description: '缓存系统管理接口',
      },
      {
        name: '数据库性能管理',
        description: '数据库性能监控和优化接口',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/server.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
