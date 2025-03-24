import { useCallback, useRef, useEffect } from "react";
import debounce from "lodash.debounce";
import { usePresentationState } from "@/states/presentation-state";
import { updatePresentation } from "@/app/_actions/presentation/presentationActions";

interface UseDebouncedSaveOptions {
  /**
   * Debounce delay in milliseconds
   * @default 1000
   */
  delay?: number;
}

/**
 * Custom hook for debounced saving of presentation slides
 * Automatically saves when slides are changed after the specified delay
 * Will not save while content is being generated
 */
export const useDebouncedSave = (options: UseDebouncedSaveOptions = {}) => {
  const { delay = 1000 } = options;
  const { setSavingStatus } = usePresentationState();

  // Create debounced save function
  const debouncedSave = useRef(
    debounce(async () => {
      // Get the latest state directly from the store
      const {
        slides,
        currentPresentationId,
        currentPresentationTitle,
        theme,
        outline,
        isGeneratingOutline,
        isGeneratingPresentation,
        imageModel,
        presentationStyle,
        language,
      } = usePresentationState.getState();

      // Don't save if we're generating content or if there's no presentation
      if (!currentPresentationId || slides.length === 0) return;
      if (isGeneratingOutline || isGeneratingPresentation) {
        setSavingStatus("idle");
        return;
      }

      try {
        setSavingStatus("saving");

        await updatePresentation({
          id: currentPresentationId,
          content: {
            slides,
          },
          title: currentPresentationTitle ?? "",
          outline,
          theme,
          imageModel,
          presentationStyle,
          language,
        });

        setSavingStatus("saved");
        // Reset to idle after 2 seconds
        setTimeout(() => {
          setSavingStatus("idle");
        }, 2000);
      } catch (error) {
        console.error("Failed to save presentation:", error);
        setSavingStatus("idle");
      }
    }, delay)
  ).current;

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Save slides immediately (useful for manual saves)
  const saveImmediately = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    debouncedSave.cancel();

    // Get the latest state directly from the store
    const {
      slides,
      currentPresentationId,
      currentPresentationTitle,
      theme,
      outline,
      imageModel,
      presentationStyle,
      language,
    } = usePresentationState.getState();

    // Don't save if there's no presentation
    if (!currentPresentationId || slides.length === 0) return;

    try {
      setSavingStatus("saving");

      await updatePresentation({
        id: currentPresentationId,
        content: {
          slides,
        },
        title: currentPresentationTitle ?? "",
        outline,
        language,
        imageModel,
        presentationStyle,
        theme,
      });

      setSavingStatus("saved");
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSavingStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Failed to save presentation:", error);
      setSavingStatus("idle");
    }
  }, [debouncedSave, setSavingStatus]);

  // Trigger save function
  const save = useCallback(() => {
    // Get the latest state directly from the store to check if we're generating content
    const { isGeneratingOutline, isGeneratingPresentation } =
      usePresentationState.getState();

    // Don't trigger save if we're generating content
    if (isGeneratingOutline || isGeneratingPresentation) {
      return;
    }
    setSavingStatus("saving");
    void debouncedSave();
  }, [debouncedSave, setSavingStatus]);

  return {
    save,
    saveImmediately,
  };
};
