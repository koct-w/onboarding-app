const SHEET_PUBLIC_ID = "1aDMcM7AybCH8k-4_98jetqRKeS2UyMtdoYFZPyOjbEs";

// Ссылка через прокси для гарантированного чтения без блокировок браузера
const masterUrl = `https://corsproxy.io?` + encodeURIComponent(`https://google.com{SHEET_PUBLIC_ID}/pub?sheet=Трекер&output=csv`);
const templateUrl = `https://corsproxy.io?` + encodeURIComponent(`https://google.com{SHEET_PUBLIC_ID}/pub?sheet=План+адаптации+новый&output=csv`);

// Разбор строк формата CSV
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

        // Поиск совпадения по фамилии (без учета регистра)
        const matchedRow = rows.find(row => row[1] && row[1].toLowerCase().includes(inputName.toLowerCase()));

        if (!matchedRow) {
            errorDiv.innerText = "Сотрудник с такой фамилией не найден в базе.";
            loginBtn.innerText = "Войти в систему";
            return;
        }

        // Вытаскиваем данные сотрудника по индексам колонок: B(1) - ФИО, C(2) - Должность, D(3) - Филиал, J(9) - Прогресс
        const employeeData = {
            name: matchedRow[1] || "Не указано",
            role: matchedRow[2] || "Не указано",
            branch: matchedRow[3] || "Не указано",
            progress: matchedRow[9] || "0%"
        };

        renderMainApp(employeeData);

    } catch (error) {
        console.error(error);
        errorDiv.innerText = " Ошибка соединения. Проверьте публикацию таблицы.";
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
    document.getElementById('progress-fill').style.width = employee.progress.includes('%') ? employee.progress : employee.progress + '%';

    try {
        const response = await fetch(templateUrl);
        const text = await response.text();
        const templateRows = parseCSV(text);

        const tasksListContainer = document.getElementById('tasks-list');
        tasksListContainer.innerHTML = "";

        templateRows.forEach((row, index) => {
            // Читаем содержательную часть (строка 9 и далее)
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
        console.error("Ошибка построения списка задач:", e);
    }
}

// Функция сброса сессии (Выход)
function logoutEmployee() {
    document.getElementById('search-lastname').value = "";
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-app-screen').style.display = 'none';
    document.getElementById('btn-login').innerText = "Войти в систему";
}
