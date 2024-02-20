const startButton = document.getElementById('start');
const interruptButton = document.getElementById('interrupt');
const timerDisplay = document.getElementById('timer');
const results = document.getElementById('results');
const yesButton = document.getElementById('yes');
const noButton = document.getElementById('no');

let interval = 1 * 30; // Start with a 25 minute interval
let running = false;

const sound = document.getElementById('timer-sound');

init();

function init() {
    updateTimeText(interval);
}

function updateTimeText(secondsLeft) {
    hours = parseInt(secondsLeft / 3600, 10);
    minutes = parseInt((secondsLeft % 3600) / 60, 10);
    seconds = parseInt(secondsLeft % 60, 10);

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    timerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
}

let countdownTimer;  // Used to hold the time countodown timer id
let alarmTimer;  // Used to hold the alarm playing sound timer id

function startTimer(duration) {
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
    const previousIntervals = JSON.parse(localStorage.getItem('concentrationIntervals')) || [];
    previousIntervals.push({interval: interval / 60, success});
    localStorage.setItem('concentrationIntervals', JSON.stringify(previousIntervals));

    if (success) {
        interval += 5 * 60; // Increase by 5 minutes
    } else {
        interval = Math.max(5 * 60, interval - 5 * 60); // Decrease by 5 minutes but not below 5 minutes
    }

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
    updateInterval(false);
});

yesButton.addEventListener('click', function() {
    updateInterval(true);
});

noButton.addEventListener('click', function() {
    updateInterval(false);
});

