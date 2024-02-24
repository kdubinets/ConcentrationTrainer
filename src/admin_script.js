///////////
// UI section
const historyTextArea = document.getElementById('history');
const updateButton = document.getElementById('update');
const results = document.getElementById('results');
const error = document.getElementById('error');

init();


function init() {
    const history = getHistory();
    historyTextArea.value = history;
}

updateButton.addEventListener('click', function() {
    if (!storeHistory(historyTextArea.value)) {
        error.style.display = 'block';
        setTimeout(function() {
            error.style.display = 'none';
        }, 3000);    

        return;
    }

    results.style.display = 'block';
    setTimeout(function() {
        results.style.display = 'none';
    }, 3000);    
});


function getHistory() {
    const cached = localStorage.getItem('sessionsHistory');
    if (!cached) {
        return "";
    }

    const jsonObject = JSON.parse(cached);
    const formattedJson = JSON.stringify(jsonObject, null,  2);
    return formattedJson;
}


function storeHistory(history) {
    try {
        const jsonObject = JSON.parse(history);

        if (!Array.isArray(jsonObject)) {
            // report error
            return false;
        }

        for (item of jsonObject) {
            if (typeof item === 'object' && !Array.isArray(item)) {
                // let's check that it has required field and they are of the correct types
                if (!hasAtribute(item, 'startTime', 'string')) {
                    return false;
                }
                if (!hasAtribute(item, 'plannedDurationSec', 'number')) {
                    return false;
                }
                if (!hasAtribute(item, 'realDurationSec', 'number')) {
                    return false;
                }
                if (!hasAtribute(item, 'succesfull', 'boolean')) {
                    return false;
                }
            } else {
                return false;
            }
        }

        localStorage.setItem('sessionsHistory', history);

        return true;
    } catch (error) {
        return false;
    }
}


function hasAtribute(obj, member, type) {
    if (! obj.hasOwnProperty(member)) {
        return false;
    }
    return typeof obj[member] === type;
}