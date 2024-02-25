///////////
// UI section
const startButton = document.getElementById('start');
const interruptButton = document.getElementById('interrupt');
const timerDisplay = document.getElementById('timer');
const results = document.getElementById('results');
const yesButton = document.getElementById('yes');
const noButton = document.getElementById('no');
const sound = document.getElementById('timer-sound');

function updateTimeText(secondsLeft) {
    hours = parseInt(secondsLeft / 3600, 10);
    minutes = parseInt((secondsLeft % 3600) / 60, 10);
    seconds = parseInt(secondsLeft % 60, 10);

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    timerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
}

// end UI section
//////

let interval;
let running = false;
let wakeLock;

let currentSession = {};
let history = [];

// parameters for models to calculate new duration and adjust concentration interval
let modelParams = {
    minSessionTime: 30,
    startIntervalSec: 60,
    historyLength: 20,
    distractionEstimateSec: 20,
    maxGrowRate: 1.1,
    recentHistoryMin: 120,
    recentHistoryQuantMin: 10,
    recentHistoryAdjustment: 1.05,
    morningAdjusment: 1.1,
    nightAdjusment: 1.1,
    targetSuccessRate: 0.80,
    stdDevs: 2
};

init();


function init() {
    history = getHistory();

    interval = calculateConcentrationTime(history);
    updateTimeText(interval);
}


let countdownTimer;  // Used to hold the time countodown timer id
let alarmTimer;  // Used to hold the alarm playing sound timer id

function startTimer(duration) {
    currentSession = {
        startTime: new Date(),
        plannedDurationSec: duration
    };

    sound.load();
    alarmTimer = setTimeout(function() {
        sound.play(); // Play the ending sound
    }, duration*1000);
    
    let timer = duration;
    countdownTimer = setInterval(function () {
        updateTimeText(timer);

        if (--timer < 0) {
            timerFinished();
        }
    }, 1000);

    if (navigator.wakeLock) {
        wakeLock = navigator.wakeLock.request("screen");
    }
}

function timerFinished() {
    running = false;
    clearInterval(countdownTimer);
    clearTimeout(alarmTimer);
    interruptButton.style.display = 'none';
    results.style.display = 'block';

    if (wakeLock) {
        wakeLock.then((sentinel) => sentinel.release());
    }
}

function updateInterval(success) {
    startButton.textContent = 'Start Concentration';
    results.style.display = 'none';
}

startButton.addEventListener('click', function() {
    if (!running) {
        startTimer(interval);
        running = true;
        this.textContent = 'Concentration Running...';
        interruptButton.style.display = 'inline';
    }
});

interruptButton.addEventListener('click', function() {
    timerFinished();

    currentSession.realDurationSec = (new Date() - currentSession.startTime)/1000;
    currentSession.succesfull = false;
    calculateAdjustedDuration(currentSession);
    history.push(currentSession);
    storeHistory(history);
    interval = calculateConcentrationTime(history);
    updateTimeText(interval);

    updateInterval(false);
});

yesButton.addEventListener('click', function() {
    currentSession.realDurationSec = currentSession.plannedDurationSec;
    currentSession.succesfull = true;
    calculateAdjustedDuration(currentSession);
    history.push(currentSession);
    storeHistory(history);
    interval = calculateConcentrationTime(history);
    updateTimeText(interval);

    updateInterval(true);
});

noButton.addEventListener('click', function() {
    currentSession.realDurationSec = currentSession.plannedDurationSec;
    currentSession.succesfull = false;
    calculateAdjustedDuration(currentSession);
    history.push(currentSession);
    storeHistory(history);
    interval = calculateConcentrationTime(history);
    updateTimeText(interval);

    updateInterval(false);
});

// meditation record:
//{
    // startTime: "";
    // plannedDurationSec: 3;
    // realDurationSec: 1;
    // adjustedDurationSec: 2;
    // succesfull: false
//}

function getHistory() {
    return JSON.parse(localStorage.getItem('sessionsHistory')) || [];
}

function storeHistory(history) {
    localStorage.setItem('sessionsHistory', JSON.stringify(history));
}

function calculateConcentrationTime(history) {
    if (history === null || history.length == 0) {
        return modelParams.startIntervalSec;
    }

    console.log("calculateConcentrationTime: non empty history");

    let durations = [];
    let successes = 0;
    for (let session of history.reverse()) {
        if (durations.length >= modelParams.historyLength) {
            break;
        }

        if (session.adjustedDurationSec === undefined) {
            session.adjustedDurationSec = session.realDurationSec;
        }
        
        if (session.adjustedDurationSec < modelParams.minSessionTime) {
            continue;
        }

        durations.push(session.adjustedDurationSec);
        if (session.succesfull) {
            successes += 1;
        }
    }

    let num = durations.length;

    if (num == 0) {
        console.log("No histrory entries fitting minimum length found. Returning default starting duration.");
        return modelParams.startIntervalSec;
    }

    let sum = 0;
    for(let duration of durations) {
        sum += duration;
    }
    let avg = sum / num;
    console.log("Results: avg = " + avg);

    let squares = 0;
    for(let duration of durations) {
        squares += (duration - avg) ** 2;
    }
    let variance = squares / num;
    console.log("Results: variance = " + variance);
    
    let stdDev = Math.sqrt(variance);
    console.log("Results: stdDev = " + stdDev);

    if (stdDev <= avg / 20) { // if there are very little variance in the results
        stdDev = avg / 10;
    }

    const stdDevMulti =  (1 + (successes/num - modelParams.targetSuccessRate)) * modelParams.stdDevs;
    console.log("Results: stdDevMulti = " + stdDevMulti);

    let concentrationTime = avg + stdDev * stdDevMulti;
    console.log("Results: concentrationTime = " + concentrationTime);

    concentrationTime = Math.max(concentrationTime, modelParams.minSessionTime*2);
    console.log("Results: adjusted concentrationTime = " + concentrationTime);

    return concentrationTime;
}

function calculateAdjustedDuration(session) {
    if (session.succesfull) {
        session.adjustedDurationSec = session.realDurationSec;
    } else {
        session.adjustedDurationSec = Math.max(session.realDurationSec - modelParams.distractionEstimateSec, 0);
    }
}