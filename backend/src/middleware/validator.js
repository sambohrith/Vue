const { body, validationResult } = require('express-validator');

// 处理验证结果
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入数据验证失败',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// 用户注册验证
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('姓名不能超过50个字符'),
  handleValidationErrors,
];

// 用户登录验证
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('请输入用户名'),
  body('password')
    .notEmpty()
    .withMessage('请输入密码'),
  handleValidationErrors,
];

// 更新个人信息验证
const updateProfileValidation = [
  body('profile.fullName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('姓名不能超过50个字符'),
  body('profile.gender')
    .optional()
    .isIn(['male', 'female', 'other', ''])
    .withMessage('无效的性别选项'),
  body('profile.phone')
    .optional()
    .trim()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码'),
  body('profile.idCard')
    .optional()
    .trim()
    .matches(/^\d{17}[\dXx]$/)
    .withMessage('请输入有效的身份证号'),
  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('请输入有效的日期格式'),
  handleValidationErrors,
];

// 更新工作信息验证
const updateWorkInfoValidation = [
  body('workInfo.department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('部门名称不能超过100个字符'),
  body('workInfo.position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('职位名称不能超过100个字符'),
  body('workInfo.employeeId')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('工号不能超过50个字符'),
  body('workInfo.hireDate')
    .optional()
    .isISO8601()
    .withMessage('请输入有效的日期格式'),
  body('workInfo.workYears')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('工作年限必须是0-100之间的整数'),
  handleValidationErrors,
];

// 更新教育信息验证
const updateEducationValidation = [
  body('education.highestDegree')
    .optional()
    .isIn(['high_school', 'associate', 'bachelor', 'master', 'doctorate', 'other', ''])
    .withMessage('无效的学历选项'),
  body('education.school')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('学校名称不能超过100个字符'),
  body('education.major')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('专业名称不能超过100个字符'),
  body('education.graduationYear')
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage('毕业年份必须在1900-2100之间'),
  handleValidationErrors,
];

// 更新地址信息验证
const updateAddressValidation = [
  body('address.province')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('省份名称不能超过50个字符'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('城市名称不能超过50个字符'),
  body('address.district')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('区县名称不能超过50个字符'),
  body('address.detail')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('详细地址不能超过200个字符'),
  body('address.zipCode')
    .optional()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('请输入有效的6位邮编'),
  handleValidationErrors,
];

// 修改密码验证
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('请输入当前密码'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密码至少需要6个字符'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('两次输入的密码不一致');
      }
      return true;
    }),
  handleValidationErrors,
];

// 创建用户验证（管理员）
const createUserValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符'),
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('无效的角色类型'),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  updateWorkInfoValidation,
  updateEducationValidation,
  updateAddressValidation,
  changePasswordValidation,
  createUserValidation,
  handleValidationErrors,
};
