<template>
  <div class="posts-page">
    <div class="page-header-section">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">
            <i class="fas fa-lightbulb"></i>
            <span>说说广场</span>
          </h1>
          <p class="page-subtitle">分享你的新鲜事，与大家一起交流</p>
        </div>
      </div>
    </div>

    <div class="posts-container">
      <div class="create-post-card">
        <div class="create-post-header">
          <div class="user-avatar">
            {{ getInitials(userStore.user?.fullName || userStore.user?.username || '我') }}
          </div>
          <div class="input-wrapper">
            <a-textarea
              v-model:value="postContent"
              :rows="3"
              placeholder="分享你的新鲜事..."
              :maxlength="500"
              class="post-input"
            />
            <span class="char-count">{{ postContent.length }}/500</span>
          </div>
        </div>
        
        <div v-if="selectedImages.length > 0" class="image-preview-list">
          <div v-for="(img, idx) in selectedImages" :key="idx" class="preview-item">
            <img :src="img" alt="preview">
            <a-button danger shape="circle" size="small" class="remove-btn" @click="removeImage(idx)">
              <i class="fas fa-times"></i>
            </a-button>
          </div>
        </div>

        <div class="create-post-actions">
          <div class="left-actions">
            <a-upload
              :customRequest="() => {}"
              :showUploadList="false"
              accept="image/*"
              multiple
              @change="handleImageSelect"
            >
              <a-button type="text" class="action-btn">
                <i class="fas fa-image"></i>
                <span>图片</span>
              </a-button>
            </a-upload>
            <a-switch v-model:checked="isPublic" size="small">
              <template #checkedChildren>公开</template>
              <template #unCheckedChildren>私密</template>
            </a-switch>
          </div>
          <a-button type="primary" class="publish-btn" :loading="loading" :disabled="!postContent.trim()" @click="createPost">
            <i class="fas fa-paper-plane"></i>
            发布
          </a-button>
        </div>
      </div>

      <div class="posts-list masonry-layout">
        <a-spin :spinning="loading">
          <a-empty v-if="!loading && posts.length === 0" description="暂无说说" />
          <template v-else>
            <div v-for="post in posts" :key="post.id" class="post-item masonry-item">
              <div class="post-header">
                <div class="post-avatar">
                  {{ getInitials(post.author?.fullName || post.author?.username || post.userName) }}
                </div>
                <div class="post-info">
                  <div class="post-author">{{ post.author?.fullName || post.author?.username || post.userName || '匿名用户' }}</div>
                  <div class="post-meta">
                    <span>{{ formatTime(post.createdAt) }}</span>
                    <a-tag v-if="!post.isPublic" size="small" class="privacy-tag">
                      <i class="fas fa-lock"></i> 私密
                    </a-tag>
                  </div>
                </div>
              </div>

              <div class="post-body">
                <p class="post-text">{{ post.content }}</p>
                <div v-if="post.images?.length" class="post-images" :class="`layout-${Math.min(post.images.length, 4)}`">
                  <div v-for="(img, idx) in post.images" :key="idx" class="image-wrapper">
                    <img :src="img" alt="post image" @error="($event.target as HTMLImageElement).src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>🖼️</text></svg>'">
                  </div>
                </div>
              </div>

              <div class="post-footer">
                <a-button type="text" class="action-btn" :class="{ active: post.isLiked }" @click="toggleLike(post)">
                  <i :class="post.isLiked ? 'fas fa-heart' : 'far fa-heart'"></i>
                  {{ post.likes > 0 ? post.likes : '赞' }}
                </a-button>
                <a-button type="text" class="action-btn" @click="toggleComments(post)">
                  <i class="fas fa-comment"></i>
                  {{ post.comments > 0 ? post.comments + '条评论' : '评论' }}
                </a-button>
                <a-button type="text" class="action-btn">
                  <i class="fas fa-share"></i>
                  分享
                </a-button>
              </div>

              <div v-if="post.showComments" class="comments-section">
                <div class="comment-input">
                  <a-input
                    v-model:value="post.commentText"
                    placeholder="写下你的评论..."
                    @pressEnter="submitComment(post)"
                  >
                    <template #suffix>
                      <a-button type="primary" size="small" @click="submitComment(post)">发送</a-button>
                    </template>
                  </a-input>
                </div>
                <div v-if="post.commentsList?.length" class="comments-list">
                  <div v-for="c in post.commentsList" :key="c.id" class="comment">
                    <div class="comment-avatar">{{ getInitials(c.author?.fullName || c.author?.username || c.userName) }}</div>
                    <div class="comment-box">
                      <div class="comment-author">{{ c.author?.fullName || c.author?.username || c.userName || '匿名' }}</div>
                      <div class="comment-text">{{ c.content }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </a-spin>
      </div>

      <div v-if="hasMore && posts.length > 0" class="load-more">
        <a-button type="link" :loading="loading" @click="loadMore">加载更多</a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'
import { postsApi } from '@/api'
import { getInitials } from '@/utils'
import type { Post } from '@/types'
import type { UploadProps } from 'ant-design-vue'

const userStore = useUserStore()
const loading = ref(false)
const postContent = ref('')
const isPublic = ref(true)
const selectedImages = ref<string[]>([])
const posts = ref<any[]>([])
const currentPage = ref(1)
const hasMore = ref(true)

// 加载说说列表
const loadPosts = async (page = 1, append = false) => {
  loading.value = true
  try {
    console.log('Loading posts, page:', page)
    const res = await postsApi.getPosts({ page, limit: 10 })
    console.log('Posts response:', res)
    console.log('Response type:', typeof res)
    console.log('Response keys:', res ? Object.keys(res) : 'null')
    
    if (res && res.posts) {
      console.log('Posts array:', res.posts)
      console.log('Posts length:', res.posts.length)
      
      const list = res.posts.map((p: Post) => ({
        ...p,
        showComments: false,
        commentText: '',
        commentsList: []
      }))
      posts.value = append ? [...posts.value, ...list] : list
      hasMore.value = res.posts.length >= 10
      currentPage.value = page
      console.log('Posts loaded:', list.length)
      console.log('Posts value:', posts.value)
    } else {
      console.error('Invalid response structure:', res)
      posts.value = []
    }
  } catch (e) {
    console.error('Load posts error:', e)
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTime = (time: string) => {
  const d = new Date(time)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 选择图片
const handleImageSelect: UploadProps['onChange'] = (info) => {
  const file = info.file.originFileObj
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) selectedImages.value.push(e.target.result as string)
    }
    reader.readAsDataURL(file)
  }
}

// 移除图片
const removeImage = (idx: number) => selectedImages.value.splice(idx, 1)

// 发布说说
const createPost = async () => {
  if (!postContent.value.trim()) return
  loading.value = true
  try {
    const newPost = await postsApi.createPost({
      content: postContent.value.trim(),
      isPublic: isPublic.value,
      images: selectedImages.value
    })
    posts.value.unshift({ ...newPost, showComments: false, commentText: '', commentsList: [] })
    postContent.value = ''
    selectedImages.value = []
    isPublic.value = true
    message.success('发布成功')
  } catch (e) {
    console.error('Create post error:', e)
    message.error('发布失败')
  } finally {
    loading.value = false
  }
}

// 点赞
const toggleLike = async (post: any) => {
  try {
    const res = await postsApi.toggleLike(post.id)
    post.isLiked = res.isLiked
    post.likes = res.isLiked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1)
  } catch (e) {
    console.error('Toggle like error:', e)
  }
}

