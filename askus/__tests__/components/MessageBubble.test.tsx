import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBubble } from "@/components/chat/MessageBubble";

describe("MessageBubble", () => {
  it("renders assistant message with avatar 'A'", () => {
    render(<MessageBubble role="assistant" content="Hello, how can I help?" />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("Hello, how can I help?")).toBeInTheDocument();
  });

  it("renders user message without avatar", () => {
    render(<MessageBubble role="user" content="I need help" />);
    expect(screen.queryByText("A")).not.toBeInTheDocument();
    expect(screen.getByText("I need help")).toBeInTheDocument();
  });

  it("assistant message container has justify-start alignment", () => {
    const { container } = render(
      <MessageBubble role="assistant" content="Hi" />
    );
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass("justify-start");
  });

  it("user message container has justify-end alignment", () => {
    const { container } = render(
      <MessageBubble role="user" content="Hi" />
    );
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass("justify-end");
  });

  it("renders assistant bubble with white background class", () => {
    render(<MessageBubble role="assistant" content="Hello" />);
    const bubble = screen.getByText("Hello").closest("div");
    expect(bubble).toHaveClass("bg-white");
  });

  it("renders user bubble with brand-purple background class", () => {
    render(<MessageBubble role="user" content="Hello" />);
    const bubble = screen.getByText("Hello").closest("div");
    expect(bubble).toHaveClass("bg-brand-purple");
  });
});
