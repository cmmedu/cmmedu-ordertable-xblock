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
            // Guardar el contenido y el índice de ambas filas
            var currentContent = $row.find('.content-cell').html();
            var targetContent = $targetRow.find('.content-cell').html();
            var currentIndex = $row.attr('data-index');
            var targetIndex = $targetRow.attr('data-index');
            
            // Intercambiar el contenido
            $row.find('.content-cell').html(targetContent);
            $targetRow.find('.content-cell').html(currentContent);
            
            // Intercambiar los atributos data-index
            $row.attr('data-index', targetIndex);
            $targetRow.attr('data-index', currentIndex);
            
            // Logs para depuración
            console.log("[EOL-ORDER] Moviendo elemento:", {
                from: currentIndex,
                to: targetIndex,
                direction: direction
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
    
    // Log settings at initialization
    //console.log("[EOL-ORDER] Settings recibidos:", settings);
    //console.log("[EOL-ORDER] Settings.ordeingelements:", settings.ordeingelements);
    
    // Add variables for state caching
    var $xblocksContainer = $('#seq_content');
    var xblockId = settings.location;
    var cachedOrderId = xblockId + '_order_state';
    var cachedIndicatorClassId = xblockId + '_order_indicator_class';
    var cachedScoreId = xblockId + '_order_score';
    var cachedAttemptsId = xblockId + '_order_attempts';
    var cachedMaxAttemptsId = xblockId + '_order_max_attempts';
    var cachedShowCorrectnessId = xblockId + '_order_show_correctness';
    var cachedShowAnswerId = xblockId + '_order_show_answer';
    var cachedStateId = xblockId + '_order_complete_state';
    
    // Obtener variables del backend
    var table_name = $element.find('.eol-order-table-content .order-header').first().text();
    var pretext_num = $element.find('.order-header').attr('pretext') || '';
    var postext_num = $element.find('.order-header').attr('postext') || '';
    
    /*
    console.log("[EOL-ORDER] Variables del backend:", {
        table_name: table_name,
        pretext_num: pretext_num,
        postext_num: postext_num
    });
    */
    
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
            // Guardar el contenido y el índice de ambas filas
            var currentContent = $row.find('.content-cell').html();
            var targetContent = $targetRow.find('.content-cell').html();
            var currentIndex = $row.attr('data-index');
            var targetIndex = $targetRow.attr('data-index');
            
            // Intercambiar el contenido
            $row.find('.content-cell').html(targetContent);
            $targetRow.find('.content-cell').html(currentContent);
            
            // Intercambiar los atributos data-index
            $row.attr('data-index', targetIndex);
            $targetRow.attr('data-index', currentIndex);
            
            // Logs para depuración
            /*
            console.log("[EOL-ORDER] Moviendo elemento:", {
                from: currentIndex,
                to: targetIndex,
                direction: direction
            });
            */
            updateButtonStates();
        }
    }

    function getCurrentOrder() {
        var order = [];
        // Obtener los elementos en el orden actual de la tabla
        $itemsContainer.find('.item-row').each(function() {
            // Obtener el índice original directamente del atributo data-index
            var originalIndex = $(this).attr('data-index');
            if (originalIndex) {
                order.push(originalIndex);
            }
        });
        
        // Logs para depuración
        //console.log("[EOL-ORDER] Orden actual:", order.join('_'));
        //console.log("[EOL-ORDER] Elementos en la tabla:");
        /*$itemsContainer.find('.item-row').each(function(index) {
            console.log(`[EOL-ORDER] Elemento ${index + 1}:`, {
                content: $(this).find('.content-cell').html(),
                key: $(this).attr('data-index')
            });
        });*/
        
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
        //console.log("[EOL-ORDER] Usuario enviando respuesta:");
        //console.log("[EOL-ORDER] Orden actual:", orderString);
        //console.log("[EOL-ORDER] Elementos en la tabla:");
        /*$itemsContainer.find('.item-row').each(function(index) {
            console.log(`[EOL-ORDER] Elemento ${index + 1}:`, {
                content: $(this).find('.content-cell').html(),
                key: $(this).attr('data-index')
            });
        });*/
        
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
                    //console.log("[EOL-ORDER] Respuesta del servidor:", response);
                    
                    // Cache state for page navigation
                    $xblocksContainer.data(cachedIndicatorClassId, response.indicator_class);
                    $xblocksContainer.data(cachedScoreId, response.score);
                    $xblocksContainer.data(cachedAttemptsId, response.attempts);
                    $xblocksContainer.data(cachedMaxAttemptsId, response.max_attempts);
                    $xblocksContainer.data(cachedShowCorrectnessId, response.show_correctness);
                    $xblocksContainer.data(cachedShowAnswerId, response.show_answer);
                    $xblocksContainer.data(cachedOrderId, orderString);
                    
                    // Save complete state object
                    $xblocksContainer.data(cachedStateId, {
                        indicator_class: response.indicator_class,
                        score: response.score,
                        attempts: response.attempts,
                        max_attempts: response.max_attempts,
                        show_correctness: response.show_correctness,
                        show_answer: response.show_answer,
                        order: orderString
                    });
                    
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

    // Initialize: Check for cached state and restore if found
    $(function ($) {
        console.log("[EOL-ORDER] XBlock initializing:", xblockId);
        console.log("[EOL-ORDER] Settings completo:", settings);
        console.log("[EOL-ORDER] Elementos en settings:", settings.ordeingelements);
        console.log("[EOL-ORDER] Estado en caché:", $xblocksContainer.data(cachedStateId));
        
        // Check if we have cached state
        if ($xblocksContainer.data(cachedStateId)) {
            console.log("[EOL-ORDER] Found cached state for XBlock:", xblockId);
            var state = $xblocksContainer.data(cachedStateId);
            console.log("[EOL-ORDER] Cached state:", state);
            
            // Restore visual state based on cached data
            var $statusDiv = $element.find('.status');
            $statusDiv.removeClass('correct incorrect unanswered');
            $statusDiv.addClass(state.indicator_class);
            
            // Restore attempts counter
            if (state.max_attempts > 0) {
                var attemptsText = "Ha realizado " + state.attempts + " de " + state.max_attempts + " intentos";
                if (state.max_attempts === 1) {
                    attemptsText = "Ha realizado " + state.attempts + " de " + state.max_attempts + " intento";
                }
                $element.find('.submission-feedback').text(attemptsText);
            }
            
            // Restore notification area based on score
            var $notification = $element.find('.notificacion');
            if (state.score >= 1.0) {
                $notification.html('<img src="/static/images/correct-icon.png" alt="Respuesta Correcta"/> &nbsp; Respuesta Correcta');
                $submitButton.prop('disabled', true);
                $element.find('.move-up-button, .move-down-button').prop('disabled', true);
            } else if (state.score === 0.0 && state.attempts > 0) {
                $notification.html('<img src="/static/images/incorrect-icon.png" alt="Respuesta Incorrecta"/> &nbsp; Respuesta Incorrecta');
                
                // Show answer button if needed
                if (state.max_attempts > 0 && state.attempts >= state.max_attempts && !$element.find('.ver_respuesta').length) {
                    $element.append('<button class="ver_respuesta" data-checking="Cargando..." data-value="Ver Respuesta">' +
                        '<span class="icon fa fa-info-circle" aria-hidden="true"></span><br>' +
                        '<span>Mostrar<br>Respuesta</span>' +
                        '</button>');
                }
            }
            
            // Disable submit button if needed
            if (state.score >= 1.0 || (state.max_attempts > 0 && state.attempts >= state.max_attempts)) {
                $submitButton.prop('disabled', true);
                $element.find('.move-up-button, .move-down-button').prop('disabled', true);
            }
        } else {
            console.log("[EOL-ORDER] No cached state found for XBlock:", xblockId);
        }

        // Initialize button states
        updateButtonStates();

        // Render MathJax
        var ordertableid = "order_" + settings.sublocation;



        if ($xblocksContainer.data(cachedStateId) && settings.ordeingelements) {
            var state = $xblocksContainer.data(cachedStateId);
            //console.log("[EOL-ORDER] ===== INICIANDO REORDENAMIENTO =====");
            //console.log("[EOL-ORDER] Orden a restaurar:", state.order);
            var orderArray = state.order.split('_');
            //console.log("[EOL-ORDER] Array de orden:", orderArray);
            //console.log("[EOL-ORDER] Elementos disponibles:", settings.ordeingelements);
            
            // Verificar la estructura de la tabla
            //console.log("[EOL-ORDER] Estructura de la tabla:");
            var $table = $element.find('.eol-order-table-content');
            var $tbody = $table.find('tbody');
            
            //console.log("[EOL-ORDER] - Tabla encontrada:", $table.length);
            //console.log("[EOL-ORDER] - Tbody encontrado:", $tbody.length);
            //console.log("[EOL-ORDER] Tabla antes de limpiar:", $tbody.html());
            
            // Limpiar el tbody existente
            //console.log("[EOL-ORDER] Limpiando tabla actual");
            $tbody.find('.item-row').remove();
            //console.log("[EOL-ORDER] Tabla después de limpiar:", $tbody.html());
            
            // Rebuild the table in the correct order
            //console.log("[EOL-ORDER] Comenzando reconstrucción de tabla");
            orderArray.forEach(function(index, arrayIndex) {
                //console.log("[EOL-ORDER] Procesando índice:", index, "posición en array:", arrayIndex);
                var element = settings.ordeingelements[index].content; // Get content from the object
                //console.log("[EOL-ORDER] Elemento encontrado:", element);
                
                if (element) {
                    var $row = $('<tr class="item-row" data-index="' + index + '">' +
                        '<td class="order-cell">' + pretext_num + index + postext_num + '</td>' +
                        '<td class="content-cell">' + element + '</td>' +
                        '<td class="actions-cell">' +
                        '<button class="move-up-button">↑</button>' +
                        '<button class="move-down-button">↓</button>' +
                        '</td>' +
                        '</tr>');
                    //console.log("[EOL-ORDER] Agregando fila:", $row.html());
                    $tbody.append($row);
                    //console.log("[EOL-ORDER] Estado de la tabla después de agregar fila:", $tbody.html());
                } else {
                    console.log("[EOL-ORDER] ¡ADVERTENCIA! No se encontró elemento para índice:", index);
                }
            });
            
            //console.log("[EOL-ORDER] Tabla reconstruida. Actualizando estados de botones");
            // Update button states after rebuilding
            updateButtonStates();
            
            // Re-render MathJax if needed
            //console.log("[EOL-ORDER] Re-renderizando MathJax");
            var ordertableid = "order_" + settings.sublocation;
            renderMathForSpecificElements(ordertableid);
            
            //console.log("[EOL-ORDER] ===== REORDENAMIENTO COMPLETADO =====");
            

        } else {
            //console.log("[EOL-ORDER] No se puede reordenar:");
            //console.log("[EOL-ORDER] - state.order:", state ? state.order : 'No hay estado');
            //console.log("[EOL-ORDER] - settings.ordeingelements:", settings.ordeingelements);
            //console.log("[EOL-ORDER] - settings:", settings);
        }
    });

    //console.log("---Mathjax Revision---")

    var ordertableid = "order_" + settings.sublocation;
    renderMathForSpecificElements(ordertableid);
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

