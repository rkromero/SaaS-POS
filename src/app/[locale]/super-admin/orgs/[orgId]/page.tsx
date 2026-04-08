import { OrgDetailPage } from '@/features/super-admin/OrgDetailPage';

export default async function OrgDetailRoute({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgDetailPage orgId={orgId} />;
}
