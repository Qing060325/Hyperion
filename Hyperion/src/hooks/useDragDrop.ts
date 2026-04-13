// ==========================================
// useDragDrop Hook - Drag and Drop for @dnd-kit
// ==========================================

import { createSignal, createMemo } from "solid-js";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export interface UseDragDropOptions {
  items: string[];
  onReorder?: (items: string[]) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: (activeId: string, overId: string | null) => void;
}

export function useDragDrop(options: UseDragDropOptions) {
  const [items, setItems] = createSignal<string[]>(options.items);
  const [activeId, setActiveId] = createSignal<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    options.onDragStart?.(id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeStr = active.id as string;
    const overStr = over.id as string;

    if (activeStr !== overStr) {
      setItems(prev => {
        const oldIndex = prev.indexOf(activeStr);
        const newIndex = prev.indexOf(overStr);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeStr = active.id as string;
    const overStr = over?.id as string | null;

    setActiveId(null);
    
    if (over && activeStr !== overStr) {
      const newItems = items();
      setItems(newItems);
      options.onReorder?.(newItems);
    }
    
    options.onDragEnd?.(activeStr, overStr);
  };

  const resetItems = (newItems: string[]) => {
    setItems(newItems);
  };

  return {
    items,
    activeId,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    resetItems,
  };
}
