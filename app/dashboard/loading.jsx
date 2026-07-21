import DashboardRouteLoader from '@/components/DashboardRouteLoader';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <DashboardRouteLoader />
    </div>
  );
}
