import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import {
  useReportsQuery,
  useReportGroupMutations,
  ReportGroup,
  ReportFilters,
  ReportStatus,
  ReportStatusFilter,
} from '@/hooks/use-query/useReportsQuery';
import { useAppsQuery, AppListItem } from '@/hooks/use-query/useAppsQuery';
import { useChannelQuery, Channel } from '@/hooks/use-query/useChannelQuery';
import { usePlatformQuery, Platform } from '@/hooks/use-query/usePlatformQuery';
import { useArchitectureQuery, Architecture } from '@/hooks/use-query/useArchitectureQuery';
import { ReportBlobsModal } from '@/components/modals/ReportBlobsModal';
import { DeleteReportConfirmationModal } from '@/components/modals/DeleteReportConfirmationModal';
import { EditReportGroupModal } from '@/components/modals/EditReportGroupModal';
import { useToast } from '@/hooks/useToast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '@/styles/cards.css';

const PANEL_CLASS = 'bg-theme-card rounded-2xl border border-theme-card-hover shadow-md backdrop-blur-lg';
const REPORTS_PAGE_LIMIT = 20;
const EVENT_TYPES = ['crash', 'startup_failure', 'update_failure', 'install_failure', 'rollback_failure'];
const STATUS_TABS: { value: ReportStatusFilter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'muted', label: 'Muted' },
  { value: 'all', label: 'All' },
];
const DEFAULT_STATUS: ReportStatusFilter = 'open';
const statusBadgeClass = (status: ReportStatus) => {
  switch (status) {
    case 'resolved':
      return 'bg-green-500/20 text-green-300 border-green-400/30';
    case 'muted':
      return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    default:
      return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
  }
};
const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg font-roboto bg-theme-input text-theme-primary border border-theme transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 placeholder:text-theme-secondary shadow-sm';
const DROPDOWN_MENU_STYLE = {
  background: 'var(--dropdown-bg)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.35)',
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

const formatLabel = (value: string | null | undefined) =>
  (value ?? '')
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null) {
    const maybe = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
    return maybe.response?.data?.error || maybe.response?.data?.message || maybe.message || fallback;
  }
  return fallback;
};

const eventTypeBadgeClass = (type: string | null | undefined) =>
  (type ?? '').toLowerCase().includes('failure') || (type ?? '').toLowerCase().includes('error')
    ? 'bg-red-500/20 text-red-300 border-red-400/30'
    : 'bg-blue-500/20 text-blue-300 border-blue-400/30';

