"use client";

import { useEffect, useMemo, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { nanoid } from "nanoid";
import { usePresentationState } from "@/states/presentation-state";

import { PresentationHeader } from "./PresentModeHeader";
import PresentationEditor from "../editor/presentation-editor";
import { ThemeBackground } from "../theme/ThemeBackground";

interface PresentationData {
  title?: string;
}

interface PresentationModeProps {
  presentationData: PresentationData;
}

export function PresentationMode({ presentationData }: PresentationModeProps) {
  const {
    slides,
    isGeneratingPresentation,
    currentSlideIndex,
    setCurrentSlideIndex,
    nextSlide,
    previousSlide,
  } = usePresentationState();
  const [showHeader, setShowHeader] = useState(false);

  const items = useMemo(
    () => slides.map((slide) => ({ ...slide, id: slide.id ?? nanoid() })),
    [slides]
  );

  // Handle keyboard navigation in presentation mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "Space") {
        nextSlide();
      } else if (event.key === "ArrowLeft") {
        previousSlide();
      } else if (event.key === "Escape") {
        usePresentationState.getState().setIsPresenting(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, previousSlide]);

  // Handle showing header on mouse move
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (event.clientY < 100) {
        setShowHeader(true);
      } else {
        setShowHeader(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <ThemeBackground>
      {/* Header that appears on hover */}
      <PresentationHeader
        showHeader={showHeader}
        presentationTitle={presentationData?.title}
      />

      {/* Full screen presentation */}
      <div className="fixed inset-0 z-[999] bg-black" data-is-presenting="true">
        {/* Current slide - truly full screen */}
        <DndProvider backend={HTML5Backend}>
          <div className="absolute inset-0 h-full w-full">
            {items[currentSlideIndex] && (
              <div
                key={currentSlideIndex}
                className="relative h-full w-full overflow-hidden rounded-lg bg-background"
              >
                <PresentationEditor
                  initialContent={items[currentSlideIndex]}
                  className="h-full w-full rounded-md border"
                  id={items[currentSlideIndex].id}
                  autoFocus={false}
                  slideIndex={currentSlideIndex}
                  onChange={() => {
                    /* Read-only mode, no changes needed */
                  }}
                  isGenerating={isGeneratingPresentation}
                  readOnly={true}
                />
              </div>
            )}
          </div>
        </DndProvider>

        {/* Slide indicators */}
        <div className="absolute bottom-0.5 left-1 right-1 z-[1001]">
          <div className="flex h-1.5 w-full gap-1">
            {items.map((_, index) => (
              <button
                key={index}
                className={`h-full flex-1 rounded-full transition-all ${
                  index === currentSlideIndex
                    ? "bg-primary shadow-sm"
                    : "bg-white/20 hover:bg-white/40"
                }`}
                onClick={() => setCurrentSlideIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </ThemeBackground>
  );
}
