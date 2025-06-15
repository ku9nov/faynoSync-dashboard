import React, { useState } from 'react';
import { useTelemetryQuery } from '../hooks/use-query/useTelemetryQuery';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAppsQuery } from '../hooks/use-query/useAppsQuery';
import { useChannelQuery } from '../hooks/use-query/useChannelQuery';
import { usePlatformQuery } from '../hooks/use-query/usePlatformQuery';
import { useArchitectureQuery } from '../hooks/use-query/useArchitectureQuery';
import { AppListItem } from '../hooks/use-query/useAppsQuery';
import { Channel } from '../hooks/use-query/useChannelQuery';
import { Platform } from '../hooks/use-query/usePlatformQuery';
import { Architecture } from '../hooks/use-query/useArchitectureQuery';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

type Filters = {
  apps: string[];
  channels: string[];
  platforms: string[];
  architectures: string[];
  range?: 'today' | 'week' | 'month';
  date?: string;
};

const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
  <div className="bg-theme-card rounded-lg shadow-md p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-theme-primary text-sm">{title}</p>
        <p className="text-2xl font-semibold mt-1 text-theme-primary">{value}</p>
      </div>
      <div className="text-theme-primary">{icon}</div>
    </div>
  </div>
);

export const StatisticsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    apps: [],
    channels: [],
    platforms: [],
    architectures: [],
    range: 'today'
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

  const { apps = [] } = useAppsQuery();
  const { channels = [] } = useChannelQuery();
  const { platforms = [] } = usePlatformQuery();
  const { architectures = [] } = useArchitectureQuery();
  const { data, isLoading } = useTelemetryQuery(filters);

  const handleDropdownClick = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const handleOptionClick = (dropdownName: keyof Filters, value: string) => {
    setFilters(prev => {
      const currentValues = prev[dropdownName] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [dropdownName]: newValues };
    });
  };

  const handleTimeRangeChange = (range: 'today' | 'week' | 'month' | 'custom') => {
    if (range === 'custom') {
      setShowDatePicker(true);
      setFilters(prev => ({ ...prev, range: undefined, date: undefined }));
    } else {
      setShowDatePicker(false);
      setSelectedDate(null);
      setFilters(prev => ({ ...prev, range, date: undefined }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setFilters(prev => ({ ...prev, date: formattedDate, range: undefined }));
      setShowDatePicker(false);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container') && !target.closest('.react-datepicker')) {
        setOpenDropdown(null);
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-theme-gradient font-sans">
        <div className="flex">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <main className="flex-1 p-8">
            <Header
              title="Statistics"
              onMenuClick={() => setIsSidebarOpen(true)}
              onCreateClick={() => {}}
              createButtonText=""
              hideSearch={true}
            />
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-theme-primary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-theme-primary mb-2">No Data Available</h3>
                <p className="text-theme-primary opacity-75">There are no statistics available for the selected period.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const NoDataMessage = () => (
    <div className="flex items-center justify-center h-80">
      <div className="text-center">
        <svg className="w-12 h-12 mx-auto text-theme-primary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-theme-primary opacity-75">No data available for this section</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-theme-gradient font-sans">
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-8">
          <Header
            title="Statistics"
            onMenuClick={() => setIsSidebarOpen(true)}
            onCreateClick={() => {}}
            createButtonText=""
            hideSearch={true}
          />

          {/* Time Range Selector */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleTimeRangeChange('today')}
                className={`px-4 py-2 rounded-lg ${
                  filters.range === 'today' && !filters.date
                    ? 'bg-theme-button-primary text-white'
                    : 'bg-theme-card text-theme-primary hover:bg-theme-card-hover'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleTimeRangeChange('week')}
                className={`px-4 py-2 rounded-lg ${
                  filters.range === 'week'
                    ? 'bg-theme-button-primary text-white'
                    : 'bg-theme-card text-theme-primary hover:bg-theme-card-hover'
                }`}
              >
                Last Week
              </button>
              <button
                onClick={() => handleTimeRangeChange('month')}
                className={`px-4 py-2 rounded-lg ${
                  filters.range === 'month'
                    ? 'bg-theme-button-primary text-white'
                    : 'bg-theme-card text-theme-primary hover:bg-theme-card-hover'
                }`}
              >
                Last Month
              </button>
              <div className="relative">
                <button
                  onClick={() => handleTimeRangeChange('custom')}
                  className={`px-4 py-2 rounded-lg ${
                    filters.date
                      ? 'bg-theme-button-primary text-white'
                      : 'bg-theme-card text-theme-primary hover:bg-theme-card-hover'
                  }`}
                >
                  {filters.date ? new Date(filters.date).toLocaleDateString() : 'Custom Date'}
                </button>
                {showDatePicker && (
                  <div className="absolute z-10 mt-2">
                    <DatePicker
                      selected={selectedDate}
                      onChange={handleDateChange}
                      inline
                      maxDate={new Date()}
                      className="bg-theme-card border border-theme-card-hover rounded-lg shadow-lg"
                      calendarClassName="react-datepicker"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="mb-4">
              <label className="block text-theme-primary mb-2 font-roboto">Apps</label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => handleDropdownClick('apps')}
                  className="w-full bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
                >
                  <span>{filters.apps.length > 0 ? `${filters.apps.length} selected` : 'Select apps'}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`text-theme-primary transition-transform ${openDropdown === 'apps' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {openDropdown === 'apps' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover max-h-60 overflow-y-auto">
                    {(apps as AppListItem[]).map((app) => (
                      <button
                        key={app.ID}
                        type="button"
                        onClick={() => handleOptionClick('apps', app.AppName)}
                        className={`w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center ${
                          filters.apps.includes(app.AppName) ? 'bg-theme-button-primary bg-opacity-50' : ''
                        }`}
                      >
                        <span className="mr-2">{filters.apps.includes(app.AppName) ? '✓' : ''}</span>
                        {app.AppName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-theme-primary mb-2 font-roboto">Channels</label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => handleDropdownClick('channels')}
                  className="w-full bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
                >
                  <span>{filters.channels.length > 0 ? `${filters.channels.length} selected` : 'Select channels'}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`text-theme-primary transition-transform ${openDropdown === 'channels' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {openDropdown === 'channels' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover max-h-60 overflow-y-auto">
                    {(channels as Channel[]).map((channel) => (
                      <button
                        key={channel.ID}
                        type="button"
                        onClick={() => handleOptionClick('channels', channel.ChannelName)}
                        className={`w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center ${
                          filters.channels.includes(channel.ChannelName) ? 'bg-theme-button-primary bg-opacity-50' : ''
                        }`}
                      >
                        <span className="mr-2">{filters.channels.includes(channel.ChannelName) ? '✓' : ''}</span>
                        {channel.ChannelName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-theme-primary mb-2 font-roboto">Platforms</label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => handleDropdownClick('platforms')}
                  className="w-full bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
                >
                  <span>{filters.platforms.length > 0 ? `${filters.platforms.length} selected` : 'Select platforms'}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`text-theme-primary transition-transform ${openDropdown === 'platforms' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {openDropdown === 'platforms' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover max-h-60 overflow-y-auto">
                    {(platforms as Platform[]).map((platform) => (
                      <button
                        key={platform.ID}
                        type="button"
                        onClick={() => handleOptionClick('platforms', platform.PlatformName)}
                        className={`w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center ${
                          filters.platforms.includes(platform.PlatformName) ? 'bg-theme-button-primary bg-opacity-50' : ''
                        }`}
                      >
                        <span className="mr-2">{filters.platforms.includes(platform.PlatformName) ? '✓' : ''}</span>
                        {platform.PlatformName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-theme-primary mb-2 font-roboto">Architectures</label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => handleDropdownClick('architectures')}
                  className="w-full bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
                >
                  <span>{filters.architectures.length > 0 ? `${filters.architectures.length} selected` : 'Select architectures'}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`text-theme-primary transition-transform ${openDropdown === 'architectures' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {openDropdown === 'architectures' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover max-h-60 overflow-y-auto">
                    {(architectures as Architecture[]).map((arch) => (
                      <button
                        key={arch.ID}
                        type="button"
                        onClick={() => handleOptionClick('architectures', arch.ArchID)}
                        className={`w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center ${
                          filters.architectures.includes(arch.ArchID) ? 'bg-theme-button-primary bg-opacity-50' : ''
                        }`}
                      >
                        <span className="mr-2">{filters.architectures.includes(arch.ArchID) ? '✓' : ''}</span>
                        {arch.ArchID}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard
              title="Total Requests"
              value={data.summary?.total_requests || 0}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
            <StatCard
              title="Unique Clients"
              value={data.summary?.unique_clients || 0}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            />
            <StatCard
              title="Latest Version Users"
              value={data.summary?.clients_using_latest_version || 0}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
            />
            <StatCard
              title="Outdated Clients"
              value={data.summary?.clients_outdated || 0}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            />
            <StatCard
              title="Active Apps"
              value={data.summary?.total_active_apps || 0}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
            />
          </div>

          {/* Trend Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Total Requests Trend */}
            <div className="bg-theme-card rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-theme-primary">Total Requests Trend</h3>
              <div className="h-80">
                {data.daily_stats ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.daily_stats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.5)" />
                      <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--theme-card)', 
                          border: '1px solid var(--theme-card-hover)',
                          color: 'var(--theme-primary)'
                        }}
                      />
                      <Line type="monotone" dataKey="total_requests" stroke="#8884d8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Unique Clients Trend */}
            <div className="bg-theme-card rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-theme-primary">Unique Clients Trend</h3>
              <div className="h-80">
                {data.daily_stats ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.daily_stats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.5)" />
                      <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--theme-card)', 
                          border: '1px solid var(--theme-card-hover)',
                          color: 'var(--theme-primary)'
                        }}
                      />
                      <Line type="monotone" dataKey="unique_clients" stroke="#00C49F" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Latest Version Users Trend */}
            <div className="bg-theme-card rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-theme-primary">Latest Version Users Trend</h3>
              <div className="h-80">
                {data.daily_stats ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.daily_stats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.5)" />
                      <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--theme-card)', 
                          border: '1px solid var(--theme-card-hover)',
                          color: 'var(--theme-primary)'
                        }}
                      />
                      <Line type="monotone" dataKey="clients_using_latest_version" stroke="#FFBB28" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Outdated Clients Trend */}
            <div className="bg-theme-card rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-theme-primary">Outdated Clients Trend</h3>
              <div className="h-80">
                {data.daily_stats ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.daily_stats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.5)" />
                      <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--theme-card)', 
                          border: '1px solid var(--theme-card-hover)',
                          color: 'var(--theme-primary)'
                        }}
                      />
                      <Line type="monotone" dataKey="clients_outdated" stroke="#FF8042" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Version Usage Chart */}
            <div className="bg-theme-card rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-theme-primary">Version Usage</h3>
              <div className="h-80">
                {data.versions?.usage ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.versions.usage}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="version" stroke="rgba(255, 255, 255, 0.5)" />
                      <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--theme-card)', 
                          border: '1px solid var(--theme-card-hover)',
                          color: 'var(--theme-primary)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{
                          color: 'var(--theme-primary)',
                          fontWeight: 'bold',
                          marginBottom: '4px'
                        }}
                        itemStyle={{
                          color: 'var(--theme-primary)',
                          padding: '4px 0'
                        }}
                      />
                      <Bar dataKey="client_count" fill="var(--button-secondary)" activeBar={{ fill: '#b388ff' }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Platform Distribution Chart */}
            <div className="bg-theme-card rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-theme-primary">Platform Distribution</h3>
              <div className="h-80">
                {data.platforms ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.platforms}
                        dataKey="client_count"
                        nameKey="platform"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.platforms.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--theme-card)', 
                          border: '1px solid var(--theme-card-hover)',
                          color: 'var(--theme-primary)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Architecture Distribution Chart */}
            <div className="bg-theme-card rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-theme-primary">Architecture Distribution</h3>
              <div className="h-80">
                {data.architectures ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.architectures}
                        dataKey="client_count"
                        nameKey="arch"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.architectures.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--theme-card)', 
                          border: '1px solid var(--theme-card-hover)',
                          color: 'var(--theme-primary)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Channel Distribution Chart */}
            <div className="bg-theme-card rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-theme-primary">Channel Distribution</h3>
              <div className="h-80">
                {data.channels ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.channels}
                        dataKey="client_count"
                        nameKey="channel"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.channels.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--theme-card)', 
                          border: '1px solid var(--theme-card-hover)',
                          color: 'var(--theme-primary)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>
          </div>

          {/* Version Table */}
          <div className="bg-theme-card rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-theme-primary">Version Details</h3>
            <div className="overflow-x-auto">
              {data.versions?.usage ? (
                <table className="min-w-full divide-y divide-theme-card-hover">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-primary uppercase tracking-wider">Version</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-primary uppercase tracking-wider">Client Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-primary uppercase tracking-wider">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-card-hover">
                    {data.versions.usage.map((version) => (
                      <tr key={version.version} className="hover:bg-theme-card-hover transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-theme-primary">{version.version}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-theme-primary">{version.client_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-theme-primary">
                          {((version.client_count / (data.summary?.unique_clients || 1)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <NoDataMessage />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}; 