# 🎓 Создание Rejuvena Old App (курсы с Azure)

## Архитектура

Отдельный сайт для старых пользователей с курсами от Azure API:

```
https://seplitza.github.io/rejuvena/          → Новое приложение (упражнения + марафоны)
https://seplitza.github.io/Rejuvena_old_app/  → Старое приложение (курсы Azure)
```

## Шаги создания

### 1. Создать репозиторий на GitHub

```bash
# Зайти на https://github.com/seplitza
# Нажать "New repository"
# Repository name: Rejuvena_old_app
# Description: Rejuvena Old App with Azure courses (version 1.0)
# Public ✅
# Create repository
```

### 2. Подготовить код локально

```bash
cd /Users/alexeipinaev/Documents/Rejuvena

# Клонировать текущий frontend
git clone https://github.com/sgit clone https://github.com/sgit clone https://github.com/sgit clone https://github.coсии 1.1.0 (с курсами Azure)
git checkout v1.1.0-stable
git checkout v1.1.0-sta�р�git checkout v1.1.0-sta�р�git checkout v1.1.0-sta�р�git checkout v1.1.0-sta�р�git checkout v1.1.0-sta�рhub.comgit checkout v1.1.0-sta�р�git checkout v1.1.0-sta�р�git cjson name
sed -i '' 's/"name": "rejuvena"/"name": "rejuvena-old-app"/' package.json

# Обновить homepage для GitHub Pages
sed -i '' 's|"homepage": "https://seplitza.github.io/rejuvena"|"homepased -i '' 's|"homepage": "https://seplitza.github.io/package.json

# Первый коммит
git add -A
git cogit cogit cogit cogit cogit uvengit cogit cogit cogit cogit cogites"git cogit cogit cogit cogit cogit uvengit cogit cogit cogit coт�git cogit citgit cogit cogit sh
# В �# В �# В �# В �# В �# В �# В �# В �# В �# Вges → Source: gh-pages branch → Save
```

### 4. Задеплоить

```bash
cd /Users/alexeipinaev/Documents/Rejuvena/Rejuvena_old_app

# Убедиться что .env.production настроен на Azure
cat .env.production
# Должно быть:# Должно �PI_URL=http# Должно быть:# Должно �PI_URL=http# Должно быть:# Должно �PI_URL=http# Должно быть:# Должно �PI_URL=http# Должно быть:# Должно �PI_URL=http# �Dep# Должно быть:# Должно �PI_URL=http# Должно бы бу# Должно быть:# Должно �PI_URLza# Должно быть:# Должно �PI_URL=http# Должно быть:# Должно �PI_URL=http# Должно быть:# До``jav# Должно быть:#  {# Долath: process.env.NODE_ENV === 'production' ? '/Rejuvena_old_app' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Rejuvena_old_app' : '',
  output: 'export',
                                                                                                   `json
{{{{{{{{{{{{{{{{{{{{{{{{{{{pp"{{{{{{om{{{{{{{{{{{{{{{{{{{{{{{{{{{pp"{{{{{{om{{{{{{{{{{{{{{{{
  "sc  "sc  "sc  "sc  "sc  "sc  "ev",
    "build": "next build",
    "start": "next start",
    "export": "next export"
  }
}
```

## Что делать пользователям

### Старые пользователи (с Azure аккаунтами):
👉 Используют: https://seplitza.github.io/Rejuvena_old_app/
- Вход через Azure API
- Доступ к купленным курсам
- Старый дизайн и функционал

### Новые пользователи:
👉 Используют: https://seplitza.github.io/rejuvena/
- Вход через новый API
- Упражнения и марафоны
- Новый функционал (фото дневник, оплата)

################################################################################d ##################о################################################################################d ##################о� �################################################################################d ########жно настроить автодеп�########################b/w######################me: D#####################

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    r    r    r    r    r    r    r    r    r    r    r    r    r    r    r   - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions      - uses: peaceiris/actions      - uses: pean: ${      - uses: peaceiris/actions      - li      - uses: peaceiris/actions      - uses: peaceiris/actions��      - uses: peaceiris/actions   �б      - uses: peaceiris/actions      - � Н      - uses: peaceiris/actions      - uses: peaceiris/actions      - нкционал  
✅ Код не смешивается между версиями  
✅ Независимый деплой и обновления  
