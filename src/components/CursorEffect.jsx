import { useEffect, useRef, useState } from "react";

/**
 * CursorEffect
 * - Outer translucent ring with lagged follow
 * - Inner precise dot
 * - Expands on hover over interactive elements
 * - Pulse on click
 * - Auto-hidden on touch devices
 */
export default function CursorEffect() {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const posRef   = useRef({ x: -100, y: -100 }); // outer's current position
  const targetRef = useRef({ x: -100, y: -100 }); // where cursor actually is
  const rafRef   = useRef(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    // Don't run on touch devices
    if (window.matchMedia("(hover: none)").matches) return;
    if (typeof window === "undefined") return;

    setVisible(true);

    const INTERACTIVE_SELECTORS = [
      "button", "a", "[role='button']", "input", "textarea", "select",
      "label[for]", ".chat-item", ".contact-item", ".avatar-choice",
      ".color-choice", ".segment", ".theme-card", ".settings-tab",
      ".kebab-btn", ".send-btn", ".icon-btn", ".sidebar-icon-btn",
      ".choice-chip", ".member-option",
    ].join(", ");

    function onMouseMove(e) {
      targetRef.current = { x: e.clientX, y: e.clientY };

      // Snap inner dot immediately
      if (innerRef.current) {
        innerRef.current.style.transform =
          `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
      }

      // Check hover
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const isInteractive = el && el.closest(INTERACTIVE_SELECTORS);
      setExpanded(!!isInteractive);
    }

    function onMouseDown() { setClicked(true); }
    function onMouseUp()   { setClicked(false); }
    function onMouseLeave(){ setVisible(false); }
    function onMouseEnter(){ setVisible(true); }

    // Smooth animation loop for outer ring
    function animate() {
      const { x: tx, y: ty } = targetRef.current;
      const { x: cx, y: cy } = posRef.current;
      const ease = 0.12;

      const nx = cx + (tx - cx) * ease;
      const ny = cy + (ty - cy) * ease;
      posRef.current = { x: nx, y: ny };

      if (outerRef.current) {
        const size = expanded ? 48 : 32;
        outerRef.current.style.transform = `translate(${nx - size / 2}px, ${ny - size / 2}px)`;
        outerRef.current.style.width  = `${size}px`;
        outerRef.current.style.height = `${size}px`;
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    document.addEventListener("mousemove",  onMouseMove);
    document.addEventListener("mousedown",  onMouseDown);
    document.addEventListener("mouseup",    onMouseUp);
    document.body.addEventListener("mouseleave", onMouseLeave);
    document.body.addEventListener("mouseenter", onMouseEnter);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove",  onMouseMove);
      document.removeEventListener("mousedown",  onMouseDown);
      document.removeEventListener("mouseup",    onMouseUp);
      document.body.removeEventListener("mouseleave", onMouseLeave);
      document.body.removeEventListener("mouseenter", onMouseEnter);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [expanded]);

  if (!visible) return null;

  return (
    <>
      {/* Outer lagged ring */}
      <div
        ref={outerRef}
        className={`cursor-outer${expanded ? " cursor-expanded" : ""}${clicked ? " cursor-clicked" : ""}`}
        aria-hidden="true"
      />
      {/* Inner precise dot */}
      <div
        ref={innerRef}
        className="cursor-inner"
        aria-hidden="true"
      />
    </>
  );
}
