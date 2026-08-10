import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";

describe("Card", () => {
  it("renders its children", () => {
    render(<Card>Card body</Card>);
    expect(screen.getByText("Card body")).toBeInTheDocument();
  });

  it("renders a full composition with header, title, description, content, and footer", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Document ready</CardTitle>
        </CardHeader>
        <CardDescription>Your paper has finished processing.</CardDescription>
        <CardContent>Ready to query.</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>
    );

    expect(screen.getByRole("heading", { name: "Document ready" })).toBeInTheDocument();
    expect(screen.getByText("Your paper has finished processing.")).toBeInTheDocument();
    expect(screen.getByText("Ready to query.")).toBeInTheDocument();
    expect(screen.getByText("Footer actions")).toBeInTheDocument();
  });

  it("forwards arbitrary props such as data attributes to the root element", () => {
    render(<Card data-testid="stat-card">Stat</Card>);
    expect(screen.getByTestId("stat-card")).toBeInTheDocument();
  });
});