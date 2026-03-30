import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopicSelector } from "@/components/session/TopicSelector";

describe("TopicSelector", () => {
  it("renders all 5 topics", () => {
    render(<TopicSelector selected={null} onSelect={vi.fn()} />);
    expect(screen.getByText("커리어")).toBeInTheDocument();
    expect(screen.getByText("관계")).toBeInTheDocument();
    expect(screen.getByText("목표")).toBeInTheDocument();
    expect(screen.getByText("자기이해")).toBeInTheDocument();
    expect(screen.getByText("자유 주제")).toBeInTheDocument();
  });

  it("calls onSelect with the topic key on click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TopicSelector selected={null} onSelect={onSelect} />);
    const careerCard = screen.getByText("커리어").closest("[data-topic]");
    await user.click(careerCard!);
    expect(onSelect).toHaveBeenCalledWith("career");
  });

  it("highlights selected topic with data-selected='true'", () => {
    render(<TopicSelector selected="career" onSelect={vi.fn()} />);
    const careerCard = screen.getByText("커리어").closest("[data-topic]");
    expect(careerCard).toHaveAttribute("data-selected", "true");
  });

  it("does not highlight non-selected topics", () => {
    render(<TopicSelector selected="career" onSelect={vi.fn()} />);
    const relationshipCard = screen
      .getByText("관계")
      .closest("[data-topic]");
    expect(relationshipCard).toHaveAttribute("data-selected", "false");
  });

  it("calls onSelect with correct key for each topic", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TopicSelector selected={null} onSelect={onSelect} />);

    const topics = [
      { label: "관계", key: "relationship" },
      { label: "목표", key: "goal" },
      { label: "자기이해", key: "self" },
      { label: "자유 주제", key: "other" },
    ];

    for (const { label, key } of topics) {
      const card = screen.getByText(label).closest("[data-topic]");
      await user.click(card!);
      expect(onSelect).toHaveBeenCalledWith(key);
    }
  });
});
