const User = require('../../user/models/User');
const { Op } = require('sequelize');

// 获取个人资料
async function getProfile(req, res) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('获取个人资料失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 更新个人资料
async function updateProfile(req, res) {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const {
      fullName,
      phone,
      gender,
      dateOfBirth,
      bio,
      avatar,
      address,
      city,
      country,
      postalCode
    } = req.body;

    // 更新基本信息
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    // 更新地址信息
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (country !== undefined) user.country = country;
    if (postalCode !== undefined) user.postalCode = postalCode;

    await user.save();

    res.json({
      success: true,
      message: '个人资料更新成功',
      data: { user: user.toPublicJSON() }
    });
  } catch (error) {
    console.error('更新个人资料失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 更新工作信息
async function updateWorkInfo(req, res) {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const {
      department,
      position,
      employeeId,
      joinDate,
      workPhone,
      workEmail
    } = req.body;

    if (department !== undefined) user.department = department;
    if (position !== undefined) user.position = position;
    if (employeeId !== undefined) user.employeeId = employeeId;
    if (joinDate !== undefined) user.joinDate = joinDate;
    if (workPhone !== undefined) user.workPhone = workPhone;
    if (workEmail !== undefined) user.workEmail = workEmail;

    await user.save();

    res.json({
      success: true,
      message: '工作信息更新成功',
      data: { user: user.toPublicJSON() }
    });
  } catch (error) {
    console.error('更新工作信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 更新教育信息
async function updateEducationInfo(req, res) {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const {
      education,
      school,
      major,
      graduationYear
    } = req.body;

    if (education !== undefined) user.education = education;
    if (school !== undefined) user.school = school;
    if (major !== undefined) user.major = major;
    if (graduationYear !== undefined) user.graduationYear = graduationYear;

    await user.save();

    res.json({
      success: true,
      message: '教育信息更新成功',
      data: { user: user.toPublicJSON() }
    });
  } catch (error) {
    console.error('更新教育信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 更新头像
async function updateAvatar(req, res) {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ success: false, message: '请提供头像URL' });
    }

    user.avatar = avatar;
    await user.save();

    res.json({
      success: true,
      message: '头像更新成功',
      data: { avatar: user.avatar }
    });
  } catch (error) {
    console.error('更新头像失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 更新密码
async function updatePassword(req, res) {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '请提供当前密码和新密码' });
    }

    // 验证当前密码
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: '当前密码错误' });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: '密码更新成功'
    });
  } catch (error) {
    console.error('更新密码失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 获取其他用户资料
async function getUserProfile(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'email', 'phone', 'address'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 只返回公开信息
    const publicProfile = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      bio: user.bio,
      department: user.department,
      position: user.position,
      role: user.role
    };

    res.json({
      success: true,
      data: { user: publicProfile }
    });
  } catch (error) {
    console.error('获取用户资料失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  updateWorkInfo,
  updateEducationInfo,
  updateAvatar,
  updatePassword,
  getUserProfile
};
