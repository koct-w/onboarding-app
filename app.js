// Прямые ссылки на CSV-выгрузку ваших опубликованных листов
const masterUrl = `https://google.com`;
const templateUrl = `https://google.com`;

// Простой и надежный разбор CSV от Google по строкам и ячейкам
function parseCSV(text) {
    // Разделяем текст по обычным переносам строк
    let lines = text.split('\n');
    return lines.map(line => {
        let result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            let char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes; // Пропускаем кавычки внутри текста
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }).filter(row => row.length > 0 && row[0] !== '');
}

async function initApp() {
    try {
        // 1. ЧИТАЕМ ДАННЫЕ О СОТРУДНИКЕ (Лист "Трекер")
        const masterResponse = await fetch(masterUrl);
        const masterText = await masterResponse.text();
        const masterRows = parseCSV(masterText);
        
        // Стандартные значения на случай, если таблица еще не до конца прочиталась
        let name = "Колегова Татьяна Евгеньевна";
        let role = "Врач-кардиолог";
        let branch = "Филиал не указан";
        let progress = "55%";

        // Ищем строку, в которой написано "Колегова"
        const targetRow = masterRows.find(row => row.some(cell => cell.includes("Колегова")));
        
        if (targetRow) {
            // Google Таблицы: Колонки идут как массив [0, 1, 2, 3...]
            // Индекс 1 - ФИО (B), Индекс 2 - Должность (C), Индекс 3 - Филиал (D), Индекс 9 - Прогресс (J)
            name = targetRow[1] || name;
            role = targetRow[2] || role;
            branch = targetRow[3] || branch;
            progress = targetRow[9] || progress;
        }

        // Выводим информацию в синюю шапку приложения
        document.getElementById('user-name').innerText = name;
        document.getElementById('user-role').innerText = role;
        document.getElementById('user-branch').innerText = branch;
        document.getElementById('progress-val').innerText = progress;
        document.getElementById('progress-fill').style.width = progress.includes('%') ? progress : progress + '%';

        // 2. ЧИТАЕМ И ВЫВОДИМ ЗАДАЧИ (Лист "План адаптации новый")
        const templateResponse = await fetch(templateUrl);
        const templateText = await templateResponse.text();
        const templateRows = parseCSV(templateText);
        
        const tasksListContainer = document.getElementById('tasks-list');
        tasksListContainer.innerHTML = "";

        // Перебираем строки плана адаптации
        templateRows.forEach((row, index) => {
            // Пропускаем верхние технические строчки, читаем содержательную часть
            if (index >= 4 && row.length > 4) { 
                // Индекс 0 - Этап, Индекс 2 - Дедлайн, Индекс 4 - Задача, Индекс 5 - Результат/Ссылка
                const taskStage = row[0] || "Этап";
                const taskDeadline = row[2] || "В процессе ИС";
                const taskTitle = row[4] || "";
                const taskResultField = row[5] || "";

                // Отсекаем пустые блоки и технические заголовки столбцов
                if (!taskTitle || 
                    taskTitle.includes("Описание задачи") || 
                    taskTitle.trim() === "" || 
                    taskTitle.length < 5) return;

                // Создаем красивую карточку шага адаптации
                const taskCard = document.createElement('div');
                taskCard.className = "task-card";
                
                // Если в поле результата есть ссылка (например на Tilda), создаем кнопку
                let actionBtn = "";
                if (taskResultField && taskResultField.includes('http')) {
                    actionBtn = `<a href="${taskResultField}" target="_blank" class="task-btn">✍️ Перейти к заполнению / Ссылка</a>`;
                }

                taskCard.innerHTML = `
                    <div class="task-meta">
                        <span>📌 ${taskStage}</span>
                        <span>⏱ ${taskDeadline}</span>
                    </div>
                    <div class="task-title">${taskTitle}</div>
                    ${actionBtn}
                `;
                tasksListContainer.appendChild(taskCard);
            }
        });

    } catch (error) {
        console.error("Критическая ошибка:", error);
        document.getElementById('user-name').innerText = "Ошибка загрузки структуры";
    }
}

// Запуск системы
initApp();
