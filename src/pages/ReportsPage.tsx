import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useReportsQuery, ReportGroup } from '@/hooks/use-query/useReportsQuery';
import { ReportBlobsModal } from '@/components/modals/ReportBlobsModal';
import '@/styles/cards.css';

const PANEL_CLASS = 'bg-theme-card rounded-2xl border border-theme-card-hover shadow-md backdrop-blur-lg';
const REPORTS_PAGE_LIMIT = 20;

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

const formatLabel = (value: string) =>
  value
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const eventTypeBadgeClass = (type: string) =>
  type.toLowerCase().includes('failure') || type.toLowerCase().includes('error')
    ? 'bg-red-500/20 text-red-300 border-red-400/30'
    : 'bg-blue-500/20 text-blue-300 border-blue-400/30';

const Badge = ({ label, className }: { label: string; className: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${className}`}>
    {label}
  </span>
);

export const ReportsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState<ReportGroup | null>(null);
  const { reports, isLoading } = useReportsQuery(page, REPORTS_PAGE_LIMIT);

  const items = reports?.items ?? [];
  const total = reports?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / REPORTS_PAGE_LIMIT));

  const handlePageChange = (nextPage: number) => {
    setPage(Math.min(Math.max(1, nextPage), totalPages));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-theme-gradient font-sans">
        <div className="flex">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <main className="flex-1 p-8">
            <Header
              title="Reports"
              onMenuClick={() => setIsSidebarOpen(true)}
              onCreateClick={() => {}}
              createButtonText=""
              hideSearch={true}
            />
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-primary"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-gradient font-sans">
      <div className="flex flex-col lg:flex-row">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-2 sm:p-4 md:p-8">
          <Header
            title="Reports"
            onMenuClick={() => setIsSidebarOpen(true)}
            onCreateClick={() => {}}
            createButtonText=""
            hideSearch={true}
          />

          <div className={`${PANEL_CLASS} p-4 sm:p-6 mb-4 sm:mb-8 flex items-center justify-between`}>
            <h2 className="text-theme-primary text-base sm:text-lg font-semibold">Report Groups</h2>
            <span className="text-theme-secondary text-xs sm:text-sm">
              {total} group{total === 1 ? '' : 's'} total
            </span>
          </div>

          {items.length === 0 ? (
            <div className={`${PANEL_CLASS} flex items-center justify-center h-64`}>
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto text-theme-primary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-theme-primary opacity-75">No reports available yet</p>
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
                      <th className="px-3 py-2 text-center">Details</th>
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
    </div>
  );
};
