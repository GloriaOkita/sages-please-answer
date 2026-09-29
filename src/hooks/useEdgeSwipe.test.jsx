import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEdgeSwipe } from "./useEdgeSwipe.js";

function Harness({ onOpen }) {
  const handlers = useEdgeSwipe(onOpen);
  return <div data-testid="surface" {...handlers} />;
}

describe("useEdgeSwipe", () => {
  it("opens after a horizontal swipe beginning at the left edge", () => {
    const onOpen = vi.fn();
    render(<Harness onOpen={onOpen} />);
    const surface = screen.getByTestId("surface");
    fireEvent.touchStart(surface, { touches: [{ clientX: 10, clientY: 200 }] });
    fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 110, clientY: 215 }] });
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("ignores swipes that begin away from the edge or move vertically", () => {
    const onOpen = vi.fn();
    render(<Harness onOpen={onOpen} />);
    const surface = screen.getByTestId("surface");
    fireEvent.touchStart(surface, { touches: [{ clientX: 80, clientY: 200 }] });
    fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 180, clientY: 205 }] });
    fireEvent.touchStart(surface, { touches: [{ clientX: 10, clientY: 200 }] });
    fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 100, clientY: 300 }] });
    expect(onOpen).not.toHaveBeenCalled();
  });
});
