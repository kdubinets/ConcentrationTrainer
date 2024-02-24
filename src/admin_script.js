///////////
// UI section
const historyTextArea = document.getElementById('history');
const updateButton = document.getElementById('update');
const results = document.getElementById('results');

init();


function init() {
    const history = getHistory();
    historyTextArea.value = history;
}

updateButton.addEventListener('click', function() {
    storeHistory(historyTextArea.value);
    results.style.display = 'block';

    setTimeout(function() {
        results.style.display = 'none';
    }, 3000);    
});


function getHistory() {
    return JSON.parse(localStorage.getItem('sessionsHistory')) || [];
}


function storeHistory(history) {
    localStorage.setItem('sessionsHistory', JSON.stringify(history));
}
