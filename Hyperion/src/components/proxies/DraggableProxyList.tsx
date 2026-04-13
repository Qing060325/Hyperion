// ==========================================
// DraggableProxyList - Sortable Proxy List
// ==========================================

import { For, Show } from "solid-js";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-solid";
import type { ProxyInfo } from "../../types/clash";
import DraggableProxyCard from "./DraggableProxyCard";

interface DraggableProxyListProps {
  proxies: ProxyInfo[];
  groupName: string;
  onReorder: (proxies: ProxyInfo[]) => void;
  onSelect: (name: string) => void;
  onTestDelay: (name: string) => void;
  selectedProxy?: string;
  sortable?: boolean;
}

interface SortableItemProps {
  proxy: ProxyInfo;
  onSelect: (name: string) => void;
  onTestDelay: (name: string) => void;
  isSelected: boolean;
}

function SortableItem(props: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.proxy.name });

  const style = () => ({
    transform: CSS.Transform.toString(transform()),
    transition,
    opacity: isDragging() ? 0.5 : 1,
    zIndex: isDragging() ? 50 : 1,
  });

  return (
    <div ref={setNodeRef} style={style()}>
      <div class="flex items-center gap-1">
        <div
          {...attributes}
          {...listeners}
          class="cursor-grab active:cursor-grabbing p-1 text-base-content/30 hover:text-base-content/60"
        >
          <GripVertical class="w-4 h-4" />
        </div>
        <div class="flex-1">
          <DraggableProxyCard
            proxy={props.proxy}
            isSelected={props.isSelected}
            onSelect={() => props.onSelect(props.proxy.name)}
            onTestDelay={() => props.onTestDelay(props.proxy.name)}
          />
        </div>
      </div>
    </div>
  );
}

export default function DraggableProxyList(props: DraggableProxyListProps) {
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

  const [activeId, setActiveId] = createSignal<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = props.proxies.findIndex(p => p.name === active.id);
      const newIndex = props.proxies.findIndex(p => p.name === over.id);

      const newProxies = [...props.proxies];
      const [removed] = newProxies.splice(oldIndex, 1);
      newProxies.splice(newIndex, 0, removed);

      props.onReorder(newProxies);
    }

    setActiveId(null);
  };

  const activeProxy = () => {
    const id = activeId();
    return id ? props.proxies.find(p => p.name === id) : null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={props.proxies.map(p => p.name)}
        strategy={verticalListSortingStrategy}
      >
        <div class="space-y-2">
          <For each={props.proxies}>
            {(proxy) => (
              <SortableItem
                proxy={proxy}
                isSelected={props.selectedProxy === proxy.name}
                onSelect={props.onSelect}
                onTestDelay={props.onTestDelay}
              />
            )}
          </For>
        </div>
      </SortableContext>

      <DragOverlay>
        <Show when={activeProxy()}>
          <div class="opacity-90">
            <DraggableProxyCard
              proxy={activeProxy()!}
              isSelected={false}
              onSelect={() => {}}
              onTestDelay={() => {}}
            />
          </div>
        </Show>
      </DragOverlay>
    </DndContext>
  );
}

// Import createSignal for the activeId
import { createSignal } from "solid-js";
