const { systemService } = require('../services');
const { success, error } = require('../utils/response');

const getSettings = async (req, res) => {
  try {
    const settings = await systemService.getSettings();
    return success(res, settings, '获取成功');
  } catch (err) {
    return error(res, 500, '获取设置失败');
  }
};

const updateSettings = async (req, res) => {
  try {
    const settings = await systemService.updateSettings(req.body);
    return success(res, settings, '更新成功');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const backupDatabase = async (req, res) => {
  try {
    const result = await systemService.backupDatabase();
    return success(res, result, '备份成功');
  } catch (err) {
    return error(res, 500, '备份失败');
  }
};

module.exports = {
  getSettings,
  updateSettings,
  backupDatabase
};
