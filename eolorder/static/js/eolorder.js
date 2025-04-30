function EolOrderXBlockEdit(runtime, element) {
    'use strict';

    var $element = $(element);
    var $itemsContainer = $element.find('.items-container');
    var $addItemButton = $element.find('.add-item-button');
    var $saveButton = $element.find('.save-button');
    var $cancelButton = $element.find('.cancel-button');
    var $displayName = $element.find('#display_name');
    var currentOrderNumber = 1;

    function updateOrderNumbers() {
        var rowCount = $itemsContainer.find('.item-row').length;
        if (rowCount === 0) {
            currentOrderNumber = 1;
            return;
        }
        
        $itemsContainer.find('.item-row').each(function(index) {
            $(this).find('.order-cell').text(currentOrderNumber + index);
            $(this).attr('data-index', currentOrderNumber + index);
        });
    }

    function updateButtonStates() {
        $itemsContainer.find('.item-row').each(function(index) {
            var $row = $(this);
            var $upButton = $row.find('.move-up-button');
            var $downButton = $row.find('.move-down-button');
            
            $upButton.prop('disabled', index === 0);
            $downButton.prop('disabled', index === $itemsContainer.find('.item-row').length - 1);
        });
    }

    function addItem(content) {
        var $newRow = $('<tr class="item-row">' +
            '<td class="order-cell"></td>' +
            '<td class="content-cell"><textarea class="item-content"></textarea></td>' +
            '<td class="actions-cell">' +
            '<button class="move-up-button">↑</button>' +
            '<button class="move-down-button">↓</button>' +
            '<button class="delete-button">×</button>' +
            '</td>' +
            '</tr>');
        
        if (content) {
            $newRow.find('.item-content').val(content);
        }
        
        $itemsContainer.append($newRow);
        updateOrderNumbers();
        updateButtonStates();
    }

    function moveItem($row, direction) {
        var $targetRow;
        if (direction === 'up') {
            $targetRow = $row.prev('.item-row');
        } else {
            $targetRow = $row.next('.item-row');
        }
        
        if ($targetRow.length) {
            if (direction === 'up') {
                $row.insertBefore($targetRow);
            } else {
                $row.insertAfter($targetRow);
            }
            updateOrderNumbers();
            updateButtonStates();
        }
    }

    function getItems() {
        var items = [];
        $itemsContainer.find('.item-content').each(function() {
            items.push($(this).val());
        });
        return items;
    }

    $addItemButton.on('click', function(e) {
        e.preventDefault();
        addItem();
    });

    $itemsContainer.on('click', '.move-up-button', function(e) {
        e.preventDefault();
        moveItem($(this).closest('.item-row'), 'up');
    });

    $itemsContainer.on('click', '.move-down-button', function(e) {
        e.preventDefault();
        moveItem($(this).closest('.item-row'), 'down');
    });

    $itemsContainer.on('click', '.delete-button', function(e) {
        e.preventDefault();
        $(this).closest('.item-row').remove();
        updateOrderNumbers();
        updateButtonStates();
    });

    $saveButton.on('click', function(e) {
        e.preventDefault();
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        var data = {
            display_name: $displayName.val(),
            items: getItems()
        };
        
        $.ajax({
            type: 'POST',
            url: handlerUrl,
            data: JSON.stringify(data),
            success: function(response) {
                if (response.result === 'success') {
                    window.location.reload(false);
                }
            }
        });
    });

    $cancelButton.on('click', function(e) {
        e.preventDefault();
        window.location.reload(false);
    });

    // Initialize button states
    updateButtonStates();
}

