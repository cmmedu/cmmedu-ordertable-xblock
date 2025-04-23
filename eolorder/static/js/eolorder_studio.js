function EolOrderStudio(runtime, element) {
    var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
    var $element = $(element);
    var $itemsTable = $element.find('.items-table');
    var $disorderPreview = $element.find('.disorder-preview');
    var $generateDisorderButton = $element.find('.generate-disorder-button');

    // Función para generar un nuevo orden desordenado
    function generateDisorder() {
        var items = [];
        $itemsTable.find('tbody tr').each(function() {
            items.push($(this).find('.item-content').val());
        });

        // Mezclar los elementos
        var disorderedItems = [...items];
        for (var i = disorderedItems.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            [disorderedItems[i], disorderedItems[j]] = [disorderedItems[j], disorderedItems[i]];
        }

        // Actualizar la vista previa
        $disorderPreview.empty();
        disorderedItems.forEach(function(item) {
            $disorderPreview.append($('<div>', {
                class: 'disorder-item',
                text: item
            }));
        });

        // Enviar el nuevo orden al servidor
        var data = {
            disordered_order: disorderedItems
        };
        $.ajax({
            type: 'POST',
            url: handlerUrl,
            data: JSON.stringify(data),
            success: function(response) {
                if (response.result === 'success') {
                    // Actualizar el orden desordenado en el servidor
                    runtime.notify('save', {state: 'start'});
                    runtime.notify('save', {state: 'end'});
                }
            }
        });
    }

    // Evento para el botón de generar nuevo orden
    $generateDisorderButton.on('click', function(e) {
        e.preventDefault();
        generateDisorder();
    });

    // Función para inicializar la vista previa del orden desordenado
    function initializeDisorderPreview() {
        var disorderedItems = JSON.parse($element.find('#disordered_order').val() || '[]');
        $disorderPreview.empty();
        disorderedItems.forEach(function(item) {
            $disorderPreview.append($('<div>', {
                class: 'disorder-item',
                text: item
            }));
        });
    }

    // Inicializar la vista previa al cargar
    initializeDisorderPreview();

    // Manejar el envío del formulario
    $element.find('.save-button').on('click', function(e) {
        e.preventDefault();
        var data = {
            display_name: $element.find('#display_name').val(),
            table_name: $element.find('#table_name').val(),
            background_color: $element.find('#background_color').val(),
            numbering_type: $element.find('#numbering_type').val(),
            use_uppercase: $element.find('#use_uppercase').is(':checked'),
            items: []
        };

        $itemsTable.find('tbody tr').each(function() {
            data.items.push($(this).find('.item-content').val());
        });

        $.ajax({
            type: 'POST',
            url: handlerUrl,
            data: JSON.stringify(data),
            success: function(response) {
                if (response.result === 'success') {
                    runtime.notify('save', {state: 'start'});
                    runtime.notify('save', {state: 'end'});
                }
            }
        });
    });

    // Manejar el botón de cancelar
    $element.find('.cancel-button').on('click', function(e) {
        e.preventDefault();
        runtime.notify('cancel', {});
    });

    // Manejar la adición de nuevos elementos
    $element.find('.add-item-button').on('click', function(e) {
        e.preventDefault();
        var $newRow = $('<tr>');
        $newRow.append($('<td>').append($('<textarea>', {
            class: 'item-content',
            rows: 3
        })));
        $newRow.append($('<td>', {
            class: 'actions-cell'
        }).append(
            $('<button>', {
                class: 'move-up-button',
                text: '↑'
            }),
            $('<button>', {
                class: 'move-down-button',
                text: '↓'
            }),
            $('<button>', {
                class: 'delete-button',
                text: '×'
            })
        ));
        $itemsTable.find('tbody').append($newRow);
    });

    // Manejar los botones de acción de los elementos
    $itemsTable.on('click', '.move-up-button', function() {
        var $row = $(this).closest('tr');
        var $prevRow = $row.prev();
        if ($prevRow.length) {
            $row.insertBefore($prevRow);
        }
    });

    $itemsTable.on('click', '.move-down-button', function() {
        var $row = $(this).closest('tr');
        var $nextRow = $row.next();
        if ($nextRow.length) {
            $row.insertAfter($nextRow);
        }
    });

    $itemsTable.on('click', '.delete-button', function() {
        $(this).closest('tr').remove();
    });
} 