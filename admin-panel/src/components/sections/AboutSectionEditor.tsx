import React from 'react';

interface Achievement {
  icon: string;
  title: string;
  description: string;
}

interface AboutSectionData {
  sectionTitle: string;
  name: string;
  bio: string;
  photo: string;
  achievements: Achievement[];
}

interface Props {
  data: AboutSectionData;
  onChange: (data: AboutSectionData) => void;
}

const AboutSectionEditor: React.FC<Props> = ({ data, onChange }) => {
  const updateAchievement = (index: number, field: keyof Achievement, value: string) => {
    const updated = [...data.achievements];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, achievements: updated });
  };

  const addAchievement = () => {
    onChange({
      ...data,
      achievements: [...data.achievements, { icon: '🎓', title: '', description: '' }]
    });
  };

  const removeAchievement = (index: number) => {
    onChange({
      ...data,
      achievements: data.achievements.filter((_, i) => i !== index)
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
          placeholder="Обо мне"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Author Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Имя
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="Алексей Пинаев"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL фото
          </label>
          <input
            type="text"
            value={data.photo}
            onChange={(e) => onChange({ ...data, photo: e.target.value })}
            placeholder="http://..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Биография
        </label>
        <textarea
          value={data.bio}
          onChange={(e) => onChange({ ...data, bio: e.target.value })}
          placeholder="Меня зовут..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Achievements */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-800">Достижения ({data.achievements.length})</h4>
          <button
            type="button"
            onClick={addAchievement}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
          >
            + Добавить
          </button>
        </div>

        <div className="space-y-4">
          {data.achievements.map((achievement, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-600">Достижение #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeAchievement(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Удалить
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Иконка</label>
                  <input
                    type="text"
                    value={achievement.icon}
                    onChange={(e) => updateAchievement(index, 'icon', e.target.value)}
                    placeholder="🎓"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-center text-2xl"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Заголовок</label>
                  <input
                    type="text"
                    value={achievement.title}
                    onChange={(e) => updateAchievement(index, 'title', e.target.value)}
                    placeholder="Образование"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">Описание</label>
                <input
                  type="text"
                  value={achievement.description}
                  onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                  placeholder="Международный институт..."
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
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">{data.sectionTitle}</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              {data.photo && (
                <img src={data.photo} alt={data.name} className="w-full rounded-2xl shadow-xl" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">{data.name}</h3>
              <p className="text-gray-600 mb-6 whitespace-pre-line">{data.bio}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {data.achievements.map((achievement, index) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <h4 className="font-bold text-sm mb-1 text-gray-800">{achievement.title}</h4>
                    <p className="text-gray-600 text-xs">{achievement.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSectionEditor;
