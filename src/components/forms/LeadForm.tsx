import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Product, Service, Lead } from '../../lib/supabase';
import { X, User, Mail, Phone, Building, Star } from 'lucide-react';

interface LeadFormProps {
  lead?: Lead;
  onClose: () => void;
  onLeadCreated: () => void;
}

export const LeadForm: React.FC<LeadFormProps> = ({ lead, onClose, onLeadCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    lead_type: 'Individual' as const,
    model_type: 'Purchase' as const,
    lead_score: 0,
    status: 'New' as const,
    potential_amount: 0,
    notes: '',
    address: '',
    location_url: '',
    pincode: 0,
    follow_up: false,
    follow_up_date: '',
    follow_up_notes: '',
    lead_sealed: false,
  });

  // Calculate total amount from selected products and services
  const calculatedAmount = React.useMemo(() => {
    const productTotal = selectedProducts.reduce((sum, productId) => {
      const product = products.find(p => p.id === productId);
      return sum + (product?.price || 0);
    }, 0);

    const serviceTotal = selectedServices.reduce((sum, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return sum + (service?.price || 0);
    }, 0);

    return productTotal + serviceTotal;
  }, [selectedProducts, selectedServices, products, services]);

  // Auto-update potential amount when selections change
  useEffect(() => {
    if (!lead && calculatedAmount > 0) {
      setFormData(prev => ({ ...prev, potential_amount: calculatedAmount }));
    }
  }, [calculatedAmount, lead]);

  useEffect(() => {
    fetchProducts();
    fetchServices();
    
    if (lead) {
      setFormData({
        full_name: lead.full_name,
        email: lead.email,
        phone: lead.phone || '',
        company: lead.company || '',
        lead_type: lead.lead_type,
        model_type: lead.model_type,
        lead_score: lead.lead_score,
        status: lead.status,
        potential_amount: lead.potential_amount,
        notes: lead.notes || '',
        address: lead.address || '',
        location_url: lead.location_url || '',
        pincode: lead.pincode || 0,
        follow_up: lead.follow_up || false,
        follow_up_date: lead.follow_up_date || '',
        follow_up_notes: lead.follow_up_notes || '',
        lead_sealed: lead.lead_sealed || false,
      });
    }
  }, [lead]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let leadData;
      
      if (lead) {
        // Update existing lead
        const { data, error } = await supabase
          .from('leads')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        leadData = data;
      } else {
        // Create new lead
        const { data, error } = await supabase
          .from('leads')
          .insert([{
            ...formData,
            user_id: user.id,
          }])
          .select()
          .single();

        if (error) throw error;
        leadData = data;
      }

      // Handle product and service associations
      if (leadData && !lead) {
        // For new leads, add product associations
        if (selectedProducts.length > 0) {
          const productInserts = selectedProducts.map(productId => ({
            lead_id: leadData.id,
            product_id: productId,
          }));

          const { error: productError } = await supabase
            .from('lead_products')
            .insert(productInserts);

          if (productError) throw productError;
        }

        // Add service associations
        if (selectedServices.length > 0) {
          const serviceInserts = selectedServices.map(serviceId => ({
            lead_id: leadData.id,
            service_id: serviceId,
          }));

          const { error: serviceError } = await supabase
            .from('lead_services')
            .insert(serviceInserts);

          if (serviceError) throw serviceError;
        }
      }

      onLeadCreated();
    } catch (error) {
      console.error('Error saving lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN Code
                </label>
                <input
                  type="number"
                  value={formData.pincode || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, pincode: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter PIN code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location URL
                </label>
                <input
                  type="url"
                  value={formData.location_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_url: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Google Maps or location URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter company name"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lead Classification */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Lead Classification</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Type
                </label>
                <select
                  value={formData.lead_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, lead_type: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Individual">Individual</option>
                  <option value="Business">Business</option>
                  <option value="Housing-Society">Housing Society</option>
                  <option value="Agent">Agent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Type
                </label>
                <select
                  value={formData.model_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, model_type: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Purchase">Purchase</option>
                  <option value="Rent">Rent</option>
                  <option value="Individual Home-kit">Individual Home-kit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Score (1-100)
                </label>
                <div className="relative">
                  <Star className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.lead_score}
                    onChange={(e) => setFormData(prev => ({ ...prev, lead_score: parseInt(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter score (1-100)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Products / Services Selection */}
          {!lead && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Products / Services</h3>
              
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'products'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Products
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('services')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'services'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Services
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTab === 'products' && products.map((product) => (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedProducts.includes(product.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleProductToggle(product.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        {product.description && (
                          <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                        )}
                        <p className="text-sm font-medium text-gray-900 mt-2">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleProductToggle(product.id)}
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                ))}

                {activeTab === 'services' && services.map((service) => (
                  <div
                    key={service.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedServices.includes(service.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleServiceToggle(service.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        )}
                        <p className="text-sm font-medium text-gray-900 mt-2">
                          {formatCurrency(service.price)}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.id)}
                        onChange={() => handleServiceToggle(service.id)}
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Potential Amount {!lead && calculatedAmount > 0 && (
                    <span className="text-sm text-blue-600">(Auto-calculated: {formatCurrency(calculatedAmount)})</span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.potential_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, potential_amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter potential amount"
                  readOnly={!lead && calculatedAmount > 0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="New">New</option>
                  <option value="In-Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Follow-up Section */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="follow_up"
                  checked={formData.follow_up}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    follow_up: e.target.checked,
                    follow_up_date: e.target.checked ? prev.follow_up_date : '',
                    follow_up_notes: e.target.checked ? prev.follow_up_notes : ''
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="follow_up" className="ml-2 block text-sm font-medium text-gray-700">
                  Follow-Up?
                </label>
              </div>

              {formData.follow_up && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6 border-l-2 border-blue-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={formData.follow_up_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, follow_up_date: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follow-up Notes
                    </label>
                    <textarea
                      value={formData.follow_up_notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, follow_up_notes: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter follow-up notes..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Lead Sealed */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="lead_sealed"
                checked={formData.lead_sealed}
                onChange={(e) => setFormData(prev => ({ ...prev, lead_sealed: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="lead_sealed" className="ml-2 block text-sm font-medium text-gray-700">
                Lead Sealed (Finalized)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter any additional notes..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : (lead ? 'Update Lead' : 'Create Lead')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};