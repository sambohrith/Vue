const Post = require('../models/Post');
const PostLike = require('../models/PostLike');
const PostComment = require('../models/PostComment');
const User = require('../../user/models/User');
const { Op } = require('sequelize');

// 调试：检查 PostLike 模型
console.log('PostLike 模型加载检查:', {
  PostLike: !!PostLike,
  PostLikeFindOne: !!PostLike.findOne,
  PostLikeCreate: !!PostLike.create
});

// 创建说说
async function createPost(req, res) {
  try {
    const { content, images, isPublic } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: '内容不能为空' });
    }

    const post = await Post.create({
      userId,
      content,
      images: images || [],
      isPublic: isPublic !== undefined ? isPublic : true
    });

    // 返回包含用户信息的帖子
    const postWithUser = await Post.findByPk(post.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'avatar'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: '发布成功',
      data: { post: postWithUser }
    });
  } catch (error) {
    console.error('创建说说失败:', error);
    res.status(500).json({ success: false, message: '发布失败' });
  }
}

// 获取说说列表
async function getPosts(req, res) {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (userId) where.userId = userId;

    const posts = await Post.findAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'avatar'] },
        { model: PostLike, as: 'likes', required: false, include: [{ model: User, as: 'user', attributes: ['id', 'username', 'fullName'] }] },
        { model: PostComment, as: 'comments', required: false, include: [{ model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'avatar'] }] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const total = await Post.count({ where });

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取说说列表失败:', error.message);
    console.error('错误详情:', error.stack);
    res.status(500).json({ success: false, message: '获取失败: ' + error.message });
  }
}

// 获取单条说说
async function getPost(req, res) {
  try {
    const { id } = req.params;

    const post = await Post.findByPk(id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'avatar'] },
        { model: PostLike, as: 'likes', required: false, include: [{ model: User, as: 'user', attributes: ['id', 'username', 'fullName'] }] },
        { model: PostComment, as: 'comments', required: false, include: [{ model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'avatar'] }] }
      ]
    });

    if (!post) {
      return res.status(404).json({ success: false, message: '说说不存在' });
    }

    res.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    console.error('获取说说失败:', error);
    res.status(500).json({ success: false, message: '获取失败' });
  }
}

// 更新说说
async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const { content, images } = req.body;
    const userId = req.user.id;

    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({ success: false, message: '说说不存在' });
    }

    // 只能修改自己的说说
    if (post.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权修改' });
    }

    post.content = content || post.content;
    if (images !== undefined) post.images = images;
    await post.save();

    res.json({
      success: true,
      message: '更新成功',
      data: { post }
    });
  } catch (error) {
    console.error('更新说说失败:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
}

// 删除说说
async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({ success: false, message: '说说不存在' });
    }

    // 只能删除自己的说说（管理员可以删除所有）
    if (post.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权删除' });
    }

    await post.destroy();

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除说说失败:', error);
    res.status(500).json({ success: false, message: '删除失败' });
  }
}

// 点赞
async function likePost(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log('点赞请求:', { postId: id, userId });

    const post = await Post.findByPk(id);
    if (!post) {
      console.log('说说不存在:', id);
      return res.status(404).json({ success: false, message: '说说不存在' });
    }
    
    console.log('找到说说:', post.id);

    // 检查是否已点赞
    console.log('检查是否已点赞...');
    const existingLike = await PostLike.findOne({
      where: { postId: id, userId }
    });
    console.log('已点赞记录:', existingLike ? '存在' : '不存在');

    if (existingLike) {
      // 取消点赞
      await existingLike.destroy();
      // 更新点赞数量
      if (post.likeCount > 0) {
        post.likeCount = post.likeCount - 1;
        await post.save();
      }
      return res.json({
        success: true,
        message: '取消点赞成功',
        data: { liked: false }
      });
    }

    // 添加点赞
    await PostLike.create({ postId: id, userId });
    // 更新点赞数量
    post.likeCount = (post.likeCount || 0) + 1;
    await post.save();

    res.json({
      success: true,
      message: '点赞成功',
      data: { liked: true }
    });
  } catch (error) {
    console.error('点赞失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ success: false, message: '操作失败: ' + error.message });
  }
}

// 评论
async function commentPost(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ success: false, message: '说说不存在' });
    }

    const comment = await PostComment.create({
      postId: id,
      userId,
      content
    });

    // 更新说说的评论数量
    post.commentCount = (post.commentCount || 0) + 1;
    await post.save();

    // 返回包含用户信息的评论
    const commentWithUser = await PostComment.findByPk(comment.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'avatar'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: '评论成功',
      data: { comment: commentWithUser }
    });
  } catch (error) {
    console.error('评论失败:', error);
    res.status(500).json({ success: false, message: '评论失败' });
  }
}

// 删除评论
async function deleteComment(req, res) {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    const comment = await PostComment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }

    // 只能删除自己的评论（管理员可以删除所有）
    if (comment.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权删除' });
    }

    await comment.destroy();

    // 更新说说的评论数量
    const post = await Post.findByPk(postId);
    if (post && post.commentCount > 0) {
      post.commentCount = post.commentCount - 1;
      await post.save();
    }

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ success: false, message: '删除失败' });
  }
}

// 获取评论列表
async function getComments(req, res) {
  try {
    const { id } = req.params;

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ success: false, message: '说说不存在' });
    }

    const comments = await PostComment.findAll({
      where: { postId: id },
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'avatar'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      data: { comments }
    });
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ success: false, message: '获取失败' });
  }
}

module.exports = {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  commentPost,
  deleteComment,
  getComments
};
