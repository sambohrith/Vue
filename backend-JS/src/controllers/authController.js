const { authService } = require('../services');
const { success, created, error } = require('../utils/response');

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    return created(res, result, '注册成功');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const login = async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    const result = await authService.login(req.body, clientIP);
    return success(res, result, '登录成功');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const logout = async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    await authService.logout(req.userId, clientIP);
    return success(res, null, '登出成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.userId);
    return success(res, { user }, '获取成功');
  } catch (err) {
    return error(res, 404, err.message);
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await authService.getUserProfile(req.userId);
    return success(res, { user: profile }, '获取成功');
  } catch (err) {
    return error(res, 404, err.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    await authService.changePassword(req.userId, req.body, clientIP);
    return success(res, null, '密码修改成功');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const refreshToken = async (req, res) => {
  try {
    const result = await authService.refreshToken(req.body.token);
    return success(res, result, '令牌刷新成功');
  } catch (err) {
    return error(res, 401, err.message);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  getProfile,
  changePassword,
  refreshToken
};
