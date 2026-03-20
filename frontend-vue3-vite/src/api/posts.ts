import http from './http'

export interface Post {
  id: number
  content: string
  userId: number
  userName: string
  userAvatar?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  likes: number
  comments: number
  images?: string[]
  isLiked?: boolean
}

export interface PostComment {
  id: number
  content: string
  userId: number
  userName: string
  userAvatar?: string
  postId: number
  createdAt: string
}

export interface PostListResponse {
  posts: Post[]
  total: number
  page: number
  limit: number
}

export interface CommentListResponse {
  comments: PostComment[]
  total: number
  page: number
  limit: number
}

export interface CreatePostData {
  content: string
  isPublic?: boolean
  images?: string[]
}

export const postsApi = {
  getPosts(params?: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = params || {}
    return http.get<{ posts: Post[]; total: number; page: number; limit: number }>(`/social/posts?page=${page}&limit=${limit}`)
  },

  createPost(data: CreatePostData) {
    return http.post<Post>('/social/posts', data)
  },

  deletePost(postId: number) {
    return http.delete(`/social/posts/${postId}`)
  },

  toggleLike(postId: number) {
    return http.post<{ isLiked: boolean; likes: number }>(`/social/posts/${postId}/like`)
  },

  getComments(postId: number, params?: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params || {}
    return http.get<CommentListResponse>(`/social/posts/${postId}/comments?page=${page}&limit=${limit}`)
  },

  addComment(postId: number, content: string) {
    return http.post<PostComment>(`/social/posts/${postId}/comment`, { content })
  },

  deleteComment(postId: number, commentId: number) {
    return http.delete(`/social/posts/${postId}/comments/${commentId}`)
  }
}

export default postsApi
