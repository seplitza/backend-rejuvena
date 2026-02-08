import React from 'react';

interface Feature {
  icon: string;
  title: string;
  description: string;
  modalId?: number;
}

interface FeaturesSectionData {
  sectionTitle: string;
  subtitle: string;
  features: Feature[];
}

interface Props {
  data: FeaturesSectionData;
  onChange: (data: FeaturesSectionData) => void;
}

const FeaturesSectionEditor: React.FC<Props> = ({ data, onChange }) => {
  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    const updated = [...data.features];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, features: updated });
  };

  const addFeature = () => {
    onChange({
      ...data,
      features: [...data.features, { icon: '✨', title: '', description: '' }]
    });
  };

  const removeFeature = (index: number) => {
    onChange({
      ...data,
      features: data.features.filter((_, i) => i !== index)
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
            placeholder="Что такое система Сеплица?"
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
            placeholder="4 ступени погружения..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Features List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-800">Преимущества ({data.features.length})</h4>
          <button
            type="button"
            onClick={addFeature}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
          >
            + Добавить
          </button>
        </div>

        <div className="space-y-4">
          {data.features.map((feature, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-600">Преимущество #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Удалить
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Иконка (emoji)</label>
                  <input
                    type="text"
                    value={feature.icon}
                    onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                    placeholder="🏃"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-center text-2xl"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Заголовок</label>
                  <input
                    type="text"
                    value={feature.title}
                    onChange={(e) => updateFeature(index, 'title', e.target.value)}
                    placeholder="Забота о теле"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Модальное окно</label>
                  <input
                    type="number"
                    value={feature.modalId ?? ''}
                    onChange={(e) => updateFeature(index, 'modalId' as keyof Feature, e.target.value ? String(Number(e.target.value)) : '')}
                    placeholder="0, 1, 2..."
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Индекс модального окна (0=первое)</p>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">Описание</label>
                <textarea
                  value={feature.description}
                  onChange={(e) => updateFeature(index, 'description', e.target.value)}
                  placeholder="Зарядка долголетия за 25 минут..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {data.features.map((feature, index) => (
              <div key={index} className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-bold mb-2 text-gray-800">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSectionEditor;
