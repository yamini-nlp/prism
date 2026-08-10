import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, Textarea } from "@/components/ui/Input";

describe("Input", () => {
  it("associates the visible label with the input via htmlFor/id", () => {
    render(<Input label="Email" placeholder="you@example.com" />);
    const input = screen.getByLabelText("Email");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "you@example.com");
  });

  it("lets the user type into the field", async () => {
    const user = userEvent.setup();
    render(<Input label="Email" />);
    const input = screen.getByLabelText("Email");
    await user.type(input, "hello@prism.dev");
    expect(input).toHaveValue("hello@prism.dev");
  });

  it("marks the field invalid and links the error message via aria-describedby", () => {
    render(<Input label="Email" error="Enter a valid email address." />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const errorId = input.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    expect(screen.getByText("Enter a valid email address.")).toHaveAttribute("id", errorId as string);
  });

  it("shows the hint text and links it via aria-describedby when there is no error", () => {
    render(<Input label="Email" hint="We'll never share this." />);
    const input = screen.getByLabelText("Email");
    const hintId = input.getAttribute("aria-describedby");
    expect(screen.getByText("We'll never share this.")).toHaveAttribute("id", hintId as string);
  });

  it("calls onChange handlers passed through props", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input label="Email" onChange={onChange} />);
    await user.type(screen.getByLabelText("Email"), "a");
    expect(onChange).toHaveBeenCalled();
  });
});

describe("Textarea", () => {
  it("associates the visible label and reflects typed content", async () => {
    const user = userEvent.setup();
    render(<Textarea label="Notes" />);
    const textarea = screen.getByLabelText("Notes");
    await user.type(textarea, "Some notes");
    expect(textarea).toHaveValue("Some notes");
  });

  it("marks the field invalid when an error is provided", () => {
    render(<Textarea label="Notes" error="Required." />);
    expect(screen.getByLabelText("Notes")).toHaveAttribute("aria-invalid", "true");
  });
});