import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

describe('Button Wrapper Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: /Click Me/i })).toBeInTheDocument();
  });

  it('forwards basic HTML button attributes', () => {
    render(
      <Button
        type="submit"
        name="test-button"
        value="submit-val"
        form="test-form"
        id="btn-id"
      >
        Submit
      </Button>
    );

    const button = screen.getByRole('button', { name: /Submit/i });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('name', 'test-button');
    expect(button).toHaveAttribute('value', 'submit-val');
    expect(button).toHaveAttribute('form', 'test-form');
    expect(button).toHaveAttribute('id', 'btn-id');
  });

  it('triggers onClick handler when pressed', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Trigger</Button>);
    
    fireEvent.click(screen.getByRole('button', { name: /Trigger/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles disabled state correctly', () => {
    render(<Button disabled={true}>Disabled Button</Button>);
    const button = screen.getByRole('button', { name: /Disabled Button/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('data-disabled', 'true');
  });

  it('handles loading state correctly', () => {
    render(<Button isLoading={true}>Save</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('data-loading', 'true');
  });
});

describe('Input Wrapper Component', () => {
  it('renders input with label and placeholder', () => {
    render(
      <Input
        label="Email Address"
        placeholder="Enter your email"
        id="email-input"
      />
    );

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
  });

  it('forwards basic HTML input attributes', () => {
    render(
      <Input
        type="password"
        name="user-pass"
        value="secret123"
        required={true}
        disabled={true}
        autoComplete="current-password"
        min="5"
        max="10"
        step="1"
        id="pass-input"
        onValueChange={() => {}}
      />
    );

    const input = screen.getByDisplayValue('secret123');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('name', 'user-pass');
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('autocomplete', 'current-password');
    expect(input).toHaveAttribute('min', '5');
    expect(input).toHaveAttribute('max', '10');
    expect(input).toHaveAttribute('step', '1');
    expect(input).toHaveAttribute('id', 'pass-input');
  });

  it('calls onValueChange callback when input changes', () => {
    const handleValueChange = vi.fn();
    render(<Input label="Name" onValueChange={handleValueChange} />);
    
    const input = screen.getByLabelText(/Name/i);
    fireEvent.change(input, { target: { value: 'John' } });
    expect(handleValueChange).toHaveBeenCalledWith('John');
  });

  it('displays helper text when provided and no error', () => {
    render(<Input label="Username" helperText="Enter a unique handle" />);
    expect(screen.getByText('Enter a unique handle')).toBeInTheDocument();
  });

  it('displays error message and ignores helper text when error is present', () => {
    render(
      <Input
        label="Username"
        helperText="Enter a unique handle"
        error="Username is already taken"
      />
    );
    expect(screen.getByText('Username is already taken')).toBeInTheDocument();
    expect(screen.queryByText('Enter a unique handle')).not.toBeInTheDocument();
  });
});
