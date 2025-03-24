"use client";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useSlideChangeWatcher } from "@/hooks/presentation/useSlideChangeWatcher";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SlidePreviewRenderer } from "./SlidePreviewRenderer";
import { usePresentationSlides } from "@/hooks/presentation/usePresentationSlides";
import { type TElement } from "@udecode/plate-common";
import { usePresentationState } from "@/states/presentation-state";
import { useEffect } from "react";
import { SlideContainer } from "./SlideContainer";
import PresentationEditor from "../editor/presentation-editor";

interface PresentationSlidesViewProps {
  handleSlideChange: (value: TElement[], index: number) => void;
  isGeneratingPresentation: boolean;
}

export const PresentationSlidesView = ({
  handleSlideChange,
  isGeneratingPresentation,
}: PresentationSlidesViewProps) => {
  const { currentSlideIndex } = usePresentationState();
  const { items, sensors, handleDragEnd } = usePresentationSlides();
  // Use the slide change watcher to automatically save changes
  useSlideChangeWatcher({ debounceDelay: 1500 });

  useEffect(() => {
    console.log("PresentationSlidesView Mounted");

    return () => {
      console.log("PresentationSlidesView Unmounted");
    };
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <DndProvider backend={HTML5Backend}>
          {items.map((slide, index) => (
            <div
              key={slide.id}
              className={`slide-wrapper slide-wrapper-${index}`}
            >
              <SlideContainer index={index} id={slide.id}>
                <div className={`slide-container-${index}`}>
                  <PresentationEditor
                    initialContent={slide}
                    className="min-h-[300px] rounded-md border"
                    id={slide.id}
                    autoFocus={index === currentSlideIndex}
                    slideIndex={index}
                    onChange={(value) => handleSlideChange(value, index)}
                    isGenerating={isGeneratingPresentation}
                    readOnly={false}
                  />
                </div>
              </SlideContainer>

              {/* Create preview directly in the markup */}
              <SlidePreviewRenderer slideIndex={index} slideId={slide.id}>
                <PresentationEditor
                  initialContent={slide}
                  className="min-h-[300px] border"
                  id={`preview-${slide.id}`}
                  slideIndex={index}
                  onChange={() => {
                    /* Read-only in preview */
                  }}
                  isGenerating={isGeneratingPresentation}
                  readOnly={true}
                />
              </SlidePreviewRenderer>
            </div>
          ))}
        </DndProvider>
      </SortableContext>
    </DndContext>
  );
};
