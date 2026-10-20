const SHEET_PUBLIC_ID = "1aDMcM7AybCH8k-4_98jetqRKeS2UyMtdoYFZPyOjbEs";

// Ссылки через прокси для гарантированного обхода блокировок CORS
const masterUrl = `https://corsproxy.io?` + encodeURIComponent(`https://google.com{SHEET_PUBLIC_ID}/pub?sheet=Трекер&output=csv`);
const templateUrl = `https://corsproxy.io?` + encodeURIComponent(`https://google.com{SHEET_PUBLIC_ID}/pub?sheet=План+адаптации+новый&output=csv`);

// Самый простой и безотказный способ разделить CSV на строки и ячейки
function parseCSV(text) {
    // Делим текст по переносу строки (учитываем любые форматы систем)
    let lines = text.split(\(/\r\)?\n/);
    
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
    }).filter(row => row.length > 0 && row[0] !== '');
}

// Функция авторизации по фамилии
async function loginEmployee() {
    const inputName = document.getElementById('search-lastname').value.trim();
    const errorDiv = document.getElementById('auth-error');
    const loginBtn = document.getElementById('btn-login');
    errorDiv.innerText = "";

    if (inputName.length < 2) {
        errorDiv.innerText = "Пожалуйста, введите фамилию.";
        return;
    }

    loginBtn.innerText = "Проверка данных...";

    try {
        const response = await fetch(masterUrl);
        const text = await response.text();
        const rows = parseCSV(text);

        // Ищем сотрудника по фамилии (без учета регистра букв)
        const matchedRow = rows.find(row => {
            return row && row[1] && row[1].toLowerCase().includes(inputName.toLowerCase());
        });

        if (!matchedRow) {
            errorDiv.innerText = "Сотрудник с такой фамилией не найден в базе.";
            loginBtn.innerText = "Войти в систему";
            return;
        }

        // Вытаскиваем данные сотрудника по точным индексам колонок: 
        // Индекс 1 (Колонка B) - ФИО, Индекс 2 (Колонка C) - Должность, Индекс 3 (Колонка D) - Филиал, Индекс 9 (Колонка J) - Прогресс
        const employeeData = {
            name: matchedRow[1] || "Не указано",
            role: matchedRow[2] || "Не указано",
            branch: matchedRow[3] || "Не указано",
            progress: matchedRow[9] || "0%"
        };

        renderMainApp(employeeData);

    } catch (error) {
        console.error("Ошибка сети:", error);
        errorDiv.innerText = "Ошибка соединения. Убедитесь, что таблица опубликована.";
        loginBtn.innerText = "Войти в систему";
    }
}

// Построение индивидуального экрана онбординга
async function renderMainApp(employee) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app-screen').style.display = 'block';

    document.getElementById('user-name').innerText = employee.name;
    document.getElementById('user-role').innerText = employee.role;
    document.getElementById('user-branch').innerText = employee.branch;
    document.getElementById('progress-val').innerText = employee.progress;
    
    // Настройка заполнения шкалы прогресса
    let progVal = String(employee.progress);
    document.getElementById('progress-fill').style.width = progVal.includes('%') ? progVal : progVal + '%';

    try {
        const response = await fetch(templateUrl);
        const text = await response.text();
        const templateRows = parseCSV(text);

        const tasksListContainer = document.getElementById('tasks-list');
        tasksListContainer.innerHTML = "";

        templateRows.forEach((row, index) => {
            // Читаем содержательную часть со строчки 9 и далее (индекс 8)
            if (index >= 8 && row.length > 4) {
                // Индекс 0 (A) - Этап, Индекс 2 (C) - Срок, Индекс 4 (E) - Задача, Индекс 5 (F) - Ссылка на Tilda
                const taskStage = row[0] || "Этап";
                const taskDeadline = row[2] || "В процессе ИС";
                const taskTitle = row[4] || "";
                const taskResultField = row[5] || "";

                if (!taskTitle || taskTitle.includes("Описание задачи") || taskTitle.trim() === "") return;

                const taskCard = document.createElement('div');
                taskCard.className = "task-card";

                let actionBtn = "";
                // Проверяем, есть ли ссылка на форму или опрос
                if (taskResultField && taskResultField.includes('http')) {
                    actionBtn = `<a href="${taskResultField}" target="_blank" class="task-btn">✍️ Пройти опрос / Заполни форму</a>`;
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
    } catch (e) {
        console.error("Ошибка построения задач:", e);
    }
}

// Функция выхода из кабинета
function logoutEmployee() {
    document.getElementById('search-lastname').value = "";
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-app-screen').style.display = 'none';
    document.getElementById('btn-login').innerText = "Войти в систему";
}
