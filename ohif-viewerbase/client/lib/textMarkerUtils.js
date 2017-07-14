import { Blaze } from 'meteor/blaze';

import { viewportUtils } from './viewportUtils';
import { hotkeyUtils } from './hotkeyUtils';

const changeTextCallback = (data, eventData, doneChangingTextCallback) => {
    const { toolManager } = OHIF.viewer;
    const dialog = document.getElementById('textMarkerRelabelDialog');
    if (dialog.open === true) {
        return;
    }

    dialog.showModal();

    const $dialog = $(dialog);

    // Is necessary to use Blaze object to not create 
    // circular depencency with helper object (./helpers)
    if (Blaze._globalHelpers.isTouchDevice()) {
        // Center the dialog on screen on touch devices
        $dialog.css({
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: 'auto'
        });
        $dialog.find('.dialog.arrow').hide();
    } else {
        // Place the dialog above the tool that is being relabelled
        // TODO = Switch this to the tool coordinates, but put back into
        // page coordinates.
        $dialog.css({
            top: eventData.currentPoints.page.y - $dialog.outerHeight() - 20,
            left: eventData.currentPoints.page.x - $dialog.outerWidth() / 2
        });
        $dialog.find('.dialog.arrow').show();
    }

    const $select = $dialog.find('.relabelSelect');
    const $confirm = $dialog.find('.relabelConfirm');
    const $remove = $dialog.find('.relabelRemove');
    const $close = $dialog.find('.relabelClose');

    // If the remove button is clicked, delete this marker
    $remove.off('click');
    $remove.on('click', function() {
        doneChangingTextCallback(data, undefined, true);
        dialog.close();
    });

    // Update selector to the current
    $select.val(data.text).trigger('change');

    $confirm.off('click');
    $confirm.on('click', () => {
        doneChangingTextCallback(data, $select.val());
        dialog.close();
    });

    $close.on('click', () => {
        doneChangingTextCallback(data, $select.val());
        dialog.close();
    });

    // Unbind our hotkeys
    $(document).unbind('keydown');

    // Use keydown since keypress doesn't handle ESC in Chrome
    $dialog.off('keydown');
    $dialog.on('keydown', event => {
        // If Enter is pressed, accept the changes
        if (event.which === 13) {
            doneChangingTextCallback(data, $select.val());
            dialog.close();
        } else if (event.which === 27) {
            // If Esc is pressed, close the dialog without changes
            doneChangingTextCallback(data, data.text);
            dialog.close();
        }
    });

    $dialog.off('cancel');
    $dialog.on('cancel', function() {
        doneChangingTextCallback(data, data.text);
    });

    $dialog.off('close');
    $dialog.on('close', () => {
        // Reset the focus to the active viewport element
        // This makes the mobile Safari keyboard close
        const element = viewportUtils.getActiveViewportElement();
        $(element).focus();

        // Deactivate textMarker tool after editing a spine label if spine is not active tool
        if (toolManager.getActiveTool() !== 'spine') {
            cornerstoneTools.textMarker.deactivate(element, 1);
        }

        // Re-enable hotkeys
        hotkeyUtils.enableHotkeys();
    });
};

const textMarkerUtils = {
    changeTextCallback
};

export { textMarkerUtils };