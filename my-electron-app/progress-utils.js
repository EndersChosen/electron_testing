// Global utility functions for progress bars with percent labels
// This file is loaded once in index.html and provides utilities to all renderer files

window.ProgressUtils = {
    enhanceProgressBarWithPercent: function (progressBar) {
        if (!progressBar) return null;

        // Check if percent label already exists
        let percentLabel = progressBar.querySelector('.progress-percent');
        if (!percentLabel) {
            // Create percent label element
            percentLabel = document.createElement('span');
            percentLabel.className = 'progress-percent';
            percentLabel.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #fff;
                font-weight: bold;
                font-size: 14px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                z-index: 1;
            `;
            percentLabel.textContent = '0%';

            // Make progress bar container relative positioned
            const progressContainer = progressBar.parentElement;
            if (progressContainer) {
                progressContainer.style.position = 'relative';
            }

            // Add the percent label to the progress container
            progressContainer.appendChild(percentLabel);
        }

        return percentLabel;
    },

    updateProgressWithPercent: function (progressBar, percent) {
        if (!progressBar) return;

        // Update the width as usual
        progressBar.style.width = `${percent}%`;

        // Update or create the percent label
        const percentLabel = window.ProgressUtils.enhanceProgressBarWithPercent(progressBar);
        if (percentLabel) {
            percentLabel.textContent = `${Math.round(percent)}%`;
        }
    }
};

// For convenience, create global aliases
window.enhanceProgressBarWithPercent = window.ProgressUtils.enhanceProgressBarWithPercent;
window.updateProgressWithPercent = window.ProgressUtils.updateProgressWithPercent;
