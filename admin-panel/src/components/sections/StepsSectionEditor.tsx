import React from 'react';
import ImageUpload from '../ImageUpload';

interface Step {
  title: string;
  description: string;
  image?: string;
}

interface StepsSectionData {
  sectionTitle: string;
  subtitle: string;
  steps: Step[];
}

interface Props {
  data: StepsSectionData;
  onChange: (data: StepsSectionData) => void;
}

const StepsSectionEditor: React.FC<Props> = ({ data, onChange }) => {
  const updateStep = (index: number, field: keyof Step, value: string) => {
    const updated = [...data.steps];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, steps: updated });
  };

  const addStep = () => {
    onChange({
      ...data,
      steps: [...data.steps, { title: '', description: '', image: '' }]
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
            placeholder="4 ступени системы Сеплица"
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
            placeholder="Холистический подход..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Steps List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-800">Ступени ({data.steps.length})</h4>
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
                <span className="text-sm font-medium text-gray-600">Ступень #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Удалить
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Заголовок</label>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateStep(index, 'title', e.target.value)}
                    placeholder="1. Зарядка долголетия"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Описание</label>
                  <textarea
                    value={step.description}
                    onChange={(e) => updateStep(index, 'description', e.target.value)}
                    placeholder="33 упражнения за 25 минут..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                <ImageUpload
                  currentUrl={step.image}
                  onUrlChange={(url) => updateStep(index, 'image', url)}
                  label="Изображение (опционально)"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="border-t pt-6">
        <h4 className="font-semibold text-gray-800 mb-4">Предпросмотр</h4>
        <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
          <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">{data.sectionTitle}</h2>
          <p className="text-lg text-center mb-8 text-gray-600">{data.subtitle}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.steps.map((step, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg">
                {step.image && (
                  <img src={step.image} alt={step.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-5">
                  <div className="text-xs font-bold text-purple-600 mb-2">СТУПЕНЬ {index + 1}</div>
                  <h3 className="text-lg font-bold mb-2 text-gray-800">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepsSectionEditor;
