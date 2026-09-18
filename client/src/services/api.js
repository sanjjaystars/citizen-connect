const API_BASE = '/api';

function getHeaders(isMultipart = false) {
  const token = localStorage.getItem('civic_token');
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(options.isMultipart),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }
  return data;
}

export const api = {
  // Auth
  sendOtp: (phone) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone, otp, role = 'citizen', name) =>
    request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp, role, name }) }),
  googleLogin: (data) => request('/auth/google', { method: 'POST', body: JSON.stringify(data) }),
  emailLogin: (data) => request('/auth/email', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),

  // Locations
  getHierarchy: () => request('/locations/hierarchy'),
  getWards: (muniId) => request(`/locations/wards${muniId ? `?municipality_id=${muniId}` : ''}`),
  getDepartments: (muniId) => request(`/locations/departments${muniId ? `?municipality_id=${muniId}` : ''}`),

  // Posts
  getPosts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/posts${query ? `?${query}` : ''}`);
  },
  getPostById: (id) => request(`/posts/${id}`),
  checkDuplicate: (data) => request('/posts/check-duplicate', { method: 'POST', body: JSON.stringify(data) }),
  previewClassify: (description) => request('/posts/preview-classify', { method: 'POST', body: JSON.stringify({ description }) }),
  createPost: (formData) => request('/posts', { method: 'POST', body: formData, isMultipart: true }),
  toggleUpvote: (postId) => request(`/posts/${postId}/upvote`, { method: 'POST' }),

  // Official
  getOfficialPosts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/official/posts${query ? `?${query}` : ''}`);
  },
  updatePostStatus: (postId, data) => request(`/official/posts/${postId}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAnalytics: (municipalityId) => request(`/official/analytics${municipalityId ? `?municipality_id=${municipalityId}` : ''}`),

  // Chatbot
  askChatbot: (queryText, history = []) => request('/chatbot/query', { method: 'POST', body: JSON.stringify({ query: queryText, history }) }),
  getChatHistory: () => request('/chatbot/history'),
};
