import React from 'react';

interface Stat {
  value: string;
  label: string;
  description: string;
}

interface StatsSectionData {
  sectionTitle: string;
  stats: Stat[];
}

interface Props {
  data: StatsSectionData;
  onChange: (data: StatsSectionData) => void;
}

const StatsSectionEditor: React.FC<Props> = ({ data, onChange }) => {
  const updateStat = (index: number, field: keyof Stat, value: string) => {
    const updated = [...data.stats];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, stats: updated });
  };

  const addStat = () => {
    onChange({
      ...data,
      stats: [...data.stats, { value: '', label: '', description: '' }]
    });
  };

  const removeStat = (index: number) => {
    onChange({
      ...data,
      stats: data.stats.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Заголовок секции
        </label>
        <input
          type="text"
          value={data.sectionTitle}
          onChange={(e) => onChange({ ...data, sectionTitle: e.target.value })}
          placeholder="Результаты наших клиентов"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Stats List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-800">Статистика ({data.stats.length})</h4>
          <button
            type="button"
            onClick={addStat}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
          >
            + Добавить
          </button>
        </div>

        <div className="space-y-4">
          {data.stats.map((stat, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-600">Показатель #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeStat(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Удалить
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Значение</label>
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => updateStat(index, 'value', e.target.value)}
                      placeholder="-7 лет"
                      className="w-full px-3 py-2 border border-gray-300 rounded font-bold text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Метка</label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => updateStat(index, 'label', e.target.value)}
                      placeholder="Биологический возраст"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Описание</label>
                  <input
                    type="text"
                    value={stat.description}
                    onChange={(e) => updateStat(index, 'description', e.target.value)}
                    placeholder="В среднем наши клиенты..."
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
        <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white p-8 rounded-lg">
          <h2 className="text-3xl font-bold text-center mb-10">{data.sectionTitle}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {data.stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl md:text-6xl font-bold mb-2">{stat.value}</div>
                <div className="text-xl font-semibold mb-2 opacity-90">{stat.label}</div>
                <p className="text-sm opacity-80">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSectionEditor;
