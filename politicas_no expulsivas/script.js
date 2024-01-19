let tasks = [];
let durations = [];
let arrivalTimes = [];
let currentAlgorithm = 'FCFS'; 

google.charts.load('current', {'packages':['gantt']});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
    
}


function addTask() {
    const taskName = document.getElementById('taskName').value;
    const taskDuration = document.getElementById('taskDuration').value;
    const taskArrival = document.getElementById('taskArrival').value;

    if (taskName === '' || taskDuration === '' || taskDuration <= 0 || taskArrival === '' || taskArrival < 0) {
        alert('Por favor, ingrese datos válidos para la tarea.');
        return;
    }

    tasks.push(taskName);
    durations.push(parseInt(taskDuration));
    arrivalTimes.push(parseInt(taskArrival));

    updateTaskList();
    document.getElementById('taskName').value = '';
    document.getElementById('taskDuration').value = '';
    document.getElementById('taskArrival').value = '';
}

function setAlgorithm(algorithm) {
    currentAlgorithm = algorithm;
    calculateTimes();
}

function calculateTimes() {
    if (currentAlgorithm === 'FCFS') {
        calculateFCFS();
    } else if (currentAlgorithm === 'SPN') {
        calculateSPN();
    }
}

function calculateFCFS() {
    let totalTime = 0;
    let ganttData = [];
    let resultsHtml = '';
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    

    tasks.forEach((task, index) => {
        const arrivalTime = arrivalTimes[index];
        const duration = durations[index];
        const waitingTime = Math.max(totalTime - arrivalTime, 0);
        const startTime = totalTime;
        totalTime = Math.max(totalTime, arrivalTime) + duration;
        const turnaroundTime = waitingTime + duration;

        totalWaitingTime += waitingTime;
        totalTurnaroundTime += turnaroundTime;

        ganttData.push([task, task, null, new Date(startTime * 1000), new Date(totalTime * 1000), null, 100, null]);
        resultsHtml += `<tr>
                            <td>${task}</td>
                            <td>${waitingTime}</td>
                            <td>${turnaroundTime}</td>
                            <td>${arrivalTime}</td>
                        </tr>`;
    });

    const avgWaitingTime = totalWaitingTime / tasks.length;
    const avgTurnaroundTime = totalTurnaroundTime / tasks.length;

    resultsHtml += `<tr>
                        <td>Promedio</td>
                        <td>${avgWaitingTime.toFixed(2)}</td>
                        <td>${avgTurnaroundTime.toFixed(2)}</td>
                        <td>---</td>
                    </tr>`;

    document.getElementById('results').querySelector('tbody').innerHTML = resultsHtml;
    drawGanttChart(ganttData);
}


function drawGanttChart(ganttData) {
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Task ID');
    data.addColumn('string', 'Task Name');
    data.addColumn('string', 'Resource');
    data.addColumn('date', 'Start Date');
    data.addColumn('date', 'End Date');
    data.addColumn('number', 'Duration');
    data.addColumn('number', 'Percent Complete');
    data.addColumn('string', 'Dependencies');

    data.addRows(ganttData);

    var options = {
        height: 400,
        gantt: {
            trackHeight: 30
        }
    };

    var chart = new google.visualization.Gantt(document.getElementById('gantt_chart'));
    chart.draw(data, options);
}


function calculateSPN() {
    let spnTasks = tasks.slice();
    let spnDurations = durations.slice();
    let spnArrivalTimes = arrivalTimes.slice();
    let ganttData = [];
    let resultsHtml = '';
    let totalTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;

    while (spnTasks.length > 0) {
        let availableTasks = spnTasks.filter((_, index) => spnArrivalTimes[index] <= totalTime);

        if (availableTasks.length === 0) {
            totalTime++;
            continue;
        }

        let shortestTaskIndex = spnTasks.findIndex((task) => task === availableTasks.sort((a, b) => {
            let aIndex = spnTasks.indexOf(a);
            let bIndex = spnTasks.indexOf(b);
            return spnDurations[aIndex] - spnDurations[bIndex];
        })[0]);

        let task = spnTasks[shortestTaskIndex];
        let duration = spnDurations[shortestTaskIndex];
        let arrivalTime = spnArrivalTimes[shortestTaskIndex];
        let waitingTime = Math.max(totalTime - arrivalTime, 0);
        let turnaroundTime = waitingTime + duration;
        let startTime = totalTime;

        totalTime += duration;

        ganttData.push([task, task, null, new Date(startTime * 1000), new Date(totalTime * 1000), null, 100, null]);
        resultsHtml += `<tr>
                            <td>${task}</td>
                            <td>${waitingTime}</td>
                            <td>${turnaroundTime}</td>
                            <td>${arrivalTime}</td>
                        </tr>`;

                        totalWaitingTime += waitingTime;
                        totalTurnaroundTime += turnaroundTime;

        spnTasks.splice(shortestTaskIndex, 1);
        spnDurations.splice(shortestTaskIndex, 1);
        spnArrivalTimes.splice(shortestTaskIndex, 1);
    }

    const avgWaitingTime = totalWaitingTime / tasks.length;
    const avgTurnaroundTime = totalTurnaroundTime / tasks.length;

    resultsHtml += `<tr>
                        <td>Promedio</td>
                        <td>${avgWaitingTime.toFixed(2)}</td>
                        <td>${avgTurnaroundTime.toFixed(2)}</td>
                        <td>---</td>
                    </tr>`;
    document.getElementById('results').querySelector('tbody').innerHTML = resultsHtml;
    drawGanttChart(ganttData);
}
function updateTaskList() {
    let html = '<ul>';
    tasks.forEach((task, index) => {
        html += `<li>Tarea ${task}: Duración = ${durations[index]}, Tiempo de Llegada = ${arrivalTimes[index]}</li>`;
    });
    html += '</ul>';
    document.getElementById('taskList').innerHTML = html;
}

function setAlgorithm(algorithm) {
    currentAlgorithm = algorithm;
    document.getElementById('rrSettings').style.display = algorithm === 'RR' ? 'block' : 'none';
    calculateTimes();
}


function calculateSRTF() {
    let currentTime = 0;
    let completedTasks = [];
    let pendingTasks = tasks.map((task, index) => ({
        name: task,
        duration: durations[index],
        arrivalTime: arrivalTimes[index],
        remainingTime: durations[index],
        startTime: null,
        endTime: null
    }));

    while (pendingTasks.length > 0) {
        
        let availableTasks = pendingTasks.filter(task => task.arrivalTime <= currentTime);

        if (availableTasks.length === 0) {
            currentTime++;
            continue;
        }

        
        availableTasks.sort((a, b) => a.remainingTime - b.remainingTime);
        let currentTask = availableTasks[0];

        
        if (currentTask.startTime === null) {
            currentTask.startTime = currentTime;
        }

       
        currentTask.remainingTime--;
        currentTime++;

        
        if (currentTask.remainingTime === 0) {
            currentTask.endTime = currentTime;
            completedTasks.push(currentTask);
            pendingTasks = pendingTasks.filter(task => task !== currentTask);
        }
    }

  
    let resultsHtml = '';
    completedTasks.forEach(task => {
        const waitingTime = task.startTime - task.arrivalTime;
        const turnaroundTime = task.endTime - task.arrivalTime;

        resultsHtml += `<tr>
                            <td>${task.name}</td>
                            <td>${waitingTime}</td>
                            <td>${turnaroundTime}</td>
                            <td>${task.arrivalTime}</td>
                        </tr>`;
    });

    document.getElementById('results').querySelector('tbody').innerHTML = resultsHtml;
    
}