// 切换评论
const toggleComments = async (post: any) => {
  post.showComments = !post.showComments
  if (post.showComments && !post.commentsList?.length) {
    try {
      const res = await postsApi.getComments(post.id)
      post.commentsList = res.comments || []
    } catch (e) {
      console.error('Load comments error:', e)
    }
  }
}

// 提交评论
const submitComment = async (post: any) => {
  if (!post.commentText?.trim()) return
  try {
    const res = await postsApi.addComment(post.id, post.commentText.trim())
    post.commentsList = [res, ...(post.commentsList || [])]
    post.comments = (post.comments || 0) + 1
    post.commentText = ''
  } catch (e) {
    console.error('Submit comment error:', e)
    message.error('评论失败')
  }
}

// 加载更多
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadPosts(currentPage.value + 1, true)
  }
}

onMounted(() => loadPosts())
</script>

<style scoped>
.posts-page {
  width: 100%;
  min-height: 100%;
}

.page-header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px 32px;
  color: white;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
}

.page-header-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title i {
  font-size: 20px;
}

.page-subtitle {
  margin: 0;
  opacity: 0.85;
  font-size: 14px;
}

.posts-container {
  max-width: 1400px;
  margin: 0 auto;
}

.create-post-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.create-post-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.input-wrapper {
  flex: 1;
  position: relative;
}

