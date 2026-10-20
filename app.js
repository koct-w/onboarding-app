// Ссылка на вашу опубликованную таблицу (формат CSV для листов "Трекер" и "План")
const masterUrl = `https://google.com`;
const templateUrl = `https://google.com`;

// Простая функция для разделения текста CSV строки с учетом кавычек
function parseCSV(text) {
    let lines = text.split('\n');
    return lines.map(line => {
        let result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            let char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    });
}

async function initApp() {
    try {
        // 1. ПОЛУЧАЕМ ДАННЫЕ О СОТРУДНИКЕ (Лист "Трекер")
        const masterResponse = await fetch(masterUrl);
        const masterText = await masterResponse.text();
        const masterRows = parseCSV(masterText);
        
        // Берем строку №5 (в массиве индексов это строка 4, так как отсчет с 0) — Колегова Т.Е.
        // Столбцы: Индекс 1 (B) - ФИО, Индекс 2 (C) - Должность, Индекс 3 (D) - Филиал, Индекс 9 (J) - Прогресс ИС
        const employeeRow = masterRows[4]; 

        if (employeeRow) {
            const name = employeeRow[1] || "Не указано";
            const role = employeeRow[2] || "Не указано";
            const branch = employeeRow[3] || "Не указано";
            const progress = employeeRow[9] || "0%"; 

            // Выводим данные в шапку приложения
            document.getElementById('user-name').innerText = name;
            document.getElementById('user-role').innerText = role;
            document.getElementById('user-branch').innerText = branch;
            document.getElementById('progress-val').innerText = progress;
            document.getElementById('progress-fill').style.width = progress.includes('%') ? progress : progress + '%';
        }

        // 2. ПОЛУЧАЕМ ШАБЛОН ЗАДАЧ (Лист "План адаптации новый")
        const templateResponse = await fetch(templateUrl);
        const templateText = await templateResponse.text();
        const templateRows = parseCSV(templateText);
        
        const tasksListContainer = document.getElementById('tasks-list');
        tasksListContainer.innerHTML = "";

        // Идем по строкам шаблона задач (начиная с 9-й строки — индекс 8)
        templateRows.forEach((row, index) => {
            if (index >= 8 && row.length > 4) { 
                // Столбцы: Индекс 0 или 1 (A/B) - Этап, Индекс 2 (C) - Дедлайн, Индекс 4 (E) - Задача, Индекс 5 (F) - Ссылка/Результат
                const taskStage = row[1] || row[0] || "Этап";
                const taskDeadline = row[2] || "В процессе ИС";
                const taskTitle = row[4] || "";
                const taskResultField = row[5] || ""; 

                // Пропускаем пустые строки интерфейса
                if (!taskTitle || taskTitle === "Описание задачи" || taskTitle.trim() === "") return;

                // Создаем карточку задачи
                const taskCard = document.createElement('div');
                taskCard.className = "task-card";
                
                // Проверяем, есть ли ссылка на Tilda-опрос или чат
                let actionBtn = "";
                if (taskResultField.includes('http')) {
                    actionBtn = `<a href="${taskResultField}" target="_blank" class="task-btn">✍️ Пройти опрос / Перейти по ссылке</a>`;
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
        console.error("Ошибка синхронизации:", error);
        document.getElementById('user-name').innerText = "Ошибка разбора таблицы";
    }
}

// Старт приложения
initApp();
