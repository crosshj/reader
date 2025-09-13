// Basic Capacitor app functionality
document.addEventListener('DOMContentLoaded', function() {
    const testButton = document.getElementById('testButton');
    const status = document.getElementById('status');
    
    testButton.addEventListener('click', async function() {
        try {
            // Test if we're running in a Capacitor environment
            if (window.Capacitor) {
                status.textContent = 'Capacitor is available! Platform: ' + window.Capacitor.getPlatform();
            } else {
                status.textContent = 'Running in web browser (Capacitor not available)';
            }
        } catch (error) {
            status.textContent = 'Error: ' + error.message;
        }
    });
    
    // Show initial status
    status.textContent = 'Ready to test Capacitor functionality';
});
