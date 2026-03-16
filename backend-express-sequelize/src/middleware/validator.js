const { AppError } = require('./errorHandler');

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

const validateLogin = (req, res, next) => {
  const { username, password } = req.body;

  if (!username) {
    throw new AppError('请输入用户名', 400);
  }

  if (!password) {
    throw new AppError('请输入密码', 400);
  }

  req.body.username = sanitizeString(username);
  next();
};

const validateRegister = (req, res, next) => {
  const { username, email, password, fullName } = req.body;

  if (!username) {
    throw new AppError('请输入用户名', 400);
  }

  if (!validateUsername(username)) {
    throw new AppError('用户名必须是3-20个字符，只能包含字母、数字和下划线', 400);
  }

  if (!email) {
    throw new AppError('请输入邮箱', 400);
  }

  if (!validateEmail(email)) {
    throw new AppError('邮箱格式不正确', 400);
  }

  if (!password) {
    throw new AppError('请输入密码', 400);
  }

  if (!validatePassword(password)) {
    throw new AppError('密码长度至少为6个字符', 400);
  }

  req.body.username = sanitizeString(username);
  req.body.email = sanitizeString(email);
  if (fullName) req.body.fullName = sanitizeString(fullName);

  next();
};

const validateUserUpdate = (req, res, next) => {
  const { username, email, password, role, isActive, fullName, phone, department, position, gender, bio, skills } = req.body;

  if (username) {
    if (!validateUsername(username)) {
      throw new AppError('用户名必须是3-20个字符，只能包含字母、数字和下划线', 400);
    }
    req.body.username = sanitizeString(username);
  }

  if (email) {
    if (!validateEmail(email)) {
      throw new AppError('邮箱格式不正确', 400);
    }
    req.body.email = sanitizeString(email);
  }

  if (password && !validatePassword(password)) {
    throw new AppError('密码长度至少为6个字符', 400);
  }

  if (role && !['admin', 'user'].includes(role)) {
    throw new AppError('无效的用户角色', 400);
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    throw new AppError('isActive必须是布尔值', 400);
  }

  if (fullName) req.body.fullName = sanitizeString(fullName);
  if (phone) req.body.phone = sanitizeString(phone);
  if (department) req.body.department = sanitizeString(department);
  if (position) req.body.position = sanitizeString(position);
  if (gender && !['male', 'female', 'other'].includes(gender)) {
    throw new AppError('无效的性别', 400);
  }
  if (bio) req.body.bio = sanitizeString(bio);

  next();
};

const validateProfileUpdate = (req, res, next) => {
  const { fullName, phone, department, position, gender, bio, skills } = req.body;

  if (fullName) req.body.fullName = sanitizeString(fullName);
  if (phone) req.body.phone = sanitizeString(phone);
  if (department) req.body.department = sanitizeString(department);
  if (position) req.body.position = sanitizeString(position);
  if (gender && !['male', 'female', 'other'].includes(gender)) {
    throw new AppError('无效的性别', 400);
  }
  if (bio) req.body.bio = sanitizeString(bio);

  next();
};

const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    throw new AppError('页码必须是大于0的整数', 400);
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    throw new AppError('每页数量必须是1-100之间的整数', 400);
  }

  next();
};

const validateChatMessage = (req, res, next) => {
  const { content, receiverId } = req.body;

  if (!content) {
    throw new AppError('消息内容不能为空', 400);
  }

  if (content.length > 1000) {
    throw new AppError('消息内容不能超过1000个字符', 400);
  }

  if (!receiverId || isNaN(receiverId)) {
    throw new AppError('无效的接收者ID', 400);
  }

  req.body.content = sanitizeString(content);

  next();
};

const validatePost = (req, res, next) => {
  const { title, content } = req.body;

  if (!title) {
    throw new AppError('标题不能为空', 400);
  }

  if (title.length > 200) {
    throw new AppError('标题不能超过200个字符', 400);
  }

  if (!content) {
    throw new AppError('内容不能为空', 400);
  }

  if (content.length > 5000) {
    throw new AppError('内容不能超过5000个字符', 400);
  }

  req.body.title = sanitizeString(title);
  req.body.content = sanitizeString(content);

  next();
};

const validateComment = (req, res, next) => {
  const { content } = req.body;

  if (!content) {
    throw new AppError('评论内容不能为空', 400);
  }

  if (content.length > 500) {
    throw new AppError('评论内容不能超过500个字符', 400);
  }

  req.body.content = sanitizeString(content);

  next();
};

module.exports = {
  validateLogin,
  validateRegister,
  validateUserUpdate,
  validateProfileUpdate,
  validatePagination,
  validateChatMessage,
  validatePost,
  validateComment,
  validateEmail,
  validateUsername,
  validatePassword,
  sanitizeString
};
