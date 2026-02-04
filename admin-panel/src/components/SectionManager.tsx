import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface SectionConfig {
  id: string;
  type: 'hero' | 'features' | 'problems' | 'about' | 'steps' | 'process' | 'stats' | 'marathons' | 'benefits' | 'testimonials' | 'resultsGallery' | 'testimonialsGallery';
  title: string;
  isVisible: boolean;
  isRequired?: boolean; // hero и marathons обязательные
  icon: string;
}

interface SortableItemProps {
  section: SectionConfig;
  onToggleVisibility: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ section, onToggleVisibility, onEdit, onDuplicate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-4 rounded-lg border-2 transition-all
        ${isDragging ? 'border-purple-400 bg-purple-50 shadow-lg' : 'border-gray-200 bg-white'}
        ${!section.isVisible ? 'opacity-50' : ''}
      `}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-move text-gray-400 hover:text-gray-600"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Section Info */}
      <div className="flex-1 flex items-center gap-3">
        <span className="text-2xl">{section.icon}</span>
        <div>
          <div className="font-medium text-gray-800">
            {section.title}
            {section.isRequired && (
              <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                обязательный
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {section.type}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Visibility Toggle */}
        <button
          type="button"
          onClick={() => onToggleVisibility(section.id)}
          className={`
            p-2 rounded-lg transition
            ${section.isVisible
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }
          `}
          title={section.isVisible ? 'Скрыть блок' : 'Показать блок'}
        >
          {section.isVisible ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          )}
        </button>

        {/* Edit Button */}
        <button
          type="button"
          onClick={() => onEdit(section.id)}
          className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
          title="Редактировать блок"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Duplicate Button */}
        <button
          type="button"
          onClick={() => onDuplicate(section.id)}
          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
          title="Копировать блок"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

interface SectionManagerProps {
  sections: SectionConfig[];
  onSectionsChange: (sections: SectionConfig[]) => void;
  onEditSection: (sectionId: string) => void;
}

const SectionManager: React.FC<SectionManagerProps> = ({
  sections,
  onSectionsChange,
  onEditSection
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((item) => item.id === active.id);
      const newIndex = sections.findIndex((item) => item.id === over.id);
      
      onSectionsChange(arrayMove(sections, oldIndex, newIndex));
    }
  };

  const toggleVisibility = (sectionId: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, isVisible: !section.isVisible }
        : section
    );
    onSectionsChange(updatedSections);
  };

  const handleDuplicate = (sectionId: string) => {
    const sectionToDuplicate = sections.find(s => s.id === sectionId);
    if (!sectionToDuplicate) return;

    const timestamp = Date.now();
    const duplicatedSection: SectionConfig = {
      ...sectionToDuplicate,
      id: `${sectionToDuplicate.id}-copy-${timestamp}`,
      title: `${sectionToDuplicate.title} (копия)`,
      isRequired: false, // Копии не могут быть обязательными
    };

    // Вставляем копию сразу после оригинала
    const originalIndex = sections.findIndex(s => s.id === sectionId);
    const newSections = [...sections];
    newSections.splice(originalIndex + 1, 0, duplicatedSection);
    
    onSectionsChange(newSections);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📋 Управление блоками лендинга
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Перетаскивайте блоки для изменения порядка. Скрывайте/показывайте ненужные секции.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableItem
                key={section.id}
                section={section}
                onToggleVisibility={toggleVisibility}
                onEdit={onEditSection}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Совет:</strong> Первый экран (Hero) и Марафоны всегда видны и находятся в начале/конце.
          Остальные блоки можно свободно перемещать и скрывать.
        </p>
      </div>
    </div>
  );
};

export default SectionManager;
