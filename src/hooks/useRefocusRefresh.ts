import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Silently refetches whenever this screen regains focus — e.g. coming back
 * from a detail screen after a registration, or from an admin create screen
 * — so a screen's data never stays stale until a manual pull-to-refresh.
 * Skips the very first focus: the screen's own mount effect already covers
 * the initial load.
 */
export function useRefocusRefresh(onRefocus: () => void): void {
  const isFirstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      onRefocus();
    }, [onRefocus]),
  );
}
