import JobBoardEmptyState from '../components/JobBoardEmptyState';

export default function ApplicationsPage() {
  return (
    <JobBoardEmptyState
      title="Application tracker coming next"
      message="Members will track applied, interviewing, offer, rejected, and withdrawn roles here."
    />
  );
}
