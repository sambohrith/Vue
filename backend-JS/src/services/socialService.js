const { Post, PostLike, PostComment, User, Sequelize } = require('../models');

const getPosts = async (currentUserId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Post.findAndCountAll({
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [{ model: User, as: 'Author', attributes: ['id', 'username', 'fullName', 'avatar'] }]
  });

  const posts = await Promise.all(rows.map(async (post) => {
    const likeCount = await PostLike.count({ where: { postId: post.id } });
    const commentCount = await PostComment.count({ where: { postId: post.id } });
    const isLiked = await PostLike.count({
      where: { postId: post.id, userId: currentUserId }
    });

    let images = [];
    if (post.images) {
      try {
        images = JSON.parse(post.images);
      } catch (e) {
        images = post.images.split(',').filter(img => img.trim());
      }
    }

    return {
      id: post.id,
      content: post.content,
      userId: post.userId,
      userName: post.Author ? (post.Author.fullName || post.Author.username) : '',
      userAvatar: post.Author ? post.Author.avatar : '',
      isPublic: true,
      createdAt: post.createdAt ? post.createdAt.toISOString().replace('T', ' ').substring(0, 19) : null,
      updatedAt: post.updatedAt ? post.updatedAt.toISOString().replace('T', ' ').substring(0, 19) : null,
      likes: likeCount,
      comments: commentCount,
      images,
      isLiked: isLiked > 0
    };
  }));

  return {
    posts,
    total: count,
    page: parseInt(page),
    limit: parseInt(limit)
  };
};

const createPost = async (userId, req) => {
  const { content, images } = req;

  const post = await Post.create({
    userId,
    content,
    images: images ? JSON.stringify(images) : null,
    isActive: true
  });

  const user = await User.findByPk(userId);

  return {
    id: post.id,
    content: post.content,
    userId: post.userId,
    userName: user ? (user.fullName || user.username) : '',
    userAvatar: user ? user.avatar : '',
    isPublic: true,
    createdAt: post.createdAt ? post.createdAt.toISOString().replace('T', ' ').substring(0, 19) : null,
    updatedAt: post.updatedAt ? post.updatedAt.toISOString().replace('T', ' ').substring(0, 19) : null,
    likes: 0,
    comments: 0,
    images: images || [],
    isLiked: false
  };
};

const deletePost = async (postId, userId) => {
  const post = await Post.findByPk(postId);

  if (!post) {
    throw new Error('帖子不存在');
  }

  if (post.userId !== userId) {
    throw new Error('只能删除自己的帖子');
  }

  await post.destroy();
  return { success: true };
};

const toggleLike = async (postId, userId) => {
  const existingLike = await PostLike.findOne({
    where: { postId, userId }
  });

  if (existingLike) {
    await existingLike.destroy();
    return { liked: false };
  } else {
    await PostLike.create({ postId, userId });
    return { liked: true };
  }
};

const addComment = async (postId, userId, req) => {
  const { content, parentId } = req;

  const comment = await PostComment.create({
    postId,
    userId,
    content,
    parentId: parentId || null
  });

  const user = await User.findByPk(userId);

  return {
    id: comment.id,
    content: comment.content,
    userId: comment.userId,
    userName: user ? (user.fullName || user.username) : '',
    userAvatar: user ? user.avatar : '',
    postId: comment.postId,
    createdAt: comment.createdAt ? comment.createdAt.toISOString().replace('T', ' ').substring(0, 19) : null
  };
};

module.exports = {
  getPosts,
  createPost,
  deletePost,
  toggleLike,
  addComment
};
