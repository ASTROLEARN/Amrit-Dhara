// Test script to verify PDF export functionality
// This would be run in the browser console to test the export feature

console.log('Testing PDF Export Functionality');

// Test 1: Check if export function exists
if (typeof exportAllChartsPDF === 'function') {
    console.log('✅ exportAllChartsPDF function exists');
} else {
    console.log('❌ exportAllChartsPDF function not found');
}

// Test 2: Check if chart elements exist
const chartIds = ['concentrations-chart', 'indices-chart', 'distribution-chart', 'trends-chart'];
let chartsFound = 0;

chartIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        console.log(`✅ Chart element found: ${id}`);
        chartsFound++;
    } else {
        console.log(`❌ Chart element not found: ${id}`);
    }
});

console.log(`Found ${chartsFound}/${chartIds.length} chart elements`);

// Test 3: Check if button exists and has correct attributes
const exportButton = document.querySelector('button[onclick*="exportAllChartsPDF"]');
if (exportButton) {
    console.log('✅ Export PDF button found');
    console.log('Button disabled state:', exportButton.disabled);
    console.log('Button text:', exportButton.textContent);
} else {
    console.log('❌ Export PDF button not found');
}

// Test 4: Check if required libraries are loaded
if (typeof html2canvas !== 'undefined') {
    console.log('✅ html2canvas library loaded');
} else {
    console.log('❌ html2canvas library not loaded');
}

if (typeof jsPDF !== 'undefined') {
    console.log('✅ jsPDF library loaded');
} else {
    console.log('❌ jsPDF library not loaded');
}

console.log('PDF Export Test Complete');