/**
 * 文件名：adminMailService.js
 * 作者：Trae AI
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：后台管理系统邮件服务，提供邮件模板管理、邮件发送和发送记录查询功能
 * 更新记录：
 *   2026-05-31 - v1.0.0 - 初始创建邮件管理服务
 */

const pool = require('../config/db');
const logger = require('../config/logger');

let mailTemplates = [
  {
    id: 1,
    title: '活动奖励通知',
    content: '亲爱的玩家，恭喜您完成活动任务，奖励已发放到您的邮箱，请查收！',
    createdAt: '2026-05-24 10:00:00',
    updatedAt: '2026-05-24 10:00:00',
  },
  {
    id: 2,
    title: '系统维护通知',
    content: '亲爱的玩家，我们将于近期进行系统维护，详情请查看官网公告。',
    createdAt: '2026-05-23 18:00:00',
    updatedAt: '2026-05-23 18:00:00',
  },
];

let mailHistory = [
  {
    id: 1,
    title: '活动奖励通知',
    recipients: '所有用户',
    recipientCount: 150,
    sendTime: '2026-05-24 10:30:00',
    status: 'sent',
  },
  {
    id: 2,
    title: '系统维护通知',
    recipients: '在线用户',
    recipientCount: 85,
    sendTime: '2026-05-23 18:00:00',
    status: 'sent',
  },
];

let nextTemplateId = 3;
let nextMailId = 3;

/**
 * 获取邮件模板列表
 * @returns {Array} 模板列表
 */
function getMailTemplates() {
  return mailTemplates;
}

/**
 * 获取邮件模板详情
 * @param {number} templateId - 模板ID
 * @returns {Object} 模板对象
 */
function getMailTemplateById(templateId) {
  const template = mailTemplates.find((t) => t.id === templateId);
  if (!template) {
    throw new Error('邮件模板不存在');
  }
  return template;
}

/**
 * 创建邮件模板
 * @param {Object} data - 模板数据 { title, content }
 * @returns {Object} 创建的模板
 */
function createMailTemplate(data) {
  const template = {
    id: nextTemplateId++,
    title: data.title,
    content: data.content,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  mailTemplates.push(template);
  logger.info('邮件模板已创建', {
    templateId: template.id,
    title: template.title,
  });
  return template;
}

/**
 * 更新邮件模板
 * @param {number} templateId - 模板ID
 * @param {Object} data - 更新数据 { title, content }
 * @returns {Object} 更新后的模板
 */
function updateMailTemplate(templateId, data) {
  const template = mailTemplates.find((t) => t.id === templateId);
  if (!template) {
    throw new Error('邮件模板不存在');
  }
  if (data.title !== undefined) template.title = data.title;
  if (data.content !== undefined) template.content = data.content;
  template.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
  logger.info('邮件模板已更新', { templateId, title: template.title });
  return template;
}

/**
 * 删除邮件模板
 * @param {number} templateId - 模板ID
 */
function deleteMailTemplate(templateId) {
  const index = mailTemplates.findIndex((t) => t.id === templateId);
  if (index === -1) {
    throw new Error('邮件模板不存在');
  }
  const removed = mailTemplates.splice(index, 1)[0];
  logger.info('邮件模板已删除', { templateId, title: removed.title });
  return removed;
}

/**
 * 发送邮件
 * @param {Object} data - 发送数据
 * @param {string} data.recipientType - 收件人类型: all/online/level/custom
 * @param {number|null} data.minLevel - 最低等级(level类型时)
 * @param {number|null} data.maxLevel - 最高等级(level类型时)
 * @param {string|null} data.userIds - 自定义用户ID列表(custom类型时)
 * @param {string} data.title - 邮件标题
 * @param {string} data.content - 邮件内容
 * @param {Object|null} data.attachments - 附件奖励
 * @param {string} data.sendTime - 发送时间: now/schedule
 * @param {string|null} data.scheduleTime - 定时时间(schedule类型时)
 * @returns {Object} 发送结果
 */
async function sendMail(data) {
  let recipientLabel = '';
  let recipientCount = 0;

  switch (data.recipientType) {
    case 'all':
      recipientLabel = '所有用户';
      recipientCount = await getTotalPlayerCount();
      break;
    case 'online':
      recipientLabel = '在线用户';
      recipientCount = 0;
      break;
    case 'level':
      recipientLabel = `等级${data.minLevel || 0}-${data.maxLevel || 0}用户`;
      recipientCount = await getPlayerCountByLevel(
        parseInt(data.minLevel) || 0,
        parseInt(data.maxLevel) || 999
      );
      break;
    case 'custom':
      recipientLabel =
        '指定用户(' + (data.userIds || '').split(',').length + '人)';
      recipientCount = 0;
      break;
    default:
      recipientLabel = '未知';
  }

  const status = data.sendTime === 'schedule' ? 'pending' : 'sent';

  const mailRecord = {
    id: nextMailId++,
    title: data.title,
    content: data.content,
    recipientType: data.recipientType,
    recipients: recipientLabel,
    recipientCount,
    attachments: data.attachments || {},
    sendTime:
      data.sendTime === 'schedule'
        ? data.scheduleTime
        : new Date().toISOString().replace('T', ' ').slice(0, 19),
    status,
  };

  mailHistory.unshift(mailRecord);

  logger.info('邮件已发送', {
    mailId: mailRecord.id,
    title: data.title,
    recipients: recipientLabel,
    status,
  });

  return mailRecord;
}

/**
 * 获取发送历史
 * @param {Object} params - 查询参数 { status, search }
 * @returns {Array} 发送记录列表
 */
function getMailHistory(params = {}) {
  let list = [...mailHistory];

  if (params.status && params.status !== 'all') {
    list = list.filter((m) => m.status === params.status);
  }

  if (params.search) {
    const keyword = params.search.toLowerCase();
    list = list.filter(
      (m) =>
        m.title.toLowerCase().includes(keyword) ||
        m.recipients.toLowerCase().includes(keyword)
    );
  }

  return list;
}

/**
 * 获取邮件详情
 * @param {number} mailId - 邮件ID
 * @returns {Object} 邮件详情
 */
function getMailDetail(mailId) {
  const mail = mailHistory.find((m) => m.id === mailId);
  if (!mail) {
    throw new Error('邮件记录不存在');
  }
  return mail;
}

/**
 * 获取玩家总数
 * @returns {number} 玩家总数
 */
async function getTotalPlayerCount() {
  try {
    const result = await pool.query('SELECT COUNT(*) AS count FROM player');
    return parseInt(result.rows[0].count) || 0;
  } catch (error) {
    logger.warn('获取玩家总数失败', { error: error.message });
    return 0;
  }
}

/**
 * 获取指定等级范围的玩家数
 * @param {number} minLevel - 最低等级
 * @param {number} maxLevel - 最高等级
 * @returns {number} 玩家数
 */
async function getPlayerCountByLevel(minLevel, maxLevel) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) AS count FROM player WHERE world_level >= $1 AND world_level <= $2',
      [minLevel, maxLevel]
    );
    return parseInt(result.rows[0].count) || 0;
  } catch (error) {
    logger.warn('获取等级范围玩家数失败', {
      minLevel,
      maxLevel,
      error: error.message,
    });
    return 0;
  }
}

module.exports = {
  getMailTemplates,
  getMailTemplateById,
  createMailTemplate,
  updateMailTemplate,
  deleteMailTemplate,
  sendMail,
  getMailHistory,
  getMailDetail,
};
