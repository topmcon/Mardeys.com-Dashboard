import React from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceStatusCard from '../components/ServiceStatusCard';

const Services = () => {
  const navigate = useNavigate();

  const services = [
    {
      id: 'wordpress',
      name: 'WordPress',
      status: 'healthy',
      metric: 'Site Performance',
      value: 'Online',
      responseTime: '215ms'
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      status: 'healthy',
      metric: 'Store Status',
      value: 'Active',
      responseTime: '187ms'
    },
    {
      id: 'digitalocean',
      name: 'DigitalOcean',
      status: 'healthy',
      metric: 'Server Status',
      value: 'Active',
      responseTime: null
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare',
      status: 'healthy',
      metric: 'DNS & CDN',
      value: 'Active',
      responseTime: null
    }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Services</h1>
          <p className="text-gray-600">Monitor and manage all connected services</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {services.map((service) => (
            <ServiceStatusCard
              key={service.id}
              service={service.name}
              status={service.status}
              metric={service.metric}
              value={service.value}
              responseTime={service.responseTime}
              onClick={() => navigate(`/dashboard/services/${service.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
