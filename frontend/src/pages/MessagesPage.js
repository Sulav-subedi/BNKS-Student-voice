import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Search, Send, MoreVertical, Phone, Video, Info, Smile, Paperclip, Users } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showSpecialAccounts, setShowSpecialAccounts] = useState(false);
  const [specialAccounts, setSpecialAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user && token) {
      fetchConversations();
    } else {
      setLoading(false);
      console.log('User not authenticated, redirecting to login...');
      toast.error('Please log in to access messages');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
    
    // Set up polling for new messages
    const interval = setInterval(() => {
      if (selectedConversation && user && token) {
        fetchMessages(selectedConversation.id);
      }
      if (user && token) {
        fetchConversations();
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [selectedConversation, user, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      console.log('Fetching conversations with token:', token ? 'token exists' : 'no token');
      console.log('User:', user);
      
      const response = await axios.get(`${API_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
      if (response.data.length === 0) {
        console.log('No conversations found - this is normal for new users');
      }
    } catch (error) {
      console.error('Conversations error:', error.response?.status, error.response?.data);
      if (error.response?.status === 401) {
        toast.error('Please log in again');
        // Redirect to login if token is invalid
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        toast.error(`Failed to load conversations: ${error.response?.data?.detail || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    setMessagesLoading(true);
    try {
      const response = await axios.get(`${API_URL}/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await axios.post(
        `${API_URL}/messages`,
        {
          content: newMessage,
          conversation_id: selectedConversation.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessages([...messages, response.data]);
      setNewMessage('');
      
      // Update conversation in list
      fetchConversations();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      console.log('Searching for users with query:', query);
      console.log('Token exists:', !!token);
      
      const response = await axios.get(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Search response:', response.data);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error.response?.status, error.response?.data);
      if (error.response?.status === 401) {
        toast.error('Please log in again');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        toast.error(`Failed to search users: ${error.response?.data?.detail || error.message}`);
      }
    }
  };

  const handleStartConversation = async (otherUser) => {
    try {
      const response = await axios.post(
        `${API_URL}/conversations`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { other_user_id: otherUser.id }
        }
      );
      
      setSelectedConversation(response.data);
      setShowSearch(false);
      setShowSpecialAccounts(false);
      setSearchQuery('');
      setSearchResults([]);
      fetchMessages(response.data.id);
      fetchConversations();
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  const fetchSpecialAccounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/special-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSpecialAccounts(response.data);
    } catch (error) {
      console.error('Failed to fetch special accounts:', error);
      toast.error('Failed to load special accounts');
    }
  };

  const handleShowSpecialAccounts = () => {
    setShowSpecialAccounts(!showSpecialAccounts);
    setShowSearch(false);
    if (!showSpecialAccounts) {
      fetchSpecialAccounts();
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participant1_id === user.id 
      ? conversation.participant2_id 
      : conversation.participant1_id;
  };

  const getOtherParticipantInfo = (conversation) => {
    const otherUserId = getOtherParticipant(conversation);
    // For now, we'll show a simplified version since we don't have user details in conversations
    // In a real implementation, you might want to populate this data when fetching conversations
    return {
      id: otherUserId,
      displayName: `User ${otherUserId.substring(0, 8)}`,
      anonymousTag: `User${otherUserId.substring(0, 6).toUpperCase()}`
    };
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/feed')}
            className="p-2 hover:bg-green-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleShowSpecialAccounts}
            className="p-2 hover:bg-green-700 rounded-lg transition-colors"
            title="View all teachers and staff"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              setShowSpecialAccounts(false);
            }}
            className="p-2 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by username or name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg">
              {searchResults.map((searchUser) => (
                <div
                  key={searchUser.id}
                  onClick={() => handleStartConversation(searchUser)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold">
                        {searchUser.username ? searchUser.username.substring(0, 2).toUpperCase() : searchUser.anonymous_tag.split('-')[0].match(/[A-Z]/g)?.slice(0, 2).join('') || 'AN'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {searchUser.username || searchUser.anonymous_tag}
                      </p>
                      <p className="text-sm text-gray-500">
                        {searchUser.role} {searchUser.username && `• @${searchUser.username}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Special Accounts List */}
      {showSpecialAccounts && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Teachers & Staff</h3>
            <button
              onClick={() => setShowSpecialAccounts(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          {specialAccounts.length > 0 ? (
            <div className="max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg">
              {specialAccounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => handleStartConversation(account)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-green-700">
                        {account.username.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {account.username}
                      </p>
                      <p className="text-sm text-gray-500">
                        {account.role} • Click to message
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>No teacher or staff accounts found</p>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-full md:w-1/3 border-r border-gray-200 bg-white">
          {loading ? (
            <div className="p-4 text-center">
              <p className="text-gray-500">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-500">No conversations yet</p>
              <p className="text-sm text-gray-400 mt-2">Click the search icon above to find users and start messaging!</p>
            </div>
          ) : (
            <div className="overflow-y-auto h-full">
              {conversations.map((conversation) => {
                const otherParticipantInfo = getOtherParticipantInfo(conversation);
                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?.id === conversation.id ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="font-semibold">
                          {otherParticipantInfo.anonymousTag.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-gray-900 truncate">
                            {otherParticipantInfo.anonymousTag}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-sm">
                      {getOtherParticipantInfo(selectedConversation).anonymousTag.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {getOtherParticipantInfo(selectedConversation).anonymousTag}
                    </p>
                    <p className="text-xs text-green-500">Online</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Video className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="text-center">
                    <p className="text-gray-500">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user.id
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user.id ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 px-4 py-3">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Smile className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Paperclip className="w-6 h-6" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Messages</h3>
                <p className="text-gray-500">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
