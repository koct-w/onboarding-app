// ID вашей опубликованной таблицы "Трекер 2.0"
const SHEET_PUBLIC_ID = "1aDMcM7AybCH8k-4_98jetqRKeS2UyMtdoYFZPyOjbEs";

// Ссылки на конкретные листы внутри вашего документа
const masterUrl = `https://google.com{SHEET_PUBLIC_ID}/gviz/tq?sheet=Трекер&tqx=out:json`;
const templateUrl = `https://google.com{SHEET_PUBLIC_ID}/gviz/tq?sheet=План+адаптации+новый&tqx=out:json`;

async function initApp() {
    try {
        // 1. ПОЛУЧАЕМ ДАННЫЕ О СОТРУДНИКЕ (Лист "Трекер")
        const masterResponse = await fetch(masterUrl);
        const masterText = await masterResponse.text();
        const masterData = JSON.parse(masterText.substr(47).slice(0, -2));
        
        const rows = masterData.table.rows;
        
        // В качестве шаблона берем строку №5 — Колегова Т.Е. (в массиве данных это индекс 4)
        // Маппинг колонок листа "Трекер": B - ФИО, C - Должность, D - Филиал, J - Прогресс ИС
        const employeeRow = rows[4]; 

        const name = employeeRow.c[1]?.v || "Не указано";
        const role = employeeRow.c[2]?.v || "Не указано";
        const branch = employeeRow.c[3]?.v || "Не указано";
        const progress = employeeRow.c[9]?.v || "0%"; 

        // Выводим данные в шапку приложения
        document.getElementById('user-name').innerText = name;
        document.getElementById('user-role').innerText = role;
        document.getElementById('user-branch').innerText = branch;
        document.getElementById('progress-val').innerText = progress;
        document.getElementById('progress-fill').style.width = progress;

        // 2. ПОЛУЧАЕМ ШАБЛОН ЗАДАЧ (Лист "План адаптации новый")
        const templateResponse = await fetch(templateUrl);
        const templateText = await templateResponse.text();
        const templateData = JSON.parse(templateText.substr(47).slice(0, -2));
        
        const taskRows = templateData.table.rows;
        const tasksListContainer = document.getElementById('tasks-list');
        tasksListContainer.innerHTML = "";

        // Идем по строкам шаблона задач
        taskRows.forEach((row, index) => {
            // Начинаем парсить с 9-й строки (индекс 8), чтобы пропустить шапку и пустые строки
            if (index >= 8 && row.c) { 
                // Маппинг столбцов по вашему шаблону: 
                // Этап (A/B), Срок/Дедлайн (C), Описание задачи (E), Ожидаемый результат / Ссылка Tilda (F)
                const taskStage = row.c[1]?.v || "Этап";
                const taskDeadline = row.c[2]?.v || "В процессе ИС";
                const taskTitle = row.c[4]?.v || "Описание задачи";
                const taskResultField = row.c[5]?.v || ""; 

                // Если задача не заполнена (пустая строка в таблице), пропускаем её
                if (taskTitle === "Описание задачи" || !row.c[4]) return;

                // Создаем карточку задачи
                const taskCard = document.createElement('div');
                taskCard.className = "task-card";
                
                // Проверяем, есть ли ссылка на Tilda-опрос или чат в поле результата
                let actionBtn = "";
                if (typeof taskResultField === 'string' && taskResultField.includes('http')) {
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
        console.error("Ошибка синхронизации с Google Sheets:", error);
        document.getElementById('user-name').innerText = "Ошибка доступа к таблице";
        document.getElementById('user-role').innerText = "Проверьте публикацию в интернете";
    }
}

// Старт приложения
initApp();
