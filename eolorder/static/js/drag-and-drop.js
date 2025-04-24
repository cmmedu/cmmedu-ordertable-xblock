(function() {
    console.log('drag-and-drop.js script loaded');
    
    let initialized = false;
    let currentContainer = null;
    let mouseMoveHandler = null;
    let mouseUpHandler = null;
    let mouseDownHandler = null;
    
    function cleanup() {
        console.log('Cleaning up drag and drop');
        if (currentContainer) {
            const items = currentContainer.querySelectorAll('.disorder-item');
            items.forEach(item => {
                if (mouseDownHandler) {
                    item.removeEventListener('mousedown', mouseDownHandler);
                }
            });
            currentContainer = null;
        }
        
        if (mouseMoveHandler) {
            document.removeEventListener('mousemove', mouseMoveHandler);
            mouseMoveHandler = null;
        }
        
        if (mouseUpHandler) {
            document.removeEventListener('mouseup', mouseUpHandler);
            mouseUpHandler = null;
        }
        
        initialized = false;
    }
    
    function initDragAndDrop() {
        console.log('Initializing drag and drop');
        console.log('Document readyState:', document.readyState);
        
        // Clean up any existing listeners
        cleanup();
        
        // Wait a bit to ensure DOM is fully loaded
        setTimeout(function() {
            const container = document.getElementById('disorder-container');
            console.log('Container found:', container);
            
            if (!container) {
                console.error('Container not found, retrying...');
                // Try to find the container by class as fallback
                const containers = document.getElementsByClassName('disorder-preview');
                console.log('Found containers by class:', containers.length);
                if (containers.length > 0) {
                    container = containers[0];
                    console.log('Using first container found by class');
                }
            }

            if (!container) {
                console.error('Container still not found after retry');
                return;
            }

            currentContainer = container;
            let draggingEle;
            let placeholder;
            let isDraggingStarted = false;
            let x = 0;
            let y = 0;

            // Swap two nodes
            const swap = function (nodeA, nodeB) {
                const parentA = nodeA.parentNode;
                const siblingA = nodeA.nextSibling === nodeB ? nodeA : nodeA.nextSibling;

                // Move nodeA to before the nodeB
                nodeB.parentNode.insertBefore(nodeA, nodeB);

                // Move nodeB to before the sibling of nodeA
                parentA.insertBefore(nodeB, siblingA);
            };

            // Check if nodeA is to the left of nodeB
            const isLeft = function (nodeA, nodeB) {
                const rectA = nodeA.getBoundingClientRect();
                const rectB = nodeB.getBoundingClientRect();
                return rectA.left + rectA.width / 2 < rectB.left + rectB.width / 2;
            };

            mouseDownHandler = function (e) {
                console.log('mousedown event triggered');
                draggingEle = e.target;
                console.log('Target element:', draggingEle);
                
                if (!draggingEle.classList.contains('disorder-item')) {
                    console.log('Not a disorder-item, ignoring');
                    return;
                }

                // Calculate the mouse position relative to the element's center
                const rect = draggingEle.getBoundingClientRect();
                x = e.clientX - (rect.left + rect.width / 2);
                y = e.clientY - (rect.top + rect.height / 2);

                // Add dragging class
                draggingEle.classList.add('dragging');

                // Create placeholder
                placeholder = document.createElement('div');
                placeholder.classList.add('placeholder');
                draggingEle.parentNode.insertBefore(placeholder, draggingEle.nextSibling);
                placeholder.style.width = rect.width + 'px';
                placeholder.style.height = rect.height + 'px';

                // Set position for dragging element
                draggingEle.style.position = 'absolute';
                draggingEle.style.top = (e.clientY - y) + 'px';
                draggingEle.style.left = (e.clientX - x) + 'px';
                draggingEle.style.width = rect.width + 'px';
                draggingEle.style.zIndex = '1000';
                draggingEle.style.cursor = 'grabbing';
                draggingEle.style.transform = 'scale(1.05)';

                // Prevent text selection while dragging
                document.body.style.userSelect = 'none';

                // Attach the listeners to document
                document.addEventListener('mousemove', mouseMoveHandler);
                document.addEventListener('mouseup', mouseUpHandler);
            };

            mouseMoveHandler = function (e) {
                console.log('mousemove event triggered');
                if (!draggingEle) return;

                // Update position of dragging element, centering it on the cursor
                draggingEle.style.top = (e.clientY - y) + 'px';
                draggingEle.style.left = (e.clientX - x) + 'px';

                // Get all items except the dragging one
                const items = Array.from(container.querySelectorAll('.disorder-item:not(.dragging)'));

                // Find the closest item
                const closest = items.reduce((closest, child) => {
                    const box = child.getBoundingClientRect();
                    const offset = e.clientX - (box.left + box.width / 2);

                    if (offset < 0 && offset > closest.offset) {
                        return { offset: offset, element: child };
                    } else {
                        return closest;
                    }
                }, { offset: Number.NEGATIVE_INFINITY }).element;

                if (closest) {
                    if (isLeft(draggingEle, closest)) {
                        container.insertBefore(placeholder, closest);
                    } else {
                        container.insertBefore(placeholder, closest.nextSibling);
                    }
                }
            };

            mouseUpHandler = function () {
                console.log('mouseup event triggered');
                if (!draggingEle) return;

                // Remove placeholder
                if (placeholder && placeholder.parentNode) {
                    placeholder.parentNode.removeChild(placeholder);
                }

                // Reset dragging element
                draggingEle.style.removeProperty('top');
                draggingEle.style.removeProperty('left');
                draggingEle.style.removeProperty('position');
                draggingEle.style.removeProperty('width');
                draggingEle.style.removeProperty('z-index');
                draggingEle.style.removeProperty('cursor');
                draggingEle.style.removeProperty('transform');
                draggingEle.classList.remove('dragging');

                // Reset text selection
                document.body.style.removeProperty('user-select');

                // Reset variables
                draggingEle = null;
                placeholder = null;
                isDraggingStarted = false;
                x = 0;
                y = 0;

                // Remove the handlers
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
            };

            // Add event listeners to each draggable item
            const items = container.querySelectorAll('.disorder-item');
            console.log('Found items:', items.length);
            
            items.forEach(item => {
                console.log('Adding mousedown listener to item');
                item.addEventListener('mousedown', mouseDownHandler);
            });
            
            initialized = true;
        }, 1000); // Wait 1 second before initializing
    }

    // Try to initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDragAndDrop);
    } else {
        initDragAndDrop();
    }
    
    // Reinitialize when the editor is reopened
    function checkForEditor() {
        const editor = document.querySelector('.wrapper-comp-settings');
        if (editor && !initialized) {
            console.log('Editor detected, reinitializing drag and drop');
            initDragAndDrop();
        }
    }
    
    // Check for editor periodically
    setInterval(checkForEditor, 1000);
    
    // Also check when clicking anywhere in the document
    document.addEventListener('click', function(e) {
        checkForEditor();
    });
})();