function EolOrderXBlock(runtime, element) {
    'use strict';

    var $element = $(element);
    var blockId = $element.attr('id');
    var $itemsContainer = $element.find('.items-container');
    var $submitButton = $element.find('.eol-order-submit');
    var handlerUrl = runtime.handlerUrl(element, 'submit_answer');
    var elements = [];
    var imagePath = $element.attr('data-image-path');
    
    // Obtener el estado actual
    var currentScore = parseFloat($element.find('.status').attr('data-score') || '0');
    var attempts = parseInt($element.find('.submission-feedback').text().match(/\d+/)[0] || '0');
    var maxAttempts = parseInt($element.find('.submission-feedback').text().match(/\d+/g)[1] || '0');
    
    console.log("[EOL-ORDER] Estado inicial:", {
        score: currentScore,
        attempts: attempts,
        maxAttempts: maxAttempts
    });

    // Inicializar el array de elementos
    $itemsContainer.find('.item-row').each(function() {
        elements.push({
            key: $(this).attr('data-index'),
            content: $(this).find('.content-cell').html()
        });
    });

    // Inicializar el ícono basado en el estado actual
    var $notification = $element.find('.notificacion');
    if (currentScore >= 1.0) {
        $notification.html('<img src="' + imagePath + 'correct-icon.png" alt="Respuesta Correcta"/> &nbsp; Respuesta Correcta');
        $submitButton.prop('disabled', true);
        $element.find('.move-up-button, .move-down-button').prop('disabled', true);
    } else if (currentScore === 0.0 && attempts > 0) {
        $notification.html('<img src="' + imagePath + 'incorrect-icon.png" alt="Respuesta Incorrecta"/> &nbsp; Respuesta Incorrecta');
    }

    function updateButtonStates() {
        $itemsContainer.find('.item-row').each(function(index) {
            var $row = $(this);
            var $upButton = $row.find('.move-up-button');
            var $downButton = $row.find('.move-down-button');
            
            $upButton.prop('disabled', index === 0);
            $downButton.prop('disabled', index === $itemsContainer.find('.item-row').length - 1);
        });
    }

    function moveItem($row, direction) {
        var $targetRow;
        if (direction === 'up') {
            $targetRow = $row.prev('.item-row');
        } else {
            $targetRow = $row.next('.item-row');
        }
        
        if ($targetRow.length) {
            // Guardar el contenido de ambas filas
            var currentContent = $row.find('.content-cell').html();
            var targetContent = $targetRow.find('.content-cell').html();
            
            // Intercambiar solo el contenido
            $row.find('.content-cell').html(targetContent);
            $targetRow.find('.content-cell').html(currentContent);
            
            updateButtonStates();
        }
    }

    function getCurrentOrder() {
        var order = [];
        // Obtener los elementos en el orden actual de la tabla
        $itemsContainer.find('.item-row').each(function() {
            // Obtener el contenido del elemento
            var content = $(this).find('.content-cell').html();
            // Buscar el índice original del elemento en el array de elementos
            var originalIndex = -1;
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].content === content) {
                    originalIndex = elements[i].key;
                    break;
                }
            }
            if (originalIndex !== -1) {
                order.push(originalIndex);
            }
        });
        return order.join('_');
    }

    $itemsContainer.on('click', '.move-up-button', function(e) {
        e.preventDefault();
        moveItem($(this).closest('.item-row'), 'up');
    });

    $itemsContainer.on('click', '.move-down-button', function(e) {
        e.preventDefault();
        moveItem($(this).closest('.item-row'), 'down');
    });

    $submitButton.on('click', function(e) {
        e.preventDefault();
        var orderString = getCurrentOrder();
        
        // Logs detallados de lo que envía el usuario
        console.log("[EOL-ORDER] Usuario enviando respuesta:");
        console.log("[EOL-ORDER] Orden actual:", orderString);
        console.log("[EOL-ORDER] Elementos en la tabla:");
        $itemsContainer.find('.item-row').each(function(index) {
            console.log(`[EOL-ORDER] Elemento ${index + 1}:`, {
                content: $(this).find('.content-cell').html(),
                key: $(this).attr('data-index')
            });
        });
        
        var data = {
            order: orderString
        };
        
        $.ajax({
            type: 'POST',
            url: handlerUrl,
            data: JSON.stringify(data),
            success: function(response) {
                if (response.result === 'success') {
                    // Logs de la respuesta del servidor
                    console.log("[EOL-ORDER] Respuesta del servidor:", response);
                    
                    // Actualizar el contador de intentos
                    if (response.attempts && response.max_attempts) {
                        var attemptsText = "Ha realizado " + response.attempts + " de " + response.max_attempts + " intentos";
                        if (response.max_attempts === 1) {
                            attemptsText = "Ha realizado " + response.attempts + " de " + response.max_attempts + " intento";
                        }
                        $element.find('.submission-feedback').text(attemptsText);
                    }

                    // Actualizar el ícono de correcto/incorrecto
                    var $notification = $element.find('.notificacion');
                    if (response.is_correct) {
                        $notification.html('<img src="/static/images/correct-icon.png" alt="Respuesta Correcta"/> &nbsp; Respuesta Correcta');
                    } else {
                        $notification.html('<img src="/static/images/incorrect-icon.png" alt="Respuesta Incorrecta"/> &nbsp; Respuesta Incorrecta');
                    }

                    // Si la respuesta es correcta o no quedan intentos, deshabilitar el botón
                    if (response.is_correct || (response.max_attempts > 0 && response.attempts >= response.max_attempts)) {
                        $submitButton.prop('disabled', true);
                        $element.find('.move-up-button, .move-down-button').prop('disabled', true);
                    }
                } else {
                    console.error("[EOL-ORDER] Error en la respuesta:", response);
                    alert('Error: ' + response.message);
                }
            },
            error: function(xhr, status, error) {
                console.error("[EOL-ORDER] Error al enviar la respuesta:", {
                    status: status,
                    error: error,
                    response: xhr.responseText
                });
                alert('Error al guardar el orden. Por favor, intente nuevamente.');
            }
        });
    });

    // Initialize button states
    updateButtonStates();
}

document.addEventListener('DOMContentLoaded', function() {
    const disorderContainer = document.getElementById('disorder-container');
    let draggingItem = null;

    if (disorderContainer) {
        disorderContainer.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('disorder-item')) {
                draggingItem = e.target;
                e.target.classList.add('dragging');
            }
        });

        disorderContainer.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('disorder-item')) {
                e.target.classList.remove('dragging');
                document.querySelectorAll('.disorder-item')
                    .forEach(item => item.classList.remove('over'));
                draggingItem = null;
            }
        });

        disorderContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingOverItem = getDragAfterElement(disorderContainer, e.clientX);
            document.querySelectorAll('.disorder-item').forEach(item => item.classList.remove('over'));
            
            if (draggingOverItem) {
                draggingOverItem.classList.add('over');
                disorderContainer.insertBefore(draggingItem, draggingOverItem);
            } else {
                disorderContainer.appendChild(draggingItem);
            }
        });

        function getDragAfterElement(container, x) {
            const draggableElements = [...container.querySelectorAll('.disorder-item:not(.dragging)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = x - box.left - box.width / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
    }
}); 