function EolOrderXBlock(runtime, element) {
    'use strict';

    var $element = $(element);
    var $tableRows = $element.find('.table-rows');
    var $addRowButton = $element.find('.add-row-button');
    var $saveButton = $element.find('.save-button');
    var $cancelButton = $element.find('.cancel-button');

    function getFormData() {
        return {
            table_name: $element.find('#table_name').val(),
            background_color: $element.find('#background_color').val(),
            numbering_type: $element.find('#numbering_type').val(),
            uppercase_letters: $element.find('#uppercase_letters').is(':checked'),
            table_rows: getTableRowsData()
        };
    }

    function getTableRowsData() {
        var rows = {};
        $element.find('.table-row').each(function() {
            var $row = $(this);
            var rowId = $row.data('row-id');
            rows[rowId] = {
                content: $row.find('.row-content-input').val()
            };
        });
        return rows;
    }

    function addRow() {
        var rowId = Date.now().toString();
        var rowHtml = `
            <div class="table-row" data-row-id="${rowId}">
                <div class="row-content">
                    <textarea class="row-content-input" placeholder="Contenido de la fila (HTML permitido)"></textarea>
                </div>
                <div class="row-actions">
                    <button class="remove-row">Eliminar</button>
                </div>
            </div>
        `;
        $tableRows.append(rowHtml);
    }

    function removeRow(event) {
        $(event.target).closest('.table-row').remove();
    }

    function saveChanges() {
        var data = getFormData();
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        
        $.ajax({
            type: 'POST',
            url: handlerUrl,
            data: JSON.stringify(data),
            success: function() {
                window.location.reload(false);
            }
        });
    }

    function cancelChanges() {
        window.location.reload(false);
    }

    $addRowButton.on('click', addRow);
    $tableRows.on('click', '.remove-row', removeRow);
    $saveButton.on('click', saveChanges);
    $cancelButton.on('click', cancelChanges);
} 