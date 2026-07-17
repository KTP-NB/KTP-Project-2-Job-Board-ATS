import AuthGate from '@/components/authgate';
import JobBoardShell from './components/JobBoardShell';

export const metadata = {
  title: 'Job Board | KTP New Brunswick',
  description: 'Member-only KTP job board and application tracking tools.',
};

export default function JobBoardLayout({ children }) {
  return (
    <AuthGate>
      <JobBoardShell>{children}</JobBoardShell>
    </AuthGate>
  );
}
