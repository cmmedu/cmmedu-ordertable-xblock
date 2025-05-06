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
            var number = currentOrderNumber + index;
            $(this).find('.order-cell').text(pretext_num + number + postext_num);
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
            // Guardar el contenido de ambas filas
            var currentContent = $row.find('.content-cell').html();
            var targetContent = $targetRow.find('.content-cell').html();
            
            // Intercambiar solo el contenido, manteniendo los números de orden intactos
            $row.find('.content-cell').html(targetContent);
            $targetRow.find('.content-cell').html(currentContent);
            
            // Mantener los atributos data-index originales
            var currentIndex = $row.attr('data-index');
            var targetIndex = $targetRow.attr('data-index');
            
            // No actualizar los números de orden
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
    
    // Obtener variables del backend
    var table_name = $element.find('.eol-order-table-content .order-header').first().text();
    var pretext_num = $element.find('.order-header').attr('pretext') || '';
    var postext_num = $element.find('.order-header').attr('postext') || '';
    
    console.log("[EOL-ORDER] Variables del backend:", {
        table_name: table_name,
        pretext_num: pretext_num,
        postext_num: postext_num
    });
    
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
        var $row = $(this);
        var content = $row.find('.content-cell').html();
        var originalIndex = $row.attr('data-index');
        
        elements.push({
            key: originalIndex,
            content: content
        });
        
        // Logs para depuración
        console.log("[EOL-ORDER] Inicializando elemento:", {
            key: originalIndex,
            content: content
        });
    });

    // Inicializar el ícono basado en el estado actual
    var $notification = $element.find('.notificacion');
    if (currentScore >= 1.0) {
        $notification.html('<img src="/static/images/correct-icon.png" alt="Respuesta Correcta"/> &nbsp; Respuesta Correcta');
        $submitButton.prop('disabled', true);
        $element.find('.move-up-button, .move-down-button').prop('disabled', true);
    } else if (currentScore === 0.0 && attempts > 0) {
        $notification.html('<img src="/static/images/incorrect-icon.png" alt="Respuesta Incorrecta"/> &nbsp; Respuesta Incorrecta');
        // Check if we should show the answer button
        if (attempts >= maxAttempts) {
            $element.append('<button class="ver_respuesta" data-checking="Cargando..." data-value="Ver Respuesta">' +
                '<span class="icon fa fa-info-circle" aria-hidden="true"></span><br>' +
                '<span>Mostrar<br>Respuesta</span>' +
                '</button>');
        }
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
            
            // Intercambiar solo el contenido, manteniendo los números de orden intactos
            $row.find('.content-cell').html(targetContent);
            $targetRow.find('.content-cell').html(currentContent);
            
            // Mantener los atributos data-index originales
            var currentIndex = $row.attr('data-index');
            var targetIndex = $targetRow.attr('data-index');
            
            // No actualizar los números de orden
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
                    // Usar el índice original del elemento
                    originalIndex = elements[i].key;
                    break;
                }
            }
            if (originalIndex !== -1) {
                order.push(originalIndex);
            }
        });
        
        // Logs para depuración
        console.log("[EOL-ORDER] Orden actual:", order.join('_'));
        console.log("[EOL-ORDER] Elementos en la tabla:");
        $itemsContainer.find('.item-row').each(function(index) {
            console.log(`[EOL-ORDER] Elemento ${index + 1}:`, {
                content: $(this).find('.content-cell').html(),
                key: $(this).attr('data-index')
            });
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
                        if(response.max_attempts > 0 && response.attempts >= response.max_attempts) {
                            $element.append('<button class="ver_respuesta" data-checking="Cargando..." data-value="Ver Respuesta">' +
                                '<span class="icon fa fa-info-circle" aria-hidden="true"></span><br>' +
                                '<span>Mostrar<br>Respuesta</span>' +
                                '</button>');
                        }
                    
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


    // Add click handler for "Mostrar Respuesta" button
    $element.on('click', '.ver_respuesta', function(e) {
        e.preventDefault();
        var $solution = $element.find('solution');
        var blockId = $element.attr('id');

        let table_name = $element.find('.eol-order-table-content .order-header').first().text();
        let textcolumn_order = $element.find('.status').attr('data-textcolumn-order') || '';
        let textcolumn_content = $element.find('.status').attr('data-textcolumn-content') || '';
        //let textcolumn_actions = $element.find('.order-header').attr('actions') || '';
        
        // Create table structure for the correct answer
        var tableHtml = '<p><b>Orden correcto:</b></p>' +
            '<table class="eol-order-table-content">' +
            '<thead>' +
            '<tr>'

        if (table_name != "") {
            tableHtml += '<th class="order-header" style="background-color: #f5f5f5; text-align: center;" colspan="2">' + table_name + '</th>'+
            '<tr>'
        }

        tableHtml += '<th class="order-header" style="background-color: #f5f5f5; text-align: center; width: 15%;">' + textcolumn_order + '</th>' +
            '<th class="content-header" style="background-color: #f5f5f5; text-align: center;">'+ textcolumn_content +'</th>' +
            '</tr>' +
            '</thead>' +
            '<tbody>';
        
        // Sort elements by their original key to show correct order
        var sortedElements = elements.slice().sort(function(a, b) {
            return parseInt(a.key) - parseInt(b.key);
        });
        
        // Get block-specific values
        let orderType = $element.find('.status').attr('data-order-type');
        let pretextNum = $element.find('.status').attr('data-pretext-num') || '';
        let postextNum = $element.find('.status').attr('data-posttext-num') || '';
        
        // Add rows for each element in correct order
        sortedElements.forEach(function(element, index) {
            var orderValue = '';
            
            switch(orderType) {
                case 'numbers':
                    orderValue = (index + 1);
                    break;
                case 'numbers_zero':
                    orderValue = index;
                    break;
                case 'letters':
                    orderValue = String.fromCharCode(97 + index); // a, b, c, ...
                    break;
                case 'roman':
                    orderValue = toRoman(index + 1);
                    break;
                default:
                    orderValue = (index + 1);
            }
            
            tableHtml += '<tr>' +
                '<td class="order-cell">' + pretextNum + orderValue + postextNum + '</td>' +
                '<td class="content-cell">' + element.content + '</td>' +
                '</tr>';
        });
        
        tableHtml += '</tbody></table>';
        
        // Update solution content and show it
        $solution.html(tableHtml);
        $solution.show();
        
        // Change button text to indicate answer is shown
        $(this).html('<span class="icon fa fa-eye-slash" aria-hidden="true"></span><br>' +
            '<span>Ocultar<br>Respuesta</span>');
        
        // Toggle between show/hide
        $(this).toggleClass('showing-answer');
    });

    // Helper function to convert numbers to Roman numerals
    function toRoman(num) {
        var roman = {
            M: 1000,
            CM: 900,
            D: 500,
            CD: 400,
            C: 100,
            XC: 90,
            L: 50,
            XL: 40,
            X: 10,
            IX: 9,
            V: 5,
            IV: 4,
            I: 1
        };
        var str = '';
        for (var i of Object.keys(roman)) {
            var q = Math.floor(num / roman[i]);
            num -= q * roman[i];
            str += i.repeat(q);
        }
        return str;
    }

    // Toggle answer visibility when clicking the button again
    $element.on('click', '.ver_respuesta.showing-answer', function(e) {
        e.preventDefault();
        var $solution = $element.find('solution');
        $solution.hide();
        
        // Change button text back to original
        $(this).html('<span class="icon fa fa-info-circle" aria-hidden="true"></span><br>' +
            '<span>Mostrar<br>Respuesta</span>');
        
        $(this).removeClass('showing-answer');
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