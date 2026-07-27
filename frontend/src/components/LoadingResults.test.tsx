import { render, screen } from '@testing-library/react';
import LoadingResults from './LoadingResults';

describe('LoadingResults', () => {
  it('renders loading text', () => {
    render(<LoadingResults />);
    expect(screen.getByText(/Loading results/i)).toBeInTheDocument();
  });
});

