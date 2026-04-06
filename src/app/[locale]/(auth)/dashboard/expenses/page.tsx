import { TitleBar } from '@/features/dashboard/TitleBar';
import { ExpensesPage } from '@/features/expenses/ExpensesPage';

export default function ExpensesRoute() {
  return (
    <>
      <TitleBar
        title="Gastos"
        description="Registrá los egresos del negocio para calcular tu ganancia real"
      />
      <ExpensesPage />
    </>
  );
}