const Badge = ({ label, className }: { label: string; className: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${className}`}>
    {label}
  </span>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
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
    className={`text-theme-primary transition-transform ${open ? 'rotate-180' : ''}`}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const FilterSelect = ({
  label,
  value,
  placeholder,
  options,
  name,
  openDropdown,
  onToggle,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  name: string;
  openDropdown: string | null;
  onToggle: (name: string) => void;
  onSelect: (value: string) => void;
}) => (
  <div>
    <label className="block text-theme-primary mb-2 text-sm font-roboto">{label}</label>
    <div className="relative dropdown-container">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onToggle(name)}
          className="header-additional-btn flex-1 p-2 pr-8 flex items-center justify-between"
        >
          <span className={value ? '' : 'text-theme-secondary'}>{value || placeholder}</span>
          <ChevronIcon open={openDropdown === name} />
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onSelect('')}
            className="header-settings-btn p-2"
            title="Clear"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      {openDropdown === name && (
        <div className="absolute top-full left-0 right-0 mt-1 backdrop-blur-2xl rounded-lg shadow-lg z-[90] border border-theme-card-hover max-h-60 overflow-y-auto" style={DROPDOWN_MENU_STYLE}>
          {options.length > 0 ? (
            options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onSelect(option)}
                className={`w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center ${
                  value === option ? 'bg-theme-button-primary bg-opacity-50' : ''
                }`}
              >
                <span className="mr-2">{value === option ? '✓' : ''}</span>
                {option}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-theme-primary text-center">No options available</div>
          )}
        </div>
      )}
    </div>
  </div>
);

export const ReportsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ReportStatusFilter>(DEFAULT_STATUS);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ReportGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<ReportGroup | null>(null);
  const [groupToEdit, setGroupToEdit] = useState<ReportGroup | null>(null);
  const [pendingHash, setPendingHash] = useState<string | null>(null);

  const { toastSuccess, toastError } = useToast();
  const { apps = [] } = useAppsQuery();
  const { channels = [] } = useChannelQuery();
  const { platforms = [] } = usePlatformQuery();
  const { architectures = [] } = useArchitectureQuery();
  const { reports, isLoading } = useReportsQuery(page, REPORTS_PAGE_LIMIT, { ...filters, status });
  const { updateGroupMutation, deleteGroupMutation } = useReportGroupMutations();

  const items = reports?.items ?? [];
  const total = reports?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / REPORTS_PAGE_LIMIT));
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const handlePageChange = (nextPage: number) => {
    setPage(Math.min(Math.max(1, nextPage), totalPages));
  };

  const updateFilter = (key: Exclude<keyof ReportFilters, 'status'>, value: string) => {
    setPage(1);
    setFilters((prev) => {
      const next = { ...prev };
      if (value) {
        next[key] = value;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const handleSelectToggle = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const handleSelect = (key: Exclude<keyof ReportFilters, 'status'>, name: string) => (value: string) => {
    updateFilter(key, value);
    setOpenDropdown((prev) => (prev === name ? null : prev));
  };

  const handleFromChange = (date: Date | null) => {
    setFromDate(date);
    updateFilter('from', date ? date.toISOString() : '');
  };

  const handleToChange = (date: Date | null) => {
    setToDate(date);
    updateFilter('to', date ? date.toISOString() : '');
  };

  const handleClearAll = () => {
    setPage(1);
    setFilters({});
    setFromDate(null);
    setToDate(null);
  };

  const handleStatusTab = (value: ReportStatusFilter) => {
    setPage(1);
    setStatus(value);
  };

  const handleUpdateStatus = (group: ReportGroup, next: ReportStatus) => {
    setPendingHash(group.group_hash);
    updateGroupMutation.mutate(
      { groupHash: group.group_hash, status: next },
      {
        onSuccess: () => {
          toastSuccess(`Group marked as ${next}`);
          setPendingHash(null);
        },
        onError: (error) => {
          toastError(getErrorMessage(error, 'Failed to update group status'));
          setPendingHash(null);
        },
      }
    );
  };

  const handleEditGroup = async (data: { tags: string[]; note: string }) => {
    if (!groupToEdit) return;
    try {
      await updateGroupMutation.mutateAsync({ groupHash: groupToEdit.group_hash, ...data });
      toastSuccess('Report group updated');
      setGroupToEdit(null);
    } catch (error) {
      toastError(getErrorMessage(error, 'Failed to update report group'));
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      await deleteGroupMutation.mutateAsync(groupToDelete.group_hash);
      toastSuccess('Report group deleted');
      setGroupToDelete(null);
    } catch (error) {
      toastError(getErrorMessage(error, 'Failed to delete report group'));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container') && !target.closest('.react-datepicker')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderHeader = () => (
    <Header
      title="Reports"
      onMenuClick={() => setIsSidebarOpen(true)}
      onCreateClick={() => {}}
      createButtonText=""
      hideSearch={true}
    />
  );

  return (
    <div className="min-h-screen bg-theme-gradient font-sans">
      <div className="flex flex-col lg:flex-row">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 min-w-0 p-2 sm:p-4 md:p-8">
          {renderHeader()}

          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusTab(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === tab.value
                    ? 'bg-theme-button-primary text-theme-primary shadow-sm'
                    : 'bg-theme-card text-theme-secondary hover:bg-theme-card-hover'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={`${PANEL_CLASS} relative z-30 p-4 sm:p-6 mb-4 sm:mb-8`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-theme-primary text-base sm:text-lg font-semibold">Filters</h2>
              <div className="flex items-center gap-3">
                <span className="text-theme-secondary text-xs sm:text-sm">
                  {total} group{total === 1 ? '' : 's'} total
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAll}
                    className="header-additional-btn px-3 py-1.5 text-sm"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              <FilterSelect
                label="Application"
                value={filters.app ?? ''}
                placeholder="Select app"
                options={(apps as AppListItem[]).map((app) => app.AppName)}
                name="app"
                openDropdown={openDropdown}
                onToggle={handleSelectToggle}
                onSelect={handleSelect('app', 'app')}
              />
              <FilterSelect
                label="Channel"
                value={filters.channel ?? ''}
                placeholder="Select channel"
                options={(channels as Channel[]).map((channel) => channel.ChannelName)}
                name="channel"
                openDropdown={openDropdown}
                onToggle={handleSelectToggle}
                onSelect={handleSelect('channel', 'channel')}
              />
              <FilterSelect
                label="Platform"
                value={filters.platform ?? ''}
                placeholder="Select platform"
                options={(platforms as Platform[]).map((platform) => platform.PlatformName)}
                name="platform"
                openDropdown={openDropdown}
                onToggle={handleSelectToggle}
                onSelect={handleSelect('platform', 'platform')}
              />
              <FilterSelect
                label="Architecture"
                value={filters.arch ?? ''}
                placeholder="Select architecture"
                options={(architectures as Architecture[]).map((arch) => arch.ArchID)}
                name="arch"
                openDropdown={openDropdown}
                onToggle={handleSelectToggle}
                onSelect={handleSelect('arch', 'arch')}
              />

              <div>
                <label className="block text-theme-primary mb-2 text-sm font-roboto">Version</label>
                <input
                  type="text"
                  value={filters.version ?? ''}
                  onChange={(e) => updateFilter('version', e.target.value)}
                  placeholder="e.g. 1.4.2"
                  className={INPUT_CLASS}
                />
              </div>
              <FilterSelect
                label="Event Type"
                value={filters.type ?? ''}
                placeholder="Select event type"
                options={EVENT_TYPES}
                name="type"
                openDropdown={openDropdown}
                onToggle={handleSelectToggle}
                onSelect={handleSelect('type', 'type')}
              />
              <div>
                <label className="flex items-center gap-1.5 text-theme-primary mb-2 text-sm font-roboto">
                  Reason
                  <span className="relative group inline-flex">
                    <i className="fas fa-info-circle text-theme-secondary cursor-help"></i>
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 rounded-lg border border-theme-card-hover backdrop-blur-2xl px-3 py-2 text-xs text-theme-primary normal-case font-normal opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-[95]" style={DROPDOWN_MENU_STYLE}>
                      Use the raw value, not the label shown in the table. Lowercase with underscores instead of spaces — e.g. "Panic Nil Pointer" → <code>panic_nil_pointer</code>.
                    </span>
                  </span>
                </label>
                <input
                  type="text"
                  value={filters.reason ?? ''}
                  onChange={(e) => updateFilter('reason', e.target.value)}
                  placeholder="e.g. checksum_mismatch"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-theme-primary mb-2 text-sm font-roboto">Last Seen From</label>
                <DatePicker
                  selected={fromDate}
                  onChange={handleFromChange}
                  showTimeSelect
                  dateFormat="yyyy-MM-dd HH:mm"
                  maxDate={new Date()}
                  placeholderText="Start date"
                  isClearable
                  className={INPUT_CLASS}
                  calendarClassName="react-datepicker"
                  popperClassName="z-[90]"
                />
              </div>
              <div>
                <label className="block text-theme-primary mb-2 text-sm font-roboto">Last Seen To</label>
                <DatePicker
                  selected={toDate}
                  onChange={handleToChange}
                  showTimeSelect
                  dateFormat="yyyy-MM-dd HH:mm"
                  minDate={fromDate ?? undefined}
                  maxDate={new Date()}
                  placeholderText="End date"
                  isClearable
                  className={INPUT_CLASS}
                  calendarClassName="react-datepicker"
                  popperClassName="z-[90]"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className={`${PANEL_CLASS} flex items-center justify-center h-64`}>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-primary"></div>
            </div>
          ) : items.length === 0 ? (
            <div className={`${PANEL_CLASS} flex items-center justify-center h-64`}>
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto text-theme-primary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-theme-primary opacity-75">
                  {hasActiveFilters ? 'No reports match the selected filters' : 'No reports available yet'}
                </p>
              </div>
            </div>
          ) : (
            <div className="users-table-container text-sm">
              <div className="overflow-x-auto">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left">Application</th>
                      <th className="px-3 py-2 text-left">System</th>
                      <th className="px-3 py-2 text-left">Event</th>
                      <th className="px-3 py-2 text-center">Occurrences</th>
                      <th className="px-3 py-2 text-left">First Seen</th>
                      <th className="px-3 py-2 text-left">Last Seen</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2 text-left">Tags / Note</th>
                      <th className="px-3 py-2 text-center">Details</th>
                      <th className="px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((group: ReportGroup) => (
                      <tr key={group.id}>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-theme-primary">{group.application.name}</div>
                          <div className="text-theme-secondary text-xs mt-0.5">
                            v{group.application.version} · {group.application.channel}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-theme-primary capitalize">{group.system.platform}</div>
                          <div className="text-theme-secondary text-xs mt-0.5 uppercase">{group.system.arch}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1.5">
                            <Badge label={formatLabel(group.event.type)} className={eventTypeBadgeClass(group.event.type)} />
                            <Badge label={formatLabel(group.event.reason)} className="bg-amber-500/20 text-amber-300 border-amber-400/30" />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-semibold text-theme-primary tabular-nums">{group.stats.count}</span>
                        </td>
                        <td className="px-3 py-2 text-theme-secondary whitespace-nowrap">{formatDateTime(group.stats.first_seen)}</td>
                        <td className="px-3 py-2 text-theme-secondary whitespace-nowrap">{formatDateTime(group.stats.last_seen)}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge label={formatLabel(group.status)} className={statusBadgeClass(group.status)} />
                            {group.resolved_at && (
                              <div className="text-theme-secondary text-xs whitespace-nowrap">
                                {group.resolved_by && <span>by {group.resolved_by}</span>}
                                <div>{formatDateTime(group.resolved_at)}</div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-col gap-1 max-w-[220px]">
                            {group.tags && group.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {group.tags.map((tag) => (
                                  <Badge key={tag} label={tag} className="bg-purple-500/20 text-purple-300 border-purple-400/30" />
                                ))}
                              </div>
                            )}
                            {group.note && (
                              <div className="flex items-start gap-1.5 text-theme-secondary text-xs" title={group.note}>
                                <i className="fas fa-sticky-note mt-0.5 flex-shrink-0"></i>
                                <span className="line-clamp-2 break-words">{group.note}</span>
                              </div>
                            )}
                            {!(group.tags && group.tags.length > 0) && !group.note && (
                              <span className="text-theme-secondary text-xs">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex justify-center">
                            {group.stats.details_stored > 0 ? (
                              <button
                                onClick={() => setSelectedGroup(group)}
                                className="users-table-action-btn"
                                title={`View ${group.stats.details_stored} stored detail blob${group.stats.details_stored === 1 ? '' : 's'}`}
                              >
                                <i className="fas fa-folder-open"></i>
                              </button>
                            ) : (
                              <span className="text-theme-secondary text-xs">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => setGroupToEdit(group)}
                              className="users-table-action-btn"
                              title="Edit tags & note"
                            >
                              <i className="fas fa-pen"></i>
                            </button>
                            {group.status !== 'resolved' && (
                              <button
                                onClick={() => handleUpdateStatus(group, 'resolved')}
                                disabled={pendingHash === group.group_hash}
                                className="users-table-action-btn disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Resolve"
                              >
                                <i className="fas fa-check text-green-400"></i>
                              </button>
                            )}
                            {group.status !== 'open' && (
                              <button
                                onClick={() => handleUpdateStatus(group, 'open')}
                                disabled={pendingHash === group.group_hash}
                                className="users-table-action-btn disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reopen"
                              >
                                <i className="fas fa-undo text-blue-400"></i>
                              </button>
                            )}
                            {group.status !== 'muted' && (
                              <button
                                onClick={() => handleUpdateStatus(group, 'muted')}
                                disabled={pendingHash === group.group_hash}
                                className="users-table-action-btn disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Mute"
                              >
                                <i className="fas fa-bell-slash text-gray-400"></i>
                              </button>
                            )}
                            <button
                              onClick={() => setGroupToDelete(group)}
                              className="users-table-action-btn"
                              title="Delete permanently"
                            >
                              <i className="fas fa-trash text-red-400"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(1)}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-theme-card text-theme-primary hover:bg-theme-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                <i className="fas fa-angle-double-left"></i>
              </button>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-theme-card text-theme-primary hover:bg-theme-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <i className="fas fa-angle-left"></i>
              </button>
              <span className="px-4 py-2 text-theme-primary">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg bg-theme-card text-theme-primary hover:bg-theme-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <i className="fas fa-angle-right"></i>
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg bg-theme-card text-theme-primary hover:bg-theme-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last page"
              >
                <i className="fas fa-angle-double-right"></i>
              </button>
            </div>
          )}
        </main>
      </div>

      {selectedGroup && (
        <ReportBlobsModal group={selectedGroup} onClose={() => setSelectedGroup(null)} />
      )}

      {groupToEdit && (
        <EditReportGroupModal
          group={groupToEdit}
          onClose={() => setGroupToEdit(null)}
          onConfirm={handleEditGroup}
        />
      )}

      {groupToDelete && (
        <DeleteReportConfirmationModal
          group={groupToDelete}
          onClose={() => setGroupToDelete(null)}
          onConfirm={handleDeleteGroup}
        />
      )}
    </div>
  );
};
