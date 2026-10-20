// ID вашей опубликованной таблицы "Трекер 2.0"
const SHEET_PUBLIC_ID = "1aDMcM7AybCH8k-4_98jetqRKeS2UyMtdoYFZPyOjbEs";

// Запросы к конкретным вкладкам через родной API Google, который обходит любые блокировки браузера
const masterUrl = `https://google.com{SHEET_PUBLIC_ID}/gviz/tq?sheet=Трекер&tqx=out:json`;
const templateUrl = `https://google.com{SHEET_PUBLIC_ID}/gviz/tq?sheet=План+адаптации+новый&tqx=out:json`;

// Вспомогательная функция для безопасного скачивания и очистки JSON от Google
async function fetchGoogleSheet(url) {
    const response = await fetch(url);
    const text = await response.text();
    // Очищаем служебный текст Google "/*O_o*/ google.visualization.Query.setResponse(...)"
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    const jsonString = text.substring(startIdx, endIdx + 1);
    return JSON.parse(jsonString);
}

async function initApp() {
    try {
        // 1. ЧИТАЕМ ДАННЫЕ О СОТРУДНИКЕ (Лист "Трекер")
        const masterData = await fetchGoogleSheet(masterUrl);
        const rows = masterData.table.rows;

        // Делаем базовые значения на случай, если нужная строка сместилась
        let name = "Колегова Татьяна Евгеньевна";
        let role = "Врач-кардиолог";
        let branch = "Филиал не указан";
        let progress = "55%";

        // Ищем строку Татьяны Евгеньевны в таблице
        const employeeRow = rows.find(row => {
            return row.c && row.c[1] && row.c[1].v && String(row.c[1].v).includes("Колегова");
        });

        if (employeeRow && employeeRow.c) {
            name = employeeRow.c[1]?.v || name;
            role = employeeRow.c[2]?.v || role;
            branch = employeeRow.c[3]?.v || branch;
            progress = employeeRow.c[9]?.v || progress;
        }

        // Выводим данные в синюю шапку приложения
        document.getElementById('user-name').innerText = name;
        document.getElementById('user-role').innerText = role;
        document.getElementById('user-branch').innerText = branch;
        document.getElementById('progress-val').innerText = progress;
        document.getElementById('progress-fill').style.width = String(progress).includes('%') ? progress : progress + '%';

        // 2. ЧИТАЕМ И ВЫВОДИМ ЗАДАЧИ (Лист "План адаптации новый")
        const templateData = await fetchGoogleSheet(templateUrl);
        const taskRows = templateData.table.rows;
        
        const tasksListContainer = document.getElementById('tasks-list');
        tasksListContainer.innerHTML = "";

        // Перебираем строки шаблона задач (начиная с 9-й строки таблицы — индекс 8)
        taskRows.forEach((row, index) => {
            if (index >= 8 && row.c) {
                // Извлекаем ячейки по столбцам: A/B (индекс 0/1) - Этап, C (индекс 2) - Дедлайн, E (индекс 4) - Описание, F (индекс 5) - Ссылка
                const taskStage = row.c[0]?.v || row.c[1]?.v || "Этап";
                const taskDeadline = row.c[2]?.v || "В процессе ИС";
                const taskTitle = row.c[4]?.v || "";
                const taskResultField = row.c[5]?.v || "";

                // Отсекаем пустые блоки
                if (!taskTitle || taskTitle === "Описание задачи" || String(taskTitle).trim() === "") return;

                // Создаем карточку задачи
                const taskCard = document.createElement('div');
                taskCard.className = "task-card";
                
                // Проверяем наличие ссылки (Tilda, чаты и т.д.)
                let actionBtn = "";
                if (taskResultField && String(taskResultField).includes('http')) {
                    actionBtn = `<a href="${taskResultField}" target="_blank" class="task-btn">✍️ Перейти по ссылке / Опрос</a>`;
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
        console.error("Ошибка:", error);
        document.getElementById('user-name').innerText = "Ошибка синхронизации данных";
        document.getElementById('user-role').innerText = "Проверьте соединение с сетью";
    }
}

// Запуск приложения
initApp();
