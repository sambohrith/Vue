const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testAdminConversations() {
  try {
    // 1. 登录获取认证令牌
    console.log('正在登录...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('登录成功，获取到令牌');
    
    // 2. 测试获取管理员对话列表
    console.log('\n正在测试获取管理员对话列表...');
    const conversationsResponse = await axios.get(`${API_BASE_URL}/chat/admin/conversations?page=1&limit=50`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('获取对话列表成功');
    console.log('响应数据:', JSON.stringify(conversationsResponse.data, null, 2));
    
  } catch (error) {
    console.error('测试失败:');
    if (error.response) {
      // 服务器返回了错误响应
      console.error('状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('未收到响应:', error.request);
    } else {
      // 请求配置出错
      console.error('请求错误:', error.message);
    }
  }
}

testAdminConversations();