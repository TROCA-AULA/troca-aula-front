import { AppShell } from '@/components/app-shell';

// Menu lateral + cabeçalho comuns a todas as telas logadas.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
