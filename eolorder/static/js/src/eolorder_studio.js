function EolOrderStudio(runtime, element) {
    var $element = $(element);
    var $errorMessage = $element.find('.wrapper-message');
    var $itemsContainer = $element.find('.items-container');
    var $addItemButton = $element.find('.add-item-button');
    var $saveButton = $element.find('.save-button');
    var $cancelButton = $element.find('.cancel-button');
    var $randomOrder = $element.find('#random_order');
    var $customDisorderField = $element.find('#custom_disorder_field');
    var $customDisorder = $element.find('#custom_disorder');

    // Manejar el cambio en la casilla de orden aleatorio
    $randomOrder.on('change', function() {
        if ($(this).is(':checked')) {
            $customDisorderField.hide();
        } else {
            $customDisorderField.show();
        }
    });

    // Agregar nuevo elemento
    $addItemButton.on('click', function() {
        var newIndex = $itemsContainer.children().length + 1;
        var newItem = $('<div class="item-box" data-index="' + newIndex + '" draggable="true">' +
            '<div class="item-header">' +
            '<span class="item-number">' + newIndex + '</span>' +
            '<button class="delete-button">×</button>' +
            '</div>' +
            '<textarea class="item-content"></textarea>' +
            '</div>');
        $itemsContainer.append(newItem);
        updateOrderNumbers();
    });

    // Eliminar elemento
    $itemsContainer.on('click', '.delete-button', function() {
        $(this).closest('.item-box').remove();
        updateOrderNumbers();
    });

    // Actualizar números de orden
    function updateOrderNumbers() {
        $itemsContainer.find('.item-box').each(function(index) {
            var newIndex = index + 1;
            $(this).attr('data-index', newIndex);
            $(this).find('.item-number').text(newIndex);
        });
    }

    // Funcionalidad de arrastrar y soltar
    $itemsContainer.on('dragstart', '.item-box', function(e) {
        $(this).addClass('dragging');
        e.originalEvent.dataTransfer.setData('text/plain', $(this).attr('data-index'));
    });

    $itemsContainer.on('dragend', '.item-box', function() {
        $(this).removeClass('dragging');
    });

    $itemsContainer.on('dragover', function(e) {
        e.preventDefault();
        var draggingItem = $('.dragging');
        var afterElement = getDragAfterElement(this, e.clientX);
        if (afterElement) {
            $itemsContainer.insertBefore(draggingItem, afterElement);
        } else {
            $itemsContainer.append(draggingItem);
        }
    });

    function getDragAfterElement(container, x) {
        var draggableElements = [...container.querySelectorAll('.item-box:not(.dragging)')];
        
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

    // Guardar cambios
    $saveButton.on('click', function() {
        var data = {
            display_name: $element.find('#display_name').val(),
            table_name: $element.find('#table_name').val(),
            background_color: $element.find('#background_color').val(),
            numbering_type: $element.find('#numbering_type').val(),
            uppercase_letters: $randomOrder.is(':checked'),
            random_order: $randomOrder.is(':checked'),
            custom_disorder: $customDisorder.val().split(',').map(function(item) {
                return item.trim();
            }).filter(function(item) {
                return item !== '';
            }),
            weight: parseFloat($element.find('#weight').val()),
            ordeingelements: {}
        };

        // Recolectar elementos
        $itemsContainer.find('.item-box').each(function() {
            var index = $(this).attr('data-index');
            data.ordeingelements[index] = {
                content: $(this).find('.item-content').val()
            };
        });

        // Validar el orden personalizado
        if (!data.random_order && data.custom_disorder.length > 0) {
            var validIndices = Object.keys(data.ordeingelements);
            var invalidIndices = data.custom_disorder.filter(function(index) {
                return !validIndices.includes(index);
            });
            
            if (invalidIndices.length > 0) {
                showError('Los siguientes índices no son válidos: ' + invalidIndices.join(', '));
                return;
            }
        }

        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        $.post(handlerUrl, JSON.stringify(data))
            .done(function(response) {
                if (response.result === 'success') {
                    window.location.reload(false);
                } else {
                    showError(response.message || 'Error al guardar los cambios');
                }
            })
            .fail(function() {
                showError('Error al guardar los cambios');
            });
    });

    // Cancelar cambios
    $cancelButton.on('click', function() {
        runtime.notify('cancel', {});
    });

    // Mostrar mensaje de error
    function showError(message) {
        $errorMessage.find('.message-text').text(message);
        $errorMessage.show();
        setTimeout(function() {
            $errorMessage.hide();
        }, 5000);
    }
} 