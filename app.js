// Автономный массив данных на основе ваших таблиц
const LOCAL_EMPLOYEE = {
    name: "Колегова Татьяна Евгеньевна",
    role: "Врач-кардиолог",
    branch: "Филиал на Баррикадной",
    progress: "55%"
};

const LOCAL_TASKS = [
    {
        stage: "Неделя 1 / День 1",
        deadline: "В первый рабочий день",
        title: "Оформление в отделе кадров, получение пропуска, вводный инструктаж по охране труда.",
        link: ""
    },
    {
        stage: "Неделя 1 / День 1",
        deadline: "В первый рабочий день",
        title: "Знакомство с руководителем, наставником и коллективом филиала. Получение корпоративной почты.",
        link: ""
    },
    {
        stage: "Неделя 1",
        deadline: "До конца 1-й недели",
        title: "Пройти пульс-опрос по итогам первого рабочего дня и зафиксировать первые впечатления.",
        link: "https://tilda.ws"
    },
    {
        stage: "Недели 1-2",
        deadline: "До конца 2-й недели",
        title: "Изучение стандартов сервиса клиники и базового регламента работы на приёме. Обучение в МИС МАК.",
        link: ""
    },
    {
        stage: "Недели 1-2",
        deadline: "Конец 2-й недели",
        title: "Заполнение Дневника адаптации по итогам двух недель совместно с наставником.",
        link: "https://tilda.ws"
    },
    {
        stage: "Недели 3-4",
        deadline: "До конца 4-й недели",
        title: "Прохождение промежуточного тестирования по знанию внутренних регламентов сети «Семейный доктор».",
        link: "https://tilda.ws"
    },
    {
        stage: "Недели 4-12",
        deadline: "До конца 3-го месяца",
        title: "Выполнение индивидуального плана задач (Action Plan) на испытательный срок. Финальная сертификация.",
        link: "https://tilda.ws"
    }
];

function initApp() {
    try {
        // 1. ВЫВОДИМ ДАННЫЕ О СОТРУДНИКЕ В СИНЮЮ ШАПКУ
        document.getElementById('user-name').innerText = LOCAL_EMPLOYEE.name;
        document.getElementById('user-role').innerText = LOCAL_EMPLOYEE.role;
        document.getElementById('user-branch').innerText = LOCAL_EMPLOYEE.branch;
        document.getElementById('progress-val').innerText = LOCAL_EMPLOYEE.progress;
        document.getElementById('progress-fill').style.width = LOCAL_EMPLOYEE.progress;

        // 2. ВЫВОДИМ КАРТОЧКИ ЗАДАЧ С КНОПКАМИ TILDA
        const tasksListContainer = document.getElementById('tasks-list');
        tasksListContainer.innerHTML = "";

        LOCAL_TASKS.forEach(task => {
            const taskCard = document.createElement('div');
            
            // Если прогресс 55%, условно подсветим первые три задачи как выполненные
            const isCompleted = task.stage.includes("День 1");
            taskCard.className = `task-card ${isCompleted ? 'completed' : ''}`;
            
            // Создаем кнопку, если у задачи прописана ссылка на форму Tilda
            let actionBtn = "";
            if (task.link && task.link.trim() !== "") {
                actionBtn = `<a href="${task.link}" target="_blank" class="task-btn">✍️ Пройти опрос / Заполнить форму</a>`;
            }

            taskCard.innerHTML = `
                <div class="task-meta">
                    <span>📌 ${task.stage}</span>
                    <span>⏱ ${task.deadline}</span>
                </div>
                <div class="task-title">${taskTitle = task.title}</div>
                ${actionBtn}
            `;
            tasksListContainer.appendChild(taskCard);
        });

    } catch (error) {
        console.error("Ошибка отображения:", error);
        document.getElementById('user-name').innerText = "Ошибка загрузки интерфейса";
    }
}

// Старт приложения
window.onload = initApp;
