function EolOrderXBlock(runtime, element) {
    'use strict';

    var $element = $(element);
    var $tableRows = $element.find('.table-rows');
    var $addRowButton = $element.find('.add-row-button');
    var $saveButton = $element.find('.save-button');
    var $cancelButton = $element.find('.cancel-button');
    var $disorderPreview = $element.find('.disorder-preview');
    var currentOrder = [];
    var savedOrder = [];

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

    function getFormData() {
        // Obtener el valor directamente del input
        var orderString = $('#current-order-value').val();
        console.log('Order string from input:', orderString);
        
        // Convertir a array y luego de vuelta a string para asegurar el formato correcto
        var normalizedOrder = arrayToString(stringToArray(orderString));
        console.log('Normalized order:', normalizedOrder);
        
        var data = {
            table_name: $element.find('#table_name').val(),
            background_color: $element.find('#background_color').val(),
            numbering_type: $element.find('#numbering_type').val(),
            uppercase_letters: $element.find('#uppercase_letters').is(':checked'),
            random_Fdisorder: $element.find('#random_disorder').is(':checked'),
            ordeingelements: getTableRowsData(),
            disordered_order: normalizedOrder
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
        console.log('Current order updated:', currentOrder);
        
        // Actualizar el input oculto con el orden actual
        var orderString = arrayToString(currentOrder);
        $('#current-order-value').val(orderString);
        
        // Guardar los cambios automáticamente
        saveChanges();
    }

    function updateDisorderPreview() {
        // Obtener el orden actual del input
        var currentValue = $('#current-order-value').val();
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
        var $input = $disorderPreview.find('#current-order-value');
        
        // Limpiar solo los elementos desordenados
        $disorderPreview.find('.disorder-item').remove();
        
        // Reconstruir los elementos desordenados
        currentOrder.forEach(function(label, index) {
            var $item = $('<div>', {
                class: 'disorder-item',
                'data-value': label
            }).append(
                $('<button>', {
                    class: 'move-up-button',
                    title: 'Mover arriba',
                    disabled: index === 0
                }).text('↑'),
                $('<span>', {
                    class: 'item-content',
                    text: label
                }),
                $('<button>', {
                    class: 'move-down-button',
                    title: 'Mover abajo',
                    disabled: index === currentOrder.length - 1
                }).text('↓')
            );
            $disorderPreview.append($item);
        });
        
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
        
        // Actualizar el input con el orden actual
        $input.val(arrayToString(currentOrder));
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
            var $leftButton = $item.find('.move-up-button');
            var $rightButton = $item.find('.move-down-button');
            
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
        
        // Obtener el valor actual del input
        var currentValue = $('#current-order-value').val();
        var currentArray = stringToArray(currentValue);
        
        // Agregar el nuevo elemento al array
        currentArray.push(nextLabelNumber.toString());
        
        // Actualizar el input con el nuevo array
        $('#current-order-value').val(arrayToString(currentArray));
        
        // Actualizar el preview con el nuevo orden
        currentOrder = currentArray;
        updateDisorderPreview();
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
        
        var rowIndex = $row.index();
        var label = (rowIndex + 1).toString();
        console.log('Removing row with label:', label);
        
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
        
        // Obtener el valor actual del input
        var currentValue = $('#current-order-value').val();
        var currentArray = stringToArray(currentValue);
        
        // Remover el elemento del array
        var index = currentArray.indexOf(label);
        if (index !== -1) {
            currentArray.splice(index, 1);
        }
        
        // Actualizar el input con el nuevo array
        $('#current-order-value').val(arrayToString(currentArray));
        
        // Actualizar el preview con el nuevo orden
        currentOrder = currentArray;
        updateDisorderPreview();
    }

    function saveChanges(event) {
        if (event) {
            event.preventDefault();
        }
        console.log('Starting save process...');
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

    // Inicialización de eventos
    $tableRows.on('click', '.remove-row', removeRow);
    $addRowButton.on('click', addRow);
    $saveButton.on('click', saveChanges);
    $cancelButton.on('click', function(event) {
        event.preventDefault();
        runtime.notify('cancel', {});
    });
    
    $disorderPreview.on('click', '.move-up-button', moveItemLeft);
    $disorderPreview.on('click', '.move-down-button', moveItemRight);
    
    // Inicializar el preview
    updateDisorderPreview();
} 