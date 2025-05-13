(function() {
    console.log('drag-and-drop.js script loaded');
    
    let observer = null;
    let currentContainer = null;
    let draggedItem = null;
    let draggedItemIndex = -1;
    let dropTarget = null;
    let isDragging = false;
    
    function cleanup() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        
        if (currentContainer) {
            const items = currentContainer.querySelectorAll('.disorder-item');
            items.forEach(item => {
                item.removeAttribute('draggable');
                item.removeEventListener('dragstart', handleDragStart);
                item.removeEventListener('dragend', handleDragEnd);
            });
            currentContainer.removeEventListener('dragover', handleDragOver);
            currentContainer.removeEventListener('drop', handleDrop);
            currentContainer = null;
        }
        
        draggedItem = null;
        draggedItemIndex = -1;
        dropTarget = null;
        isDragging = false;
    }
    
    function handleDragStart(e) {
        console.log('DragStart');
        isDragging = true;
        draggedItem = e.target;
        draggedItemIndex = Array.from(currentContainer.children).indexOf(draggedItem);
        console.log('Dragged item index:', draggedItemIndex);
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.id);
    }
    
    function handleDragEnd(e) {
        console.log('DragEnd');
        e.target.classList.remove('dragging');
        draggedItem = null;
        draggedItemIndex = -1;
        dropTarget = null;
        isDragging = false;
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (!draggedItem) {
            console.log('No dragged item');
            return;
        }
        
        const items = Array.from(currentContainer.querySelectorAll('.disorder-item:not(.dragging)'));
        let closest = null;
        let closestOffset = Number.NEGATIVE_INFINITY;
        
        // Verificar cada elemento horizontalmente
        items.forEach(item => {
            const box = item.getBoundingClientRect();
            const offset = e.clientX - (box.left + box.width / 2);
            
            // Log para cada elemento que estamos pasando
            const labelElement = item.querySelector('.item-label');
            const labelText = labelElement ? labelElement.textContent.trim() : 'No label found';
            const itemIndex = Array.from(currentContainer.children).indexOf(item);
            
            console.log('=== Passing Over Item ===');
            console.log('Item index:', itemIndex);
            console.log('Item label:', labelText);
            console.log('Horizontal offset from center:', offset);
            console.log('Is to the left of center:', offset < 0);
            console.log('=======================');

            // Encontrar el elemento más cercano horizontalmente
            if (offset < 0 && offset > closestOffset) {
                closestOffset = offset;
                closest = item;
            }
        });
        
        if (closest) {
            const rect = closest.getBoundingClientRect();
            const offset = e.clientX - (rect.left + rect.width / 2);
            const closestIndex = Array.from(currentContainer.children).indexOf(closest);
            
            console.log('=== Selected Target ===');
            console.log('Selected item index:', closestIndex);
            console.log('Selected item label:', closest.querySelector('.item-label')?.textContent.trim());
            console.log('Final horizontal offset:', offset);
            console.log('Insert before:', offset < 0);
            console.log('=======================');

            // Actualizar el dropTarget con la nueva posición
            dropTarget = {
                element: closest,
                insertBefore: offset < 0
            };
            
            // Solo mover visualmente si la posición ha cambiado significativamente
            if (Math.abs(closestIndex - draggedItemIndex) > 0) {
                if (offset < 0) {
                    currentContainer.insertBefore(draggedItem, closest);
                } else {
                    currentContainer.insertBefore(draggedItem, closest.nextSibling);
                }
                draggedItemIndex = Array.from(currentContainer.children).indexOf(draggedItem);
                console.log('New dragged index:', draggedItemIndex);
            }
        } else {
            console.log('No closest item found - outside container bounds');
        }
    }
    
    function handleDrop(e) {
        console.log('Drop');
        e.preventDefault();
        
        if (!draggedItem || !dropTarget) {
            console.log('No dragged item or drop target');
            return;
        }
        
        console.log('Performing drop');
        console.log('Dragged item:', draggedItem.id);
        console.log('Drop target:', dropTarget.element.id);
        console.log('Insert before:', dropTarget.insertBefore);
        
        if (dropTarget.insertBefore) {
            currentContainer.insertBefore(draggedItem, dropTarget.element);
        } else {
            currentContainer.insertBefore(draggedItem, dropTarget.element.nextSibling);
        }
        
        const newOrder = Array.from(currentContainer.children).map((item, index) => {
            return {
                id: item.id,
                order: index
            };
        });
        
        console.log('New order:', newOrder);
        
        draggedItem.classList.remove('dragging');
        draggedItem = null;
        draggedItemIndex = -1;
        dropTarget = null;
        isDragging = false;
    }
    
    function initDragAndDrop() {
        // No reinicializar si hay un arrastre en curso
        if (isDragging) {
            console.log('Skipping reinitialization during drag');
            return;
        }

        cleanup();
        
        const container = document.getElementById('disorder-container');
        if (!container) {
            console.log('Container not found, waiting...');
            return;
        }
        
        currentContainer = container;
        
        // Make items draggable
        const items = container.querySelectorAll('.disorder-item');
        items.forEach(item => {
            item.setAttribute('draggable', 'true');
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
        });

        // Add container event listeners
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
        
        // Set up observer to watch for changes in the container
        observer = new MutationObserver((mutations) => {
            // No reinicializar si hay un arrastre en curso
            if (isDragging) {
                console.log('Skipping observer during drag');
                return;
            }
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Reinitialize if items are added or removed
                    initDragAndDrop();
                }
    });
});
        
        observer.observe(container, {
            childList: true,
            subtree: true
        });
        
        console.log('Drag and drop initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDragAndDrop);
    } else {
        initDragAndDrop();
    }
    
    // Also initialize when the editor is opened
    const checkForEditor = setInterval(() => {
        // No reinicializar si hay un arrastre en curso
        if (isDragging) {
            console.log('Skipping editor check during drag');
            return;
        }
        
        const editor = document.querySelector('.wrapper-comp-settings');
        if (editor) {
            initDragAndDrop();
        }
    }, 1000);
    
    // Clean up when the page is unloaded
    window.addEventListener('unload', cleanup);
})();