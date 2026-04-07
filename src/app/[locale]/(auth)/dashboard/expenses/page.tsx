import { auth } from '@clerk/nextjs/server';

import { TitleBar } from '@/features/dashboard/TitleBar';
import { ExpensesPage } from '@/features/expenses/ExpensesPage';

export default async function ExpensesRoute() {
  const { orgRole } = await auth();
  const isAdmin = orgRole === 'org:admin';

  return (
    <>
      <TitleBar
        title="Gastos"
        description="Registrá los egresos del negocio para calcular tu ganancia real"
      />
      <ExpensesPage isAdmin={isAdmin} />
    </>
  );
}
