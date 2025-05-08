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
            // Intercambiar los data-key
            var currentKey = $row.attr('data-key');
            var targetKey = $targetRow.attr('data-key');
            
            // Guardar el contenido
            var currentContent = $row.find('.content-cell').html();
            var targetContent = $targetRow.find('.content-cell').html();
            
            // Intercambiar el contenido
            $row.find('.content-cell').html(targetContent);
            $targetRow.find('.content-cell').html(currentContent);
            
            // Intercambiar los data-key
            $row.attr('data-key', targetKey);
            $targetRow.attr('data-key', currentKey);
            
            console.log("[EOL-ORDER] Movimiento realizado:", {
                direction: direction,
                currentKey: currentKey,
                targetKey: targetKey
            });
            
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

function EolOrderXBlock(runtime, element, settings) {
    'use strict';

    var $element = $(element);
    var blockId = $element.attr('id');
    var $itemsContainer = $element.find('.items-container');
    var $submitButton = $element.find('.eol-order-submit');
    var handlerUrl = runtime.handlerUrl(element, 'submit_answer');
    var elements = [];
    var imagePath = $element.attr('data-image-path');
    
    // Add variables for state caching with unique sublocation identifier
    var $xblocksContainer = $('#seq_content');
    var xblockId = settings.location;
    var sublocation = settings.sublocation;
    var cachedStateId = 'order_state_' + sublocation;
    
    console.log("[EOL-ORDER] Inicializando XBlock:", {
        xblockId: xblockId,
        sublocation: sublocation,
        cachedStateId: cachedStateId
    });
    
    // Obtener variables del backend
    var table_name = settings.table_name;
    var textcolumn_order = settings.textcolumn_order;   
    var textcolumn_content = settings.textcolumn_content;
    var textcolumn_actions = settings.textcolumn_actions;
    var numbering_type = settings.numbering_type
    var pretext_num = settings.pretext_num;
    var postext_num = settings.postext_num;
    
    // Obtener el estado actual
    var currentScore = parseFloat($element.find('.status').attr('data-score') || '0');
    var attempts = parseInt($element.find('.submission-feedback').text().match(/\d+/)[0] || '0');
    var maxAttempts = parseInt($element.find('.submission-feedback').text().match(/\d+/g)[1] || '0');
    
    console.log("[EOL-ORDER] Estado inicial para XBlock " + xblockId + ":", {
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
        /*
        console.log("[EOL-ORDER] Inicializando elemento:", {
            key: originalIndex,
            content: content
        });
        */
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
            // Intercambiar los data-key
            var currentKey = $row.attr('data-key');
            var targetKey = $targetRow.attr('data-key');
            
            // Guardar el contenido
            var currentContent = $row.find('.content-cell').html();
            var targetContent = $targetRow.find('.content-cell').html();
            
            // Intercambiar el contenido
            $row.find('.content-cell').html(targetContent);
            $targetRow.find('.content-cell').html(currentContent);
            
            // Intercambiar los data-key
            $row.attr('data-key', targetKey);
            $targetRow.attr('data-key', currentKey);
            
            console.log("[EOL-ORDER] Movimiento realizado:", {
                direction: direction,
                currentKey: currentKey,
                targetKey: targetKey
            });
            
            updateButtonStates();
        }
    }

    function getCurrentOrder() {
        var order = [];
        // Usar la tabla correcta
        var $tbody = $element.find('.eol-order-table-content tbody');
        
        console.log("[EOL-ORDER] Buscando orden en tabla:", $tbody.length ? "encontrada" : "no encontrada");
        
        $tbody.find('.item-row').each(function() {
            var key = $(this).attr('data-key');
            console.log("[EOL-ORDER] Fila encontrada, data-key:", key);
            if (key) {
                order.push(key);
            }
        });
        
        var orderString = order.join('_');
        console.log("[EOL-ORDER] Orden actual obtenido:", orderString);
        console.log("[EOL-ORDER] Estado actual de la tabla:", $tbody.html());
        
        return orderString;
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
        
        // Get current order
        var orderString = getCurrentOrder();
        console.log("[EOL-ORDER] Enviando orden:", orderString);
        
        // Send both 'order' and 'answer' for compatibility
        var data = {
            order: orderString,
            answer: orderString
        };
        
        $.post(handlerUrl, JSON.stringify(data))
            .done(function(response) {
                console.log("[EOL-ORDER] Respuesta recibida:", response);
                if (response.result === 'success') {
                    // Update UI with response
                    updateUIWithResponse(response);
                } else {
                    // Show error message
                    showMessage(response.message || 'Error al enviar la respuesta', 'error');
                }
            })
            .fail(function() {
                console.log("[EOL-ORDER] Error en la petición");
                showMessage('Error al enviar la respuesta', 'error');
        });
    });

    // Add click handler for "Mostrar Respuesta" button
    $element.on('click', '.ver_respuesta', function(e) {
        e.preventDefault();
        var $solution = $element.find('solution');
        var blockId = $element.attr('id');
        
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
        

        
        // Add rows for each element in correct order
        sortedElements.forEach(function(element, index) {
            var orderValue = '';
            
            switch(numbering_type) {
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
                '<td class="order-cell">' + pretext_num + orderValue + postext_num + '</td>' +
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

        // Esperar a que el DOM se actualice antes de renderizar MathJax
        setTimeout(function() {
            if (typeof MathJax !== "undefined") {
                console.log("[EOL-ORDER] Renderizando MathJax en la tabla de respuesta");
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, $solution[0]]);
            } else {
                console.warn("[EOL-ORDER] MathJax no está cargado");
            }
        }, 100);
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

    function updateUIWithResponse(response) {
        // Update attempts counter
        if (response.attempts && response.max_attempts) {
            var attemptsText = "Ha realizado " + response.attempts + " de " + response.max_attempts + " intentos";
            if (response.max_attempts === 1) {
                attemptsText = "Ha realizado " + response.attempts + " de " + response.max_attempts + " intento";
                }
                $element.find('.submission-feedback').text(attemptsText);
            }
            
        // Update notification area
            var $notification = $element.find('.notificacion');
        if (response.is_correct) {
                $notification.html('<img src="/static/images/correct-icon.png" alt="Respuesta Correcta"/> &nbsp; Respuesta Correcta');
                $submitButton.prop('disabled', true);
                $element.find('.move-up-button, .move-down-button').prop('disabled', true);
        } else {
                $notification.html('<img src="/static/images/incorrect-icon.png" alt="Respuesta Incorrecta"/> &nbsp; Respuesta Incorrecta');
            // Show answer button if no more attempts
            if (response.max_attempts > 0 && response.attempts >= response.max_attempts && !$element.find('.ver_respuesta').length) {
                    $element.append('<button class="ver_respuesta" data-checking="Cargando..." data-value="Ver Respuesta">' +
                        '<span class="icon fa fa-info-circle" aria-hidden="true"></span><br>' +
                        '<span>Mostrar<br>Respuesta</span>' +
                        '</button>');
                }
            }

        // Update status class
        var $statusDiv = $element.find('.status');
        $statusDiv.removeClass('correct incorrect unanswered');
        $statusDiv.addClass(response.is_correct ? 'correct' : 'incorrect');
            
            // Disable submit button if needed
        if (response.is_correct || (response.max_attempts > 0 && response.attempts >= response.max_attempts)) {
                $submitButton.prop('disabled', true);
                $element.find('.move-up-button, .move-down-button').prop('disabled', true);
            }

        // Save complete state object with sublocation identifier
        var currentOrder = getCurrentOrder();
        var state = {
            sublocation: sublocation,
            indicator_class: response.is_correct ? 'correct' : 'incorrect',
            score: response.score,
            attempts: response.attempts,
            max_attempts: response.max_attempts,
            show_correctness: response.show_correctness,
            show_answer: response.show_answer,
            order: currentOrder
        };
        
        // Store state both in element and shared container
        $element.data('state', state);
        $xblocksContainer.data(cachedStateId, state);
        
        console.log("[EOL-ORDER] Estado actualizado para XBlock " + sublocation + ":", state);
    }

    function showMessage(message, type) {
        var $notification = $element.find('.notificacion');
        if (type === 'error') {
            $notification.html('<img src="/static/images/incorrect-icon.png" alt="Error"/> &nbsp; ' + message);
        } else {
            $notification.html(message);
        }
    }

    // Initialize: Check for cached state and restore if found
    $(function() {
        var cachedState = $xblocksContainer.data(cachedStateId);
        if (cachedState && cachedState.sublocation === sublocation) {
            console.log("[EOL-ORDER] Restaurando estado en caché para XBlock " + sublocation);
            updateUIWithState(cachedState);
            
            // Restore table order
            if (settings.ordeingelements) {
                restoreTableOrder(cachedState.order);
            }
        } else {
            console.log("[EOL-ORDER] No se encontró estado en caché para XBlock " + sublocation);
        }
    });

    function restoreTableOrder(order) {
        if (!order || !settings.ordeingelements) return;
        
        console.log("[EOL-ORDER] Restaurando orden de tabla para XBlock " + sublocation);
        var orderArray = order.split('_');
            var $table = $element.find('.eol-order-table-content');
            var $tbody = $table.find('tbody');
            
            // Limpiar el tbody existente
            $tbody.find('.item-row').remove();
            
            // Rebuild the table in the correct order
            orderArray.forEach(function(index, arrayIndex) {
            var element = settings.ordeingelements[index].content;
                if (element) {
                var $row = $('<tr class="item-row" data-key="' + index + '">' +
                        '<td class="order-cell">' + pretext_num + index + postext_num + '</td>' +
                        '<td class="content-cell">' + element + '</td>' +
                    '<td class="actions-cell" style="text-align: center;">' +
                        '<button class="move-up-button">↑</button>' +
                        '<button class="move-down-button">↓</button>' +
                        '</td>' +
                        '</tr>');
                    $tbody.append($row);
                }
            });
            
            // Update button states after rebuilding
            updateButtonStates();
            
            // Re-render MathJax if needed
            var ordertableid = "order_" + settings.sublocation;
            renderMathForSpecificElements(ordertableid);
    }

    // Add visibility change handler
    var visibilityHandler = function() {
        if (!document.hidden) {
            // When returning to the tab, refresh the state from the server
            $.ajax({
                type: 'POST',
                url: runtime.handlerUrl(element, 'get_state'),
                data: JSON.stringify({}),
                success: function(response) {
                    console.log("[EOL-ORDER] Estado recibido del servidor para XBlock " + sublocation + ":", response);
                    if (response) {
                        // Update UI with the fresh state from server
                        var state = {
                            sublocation: sublocation,
                            ...response
                        };
                        updateUIWithState(state);
                        // Restore table order if needed
                        if (response.user_answer) {
                            restoreTableOrder(response.user_answer);
                        }
                    }
                },
                error: function(xhr, status, error) {
                    console.error("[EOL-ORDER] Error al actualizar estado para XBlock " + sublocation + ":", error);
                }
            });
        }
    };

    // Remove any existing handler and add the new one
    document.removeEventListener('visibilitychange', visibilityHandler);
    document.addEventListener('visibilitychange', visibilityHandler);

    function updateUIWithState(state) {
        if (!state || state.sublocation !== sublocation) {
            console.log("[EOL-ORDER] Estado ignorado para XBlock " + sublocation + " (estado no coincide)");
            return;
        }
        
        console.log("[EOL-ORDER] Actualizando UI para XBlock " + sublocation + " con estado:", state);
        
        // Update score and attempts
        if (state.score !== undefined) {
            currentScore = parseFloat(state.score);
            $element.find('.status').attr('data-score', currentScore);
        }
        
        if (state.attempts !== undefined && state.max_attempts !== undefined) {
            attempts = parseInt(state.attempts);
            maxAttempts = parseInt(state.max_attempts);
            
            var attemptsText = "Ha realizado " + attempts + " de " + maxAttempts + " intentos";
            if (maxAttempts === 1) {
                attemptsText = "Ha realizado " + attempts + " de " + maxAttempts + " intento";
            }
            $element.find('.submission-feedback').text(attemptsText);
        }

        // Update notification area based on score
        var $notification = $element.find('.notificacion');
        if (currentScore >= 1.0) {
            $notification.html('<img src="/static/images/correct-icon.png" alt="Respuesta Correcta"/> &nbsp; Respuesta Correcta');
            $submitButton.prop('disabled', true);
            $element.find('.move-up-button, .move-down-button').prop('disabled', true);
        } else if (currentScore === 0.0 && attempts > 0) {
            $notification.html('<img src="/static/images/incorrect-icon.png" alt="Respuesta Incorrecta"/> &nbsp; Respuesta Incorrecta');
            
            // Show answer button if no more attempts
            if (attempts >= maxAttempts && !$element.find('.ver_respuesta').length) {
                $element.append('<button class="ver_respuesta" data-checking="Cargando..." data-value="Ver Respuesta">' +
                    '<span class="icon fa fa-info-circle" aria-hidden="true"></span><br>' +
                    '<span>Mostrar<br>Respuesta</span>' +
                    '</button>');
            }
        } else {
            $notification.empty();
            $submitButton.prop('disabled', false);
            $element.find('.move-up-button, .move-down-button').prop('disabled', false);
        }

        // Store the updated state in both places
        $element.data('state', state);
        $xblocksContainer.data(cachedStateId, state);
    }

    var ordertableid = "order_" + settings.sublocation;
    renderMathForSpecificElements(ordertableid);

    function renderMathForSpecificElements(id) {
        console.log("Render mathjax in " + id)
        if (typeof MathJax !== "undefined") {
            var $ordtab = $('#' + id);
            //console.log("encontrado " )
            //console.log($ordtab)
            if ($ordtab.length) {
                $ordtab.find('.eol-order-table-content').each(function (index, ordtabelem) {
                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, ordtabelem]);
                });
            }
        } else {
            console.warn("MathJax no está cargado.");
        }
    }
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

