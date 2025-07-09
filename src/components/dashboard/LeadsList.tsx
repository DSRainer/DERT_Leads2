import React, { useState } from 'react';
import { Lead, supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Trash2, Edit, Mail, Phone, Building } from 'lucide-react';
import { LeadForm } from '../forms/LeadForm';

interface LeadsListProps {
  leads: Lead[];
  onLeadUpdated: () => void;
  onLeadDeleted: () => void;
}

export const LeadsList: React.FC<LeadsListProps> = ({ leads, onLeadUpdated, onLeadDeleted }) => {
  const { user } = useAuth();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Are you sure you want to delete this lead?')) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      onLeadDeleted();
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      onLeadUpdated();
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'In-Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Mail className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
        <p className="text-gray-500">Get started by adding your first lead.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header row: hidden on small screens */}
        <div className="px-4 md:px-8 py-3 border-b border-gray-200 hidden md:block">
          <div className="grid grid-cols-12 gap-x-8 gap-y-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Lead Info</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-1">Type & Model</div>
            <div className="col-span-1">Potential Amount</div>
            <div className="col-span-1">Follow-up</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="px-4 py-4 md:px-8 md:py-5 hover:bg-gray-50 transition-colors flex flex-col md:block"
            >
              {/* Responsive grid: 1 col on mobile, 12 cols on md+ */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-y-4 md:gap-x-8 items-start md:items-center">
                {/* Lead Info */}
                <div className="md:col-span-3 flex flex-col">
                  <span className="md:hidden text-xs text-gray-400 mb-1">Lead Info</span>
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-gray-900">{lead.full_name}</p>
                      <p className="text-sm text-gray-500">
                        Score: {lead.lead_score} {lead.lead_sealed && <span className="text-green-600">• Sealed</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="md:col-span-2 flex flex-col">
                  <span className="md:hidden text-xs text-gray-400 mb-1">Contact</span>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{lead.email}</span>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                      <Phone className="w-4 h-4" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                </div>

                {/* Type & Model */}
                <div className="md:col-span-1 flex flex-col">
                  <span className="md:hidden text-xs text-gray-400 mb-1">Type & Model</span>
                  <p className="text-xs font-medium text-gray-900">{lead.lead_type}</p>
                  <p className="text-xs text-gray-500">{lead.model_type}</p>
                </div>

                {/* Potential Amount */}
                <div className="md:col-span-1 flex flex-col">
                  <span className="md:hidden text-xs text-gray-400 mb-1">Potential Amount</span>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(lead.potential_amount)}
                  </p>
                </div>

                {/* Follow-up */}
                <div className="md:col-span-1 flex flex-col">
                  <span className="md:hidden text-xs text-gray-400 mb-1">Follow-up</span>
                  {lead.follow_up ? (
                    <div className="text-xs">
                      <p className="text-orange-600 font-medium">Required</p>
                      {lead.follow_up_date && (
                        <p className="text-gray-500">{formatDate(lead.follow_up_date)}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">None</span>
                  )}
                </div>

                {/* Status */}
                <div className="md:col-span-1 flex flex-col">
                  <span className="md:hidden text-xs text-gray-400 mb-1">Status</span>
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(lead.status)}`}
                  >
                    <option value="New">New</option>
                    <option value="In-Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="md:col-span-1 flex flex-row md:flex-col items-start md:items-center space-x-2 md:space-x-0 md:space-y-2 mt-2 md:mt-0">
                  <span className="md:hidden text-xs text-gray-400 mb-1">Actions</span>
                  <button
                    onClick={() => setEditingLead(lead)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(lead.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingLead && (
        <LeadForm
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onLeadCreated={onLeadUpdated}
        />
      )}
    </>
  );
};