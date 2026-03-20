const { socialService } = require('../services');
const { success, created, error } = require('../utils/response');

const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await socialService.getPosts(req.userId, page, limit);
    return success(res, result, '获取成功');
  } catch (err) {
    return error(res, 500, '获取帖子失败');
  }
};

const createPost = async (req, res) => {
  try {
    const post = await socialService.createPost(req.userId, req.body);
    return created(res, post, '创建成功');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const deletePost = async (req, res) => {
  try {
    await socialService.deletePost(parseInt(req.params.id), req.userId);
    return success(res, null, '帖子已删除');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const toggleLike = async (req, res) => {
  try {
    const result = await socialService.toggleLike(parseInt(req.params.id), req.userId);
    return success(res, result, result.liked ? '点赞成功' : '取消点赞');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const addComment = async (req, res) => {
  try {
    const comment = await socialService.addComment(parseInt(req.params.id), req.userId, req.body);
    return created(res, comment, '评论成功');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const testPosts = async (req, res) => {
  try {
    const { Post } = require('../models');
    const posts = await Post.findAll({ order: [['createdAt', 'DESC']] });
    return success(res, { posts, count: posts.length }, '获取成功');
  } catch (err) {
    return error(res, 500, '测试失败');
  }
};

module.exports = {
  getPosts,
  createPost,
  deletePost,
  toggleLike,
  addComment,
  testPosts
};
