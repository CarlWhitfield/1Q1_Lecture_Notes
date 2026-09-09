const ctx = document.getElementById('lineChart').getContext('2d');
const slopeSlider = document.getElementById('slopeSlider');
const interceptSlider = document.getElementById('interceptSlider');
const slopeValue = document.getElementById('slopeValue');
const interceptValue = document.getElementById('interceptValue');

// Initial values for m and c
let m = parseFloat(slopeSlider.value);
let c = parseFloat(interceptSlider.value);

// Generate x and y data for the line
function generateLineData(m, c) {
    const x = Array.from({ length: 11 }, (_, i) => i - 5); // x values from -5 to 5
    const y = x.map(xi => m * xi + c);
    return { x, y };
}

// Initial line data
const initialData = generateLineData(m, c);

// Create the chart
const lineChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: initialData.x,
        datasets: [{
            label: 'y = mx + c',
            data: initialData.y,
            borderColor: 'blue',
            borderWidth: 2,
            fill: false,
        }]
    },
    options: {
        responsive: false,
        maintainAspectRatio: true,
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'x'
                },
                min: -5,
                max: 5
            },
            y: {
                title: {
                    display: true,
                    text: 'y'
                },
                min:-5,
                max: 5
            }
        }
    }
});

updateChart(); // Initial chart update

// Update the chart when sliders change
function updateChart() {
    m = parseFloat(slopeSlider.value);
    c = parseFloat(interceptSlider.value);
    slopeValue.textContent = m;
    interceptValue.textContent = c;

    const newData = generateLineData(m, c);
    lineChart.data.labels = newData.x;
    lineChart.data.datasets[0].data = newData.y;
    lineChart.update();
}

slopeSlider.addEventListener('input', updateChart);
interceptSlider.addEventListener('input', updateChart);