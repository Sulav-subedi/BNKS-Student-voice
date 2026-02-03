import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ChevronUp, ChevronDown, MessageCircle, LogOut, Users, MessageSquare } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const FeedPage = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [filters, setFilters] = useState({ category: '', target_group_type: '', target_group_name: '' });
  const [expandedComments, setExpandedComments] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const fetchPosts = async () => {
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.target_group_type) params.target_group_type = filters.target_group_type;
      if (filters.target_group_name) params.target_group_name = filters.target_group_name;
      
      const response = await axios.get(`${API_URL}/posts`, { params });
      setPosts(response.data);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId, voteType) => {
    try {
      const response = await axios.post(
        `${API_URL}/posts/${postId}/${voteType}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const newPost = { ...post };
          if (voteType === 'upvote') {
            if (newPost.upvotes.includes(user.id)) {
              newPost.upvotes = newPost.upvotes.filter(id => id !== user.id);
            } else {
              newPost.upvotes = [...newPost.upvotes, user.id];
              newPost.downvotes = newPost.downvotes.filter(id => id !== user.id);
            }
          } else {
            if (newPost.downvotes.includes(user.id)) {
              newPost.downvotes = newPost.downvotes.filter(id => id !== user.id);
            } else {
              newPost.downvotes = [...newPost.downvotes, user.id];
              newPost.upvotes = newPost.upvotes.filter(id => id !== user.id);
            }
          }
          return newPost;
        }
        return post;
      }));
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const toggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments({ ...expandedComments, [postId]: false });
    } else {
      setExpandedComments({ ...expandedComments, [postId]: true });
      if (!comments[postId]) {
        try {
          const response = await axios.get(`${API_URL}/posts/${postId}/comments`);
          setComments({ ...comments, [postId]: response.data });
        } catch (error) {
          toast.error('Failed to load comments');
        }
      }
    }
  };

  const handleAddComment = async (postId) => {
    if (!newComment[postId]?.trim()) return;
    
    try {
      const response = await axios.post(
        `${API_URL}/posts/${postId}/comments`,
        { content: newComment[postId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setComments({
        ...comments,
        [postId]: [...(comments[postId] || []), response.data]
      });
      setNewComment({ ...newComment, [postId]: '' });
      
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, comment_count: post.comment_count + 1 } : post
      ));
      
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Appreciation': return 'bg-green-100 text-green-800';
      case 'Suggestion': return 'bg-orange-100 text-orange-800';
      case 'Complaint': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (tag) => {
    const parts = tag.split('-')[0].match(/[A-Z]/g);
    return parts ? parts.slice(0, 2).join('') : 'AN';
  };

  return (
    <div className="min-h-screen grain-texture bg-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <img src="/logo.png?v=2" alt="BS Logo" className="w-24 h-24 object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Feedback Platform</h1>
                <p className="text-xs text-gray-500">Budhanilkantha School</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/groups')}
                data-testid="groups-button"
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary transition-colors flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Groups</span>
              </button>
              <button
                onClick={() => navigate('/messages')}
                data-testid="messages-button"
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary transition-colors flex items-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
              </button>
              <button
                onClick={() => setShowNewPostModal(true)}
                data-testid="new-post-button"
                className="px-5 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                New Post
              </button>
              <button
                onClick={logout}
                data-testid="logout-button"
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Filters Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow" data-testid="filters-card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Filters</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-3 block">Category</label>
                  <select
                    data-testid="category-filter"
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Categories</option>
                    <option value="Complaint">Complaint</option>
                    <option value="Suggestion">Suggestion</option>
                    <option value="Appreciation">Appreciation</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-3 block">Group Type</label>
                  <select
                    data-testid="group-type-filter"
                    value={filters.target_group_type}
                    onChange={(e) => {
                      setFilters({ ...filters, target_group_type: e.target.value, target_group_name: '' });
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Types</option>
                    <option value="Department">Department</option>
                    <option value="Club">Club</option>
                    <option value="House">House</option>
                  </select>
                </div>

                {filters.target_group_type && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-3 block">Group Name</label>
                    <select
                      data-testid="group-name-filter"
                      value={filters.target_group_name}
                      onChange={(e) => setFilters({ ...filters, target_group_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">All Groups</option>
                      {filters.target_group_type === 'Department' && [
                        'Physics', 'Chemistry', 'Computer', 'Maths', 'Kitchen', 'School Management Team'
                      ].map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                      {filters.target_group_type === 'Club' && [
                        'ARC Club', 'Maths Club', 'Science Club', 'Leo Club', 'Interact Club', 'Social Service Club', 'YRC Club'
                      ].map(club => (
                        <option key={club} value={club}>{club}</option>
                      ))}
                      {filters.target_group_type === 'House' && [
                        'Gaurishankhar House', 'Choyu House', 'Byasrishi House', 'Ratnachuli House'
                      ].map(house => (
                        <option key={house} value={house}>{house}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Guidelines Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Guidelines</h2>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-primary mr-3 mt-1">✓</span>
                  <span>Be respectful and constructive</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-3 mt-1">✓</span>
                  <span>Focus on issues, not individuals</span>
                </li>
                <li className="flex items-start">
                  <span className="text-destructive mr-3 mt-1">✗</span>
                  <span>No harassment or hate speech</span>
                </li>
              </ul>
            </div>
          </aside>

          {/* Main Feed */}
          <main className="lg:col-span-2 space-y-6" data-testid="feed-main">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200 p-8">
                <p className="text-gray-500">No posts yet. Be the first to share feedback!</p>
              </div>
            ) : (
              posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-xl border border-gray-200 shadow hover:shadow-lg transition-shadow overflow-hidden"
                  data-testid={`post-${post.id}`}
                >
                  <div className="p-6">
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg ${getCategoryColor(post.category)} flex items-center justify-center shadow-sm`}>
                          <span className="font-semibold text-base">{getInitials(post.anonymous_tag)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{post.anonymous_tag}</p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <span className={`px-4 py-1 rounded-full text-xs font-semibold ${getCategoryColor(post.category)}`}>
                        {post.category}
                      </span>
                    </div>

                    {/* Post Content */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{post.title}</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">{post.content}</p>

                    {/* Post Meta */}
                    <div className="flex items-center justify-between pt-5 border-t border-gray-200">
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => handleVote(post.id, 'upvote')}
                          data-testid={`upvote-${post.id}`}
                          className={`flex items-center space-x-2 transition-colors ${
                            post.upvotes.includes(user.id)
                              ? 'text-primary'
                              : 'text-gray-500 hover:text-primary'
                          }`}
                        >
                          <ChevronUp className="w-5 h-5" />
                          <span className="font-semibold">{post.upvotes.length}</span>
                        </button>
                        <button
                          onClick={() => handleVote(post.id, 'downvote')}
                          data-testid={`downvote-${post.id}`}
                          className={`flex items-center space-x-2 transition-colors ${
                            post.downvotes.includes(user.id)
                              ? 'text-destructive'
                              : 'text-gray-500 hover:text-destructive'
                          }`}
                        >
                          <ChevronDown className="w-5 h-5" />
                          <span className="font-semibold">{post.downvotes.length}</span>
                        </button>
                        <button
                          onClick={() => toggleComments(post.id)}
                          data-testid={`comments-toggle-${post.id}`}
                          className="flex items-center space-x-2 text-gray-500 hover:text-primary transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="font-semibold">{post.comment_count}</span>
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">
                        → {post.target_group_name}
                      </span>
                    </div>

                    {/* Comments Section */}
                    {expandedComments[post.id] && (
                      <div className="mt-4 pt-4 border-t border-gray-100" data-testid={`comments-section-${post.id}`}>
                        <div className="space-y-4">
                          {/* Comment form */}
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              data-testid={`comment-input-${post.id}`}
                              value={newComment[post.id] || ''}
                              onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                              placeholder="Add a comment..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              data-testid={`comment-submit-${post.id}`}
                              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                            >
                              Post
                            </button>
                          </div>
                          
                          {/* Comments list */}
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 p-3 rounded-lg" data-testid={`comment-${comment.id}`}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="font-semibold">{comment.anonymous_tag}</span>
                                <span className="text-gray-500 text-xs">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-gray-700">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </main>
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPostModal && <NewPostModal onClose={() => setShowNewPostModal(false)} onSuccess={fetchPosts} token={token} />}
    </div>
  );
};

const NewPostModal = ({ onClose, onSuccess, token }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Suggestion',
    target_group_type: 'Department',
    target_group_name: 'Physics'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/posts`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Post created successfully!');
      onClose();
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" data-testid="new-post-modal">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full p-6 relative z-10">
          <h2 className="text-2xl font-bold mb-6">Create New Post</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                data-testid="post-title-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                data-testid="post-category-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Complaint">Complaint</option>
                <option value="Suggestion">Suggestion</option>
                <option value="Appreciation">Appreciation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Group Type</label>
              <select
                data-testid="post-group-type-select"
                value={formData.target_group_type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setFormData({
                    ...formData,
                    target_group_type: newType,
                    target_group_name: newType === 'Department' ? 'Physics' : newType === 'Club' ? 'ARC Club' : 'Gaurishankhar House'
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Department">Department</option>
                <option value="Club">Club</option>
                <option value="House">House</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Group</label>
              <select
                data-testid="post-group-name-select"
                value={formData.target_group_name}
                onChange={(e) => setFormData({ ...formData, target_group_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {formData.target_group_type === 'Department' && [
                  'Physics', 'Chemistry', 'Computer', 'Maths', 'Kitchen', 'School Management Team'
                ].map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
                {formData.target_group_type === 'Club' && [
                  'ARC Club', 'Maths Club', 'Science Club', 'Leo Club', 'Interact Club', 'Social Service Club', 'YRC Club'
                ].map(club => (
                  <option key={club} value={club}>{club}</option>
                ))}
                {formData.target_group_type === 'House' && [
                  'Gaurishankhar House', 'Choyu House', 'Byasrishi House', 'Ratnachuli House'
                ].map(house => (
                  <option key={house} value={house}>{house}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                data-testid="post-content-textarea"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                data-testid="post-cancel-button"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="post-submit-button"
                disabled={loading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
