import React from 'react';

interface Problem {
  number: string;
  title: string;
  description: string;
  modalId?: number;
}

interface ProblemsSectionData {
  sectionTitle: string;
  subtitle: string;
  problems: Problem[];
}

interface Props {
  data: ProblemsSectionData;
  onChange: (data: ProblemsSectionData) => void;
}

const ProblemsSectionEditor: React.FC<Props> = ({ data, onChange }) => {
  const updateProblem = (index: number, field: keyof Problem, value: string) => {
    const updated = [...data.problems];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, problems: updated });
  };

  const addProblem = () => {
    const nextNumber = String(data.problems.length + 1).padStart(2, '0');
    onChange({
      ...data,
      problems: [...data.problems, { number: nextNumber, title: '', description: '' }]
    });
  };

  const removeProblem = (index: number) => {
    onChange({
      ...data,
      problems: data.problems.filter((_, i) => i !== index)
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
            placeholder="Сеплица стирает возрастные признаки"
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
            placeholder="От 20 до 40 минут в день..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Problems List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-800">Проблемы ({data.problems.length})</h4>
          <button
            type="button"
            onClick={addProblem}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
          >
            + Добавить
          </button>
        </div>

        <div className="space-y-4">
          {data.problems.map((problem, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-600">Проблема #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeProblem(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Удалить
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Номер</label>
                  <input
                    type="text"
                    value={problem.number}
                    onChange={(e) => updateProblem(index, 'number', e.target.value)}
                    placeholder="01"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-center font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Заголовок</label>
                  <input
                    type="text"
                    value={problem.title}
                    onChange={(e) => updateProblem(index, 'title', e.target.value)}
                    placeholder="Отеки и птоз лица"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Модальное окно</label>
                  <input
                    type="number"
                    value={problem.modalId ?? ''}
                    onChange={(e) => updateProblem(index, 'modalId' as keyof Problem, e.target.value ? String(Number(e.target.value)) : '')}
                    placeholder="0, 1, 2..."
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    min="0"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">Описание</label>
                <textarea
                  value={problem.description}
                  onChange={(e) => updateProblem(index, 'description', e.target.value)}
                  placeholder="Отек лица, обвисшее верхнее веко..."
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
        <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
          <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">{data.sectionTitle}</h2>
          <p className="text-lg text-center mb-8 text-gray-600">{data.subtitle}</p>
          <div className="grid md:grid-cols-2 gap-6">
            {data.problems.map((problem, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {problem.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-gray-800">{problem.title}</h3>
                    <p className="text-gray-600 text-sm">{problem.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemsSectionEditor;
