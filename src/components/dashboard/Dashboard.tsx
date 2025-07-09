import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Lead } from '../../lib/supabase';
import { StatCard } from './StatCard';
import { LeadsList } from './LeadsList';
import { LeadForm } from '../forms/LeadForm';
import { Users, Plus, TrendingUp, DollarSign, Search, Filter } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLeadType, setFilterLeadType] = useState('');
  const [filterModelType, setFilterModelType] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    closed: 0,
  });

  useEffect(() => {
    fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('lead_score', { ascending: false });

      if (error) throw error;

      setLeads(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const newLeads = data?.filter(lead => lead.status === 'New').length || 0;
      const inProgress = data?.filter(lead => lead.status === 'In-Progress').length || 0;
      const closed = data?.filter(lead => lead.status === 'Closed').length || 0;

      setStats({ total, new: newLeads, contacted: inProgress, closed });
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadCreated = () => {
    setShowForm(false);
    fetchLeads();
  };

  const handleLeadUpdated = () => {
    fetchLeads();
  };

  const handleLeadDeleted = () => {
    fetchLeads();
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !filterStatus || lead.status === filterStatus;
    const matchesLeadType = !filterLeadType || lead.lead_type === filterLeadType;
    const matchesModelType = !filterModelType || lead.model_type === filterModelType;

    return matchesSearch && matchesStatus && matchesLeadType && matchesModelType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Leads"
          value={stats.total}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="New Leads"
          value={stats.new}
          icon={Plus}
          color="bg-yellow-500"
        />
        <StatCard
          title="In Progress"
          value={stats.contacted}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="Closed"
          value={stats.closed}
          icon={DollarSign}
          color="bg-purple-500"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="New">New</option>
              <option value="In-Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={filterLeadType}
              onChange={(e) => setFilterLeadType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Lead Types</option>
              <option value="Individual">Individual</option>
              <option value="Business">Business</option>
              <option value="Housing-Society">Housing Society</option>
              <option value="Agent">Agent</option>
            </select>

            <select
              value={filterModelType}
              onChange={(e) => setFilterModelType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Model Types</option>
              <option value="Purchase">Purchase</option>
              <option value="Rent">Rent</option>
              <option value="Individual Home-kit">Individual Home-kit</option>
            </select>

            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <LeadsList
        leads={filteredLeads}
        onLeadUpdated={handleLeadUpdated}
        onLeadDeleted={handleLeadDeleted}
      />

      {/* Lead Form Modal */}
      {showForm && (
        <LeadForm
          onClose={() => setShowForm(false)}
          onLeadCreated={handleLeadCreated}
        />
      )}
    </div>
  );
};