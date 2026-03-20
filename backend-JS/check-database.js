const { sequelize, initModels, User, ChatMessage, Room, RoomMember, RoomMessage, Post, PostLike, PostComment, SystemSettings } = require('./src/models');

async function checkDatabase() {
  try {
    console.log('开始检查数据库连接...');
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    console.log('\n开始检查数据库表结构...');
    
    // 检查用户表
    console.log('\n1. 检查用户表 (users)...');
    try {
      const userCount = await User.count();
      console.log(`用户表存在，当前有 ${userCount} 个用户`);
    } catch (error) {
      console.error('用户表检查失败:', error.message);
    }
    
    // 检查聊天消息表
    console.log('\n2. 检查聊天消息表 (chat_messages)...');
    try {
      const messageCount = await ChatMessage.count();
      console.log(`聊天消息表存在，当前有 ${messageCount} 条消息`);
    } catch (error) {
      console.error('聊天消息表检查失败:', error.message);
    }
    
    // 检查房间表
    console.log('\n3. 检查房间表 (rooms)...');
    try {
      const roomCount = await Room.count();
      console.log(`房间表存在，当前有 ${roomCount} 个房间`);
    } catch (error) {
      console.error('房间表检查失败:', error.message);
    }
    
    // 检查房间成员表
    console.log('\n4. 检查房间成员表 (room_members)...');
    try {
      const roomMemberCount = await RoomMember.count();
      console.log(`房间成员表存在，当前有 ${roomMemberCount} 个成员`);
    } catch (error) {
      console.error('房间成员表检查失败:', error.message);
    }
    
    // 检查房间消息表
    console.log('\n5. 检查房间消息表 (room_messages)...');
    try {
      const roomMessageCount = await RoomMessage.count();
      console.log(`房间消息表存在，当前有 ${roomMessageCount} 条消息`);
    } catch (error) {
      console.error('房间消息表检查失败:', error.message);
    }
    
    // 检查帖子表
    console.log('\n6. 检查帖子表 (posts)...');
    try {
      const postCount = await Post.count();
      console.log(`帖子表存在，当前有 ${postCount} 个帖子`);
    } catch (error) {
      console.error('帖子表检查失败:', error.message);
    }
    
    // 检查帖子点赞表
    console.log('\n7. 检查帖子点赞表 (post_likes)...');
    try {
      const postLikeCount = await PostLike.count();
      console.log(`帖子点赞表存在，当前有 ${postLikeCount} 个点赞`);
    } catch (error) {
      console.error('帖子点赞表检查失败:', error.message);
    }
    
    // 检查帖子评论表
    console.log('\n8. 检查帖子评论表 (post_comments)...');
    try {
      const postCommentCount = await PostComment.count();
      console.log(`帖子评论表存在，当前有 ${postCommentCount} 个评论`);
    } catch (error) {
      console.error('帖子评论表检查失败:', error.message);
    }
    
    // 检查系统设置表
    console.log('\n9. 检查系统设置表 (system_settings)...');
    try {
      const systemSettingsCount = await SystemSettings.count();
      console.log(`系统设置表存在，当前有 ${systemSettingsCount} 条设置`);
    } catch (error) {
      console.error('系统设置表检查失败:', error.message);
    }
    
    console.log('\n数据库表结构检查完成');
    
  } catch (error) {
    console.error('数据库检查失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();