import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { SmartLoading } from '../../components/ui/SmartLoading';

describe('SmartLoading Scaffold', () => {
  it('renders without crashing in IDLE stage', () => {
    // TODO(@agent:atlas): Add robust testing for stage transitions
    const { getByText } = render(<SmartLoading stage="IDLE" />);
    expect(getByText('Ready to Import')).toBeTruthy();
  });

  it('renders error state correctly', () => {
    const { getByText } = render(<SmartLoading stage="ERROR" error="Test failure" />);
    expect(getByText('Import Failed')).toBeTruthy();
    expect(getByText('Test failure')).toBeTruthy();
  });
});
