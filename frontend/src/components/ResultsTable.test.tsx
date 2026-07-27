import { render, screen } from '@testing-library/react';
import ResultsTable from './ResultsTable';

describe('ResultsTable empty state', () => {
  it('shows "No data yet" when there are no results on page 1', () => {
    render(
      <ResultsTable
        results={[]}
        newestId={null}
        page={1}
        totalPages={1}
        total={0}
        onPageChange={() => {}}
      />,
    );

    expect(screen.getByText(/No data yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Waiting for the first monitor result/i),
    ).toBeInTheDocument();
  });
});

