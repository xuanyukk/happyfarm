
/**
 * 文件名: gameEventMediumController.js
 * 作者: Trae AI
 * 日期: 2026-05-22
 * 版本: v1.0.0
 * 功能描述: 游戏活动中期规划控制器 (模板系统 + 定时任务)
 */

const gameEventTemplateService = require('../services/gameEventTemplateService');
const gameEventSchedulerService = require('../services/gameEventSchedulerService');

// 模板系统控制器
const templateController = {
  // 获取所有模板
  async getAllTemplates(req, res) {
    try {
      const includeInactive = req.query.include_inactive === 'true';
      const templates = await gameEventTemplateService.getAllTemplates(includeInactive);
      res.json({ success: true, data: templates });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 获取单个模板
  async getTemplate(req, res) {
    try {
      const template = await gameEventTemplateService.getTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({ success: false, error: '模板不存在' });
      }
      
      const variables = await gameEventTemplateService.getTemplateVariables(req.params.id);
      const versions = await gameEventTemplateService.getTemplateVersions(req.params.id);
      
      res.json({ 
        success: true, 
        data: { 
          template, 
          variables, 
          versions 
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 创建模板
  async createTemplate(req, res) {
    try {
      const userId = req.user?.id;
      const template = await gameEventTemplateService.createTemplate(req.body, userId);
      res.status(201).json({ success: true, data: template });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 更新模板
  async updateTemplate(req, res) {
    try {
      const userId = req.user?.id;
      const template = await gameEventTemplateService.updateTemplate(req.params.id, req.body, userId);
      res.json({ success: true, data: template });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 从模板创建活动
  async createEventFromTemplate(req, res) {
    try {
      const userId = req.user?.id;
      const event = await gameEventTemplateService.createEventFromTemplate(
        req.params.id, 
        req.body.variables, 
        userId
      );
      res.status(201).json({ success: true, data: event });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 停用模板
  async deactivateTemplate(req, res) {
    try {
      const template = await gameEventTemplateService.deactivateTemplate(req.params.id);
      res.json({ success: true, data: template });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 对比模板版本
  async compareVersions(req, res) {
    try {
      const comparison = await gameEventTemplateService.compareVersions(
        req.params.id,
        parseInt(req.query.version1),
        parseInt(req.query.version2)
      );
      
      if (!comparison) {
        return res.status(404).json({ success: false, error: '版本不存在' });
      }
      
      res.json({ success: true, data: comparison });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// 定时任务控制器
const schedulerController = {
  // 获取可用的任务类型
  async getAvailableTasks(req, res) {
    try {
      const tasks = gameEventSchedulerService.getAvailableTasks();
      res.json({ success: true, data: tasks });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 创建定时任务
  async createTask(req, res) {
    try {
      const task = await gameEventSchedulerService.createTask(req.body);
      res.status(201).json({ success: true, data: task });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 获取任务列表
  async getTasks(req, res) {
    try {
      const filters = {
        status: req.query.status,
        task_type: req.query.task_type,
        event_id: req.query.event_id ? parseInt(req.query.event_id) : null
      };
      const tasks = await gameEventSchedulerService.getTasks(filters);
      res.json({ success: true, data: tasks });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 获取单个任务
  async getTask(req, res) {
    try {
      const tasks = await gameEventSchedulerService.getTasks({});
      const task = tasks.find(t => t.id === parseInt(req.params.id));
      
      if (!task) {
        return res.status(404).json({ success: false, error: '任务不存在' });
      }
      
      const logs = await gameEventSchedulerService.getTaskLogs(req.params.id);
      res.json({ success: true, data: { task, logs } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 取消任务
  async cancelTask(req, res) {
    try {
      await gameEventSchedulerService.cancelTask(req.params.id);
      res.json({ success: true, message: '任务已取消' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = {
  templateController,
  schedulerController
};

