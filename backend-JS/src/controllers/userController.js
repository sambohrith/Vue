const { userService } = require('../services');
const { success, created, error, paginated } = require('../utils/response');

const listUsers = async (req, res) => {
  try {
    const result = await userService.listUsers(req.query);
    return res.json({
      success: true,
      message: '获取成功',
      data: {
        users: result.users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      }
    });
  } catch (err) {
    return error(res, 500, '获取用户列表失败');
  }
};

const getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(parseInt(req.params.id));
    return success(res, { user: user.toPublicJSON() }, '获取成功');
  } catch (err) {
    return error(res, 404, err.message);
  }
};

const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    return created(res, { user: user.toPublicJSON() }, '用户创建成功');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(parseInt(req.params.id), req.body);
    return success(res, { user: user.toPublicJSON() }, '用户更新成功');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.userId) {
      return error(res, 400, '不能删除自己的账号');
    }
    await userService.deleteUser(parseInt(req.params.id));
    return success(res, null, '用户已删除');
  } catch (err) {
    return error(res, 500, '删除用户失败');
  }
};

const toggleUserActive = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.userId) {
      return error(res, 400, '不能禁用自己的账号');
    }
    const user = await userService.toggleUserActive(parseInt(req.params.id));
    const message = user.isActive ? '用户已启用' : '用户已禁用';
    return success(res, { user: user.toPublicJSON() }, message);
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const getUserStats = async (req, res) => {
  try {
    const stats = await userService.getUserStats();
    return success(res, stats, '获取成功');
  } catch (err) {
    return error(res, 500, '获取统计失败');
  }
};

const getMyInfo = async (req, res) => {
  try {
    const user = await userService.getUserById(req.userId);
    return success(res, user.toProfileJSON(), '获取成功');
  } catch (err) {
    return error(res, 404, err.message);
  }
};

const updateMyInfo = async (req, res) => {
  try {
    const user = await userService.updateProfile(req.userId, req.body);
    return success(res, user.toProfileJSON(), '更新成功');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const stats = await userService.getDashboardStats();
    return success(res, stats, '获取成功');
  } catch (err) {
    return error(res, 500, '获取统计失败');
  }
};

const getAllContacts = async (req, res) => {
  try {
    const contacts = await userService.getAllContacts(req.userId);
    return success(res, { contacts, total: contacts.length }, '获取成功');
  } catch (err) {
    console.error('[getAllContacts] Error:', err.message);
    return error(res, 500, '获取联系人失败: ' + err.message);
  }
};

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  getUserStats,
  getMyInfo,
  updateMyInfo,
  getDashboardStats,
  getAllContacts
};
