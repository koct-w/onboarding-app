// Прямые ссылки на CSV-выгрузку ваших опубликованных листов
const masterUrl = `https://google.com`;
const templateUrl = `https://google.com`;

// Универсальный и надежный разбор CSV формата от Google
function parseCSV(text) {
    let lines = text.split(\(/\r\)?\n/);
    return lines.map(line => {
        let result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            let char = line[i];
            if (char === '"') {
                if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }).filter(row => row.length > 0 && row.some(cell => cell !== ''));
}

async function initApp() {
    try {
        // 1. ЧИТАЕМ ДАННЫЕ О СОТРУДНИКЕ (Лист "Трекер")
        const masterResponse = await fetch(masterUrl);
        const masterText = await masterResponse.text();
        const masterRows = parseCSV(masterText);
        
        // По умолчанию выставляем заглушки на случай, если строка пуста
        let name = "Колегова Татьяна Евгеньевна";
        let role = "Врач-кардиолог";
        let branch = "Филиал не указан";
        let progress = "55%";

        // Ищем строку, где есть ФИО Колеговой, чтобы взять реальные данные
        const targetRow = masterRows.find(row => row.some(cell => cell.includes("Колегова")));
        
        if (targetRow) {
            // Защищенный сбор элементов: если колонка пустая — берем стандартное значение
            name = targetRow[1] || name;
            role = targetRow[2] || role;
            branch = targetRow[3] || branch;
            progress = targetRow[9] || progress;
        }

        // Выводим информацию в красивую синюю шапку
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

        // Перебираем строки плана (пропуская первые технические строки шапки)
        templateRows.forEach((row, index) => {
            if (index >= 4) { // Начинаем разбор чуть выше, чтобы зацепить все задачи
                // Безопасное извлечение ячеек по индексам колонок A, C, E, F
                const taskStage = row[0] || row[1] || "Этап";
                const taskDeadline = row[2] || "В процессе ИС";
                const taskTitle = row[4] || "";
                const taskResultField = row[5] || "";

                // Строгие фильтры: отсекаем пустые блоки и технический текст
                if (!taskTitle || 
                    taskTitle.includes("Описание задачи") || 
                    taskTitle.trim() === "" || 
                    taskTitle.length < 5) return;

                // Создаем карточку шага адаптации
                const taskCard = document.createElement('div');
                taskCard.className = "task-card";
                
                // Автоматически создаем кнопку, если в ожидаемом результате есть ссылка на Tilda/чат
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
