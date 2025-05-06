function EolOrderXBlock(runtime, element) {
    'use strict';

    var $element = $(element);
    var $tableRows = $element.find('.table-rows');
    var $addRowButton = $element.find('.add-row-button');
    var $saveButton = $element.find('.save-button');
    var $cancelButton = $element.find('.cancel-button');
    var $disorderPreview = $element.find('.disordered-list');
    var $correctAnswersList = $element.find('.correct-answers-list');
    var $addAnswerButton = $element.find('.add-answer-button');
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
        console.log('Converting string to array:', answerString);
        
        // Separar las listas usando _[|]_
        var lists = answerString.split('_[|]_');
        console.log('Split lists:', lists);
        
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
        console.log('Converting array to string:', answerArray);
        
        // Convertir cada lista a string usando _ como separador
        var result = answerArray.map(function(list) {
            return list.join('_');
        }).join('_[|]_');
        
        console.log('Result string:', result);
        return result;
    }

    function getFormData() {
        // Obtener el valor directamente del input
        var orderString = $('#current-disorder-value').val();
        console.log('Disorder order string from input:', orderString);
        
        // Validar que el valor no contenga el separador de respuestas correctas
        if (orderString.includes('_[|]_')) {
            console.warn('Warning: Disorder order contains answer separator!');
            // Limpiar el valor si contiene el separador
            orderString = orderString.split('_[|]_')[0];
        }
        
        // Convertir a array y luego de vuelta a string para asegurar el formato correcto
        var normalizedOrder = arrayToString(stringToArray(orderString));
        console.log('Normalized disorder order:', normalizedOrder);
        
        // Obtener las respuestas correctas directamente del input
        var correctAnswersString = $('#current-answers-value').val();
        console.log('Correct answers string:', correctAnswersString);
        
        var data = {
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
            correct_answers: correctAnswersString
        };
        
        console.log('Form data to submit:', data);
        return data;
    }

    function getTableRowsData() {
        var rows = {};
        $element.find('.table-row').each(function() {
            var $row = $(this);
            var rowId = $row.find('.row-label').text().trim() || $row.data('row-id');
            rows[rowId] = {
                content: $row.find('.row-content-input').val()
            };
        });
        return rows;
    }

    function getDisorderList() {
        var disorderList = [];
        $('.table-row').each(function(index) {
            var $row = $(this);
            var rowNumber = index + 1; // Usar el número de orden basado en la posición
            disorderList.push(rowNumber.toString());
        });
        console.log('Getting disorder list:', disorderList);
        return disorderList;
    }

    function updateCurrentOrder() {
        currentOrder = [];
        $disorderPreview.find('.disorder-item').each(function() {
            currentOrder.push($(this).data('value'));
        });
        console.log('Current disorder order updated:', currentOrder);
        
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
        console.log('Disorder list:', disorderList);
        console.log('Current order from input:', currentOrder);
        
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
        
        console.log('Updated current order:', currentOrder);
        
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
        
        // Obtener todos los labels actuales
        var newOrder = [];
        $('.table-row').each(function() {
            var label = $(this).find('.row-content p').text().replace('Label: ', '');
            newOrder.push(label);
        });
        
        // Actualizar el input con el nuevo orden
        $('#current-disorder-value').val(arrayToString(newOrder));
        
        // Actualizar el preview con el nuevo orden
        currentOrder = newOrder;
        updateDisorderPreview();
        resetCorrectAnswers(); // Resetear respuestas correctas
    }

    function removeRow(event) {
        console.log('Remove row event triggered');
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
        console.log('Total rows before renumbering:', totalRows);
        
        $rows.each(function(index) {
            var $currentLabel = $(this).find('.row-content p');
            if ($currentLabel.length) {
                var newNumber = index + 1;
                console.log('Renumbering row', index, 'to', newNumber);
                $currentLabel.text('Label: ' + newNumber);
                $(this).attr('data-row-id', newNumber);
            }
        });
        
        // Obtener todos los labels actuales
        var newOrder = [];
        $('.table-row').each(function() {
            var label = $(this).find('.row-content p').text().replace('Label: ', '');
            newOrder.push(label);
        });
        
        // Actualizar el input con el nuevo orden
        $('#current-disorder-value').val(arrayToString(newOrder));
        
        // Actualizar el preview con el nuevo orden
        currentOrder = newOrder;
        updateDisorderPreview();
        resetCorrectAnswers(); // Resetear respuestas correctas
    }

    function saveChanges(event) {
        if (event) {
            event.preventDefault();
        }
        console.log('Starting save process...');
        
        // Guardar los valores actuales como valores anteriores
        previousDisorderOrder = $('#current-disorder-value').val();
        previousCorrectAnswers = $('#current-answers-value').val();
        
        var data = getFormData();
        console.log('Data to be sent:', data);
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        
        if ($.isFunction(runtime.notify)) {
            runtime.notify('save', {state: 'start'});
        }
        
        $.ajax({
            type: 'POST',
            url: handlerUrl,
            data: JSON.stringify(data),
            success: function(response) {
                console.log('Server response:', response);
                if (response.result === 'success') {
                    if ($.isFunction(runtime.notify)) {
                        runtime.notify('save', {state: 'end'});
                    }
                    // Actualizar savedOrder con el orden actual después de guardar
                    savedOrder = currentOrder;
                    console.log('Order saved successfully. Current order:', currentOrder);
                    console.log('Saved order:', savedOrder);
                    
                    // Actualizar el display del orden
                    $('.order-display').text(response.correct_answers);
                    
                    // Actualizar el display del orden anterior
                    var previousAnswers = previousCorrectAnswers || 'No definido';
                    $('.correct-answers-container .previous-order-display').text(previousAnswers);
                } else {
                    console.error('Error saving order:', response.message);
                    showMessage('Error al guardar: ' + response.message, 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX error:', error);
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
        $('.table-row').each(function() {
            var label = $(this).find('.row-content p').text().replace('Label: ', '');
            labels.push(label);
        });
        return labels;
    }

    // Crear una nueva lista con los labels ordenados
    function createOrderedList() {
        var orderedLabels = getOrderedLabels();
        var $newAnswerList = $('<div class="correct-answers-list">');
        
        orderedLabels.forEach(function(label) {
            var $newAnswer = $('<div class="correct-answer-item" draggable="true">' +
                '<button class="move-left-button" title="Mover izquierda">></button>' +
                '<span class="item-content">' + label + '</span>' +
                '<button class="move-right-button" title="Mover derecha"><</button>' +
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
                '<button class="move-left-button" title="Mover izquierda">></button>' +
                '<span class="item-content">' + label + '</span>' +
                '<button class="move-right-button" title="Mover derecha"><</button>' +
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
        
        console.log('Updating correct answers:', answerString);
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
        console.log('Initial correct answers:', initialAnswers);
        
        if (initialAnswers) {
            var answersArray = stringToAnswersArray(initialAnswers);
            console.log('Parsed answers array:', answersArray);
            
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
                        '<button class="move-left-button" title="Mover izquierda">></button>' +
                        '<span class="item-content">' + answer + '</span>' +
                        '<button class="move-right-button" title="Mover derecha"><</button>' +
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

    // Inicialización de eventos
    $tableRows.on('click', '.remove-row', removeRow);
    $addRowButton.on('click', addRow);
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
    }

    initialize();
} 