interface LoadingStateProps {
  message?: string;
}

interface EmptyStateProps {
  icon: string;
  message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <>
      <div className="spinner" />
      {message && <p className="loading-text">{message}</p>}
    </>
  );
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="text-5xl" aria-hidden="true">{icon}</div>
      <p>{message}</p>
    </div>
  );
}
