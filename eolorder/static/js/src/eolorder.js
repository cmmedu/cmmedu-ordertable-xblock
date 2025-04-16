function EolOrderXBlockEdit(runtime, element) {
    'use strict';

    var $element = $(element);
    var $itemsContainer = $element.find('.items-container');
    var $addItemButton = $element.find('.add-item-button');
    var $saveButton = $element.find('.save-button');
    var $cancelButton = $element.find('.cancel-button');
    var $displayName = $element.find('#display_name');

    function updateOrderNumbers() {
        $itemsContainer.find('.item-row').each(function(index) {
            $(this).find('.order-cell').text(index + 1);
            $(this).attr('data-index', index);
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
            if (direction === 'up') {
                $row.insertBefore($targetRow);
            } else {
                $row.insertAfter($targetRow);
            }
            updateOrderNumbers();
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
    var $submitButton = $element.find('.eol-order-submit');
    var handlerUrl = runtime.handlerUrl(element, 'submit_answer');

    $submitButton.on('click', function(e) {
        e.preventDefault();
        var data = {
            // Add any data you want to submit
        };
        
        $.ajax({
            type: 'POST',
            url: handlerUrl,
            data: JSON.stringify(data),
            success: function(response) {
                if (response.result === 'success') {
                    // Handle success
                }
            }
        });
    });
} 