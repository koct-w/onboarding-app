const SHEET_PUBLIC_ID = "1aDMcM7AybCH8k-4_98jetqRKeS2UyMtdoYFZPyOjbEs";

// Используем бесплатный прокси-сервер для обхода сетевых ограничений браузера (CORS)
const masterUrl = `https://corsproxy.io?` + encodeURIComponent(`https://google.com{SHEET_PUBLIC_ID}/pub?sheet=Трекер&output=csv`);
const templateUrl = `https://corsproxy.io?` + encodeURIComponent(`https://google.com{SHEET_PUBLIC_ID}/pub?sheet=План+адаптации+новый&output=csv`);

// Разбор CSV данных по строкам
function parseCSV(text) {
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
    }).filter(row => row.length > 0);
}

// Функция входа
async function loginEmployee() {
    const inputName = document.getElementById('search-lastname').value.trim();
    const errorDiv = document.getElementById('auth-error');
    errorDiv.innerText = "";

    if (inputName.length < 2) {
        errorDiv.innerText = "Пожалуйста, введите фамилию корректно.";
        return;
    }

    document.getElementById('btn-login').innerText = "Проверка данных...";

    try {
        // Скачиваем лист "Трекер"
        const response = await fetch(masterUrl);
        const text = await response.text();
        const rows = parseCSV(text);

        // Ищем сотрудника по введенной фамилии (Регистронезависимо)
        const matchedRow = rows.find(row => row[1] && row[1].toLowerCase().includes(inputName.toLowerCase()));

        if (!matchedRow) {
            errorDiv.innerText = "Сотрудник с такой фамилией не найден в Трекере 2.0";
            document.getElementById('btn-login').innerText = "Войти в систему";
            return;
        }

        // Если нашли, вытаскиваем его уникальные данные из колонок таблицы
        const employeeData = {
            name: matchedRow[1],      // Колонка B - ФИО
            role: matchedRow[2],      // Колонка C - Должность
            branch: matchedRow[3],    // Колонка D - Филиал
            progress: matchedRow[9]   // Колонка J - Прогресс ИС
        };

        // Запускаем отрисовку его личного кабинета
        renderMainApp(employeeData);

    } catch (error) {
        console.error(error);
        errorDiv.innerText = "Ошибка соединения с таблицей. Попробуйте еще раз.";
        document.getElementById('btn-login').innerText = "Войти в систему";
    }
}

// Функция отображения личного кабинета и его задач
async function renderMainApp(employee) {
    // Переключаем экраны: скрываем вход, показываем приложение
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app-screen').style.display = 'block';

    // Заполняем шапку данными конкретного человека
    document.getElementById('user-name').innerText = employee.name;
    document.getElementById('user-role').innerText = employee.role;
    document.getElementById('user-branch').innerText = employee.branch;
    document.getElementById('progress-val').innerText = employee.progress;
    document.getElementById('progress-fill').style.width = employee.progress.includes('%') ? employee.progress : employee.progress + '%';

    try {
        // Скачиваем эталонный шаблон задач
        const response = await fetch(templateUrl);
        const text = await response.text();
        const templateRows = parseCSV(text);

        const tasksListContainer = document.getElementById('tasks-list');
        tasksListContainer.innerHTML = "";

        // Строим список задач
        templateRows.forEach((row, index) => {
            if (index >= 8 && row.length > 4) {
                const taskStage = row[0] || row[1] || "Этап";
                const taskDeadline = row[2] || "В процессе ИС";
                const taskTitle = row[4] || "";
                const taskResultField = row[5] || "";

                if (!taskTitle || taskTitle.includes("Описание задачи") || taskTitle.trim() === "") return;

                const taskCard = document.createElement('div');
                taskCard.className = "task-card";

                let actionBtn = "";
                if (taskResultField && taskResultField.includes('http')) {
                    actionBtn = `<a href="${taskResultField}" target="_blank" class="task-btn">✍️ Пройти опрос / Заполнить форму</a>`;
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
        console.error("Ошибка загрузки задач:", e);
    }
}

// Функция выхода
function logoutEmployee() {
    document.getElementById('search-lastname').value = "";
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-app-screen').style.display = 'none';
    document.getElementById('btn-login').innerText = "Войти в систему";
}
