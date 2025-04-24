function EolOrderXBlock(runtime, element) {
    'use strict';

    var $element = $(element);
    var $tableRows = $element.find('.table-rows');
    var $addRowButton = $element.find('.add-row-button');
    var $saveButton = $element.find('.save-button');
    var $cancelButton = $element.find('.cancel-button');
    var $disorderPreview = $element.find('.disorder-preview');

    function getFormData() {
        return {
            table_name: $element.find('#table_name').val(),
            background_color: $element.find('#background_color').val(),
            numbering_type: $element.find('#numbering_type').val(),
            uppercase_letters: $element.find('#uppercase_letters').is(':checked'),
            random_disorder: $element.find('#random_disorder').is(':checked'),
            ordeingelements: getTableRowsData(),
            disordered_order: getDisorderList()
        };
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
        $element.find('.table-row').each(function() {
            var $row = $(this);
            var label = $row.find('.row-label').text().trim() || $row.data('row-id');
            disorderList.push(label);
        });
        return disorderList;
    }

    function updateDisorderPreview() {
        $disorderPreview.empty();
        var disorderList = getDisorderList();
        disorderList.forEach(function(label) {
            $disorderPreview.append($('<span>', {
                class: 'disorder-item',
                text: label
            }));
        });
    }

    function addRow() {
        var rowId = Date.now().toString();
        var nextLabelNumber = $element.find('.table-row').length + 1;
        var rowHtml = `
            <div class="table-row" data-row-id="${rowId}">
                <div class="row-content">
                    <p>Label: <span class="row-label">${nextLabelNumber}</span></p>
                </div>
                <div class="row-content">
                    <textarea class="row-content-input" placeholder="Contenido de la fila (HTML permitido)"></textarea>
                </div>
                <div class="row-actions">
                    <button class="remove-row">Eliminar</button>
                </div>
            </div>
        `;
        $tableRows.append(rowHtml);
        updateDisorderPreview();
    }

    function removeRow(event) {
        $(event.target).closest('.table-row').remove();
        updateDisorderPreview();
    }

    function saveChanges(event) {
        event.preventDefault();
        var data = getFormData();
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        
        if ($.isFunction(runtime.notify)) {
            runtime.notify('save', {state: 'start'});
        }
        
        $.ajax({
            type: 'POST',
            url: handlerUrl,
            data: JSON.stringify(data),
            success: function(response) {
                if (response.result === 'success') {
                    if ($.isFunction(runtime.notify)) {
                        runtime.notify('save', {state: 'end'});
                    }
                } else {
                    showMessage('Error al guardar: ' + response.message, 'error');
                }
            },
            error: function() {
                showMessage('Error al guardar los cambios', 'error');
            }
        });
    }

    function showMessage(message, type) {
        var $messageContainer = $('.xblock-editor-error-message');
        $messageContainer.text(message);
        $messageContainer.removeClass('success error').addClass(type);
    }

    // Initialize disorder preview on load
    updateDisorderPreview();

    $addRowButton.on('click', addRow);
    $tableRows.on('click', '.remove-row', removeRow);
    $saveButton.on('click', saveChanges);
    $cancelButton.on('click', function(event) {
        event.preventDefault();
        runtime.notify('cancel', {});
    });
} 