import React, { useState } from 'react';
import FeaturesSectionEditor from './FeaturesSectionEditor';
import ProblemsSectionEditor from './ProblemsSectionEditor';
import AboutSectionEditor from './AboutSectionEditor';
import StepsSectionEditor from './StepsSectionEditor';
import ProcessSectionEditor from './ProcessSectionEditor';
import StatsSectionEditor from './StatsSectionEditor';

interface ModalProps {
  sectionType: string;
  data: any;
  onSave: (data: any) => void;
  onClose: () => void;
}

const SectionEditorModal: React.FC<ModalProps> = ({ sectionType, data, onSave, onClose }) => {
  const [localData, setLocalData] = useState(data);

  const handleSave = () => {
    onSave(localData);
    onClose();
  };

  const renderEditor = () => {
    switch (sectionType) {
      case 'features':
        return <FeaturesSectionEditor data={localData} onChange={setLocalData} />;
      case 'problems':
        return <ProblemsSectionEditor data={localData} onChange={setLocalData} />;
      case 'about':
        return <AboutSectionEditor data={localData} onChange={setLocalData} />;
      case 'steps':
        return <StepsSectionEditor data={localData} onChange={setLocalData} />;
      case 'process':
        return <ProcessSectionEditor data={localData} onChange={setLocalData} />;
      case 'stats':
        return <StatsSectionEditor data={localData} onChange={setLocalData} />;
      default:
        return <div>Редактор не найден</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Редактировать секцию: {sectionType}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderEditor()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionEditorModal;
