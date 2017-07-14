import { viewportUtils } from './viewportUtils';
import { hotkeyUtils } from './hotkeyUtils';

const getTextCallback = doneChangingTextCallback => {
    const dialog = document.getElementById('annotationDialog');
    if (dialog.open === true) {
        return;
    }

    dialog.showModal();

    const $dialog = $(dialog);
    const $confirm = $dialog.find('.annotationDialogConfirm');

    // Focus on the text input to open the Safari keyboard
    const $getTextInput = $dialog.find('.annotationTextInput');
    $getTextInput.focus();

    // Unbind our hotkeys
    $(document).unbind('keydown');

    $confirm.off('click');
    $confirm.on('click', function() {
        doneChangingTextCallback($getTextInput.val());
        dialog.close();
    });

    $dialog.off('cancel');
    $dialog.on('cancel', function() {
        doneChangingTextCallback();
    });

    // Use keydown since keypress doesn't handle ESC in Chrome
    $dialog.off('keydown');
    $dialog.on('keydown', event => {
        // If Enter or Esc are pressed, close the dialog
        if (event.which === 13) {
            doneChangingTextCallback($getTextInput.val());
            dialog.close();
        } else if (event.which === 27) {
            doneChangingTextCallback();
            dialog.close();
        }
    });

    $dialog.off('close');
    $dialog.on('close', () => {
        // Reset the text value
        $getTextInput.val('');

        // Reset the focus to the active viewport element
        // This makes the mobile Safari keyboard close
        const element = viewportUtils.getActiveViewportElement();
        $(element).focus();

        // Re-enable hotkeys
        hotkeyUtils.enableHotkeys();
    });
};

const changeTextCallback = (data, eventData, doneChangingTextCallback) => {
    const dialog = document.getElementById('relabelAnnotationDialog');
    if (dialog.open === true) {
        return;
    }

    dialog.showModal();

    const $dialog = $(dialog);
    const $dialogArrow = $dialog.find('.dialog.arrow');
    const $confirm = $dialog.find('.annotationDialogConfirm');
    const $remove = $dialog.find('.annotationDialogRemove');

    const $getTextInput = $dialog.find('.annotationTextInput');
    // Focus on the text input to open the Safari keyboard
    $getTextInput.focus();
    $getTextInput.val(data.text);

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
        $dialogArrow.hide();
    } else {
        // Place the dialog above the tool that is being relabelled
        // TODO = Switch this to the tool coordinates, but put back into
        // page coordinates.
        $dialog.css({
            top: eventData.currentPoints.page.y - $dialog.outerHeight() - 20,
            left: eventData.currentPoints.page.x - $dialog.outerWidth() / 2
        });
        $dialogArrow.show();
    }

    $confirm.off('click');
    $confirm.on('click', function() {
        doneChangingTextCallback(data, $getTextInput.val());
        dialog.close();
    });

    // If the remove button is clicked, delete this marker
    $remove.off('click');
    $remove.on('click', function() {
        doneChangingTextCallback(data, undefined, true);
        dialog.close();
    });

    // Unbind our hotkeys
    $(document).unbind('keydown');

    $dialog.off('keydown');
    $dialog.on('keydown', event => {
        // If Enter is pressed, close the dialog
        if (event.which === 13) {
            doneChangingTextCallback(data, $getTextInput.val());
            dialog.close();
        } else if (event.which === 27) {
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
        // Reset the text value
        $getTextInput.val('');

        // Reset the focus to the active viewport element
        // This makes the mobile Safari keyboard close
        const element = viewportUtils.getActiveViewportElement();
        $(element).focus();

        // Re-enable hotkeys
        hotkeyUtils.enableHotkeys();
    });
};

const annotateTextUtils = {
    getTextCallback,
    changeTextCallback
};

export { annotateTextUtils };