function CmmOrderXBlock(runtime, element) {
    'use strict';

    var $element = $(element);
    var $tableRows = $element.find('.table-rows');
    var $addRowButton = $element.find('.add-row-button');
    var $saveButton = $element.find('.save-button');
    var $cancelButton = $element.find('.cancel-button');
    var $disorderPreview = $element.find('.disordered-list');
    var $correctAnswersList = $element.find('.correct-answers-list');
    var $addAnswerButton = $element.find('.add-answer-button');
    var $displayNameInput = $element.find('#display_name');
    var $resetDisplayNameButton = $element.find('.reset-display-name');
    var defaultDisplayName = 'CmmEdu Order Table XBlock';
    var currentOrder = [];
    var savedOrder = [];
    var previousDisorderOrder = $('#current-disorder-value').val();
    var previousCorrectAnswers = $('#current-answers-value').val();

    // Convertir string a array
    function stringToArray(orderString) {
        if (!orderString) return [];
        // Manejar tanto comas como guiones bajos
        var separator = orderString.includes(',') ? ',' : '_';
        return orderString.split(separator).map(function(item) {
            return item.trim();
        });
    }

    // Convertir array a string
    function arrayToString(orderArray) {
        if (!orderArray || !orderArray.length) return '';
        // Siempre usar guiones bajos como separador
        return orderArray.join('_');
    }

    // Convertir string a array para respuestas correctas
    function stringToAnswersArray(answerString) {
        if (!answerString) return [];
        //console.log('Converting string to array:', answerString);
        
        // Separar las listas usando _[|]_
        var lists = answerString.split('_[|]_');
        //console.log('Split lists:', lists);
        
        return lists.map(function(listString) {
            // Limpiar espacios en blanco y separar por _
            return listString.trim().split('_').filter(function(item) {
                return item.trim() !== '';
            });
        });
    }

    // Convertir array a string para respuestas correctas
    function answersArrayToString(answerArray) {
        if (!answerArray || !answerArray.length) return '';
        //console.log('Converting array to string:', answerArray);
        
        // Convertir cada lista a string usando _ como separador
        var result = answerArray.map(function(list) {
            return list.join('_');
        }).join('_[|]_');
        
        //console.log('Result string:', result);
        return result;
    }

    function getFormData() {
        // Obtener el valor directamente del input
        var orderString = $('#current-disorder-value').val();
        //console.log('Disorder order string from input:', orderString);
        
        // Validar que el valor no contenga el separador de respuestas correctas
        if (orderString.includes('_[|]_')) {
            console.warn('Warning: Disorder order contains answer separator!');
            // Limpiar el valor si contiene el separador
            orderString = orderString.split('_[|]_')[0];
        }
        
        // Convertir a array y luego de vuelta a string para asegurar el formato correcto
        var normalizedOrder = arrayToString(stringToArray(orderString));
        //console.log('Normalized disorder order:', normalizedOrder);
        
        // Obtener las respuestas correctas directamente del input
        var correctAnswersString = $('#current-answers-value').val();
        //console.log('Correct answers string:', correctAnswersString);
        
        var data = {
            display_name: $element.find('#display_name').val(),
            table_name: $element.find('#table_name').val(),
            textcolumn_order: $element.find('#textcolumn_order').val(),
            textcolumn_content: $element.find('#textcolumn_content').val(),
            textcolumn_actions: $element.find('#textcolumn_actions').val(),
            background_color: $element.find('#background_color').val(),
            numbering_type: $element.find('#numbering_type').val(),
            pretext_num: $element.find('#pretext_num').val(),
            postext_num: $element.find('#postext_num').val(),
            show_answer: $element.find('#show_answer').val(),
            uppercase_letters: $element.find('#uppercase_letters').is(':checked'),
            random_disorder: $element.find('#random_disorder').is(':checked'),
            ordeingelements: getTableRowsData(),
            disordered_order: normalizedOrder,
            correct_answers: correctAnswersString,
            use_custom_labels: $('#use_custom_labels').is(':checked'),
            label_width: $element.find('#label_width').val(),
            custom_labels: {}
        };
        
        // Recolectar las etiquetas personalizadas si el checkbox está marcado
        if (data.use_custom_labels) {
            //console.log('Recolectando etiquetas personalizadas...');
            var cleanCustomLabels = {};
            var iterator = 0;
            $('.custom-label-item').each(function() {
                var key = String( $(this).data('key') ).trim() || String(iterator);
                iterator++; // Incrementar el contador
                var value = $(this).find('.custom-label-input').val();
                //console.log('Etiqueta personalizada:', key, '=', value);
                cleanCustomLabels[key] = { content: value };
            });
            data.custom_labels = cleanCustomLabels;
            //console.log('Etiquetas personalizadas recolectadas:', data.custom_labels);
        }
        
        //console.log('Datos completos a enviar:', JSON.stringify(data, null, 2));
        return data;
    }

    function getTableRowsData() {
        var rows = {};
        $element.find('.table-row').each(function(index) {
            var $row = $(this);
            var rowId = (index + 1).toString(); // Usar índice + 1 como ID
            rows[rowId] = {
                content: $row.find('.row-content-input').val()
            };
        });
        return rows;
    }

    function getDisorderList() {
        var disorderList = [];
        $('.table-row').each(function(index) {
            var rowNumber = index + 1; // Usar el número de orden basado en la posición
            disorderList.push(rowNumber.toString());
        });
        //console.log('Getting disorder list:', disorderList);
        return disorderList;
    }

    function updateCurrentOrder() {
        currentOrder = [];
        $disorderPreview.find('.disorder-item').each(function() {
            currentOrder.push($(this).data('value'));
        });
        //console.log('Current disorder order updated:', currentOrder);
        
        // Validar que el orden no contenga el separador de respuestas correctas
        var orderString = arrayToString(currentOrder);
        if (orderString.includes('_[|]_')) {
            console.warn('Warning: Disorder order contains answer separator!');
            // Limpiar el valor si contiene el separador
            orderString = orderString.split('_[|]_')[0];
        }
        
        // Actualizar el input oculto y el display con el orden actual
        $('#current-disorder-value').val(orderString);
        $('.disorder-preview .order-display').text(orderString);
        
        // Actualizar el display del orden anterior
        var previousOrder = previousDisorderOrder || 'No definido';
        $('.disorder-preview .previous-order-display').text(previousOrder);
    }

    function updateDisorderPreview() {
        // Obtener el orden actual del input oculto
        var currentValue = $('#current-disorder-value').val();
        currentOrder = stringToArray(currentValue);
        
        var disorderList = getDisorderList();
        //console.log('Disorder list:', disorderList);
        //console.log('Current order from input:', currentOrder);
        
        // Si no hay elementos en la lista, no hacer nada
        if (disorderList.length === 0) {
            console.log('No elements found in disorder list');
            return;
        }
        
        // Filtrar el orden actual para mantener solo los elementos que existen
        currentOrder = currentOrder.filter(function(item) {
            return disorderList.includes(item);
        });
        
        // Agregar los elementos nuevos al final
        disorderList.forEach(function(item) {
            if (!currentOrder.includes(item)) {
                currentOrder.push(item);
            }
        });
        
        //console.log('Updated current order:', currentOrder);
        
        // Mantener el label y el input
        var $label = $disorderPreview.find('.order-label');
        var $input = $disorderPreview.find('#current-disorder-value');
        var $display = $disorderPreview.find('.order-display');
        
        // Limpiar solo los elementos desordenados
        $disorderPreview.find('.disorder-item').remove();
        
        // Reconstruir los elementos desordenados
        currentOrder.forEach(function(label, index) {
            var $item = $('<div>', {
                class: 'disorder-item',
                'data-value': label
            }).append(
                $('<button>', {
                    class: 'move-left-button',
                    title: 'Mover izquierda',
                    disabled: index === 0
                }).text('<'),
                $('<span>', {
                    class: 'item-content',
                    text: label
                }),
                $('<button>', {
                    class: 'move-right-button',
                    title: 'Mover derecha',
                    disabled: index === currentOrder.length - 1
                }).text('>')
            );
            $disorderPreview.append($item);
        });
        
        // Actualizar el input oculto y el display con el orden actual
        var orderString = arrayToString(currentOrder);
        $input.val(orderString);
        $display.text(orderString);
        
        // Inicializar la funcionalidad draggable
        $disorderPreview.find('.disorder-item').draggable({
            revert: true,
            cursor: 'move',
            helper: 'clone',
            start: function(event, ui) {
                $(this).addClass('dragging');
            },
            stop: function(event, ui) {
                $(this).removeClass('dragging');
            }
        });
        
        // Inicializar la funcionalidad droppable
        $disorderPreview.droppable({
            accept: '.disorder-item',
            drop: function(event, ui) {
                var $draggedItem = ui.draggable;
                var $targetItem = $(event.target).closest('.disorder-item');
                
                if ($targetItem.length) {
                    if ($draggedItem.index() < $targetItem.index()) {
                        $draggedItem.insertAfter($targetItem);
                    } else {
                        $draggedItem.insertBefore($targetItem);
                    }
                } else {
                    $disorderPreview.append($draggedItem);
                }
                
                updateMoveButtons();
                updateCurrentOrder();
            }
        });
    }

    function moveItemLeft(event) {
        var $item = $(event.target).closest('.disorder-item');
        var $prevItem = $item.prev('.disorder-item');
        if ($prevItem.length) {
            $item.insertBefore($prevItem);
            updateMoveButtons();
            updateCurrentOrder();
        }
    }

    function moveItemRight(event) {
        var $item = $(event.target).closest('.disorder-item');
        var $nextItem = $item.next('.disorder-item');
        if ($nextItem.length) {
            $item.insertAfter($nextItem);
            updateMoveButtons();
            updateCurrentOrder();
        }
    }

    function updateMoveButtons() {
        $disorderPreview.find('.disorder-item').each(function(index) {
            var $item = $(this);
            var $leftButton = $item.find('.move-left-button');
            var $rightButton = $item.find('.move-right-button');
            
            $leftButton.prop('disabled', index === 0);
            $rightButton.prop('disabled', index === $disorderPreview.find('.disorder-item').length - 1);
        });
    }

    function addRow() {
        //console.log('[CMMEDU-ORDERTABLE] addRow llamado');
        var nextLabelNumber = $('.table-row').length + 1;
        var rowHtml = `
            <div class="table-row" data-row-id="${nextLabelNumber}">
                <div class="row-content">
                    <p>Label: ${nextLabelNumber}</p>
                </div>
                <div class="row-content">
                    <textarea class="row-content-input" placeholder="Contenido de la fila (HTML permitido)"
                        name="content"></textarea>
                </div>
                <div class="row-actions">
                    <button class="remove-row">Eliminar</button>
                </div>
            </div>
        `;
        $('.table-rows').append(rowHtml);
        
        // Obtener todos los labels actuales usando índices
        var newOrder = [];
        $('.table-row').each(function(index) {
            newOrder.push((index + 1).toString());
        });
        
        // Actualizar el input con el nuevo orden
        $('#current-disorder-value').val(arrayToString(newOrder));
        
        // Actualizar el preview con el nuevo orden
        currentOrder = newOrder;
        updateDisorderPreview();
        resetCorrectAnswers(); // Resetear respuestas correctas
        
        // Actualizar los inputs de etiquetas personalizadas si están activos
        if ($('#use_custom_labels').is(':checked')) {
            // Guardar los valores actuales de custom_labels
            var currentCustomLabels = {};
            $('.custom-label-item').each(function() {
                var key = $(this).data('key');
                var value = $(this).find('.custom-label-input').val();
                currentCustomLabels[key] = { content: value };
            });
            // Actualizar el input oculto con los valores actuales
            $('#current-custom-labels-value').val(JSON.stringify(currentCustomLabels));
            updateCustomLabelsInputs();
        }
    }

    function removeRow(event) {
        //console.log('[CMMEDU-ORDERTABLE] removeRow llamado');
        event.preventDefault();
        event.stopPropagation();
        
        var $row = $(event.target).closest('.table-row');
        console.log('Row to remove:', $row.length ? 'found' : 'not found');
        
        if (!$row.length) {
            console.log('No row found to remove');
            return;
        }
        
        // Remover la fila
        $row.remove();
        
        // Renumerar los labels restantes desde 1 hasta el total
        var $rows = $('.table-row');
        var totalRows = $rows.length;
        //console.log('Total rows before renumbering:', totalRows);
        
        $rows.each(function(index) {
            var $currentLabel = $(this).find('.row-content p');
            if ($currentLabel.length) {
                var newNumber = index + 1;
                //console.log('Renumbering row', index, 'to', newNumber);
                $currentLabel.text('Label: ' + newNumber);
                $(this).attr('data-row-id', newNumber);
            }
        });
        
        // Obtener todos los labels actuales usando índices
        var newOrder = [];
        $('.table-row').each(function(index) {
            newOrder.push((index + 1).toString());
        });
        
        // Actualizar el input con el nuevo orden
        $('#current-disorder-value').val(arrayToString(newOrder));
        
        // Actualizar el preview con el nuevo orden
        currentOrder = newOrder;
        updateDisorderPreview();
        resetCorrectAnswers(); // Resetear respuestas correctas
        
        // Actualizar los inputs de etiquetas personalizadas si están activos
        if ($('#use_custom_labels').is(':checked')) {
            // Guardar los valores actuales de custom_labels
            var currentCustomLabels = {};
            $('.custom-label-item').each(function() {
                var key = $(this).data('key');
                var value = $(this).find('.custom-label-input').val();
                currentCustomLabels[key] = { content: value };
            });
            // Actualizar el input oculto con los valores actuales
            $('#current-custom-labels-value').val(JSON.stringify(currentCustomLabels));
            updateCustomLabelsInputs();
        }
    }

    function saveChanges(event) {
        if (event) {
            event.preventDefault();
        }
        console.log('Iniciando proceso de guardado...');
        
        // Guardar los valores actuales como valores anteriores
        previousDisorderOrder = $('#current-disorder-value').val();
        previousCorrectAnswers = $('#current-answers-value').val();
        
        var data = getFormData();
        //console.log('Datos a enviar:', JSON.stringify(data, null, 2));
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        
        if ($.isFunction(runtime.notify)) {
            runtime.notify('save', {state: 'start'});
        }
        
        $.ajax({
            type: 'POST',
            url: handlerUrl,
            data: JSON.stringify(data),
            success: function(response) {
                console.log('Subido Correctamente');
                //console.log('Respuesta del servidor:', response);
                if (response.result === 'success') {
                    if ($.isFunction(runtime.notify)) {
                        runtime.notify('save', {state: 'end'});
                    }
                    // Actualizar savedOrder con el orden actual después de guardar
                    savedOrder = currentOrder;
                    //console.log('Orden guardado exitosamente. Orden actual:', currentOrder);
                    //console.log('Orden guardado:', savedOrder);
                    
                    // Actualizar el display del orden
                    $('.order-display').text(response.correct_answers);
                    
                    // Actualizar el display del orden anterior
                    var previousAnswers = previousCorrectAnswers || 'No definido';
                    $('.correct-answers-container .previous-order-display').text(previousAnswers);
                    
                    // Guardar los valores de las etiquetas personalizadas
                    if (data.use_custom_labels) {
                        //console.log('Guardando etiquetas personalizadas:', data.custom_labels);
                        $('#current-custom-labels-value').val(JSON.stringify(data.custom_labels));
                    }
                } else {
                    console.error('Error al guardar:', response.message);
                    showMessage('Error al guardar: ' + response.message, 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error AJAX:', error);
                console.error('Status:', status);
                console.error('Response:', xhr.responseText);
                showMessage('Error al guardar los cambios', 'error');
            }
        });
    }

    function showMessage(message, type) {
        var $messageContainer = $('.xblock-editor-error-message');
        $messageContainer.text(message);
        $messageContainer.removeClass('success error').addClass(type);
    }

    // Obtener lista de labels ordenados
    function getOrderedLabels() {
        var labels = [];
        $('.table-row').each(function(index) {
            // Usar el índice + 1 como etiqueta (1-based index)
            labels.push((index + 1).toString());
        });
        return labels;
    }

    // Crear una nueva lista con los labels ordenados
    function createOrderedList() {
        var orderedLabels = getOrderedLabels();
        var $newAnswerList = $('<div class="correct-answers-list">');
        
        orderedLabels.forEach(function(label) {
            var $newAnswer = $('<div class="correct-answer-item" draggable="true">' +
                '<button class="move-left-button" title="Mover izquierda"><</button>' +
                '<span class="item-content">' + label + '</span>' +
                '<button class="move-right-button" title="Mover derecha">></button>' +
                '</div>');
            
            $newAnswerList.append($newAnswer);
            
            // Hacer el elemento arrastrable
            $newAnswer.draggable({
                revert: true,
                cursor: 'move',
                helper: 'clone',
                start: function(event, ui) {
                    $(this).addClass('dragging');
                },
                stop: function(event, ui) {
                    $(this).removeClass('dragging');
                }
            });
        });
        
        return $newAnswerList;
    }

    // Resetear las respuestas correctas a una lista ordenada
    function resetCorrectAnswers() {
        // Limpiar todas las listas existentes
        $('.correct-answers-list').empty();
        
        // Crear y agregar una nueva lista ordenada
        var $newAnswerGroup = $('<div class="correct-answers-group">');
        var $groupHeader = $('<div class="group-header">' +
            '<button class="remove-group-button">Eliminar grupo</button>' +
            '</div>');
        var $groupContent = $('<div class="group-content">');
        
        $newAnswerGroup.append($groupHeader);
        
        var orderedLabels = getOrderedLabels();
        orderedLabels.forEach(function(label) {
            var $newAnswer = $('<div class="correct-answer-item" draggable="true">' +
                '<button class="move-left-button" title="Mover izquierda"><</button>' +
                '<span class="item-content">' + label + '</span>' +
                '<button class="move-right-button" title="Mover derecha">></button>' +
                '</div>');
            
            $groupContent.append($newAnswer);
            
            // Hacer el elemento arrastrable
            $newAnswer.draggable({
                revert: true,
                cursor: 'move',
                helper: 'clone',
                start: function(event, ui) {
                    $(this).addClass('dragging');
                },
                stop: function(event, ui) {
                    $(this).removeClass('dragging');
                }
            });
        });
        
        $newAnswerGroup.append($groupContent);
        $('.correct-answers-list').append($newAnswerGroup);
        
        // Hacer la lista droppable
        $groupContent.droppable({
            accept: '.correct-answer-item',
            drop: function(event, ui) {
                var $draggedItem = ui.draggable;
                var $targetItem = $(event.target).closest('.correct-answer-item');
                
                if ($targetItem.length) {
                    if ($draggedItem.index() < $targetItem.index()) {
                        $draggedItem.insertAfter($targetItem);
                    } else {
                        $draggedItem.insertBefore($targetItem);
                    }
                } else {
                    $(this).append($draggedItem);
                }
                
                updateAnswerMoveButtons();
                updateCorrectAnswersOrder();
            }
        });
        
        updateAnswerMoveButtons();
        updateCorrectAnswersOrder();
    }

    // Agregar nueva respuesta (crea una nueva lista completa)
    function addAnswer() {
        var $newAnswerGroup = $('<div class="correct-answers-group">');
        var $groupHeader = $('<div class="group-header">' +
            '<button class="remove-group-button">Eliminar grupo</button>' +
            '</div>');
        var $groupContent = $('<div class="group-content">');
        
        $newAnswerGroup.append($groupHeader);
        
        var orderedLabels = getOrderedLabels();
        orderedLabels.forEach(function(label) {
            var $newAnswer = $('<div class="correct-answer-item" draggable="true">' +
                '<button class="move-left-button" title="Mover izquierda"><</button>' +
                '<span class="item-content">' + label + '</span>' +
                '<button class="move-right-button" title="Mover derecha">></button>' +
                '</div>');
            
            $groupContent.append($newAnswer);
            
            // Hacer el elemento arrastrable
            $newAnswer.draggable({
                revert: true,
                cursor: 'move',
                helper: 'clone',
                start: function(event, ui) {
                    $(this).addClass('dragging');
                },
                stop: function(event, ui) {
                    $(this).removeClass('dragging');
                }
            });
        });
        
        $newAnswerGroup.append($groupContent);
        
        // Agregar la nueva lista al contenedor
        $('.correct-answers-list').append($newAnswerGroup);
        
        // Hacer la nueva lista droppable
        $groupContent.droppable({
            accept: '.correct-answer-item',
            drop: function(event, ui) {
                var $draggedItem = ui.draggable;
                var $targetItem = $(event.target).closest('.correct-answer-item');
                
                if ($targetItem.length) {
                    if ($draggedItem.index() < $targetItem.index()) {
                        $draggedItem.insertAfter($targetItem);
                    } else {
                        $draggedItem.insertBefore($targetItem);
                    }
                } else {
                    $(this).append($draggedItem);
                }
                
                updateAnswerMoveButtons();
                updateCorrectAnswersOrder();
            }
        });
        
        updateAnswerMoveButtons();
        updateCorrectAnswersOrder();
    }

    // Actualizar el orden de todas las respuestas correctas
    function updateCorrectAnswersOrder() {
        var allAnswers = [];
        $('.correct-answers-group').each(function() {
            var listAnswers = [];
            $(this).find('.correct-answer-item').each(function() {
                var text = $(this).find('.item-content').text().trim();
                if (text) {
                    listAnswers.push(text);
                }
            });
            if (listAnswers.length > 0) {
                allAnswers.push(listAnswers);
            }
        });
        
        // Convertir a string para el input oculto usando el formato correcto
        var answerString = '';
        if (allAnswers.length > 0) {
            answerString = allAnswers.map(function(list) {
                return list.join('_');
            }).join('_[|]_');
        }
        
        //console.log('Updating correct answers:', answerString);
        $('#current-answers-value').val(answerString);
        $('.correct-answers-container .order-display').text(answerString);
        
        // Actualizar el display del orden anterior
        var previousAnswers = previousCorrectAnswers || 'No definido';
        $('.correct-answers-container .previous-order-display').text(previousAnswers);
    }

    // Mover respuesta a la izquierda
    function moveAnswerLeft(event) {
        var $item = $(event.target).closest('.correct-answer-item');
        var $prevItem = $item.prev('.correct-answer-item');
        if ($prevItem.length) {
            $item.insertBefore($prevItem);
            updateCorrectAnswersOrder();
            updateAnswerMoveButtons();
        }
    }

    // Mover respuesta a la derecha
    function moveAnswerRight(event) {
        var $item = $(event.target).closest('.correct-answer-item');
        var $nextItem = $item.next('.correct-answer-item');
        if ($nextItem.length) {
            $item.insertAfter($nextItem);
            updateCorrectAnswersOrder();
            updateAnswerMoveButtons();
        }
    }

    // Actualizar botones de movimiento de respuestas
    function updateAnswerMoveButtons() {
        $correctAnswersList.find('.correct-answer-item').each(function(index) {
            var $item = $(this);
            var $leftButton = $item.find('.move-left-button');
            var $rightButton = $item.find('.move-right-button');
            
            $leftButton.prop('disabled', index === 0);
            $rightButton.prop('disabled', index === $correctAnswersList.find('.correct-answer-item').length - 1);
        });
    }

    // Eliminar respuesta
    function removeAnswer(event) {
        $(event.target).closest('.correct-answer-item').remove();
        updateCorrectAnswersOrder();
        updateAnswerMoveButtons();
    }

    // Eliminar grupo de respuestas
    function removeGroup(event) {
        event.preventDefault();
        event.stopPropagation();
        
        var $group = $(event.target).closest('.correct-answers-group');
        $group.remove();
        updateCorrectAnswersOrder();
    }

    // Inicializar eventos para respuestas correctas
    function initializeCorrectAnswers() {
        // Obtener el valor inicial del input oculto
        var initialAnswers = $('#current-answers-value').val();
        //console.log('Initial correct answers:', initialAnswers);
        
        if (initialAnswers) {
            var answersArray = stringToAnswersArray(initialAnswers);
            ///console.log('Parsed answers array:', answersArray);
            
            // Limpiar las respuestas existentes
            $('.correct-answers-list').empty();
            
            // Crear grupos para cada lista de respuestas
            answersArray.forEach(function(answerList) {
                var $answerGroup = $('<div class="correct-answers-group">');
                var $groupHeader = $('<div class="group-header">' +
                    '<button class="remove-group-button">Eliminar grupo</button>' +
                    '</div>');
                var $groupContent = $('<div class="group-content">');
                
                $answerGroup.append($groupHeader);
                
                answerList.forEach(function(answer) {
                    var $answerItem = $('<div class="correct-answer-item" draggable="true">' +
                        '<button class="move-left-button" title="Mover izquierda"><</button>' +
                        '<span class="item-content">' + answer + '</span>' +
                        '<button class="move-right-button" title="Mover derecha">></button>' +
                        '</div>');
                    
                    $groupContent.append($answerItem);
                    
                    // Hacer el elemento arrastrable
                    $answerItem.draggable({
                        revert: true,
                        cursor: 'move',
                        helper: 'clone',
                        start: function(event, ui) {
                            $(this).addClass('dragging');
                        },
                        stop: function(event, ui) {
                            $(this).removeClass('dragging');
                        }
                    });
                });
                
                $answerGroup.append($groupContent);
                $('.correct-answers-list').append($answerGroup);
                
                // Hacer el grupo droppable
                $groupContent.droppable({
                    accept: '.correct-answer-item',
                    drop: function(event, ui) {
                        var $draggedItem = ui.draggable;
                        var $targetItem = $(event.target).closest('.correct-answer-item');
                        
                        if ($targetItem.length) {
                            if ($draggedItem.index() < $targetItem.index()) {
                                $draggedItem.insertAfter($targetItem);
                            } else {
                                $draggedItem.insertBefore($targetItem);
                            }
                        } else {
                            $(this).append($draggedItem);
                        }
                        
                        updateAnswerMoveButtons();
                        updateCorrectAnswersOrder();
                    }
                });
            });
        } else {
            // Si no hay respuestas iniciales, crear una lista por defecto
            resetCorrectAnswers();
        }
        
        // Inicializar los event listeners para los botones
        $('.correct-answers-list').on('click', '.move-left-button', moveAnswerLeft);
        $('.correct-answers-list').on('click', '.move-right-button', moveAnswerRight);
        $('.correct-answers-list').on('click', '.remove-group-button', removeGroup);
        $addAnswerButton.on('click', addAnswer);
        
        updateAnswerMoveButtons();
    }

    // Función para obtener el valor por defecto según el tipo de numeración
    function getDefaultLabelValue(index, numberingType, uppercase) {
        var number = index + 1; // Convertir de base 0 a base 1
        switch(numberingType) {
            case 'numbers':
                return number.toString();
            case 'numbers_zero':
                return index.toString();
            case 'letters':
                return numberToLetter(number, uppercase);
            case 'roman':
                return numberToRoman(number, uppercase);
            default:
                return number.toString();
        }
    }

    // Función para convertir número a letra
    function numberToLetter(n, uppercase) {
        if (n < 1) return '';
        var result = '';
        while (n > 0) {
            n--;
            result = String.fromCharCode(65 + (n % 26)) + result;
            n = Math.floor(n / 26);
        }
        return uppercase ? result : result.toLowerCase();
    }

    // Función para convertir número a romano
    function numberToRoman(n, uppercase) {
        if (!n || n < 1 || n > 3999) return '';
        var ints = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
        var nums = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
        var result = '';
        for (var i = 0; i < ints.length; i++) {
            while (n >= ints[i]) {
                result += nums[i];
                n -= ints[i];
            }
        }
        return uppercase ? result : result.toLowerCase();
    }

    // Función para actualizar los inputs de etiquetas personalizadas
    function updateCustomLabelsInputs() {
        //console.log('[CMMEDU-ORDERTABLE] updateCustomLabelsInputs llamado desde:', new Error().stack);
        var $container = $('.custom-labels-list');
        $container.empty();
        
        // Obtener todos los labels actuales
        var labels = getOrderedLabels();
        var numberingType = $('#numbering_type').val();
        var uppercase = $('#uppercase_letters').is(':checked');
        
        // Obtener los valores guardados si existen
        var savedLabels = {};
        try {
            var rawValue = $('#current-custom-labels-value').val();
            //console.log('[CMMEDU-ORDERTABLE] Valor raw del input:', rawValue);
            //console.log('[CMMEDU-ORDERTABLE] Tipo del valor raw:', typeof rawValue);
            
            if (!rawValue) {
                console.log('[CMMEDU-ORDERTABLE] No hay valor guardado, usando objeto vacío');
                savedLabels = {};
            } else {
                var savedData;
                // Intentar parsear como JSON primero
                try {
                    savedData = JSON.parse(rawValue);
                } catch (e) {
                    // Si falla, intentar evaluar como objeto literal
                    try {
                        savedData = eval('(' + rawValue + ')');
                    } catch (e2) {
                        console.warn('[CMMEDU-ORDERTABLE] Error al parsear el valor:', e2);
                        savedData = {};
                    }
                }
                
                //console.log('[CMMEDU-ORDERTABLE] Datos guardados originales:', savedData);
                // Limpiar las claves del objeto guardado y convertirlas a string
                Object.keys(savedData).forEach(function(key) {
                    var cleanKey = key.trim().toString();
                    savedLabels[cleanKey] = savedData[key];
                });
                //console.log('[CMMEDU-ORDERTABLE] Custom labels limpios:', savedLabels);
            }
        } catch (e) {
            //console.warn('[CMMEDU-ORDERTABLE] Error general:', e);
            //console.warn('[CMMEDU-ORDERTABLE] Valor que causó el error:', $('#current-custom-labels-value').val());
            savedLabels = {};
        }
        
        labels.forEach(function(label, index) {
            var defaultValue = getDefaultLabelValue(index, numberingType, uppercase);
            // Convertir el label a string para la comparación
            var labelStr = label.toString();
            //console.log('[CMMEDU-ORDERTABLE] labelStr:', labelStr);
            //console.log('[CMMEDU-ORDERTABLE] savedLabels:', savedLabels);
            //console.log('[CMMEDU-ORDERTABLE] savedLabels[labelStr]:', savedLabels[labelStr]);
            //console.log('[CMMEDU-ORDERTABLE] savedLabels[parseInt(labelStr)]:', savedLabels[parseInt(labelStr)]);
            
            // Usar el valor guardado si existe, de lo contrario usar el valor por defecto
            var savedValue = '';
            // Intentar con string primero, luego con número
            if (savedLabels[labelStr] && savedLabels[labelStr].content) {
                savedValue = savedLabels[labelStr].content;
                //console.log('[CMMEDU-ORDERTABLE] Usando valor guardado (string) para label', labelStr, ':', savedValue);
            } else if (savedLabels[parseInt(labelStr)] && savedLabels[parseInt(labelStr)].content) {
                savedValue = savedLabels[parseInt(labelStr)].content;
                //console.log('[CMMEDU-ORDERTABLE] Usando valor guardado (número) para label', labelStr, ':', savedValue);
            } else {
                savedValue = defaultValue;
                //console.log('[CMMEDU-ORDERTABLE] Usando valor por defecto para label', labelStr, ':', savedValue);
            }
            
            var $item = $('<div class="custom-label-item" data-key="' + labelStr + '">' +
                '<label>Etiqueta ' + labelStr + ':</label>' +
                '<input type="text" name="custom_label_' + labelStr + '" class="custom-label-input" value="' + savedValue + '" />' +
                '</div>');
            $container.append($item);
        });
    }

    // Función para manejar la visibilidad del contenedor de etiquetas personalizadas
    function handleCustomLabelsVisibility() {
        //console.log('[CMMEDU-ORDERTABLE] handleCustomLabelsVisibility llamado');
        var useCustomLabels = $('#use_custom_labels').is(':checked');
        $('.custom-labels-container').toggle(useCustomLabels);
        
        if (useCustomLabels) {
            updateCustomLabelsInputs();
        }
    }

    // Agregar eventos para actualizar los valores por defecto cuando cambie el tipo de numeración
    $('#numbering_type, #uppercase_letters').on('change', function() {
        //console.log('[CMMEDU-ORDERTABLE] Cambio en numbering_type o uppercase_letters');
        if ($('#use_custom_labels').is(':checked')) {
            updateCustomLabelsInputs();
        }
    });

    // Agregar el evento change al checkbox
    $('#use_custom_labels').on('change', handleCustomLabelsVisibility);

    // Ejecutar al inicio
    handleCustomLabelsVisibility();
    
    // Mostrar el valor de custom_labels al inicio
    //console.log('[CMMEDU-ORDERTABLE] Custom labels al inicio:', $('#current-custom-labels-value').val());
    try {
        var savedLabels = JSON.parse($('#current-custom-labels-value').val() || '{}');
        //console.log('[CMMEDU-ORDERTABLE] Custom labels parseados:', savedLabels);
    } catch (e) {
        console.warn('[CMMEDU-ORDERTABLE] Error al parsear custom labels:', e);
    }

    // Función para manejar la visibilidad del botón de reinicio
    function handleResetButtonVisibility() {
        var currentValue = $displayNameInput.val();
        if (currentValue !== defaultDisplayName) {
            $resetDisplayNameButton.show();
        } else {
            $resetDisplayNameButton.hide();
        }
    }

    // Función para reiniciar el display_name
    function resetDisplayName() {
        $displayNameInput.val(defaultDisplayName);
        handleResetButtonVisibility();
    }

    // Inicialización de eventos
    $tableRows.on('click', '.remove-row', removeRow);
    $saveButton.on('click', saveChanges);
    $cancelButton.on('click', function(event) {
        event.preventDefault();
        runtime.notify('cancel', {});
    });
    
    $disorderPreview.on('click', '.move-left-button', moveItemLeft);
    $disorderPreview.on('click', '.move-right-button', moveItemRight);
    
    // Inicializar el preview
    updateDisorderPreview();

    // Inicializar el XBlock
    function initialize() {
        // ... existing initialization code ...
        initializeCorrectAnswers();
        $addRowButton.on('click', addRow);
        $saveButton.on('click', saveChanges);
        $cancelButton.on('click', function() {
            runtime.notify('cancel', {});
        });
        
        // Add reset button functionality
        $displayNameInput.on('input', handleResetButtonVisibility);
        $resetDisplayNameButton.on('click', resetDisplayName);
        
        // Initialize reset button visibility
        handleResetButtonVisibility();
        
        // Rest of the initialization code
        // ... existing code ...
    }

    initialize();
} 