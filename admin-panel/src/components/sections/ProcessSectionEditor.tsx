import React from 'react';

interface ProcessStep {
  number: number;
  title: string;
  description: string;
  duration: string;
}

interface ProcessSectionData {
  sectionTitle: string;
  subtitle: string;
  steps: ProcessStep[];
}

interface Props {
  data: ProcessSectionData;
  onChange: (data: ProcessSectionData) => void;
}

const ProcessSectionEditor: React.FC<Props> = ({ data, onChange }) => {
  const updateStep = (index: number, field: keyof ProcessStep, value: string | number) => {
    const updated = [...data.steps];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, steps: updated });
  };

  const addStep = () => {
    onChange({
      ...data,
      steps: [...data.steps, { number: data.steps.length + 1, title: '', description: '', duration: '' }]
    });
  };

  const removeStep = (index: number) => {
    onChange({
      ...data,
      steps: data.steps.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Заголовок секции
          </label>
          <input
            type="text"
            value={data.sectionTitle}
            onChange={(e) => onChange({ ...data, sectionTitle: e.target.value })}
            placeholder="Как проходит программа"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Подзаголовок
          </label>
          <input
            type="text"
            value={data.subtitle}
            onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
            placeholder="Пошаговый путь..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Steps List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-800">Этапы процесса ({data.steps.length})</h4>
          <button
            type="button"
            onClick={addStep}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
          >
            + Добавить
          </button>
        </div>

        <div className="space-y-4">
          {data.steps.map((step, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-600">Этап #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Удалить
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Номер</label>
                  <input
                    type="number"
                    value={step.number}
                    onChange={(e) => updateStep(index, 'number', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-center font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Длительность</label>
                  <input
                    type="text"
                    value={step.duration}
                    onChange={(e) => updateStep(index, 'duration', e.target.value)}
                    placeholder="1-2 дня"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Заголовок</label>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateStep(index, 'title', e.target.value)}
                    placeholder="Диагностика и анализ"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Описание</label>
                  <textarea
                    value={step.description}
                    onChange={(e) => updateStep(index, 'description', e.target.value)}
                    placeholder="Комплексное обследование..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="border-t pt-6">
        <h4 className="font-semibold text-gray-800 mb-4">Предпросмотр</h4>
        <div className="bg-white p-8 rounded-lg border border-gray-200">
          <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">{data.sectionTitle}</h2>
          <p className="text-lg text-center mb-8 text-gray-600">{data.subtitle}</p>
          <div className="space-y-6">
            {data.steps.map((step, index) => (
              <div key={index} className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {step.number}
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{step.title}</h3>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {step.duration}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessSectionEditor;
