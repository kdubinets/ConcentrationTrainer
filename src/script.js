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

let currentSession = {};
let history = [];

// parameters for models to calculate new duration and adjust concentration interval
let modelParams = {
    historyLength: 20,
    distractionEstimateSec: 30,
    maxGrowRate: 1.1,
    recentHistoryMin: 120,
    recentHistoryQuantMin: 10,
    recentHistoryAdjustment: 1.05,
    morningAdjusment: 1.1,
    nightAdjusment: 1.1,
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
}

function timerFinished() {
    running = false;
    clearInterval(countdownTimer);
    clearTimeout(alarmTimer);
    interruptButton.style.display = 'none';
    results.style.display = 'block';
}

function updateInterval(success) {
    // const previousIntervals = JSON.parse(localStorage.getItem('concentrationIntervals')) || [];
    // previousIntervals.push({interval: interval / 60, success});
    // localStorage.setItem('concentrationIntervals', JSON.stringify(previousIntervals));

    // if (success) {
    //     interval += 5 * 60; // Increase by 5 minutes
    // } else {
    //     interval = Math.max(5 * 60, interval - 5 * 60); // Decrease by 5 minutes but not below 5 minutes
    // }

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
    if (history === null) {
        return 30;
    } else {
        return 30 + history.length;
    }
}

function calculateAdjustedDuration(session) {
    if (session.succesfull) {
        session.adjustedDurationSec = session.realDurationSec;
    } else {
        session.adjustedDurationSec = Math.max(session.realDurationSec - modelParams.distractionEstimateSec, 0);
    }
}