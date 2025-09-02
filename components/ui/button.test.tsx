
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
  it('should render the button with the correct text', () => {
    render(<Button>Click Me</Button>);

    // Find the button by its accessible name, which is its text content.
    const buttonElement = screen.getByRole('button', { name: /click me/i });

    // Assert that the button is in the document
    expect(buttonElement).toBeInTheDocument();
  });
});