.post-input {
  border-radius: 12px;
  padding: 12px 16px;
  resize: none;
  border: 1px solid #e5e7eb;
}

.post-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.char-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: #9ca3af;
}

.image-preview-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 0 0 16px 64px;
}

.preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.preview-item:hover .remove-btn {
  opacity: 1;
}

.create-post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-left: 64px;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
}

.action-btn i {
  font-size: 14px;
}

.action-btn:hover {
  color: #667eea;
}

.publish-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.publish-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.posts-list.masonry-layout {
  column-count: 5;
  column-gap: 12px;
}

.masonry-item {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  break-inside: avoid;
  margin-bottom: 12px;
  width: 100%;
  display: inline-block;
  transition: all 0.3s ease;
}

.masonry-item:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

@media (max-width: 2400px) {
  .posts-list.masonry-layout { column-count: 5; }
}

@media (max-width: 2000px) {
  .posts-list.masonry-layout { column-count: 4; }
}

@media (max-width: 1600px) {
  .posts-list.masonry-layout { column-count: 3; }
}

@media (max-width: 1200px) {
  .posts-list.masonry-layout { column-count: 2; }
}

@media (max-width: 700px) {
  .posts-list.masonry-layout { column-count: 1; }
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.post-avatar {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.post-info {
  flex: 1;
}

.post-author {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.post-meta {
  font-size: 13px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.privacy-tag {
  font-size: 11px;
  height: 18px;
  line-height: 16px;
  padding: 0 6px;
  background: rgba(102, 126, 234, 0.1);
  border: none;
  color: #667eea;
}

.post-body {
  margin-bottom: 16px;
}

.post-text {
  font-size: 15px;
  line-height: 1.7;
  color: #1f2937;
  margin: 0 0 12px 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.post-images {
  display: grid;
  gap: 8px;
  border-radius: 12px;
  overflow: hidden;
}

.post-images.layout-1 { grid-template-columns: 1fr; }
.post-images.layout-1 img { max-height: 400px; }
.post-images.layout-2,
.post-images.layout-4 { grid-template-columns: repeat(2, 1fr); }
.post-images.layout-3 { grid-template-columns: repeat(3, 1fr); }

.post-images .image-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: #f3f4f6;
}

.post-images img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;
  display: block;
}

.post-images img:hover {
  transform: scale(1.05);
}

.post-footer {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.post-footer .action-btn {
  flex: 1;
  color: #6b7280;
  border-radius: 12px;
  padding: 8px;
}

.post-footer .action-btn:hover {
  background: #f3f4f6;
  color: #4b5563;
}

.post-footer .action-btn.active {
  color: #ef4444;
}

.post-footer .action-btn.active i {
  color: #ef4444;
}

.comments-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.comment-input {
  margin-bottom: 12px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.comment-box {
  flex: 1;
  background: #f9fafb;
  padding: 10px 14px;
  border-radius: 12px;
}

.comment-author {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.comment-text {
  font-size: 14px;
  color: #4b5563;
  margin: 0;
}

.load-more {
  text-align: center;
  padding: 20px 0;
}

@media (max-width: 768px) {
  .create-post-header {
    gap: 12px;
  }
  
  .create-post-actions,
  .image-preview-list {
    margin-left: 0;
  }
  
  .post-images img {
    height: 140px;
  }
}
</style>
