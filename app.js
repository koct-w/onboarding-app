const SHEET_PUBLIC_ID = "1aDMcM7AybCH8k-4_98jetqRKeS2UyMtdoYFZPyOjbEs";

// Ссылки через прокси для гарантированного обхода блокировок CORS
const masterUrl = "https://corsproxy.io?" + encodeURIComponent("https://google.com" + SHEET_PUBLIC_ID + "/pub?sheet=Трекер&output=csv");
const templateUrl = "https://corsproxy.io?" + encodeURIComponent("https://google.com" + SHEET_PUBLIC_ID + "/pub?sheet=План+адаптации+новый&output=csv");

// Самый простой способ разделить CSV без опасных символов
function parseCSV(text) {
    // Безопасное разделение текста по строкам без регулярных выражений
    let lines = text.split('\n');
    
    return lines.map(function(line) {
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
    }).filter(function(row) {
        return row.length > 0 && row[0] !== '';
    });
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
        const matchedRow = rows.find(function(row) {
            return row && row[1] && row[1].toLowerCase().indexOf(inputName.toLowerCase()) !== -1;
        });

        if (!matchedRow) {
            errorDiv.innerText = "Сотрудник с такой фамилией не найден в базе.";
            loginBtn.innerText = "Войти в систему";
            return;
        }

        // Вытаскиваем данные сотрудника по точным индексам колонок: 
        // B(1) - ФИО, C(2) - Должность, D(3) - Филиал, J(9) - Прогресс
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
    
    let progVal = String(employee.progress);
    document.getElementById('progress-fill').style.width = progVal.indexOf('%') !== -1 ? progVal : progVal + '%';

    try {
        const response = await fetch(templateUrl);
        const text = await response.text();
        const templateRows = parseCSV(text);

        const tasksListContainer = document.getElementById('tasks-list');
        tasksListContainer.innerHTML = "";

        templateRows.forEach(function(row, index) {
            // Читаем содержательную часть со строчки 9 и далее (индекс 8)
            if (index >= 8 && row.length > 4) {
                // Индекс 1 - Этап, Индекс 2 - Дедлайн, Индекс 4 - Задача, Индекс 5 - Ссылка на Tilda
                const taskStage = row[1] || "Этап";
                const taskDeadline = row[2] || "В процессе ИС";
                const taskTitle = row[4] || "";
                const taskResultField = row[5] || "";

                if (!taskTitle || taskTitle.indexOf("Описание задачи") !== -1 || taskTitle.trim() === "") return;

                const taskCard = document.createElement('div');
                taskCard.className = "task-card";

                let actionBtn = "";
                if (taskResultField && taskResultField.indexOf('http') !== -1) {
                    actionBtn = '<a href="' + taskResultField + '" target="_blank" class="task-btn">✍️ Пройти опрос / Заполни форму</a>';
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
