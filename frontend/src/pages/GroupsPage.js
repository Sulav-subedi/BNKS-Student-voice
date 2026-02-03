import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, MessageSquare } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const GroupsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${API_URL}/groups`);
      setGroups(response.data);
    } catch (error) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 70) return 'bg-green-50 border-green-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreIcon = (score) => {
    if (score >= 70) return <TrendingUp className="w-6 h-6" />;
    if (score >= 50) return <Minus className="w-6 h-6" />;
    return <TrendingDown className="w-6 h-6" />;
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return 'Excellent';
    if (score >= 50) return 'Good';
    return 'Needs Improvement';
  };

  const departments = groups.filter(g => g.group_type === 'Department');
  const clubs = groups.filter(g => g.group_type === 'Club');
  const houses = groups.filter(g => g.group_type === 'House');

  return (
    <div className="min-h-screen grain-texture bg-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/feed')}
                data-testid="back-to-feed-button"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Group Performance</h1>
                <p className="text-xs text-gray-500">Departments, Clubs & Houses</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/messages')}
              data-testid="messages-button"
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary transition-colors flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading groups...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Departments Section */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Departments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((group) => (
                  <GroupCard key={`${group.group_type}-${group.group_name}`} group={group} />
                ))}
              </div>
            </section>

            {/* Houses Section */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Houses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {houses.map((group) => (
                  <GroupCard key={`${group.group_type}-${group.group_name}`} group={group} />
                ))}
              </div>
            </section>

            {/* Clubs Section */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Clubs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map((group) => (
                  <GroupCard key={`${group.group_type}-${group.group_name}`} group={group} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

const GroupCard = ({ group }) => {
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 70) return 'bg-green-50 border-green-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreIcon = (score) => {
    if (score >= 70) return <TrendingUp className="w-5 h-5" />;
    if (score >= 50) return <Minus className="w-5 h-5" />;
    return <TrendingDown className="w-5 h-5" />;
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return 'Excellent';
    if (score >= 50) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-xl transition-all overflow-hidden"
      data-testid={`group-card-${group.group_name.replace(/\s+/g, '-')}`}
    >
      <div className="p-6">
        {/* Group Name */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{group.group_name}</h3>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{group.group_type}</p>
        </div>

        {/* Performance Score */}
        <div className={`rounded-lg border-2 p-4 mb-4 ${getScoreBgColor(group.performance_score)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Performance Score</p>
              <div className="flex items-center space-x-2">
                <span className={`text-3xl font-bold ${getScoreColor(group.performance_score)}`}>
                  {group.performance_score.toFixed(1)}
                </span>
                <span className="text-gray-400 text-lg">/100</span>
              </div>
              <p className={`text-xs font-semibold mt-1 ${getScoreColor(group.performance_score)}`}>
                {getScoreLabel(group.performance_score)}
              </p>
            </div>
            <div className={getScoreColor(group.performance_score)}>
              {getScoreIcon(group.performance_score)}
            </div>
          </div>
        </div>

        {/* Feedback Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-700">Appreciations</span>
            </div>
            <span className="text-sm font-semibold text-green-600" data-testid={`appreciation-count-${group.group_name.replace(/\s+/g, '-')}`}>
              {group.appreciation_count}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm text-gray-700">Suggestions</span>
            </div>
            <span className="text-sm font-semibold text-orange-600" data-testid={`suggestion-count-${group.group_name.replace(/\s+/g, '-')}`}>
              {group.suggestion_count}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-700">Complaints</span>
            </div>
            <span className="text-sm font-semibold text-red-600" data-testid={`complaint-count-${group.group_name.replace(/\s+/g, '-')}`}>
              {group.complaint_count}
            </span>
          </div>
        </div>

        {/* Total Posts */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Total Feedback</span>
            <span className="text-sm font-semibold text-gray-900">{group.total_posts} posts</span>
          </div>
          {group.total_posts < 5 && (
            <p className="text-xs text-orange-600 mt-2">
              Need at least 5 posts for accurate scoring
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupsPage;
