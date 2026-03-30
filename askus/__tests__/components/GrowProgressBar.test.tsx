import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GrowProgressBar } from "@/components/grow/GrowProgressBar";

describe("GrowProgressBar", () => {
  it("renders all 4 stage labels", () => {
    render(<GrowProgressBar currentStage="goal" />);
    expect(screen.getByText("Goal")).toBeInTheDocument();
    expect(screen.getByText("Reality")).toBeInTheDocument();
    expect(screen.getByText("Options")).toBeInTheDocument();
    expect(screen.getByText("Will")).toBeInTheDocument();
  });

  it("renders all 4 stage letters", () => {
    render(<GrowProgressBar currentStage="goal" />);
    expect(screen.getByText("G")).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
    expect(screen.getByText("O")).toBeInTheDocument();
    expect(screen.getByText("W")).toBeInTheDocument();
  });

  it("highlights current stage label with font-bold", () => {
    render(<GrowProgressBar currentStage="reality" />);
    const label = screen.getByText("Reality");
    expect(label).toHaveClass("font-bold");
  });

  it("marks completed stages label with text-brand-purple", () => {
    render(<GrowProgressBar currentStage="options" />);
    const goalLabel = screen.getByText("Goal");
    const realityLabel = screen.getByText("Reality");
    expect(goalLabel).toHaveClass("text-brand-purple");
    expect(realityLabel).toHaveClass("text-brand-purple");
  });

  it("does not mark upcoming stages with text-brand-purple", () => {
    render(<GrowProgressBar currentStage="goal" />);
    const realityLabel = screen.getByText("Reality");
    expect(realityLabel).not.toHaveClass("text-brand-purple");
    const optionsLabel = screen.getByText("Options");
    expect(optionsLabel).not.toHaveClass("text-brand-purple");
  });

  it("highlights current stage label even at first stage", () => {
    render(<GrowProgressBar currentStage="goal" />);
    const label = screen.getByText("Goal");
    expect(label).toHaveClass("font-bold");
  });

  it("highlights current stage label at last stage", () => {
    render(<GrowProgressBar currentStage="will" />);
    const label = screen.getByText("Will");
    expect(label).toHaveClass("font-bold");
  });

  it("marks all previous stages completed when at last stage", () => {
    render(<GrowProgressBar currentStage="will" />);
    expect(screen.getByText("Goal")).toHaveClass("text-brand-purple");
    expect(screen.getByText("Reality")).toHaveClass("text-brand-purple");
    expect(screen.getByText("Options")).toHaveClass("text-brand-purple");
  });
});
