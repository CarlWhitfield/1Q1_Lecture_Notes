document.addEventListener('DOMContentLoaded', () => {
const ctxLeft = document.getElementById('leftChart').getContext('2d');
const ctxRight = document.getElementById('rightChart').getContext('2d');
const tSlider = document.getElementById('tSlider');
const tValue = document.getElementById('tValue');
const Npts = 100;
const tValues = Array.from({ length: (Npts+1) }, (_, i) => -1 + (i / Npts) * 2);
const xValues = tValues.map(t => 2 * (t ** 2) - 1);
const yValues = tValues.map(t => 2 * Math.sin(Math.PI*t) - Math.cos(3 * Math.PI * t));

// Create the left chart for y = t^2 - t + 1 and x = 2sin(t) - cos(3t)
const leftChart = new Chart(ctxLeft, {
    type: 'scatter',
    data: {
        datasets: [
            {
                label: 'y = 2sin(πt) - cos(3πt)',
                data: tValues.map((tval, index) => ({ x: tval, y: yValues[index] })),
                borderColor: 'blue',
                borderWidth: 2,
                pointRadius: 0,
                showLine: true
            },
            {
                label: 'x = 2t^2 - 1',
                data: tValues.map((tval, index) => ({ x: tval, y: xValues[index] })),
                borderColor: 'red',
                borderWidth: 2,
                pointRadius: 0,
                showLine: true
            },
            {
                label: 't value',
                data: [], // Vertical line at t (initially empty)
                borderColor: 'black',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
                showLine: true
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 't'
                },
                min: -1,
                max: 1
            },
            y: {
                title: {
                    display: true,
                    text: 'Value'
                },
                min: -3,
                max: 3
            }
        }
    }
});

// Create the right chart for y plotted against x
const rightChart = new Chart(ctxRight, {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'y vs x',
            data: tValues.map((t, index) => ({ x: xValues[index], y: yValues[index] })),
            borderColor: 'green',
            borderWidth: 2,
            showLine: true,
        },
        {
            label: 'Selected Point',
            data: [], // Highlighted point (initially empty)
            borderColor: 'orange',
            borderWidth: 3,
            pointRadius: 6,
            showLine: false,
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'x'
                },
                min: -1,
                max: 1
            },
            y: {
                title: {
                    display: true,
                    text: 'y'
                },
                min: -3,
                max: 3
            }
        }
    }
});

// Update the charts based on the slider value
function updateCharts() {
    const tval = parseFloat(tSlider.value);
    const index = Math.round((1 + tval)*Npts/2); // Get the index for the current t value

    // Update the left chart with a vertical line
    leftChart.data.datasets[2].data = [
        { x: tval, y: -3 },
        { x: tval, y: 3 }
    ];
    leftChart.update();

    // Update the right chart with the corresponding point
    rightChart.data.datasets[1].data = [
        { x: xValues[index], y: yValues[index] }
    ];
    rightChart.update();

    // Update the displayed t value
    tValue.textContent = tval.toFixed(2);
}

// Event listener for the slider
tSlider.addEventListener('input', updateCharts);

// Initialize the charts with the first value
updateCharts();

// Your existing JavaScript code here
});