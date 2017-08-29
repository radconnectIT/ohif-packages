import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { setActiveViewport } from '../../../lib/setActiveViewport';

const slideTimeoutTime = 40;
let slideTimeout;

Template.imageControls.onRendered(() => {
    const instance = Template.instance();

    // Set the current imageSlider width to its parent's height
    // (because webkit is stupid and can't style vertical sliders)
    const $slider = instance.$('#imageSlider');
    const $element = $slider.parents().eq(2).siblings('.imageViewerViewport');
    const viewportHeight = $element.height();

    $slider.width(viewportHeight - 20);
})

Template.imageControls.events({
    'keydown input[type=range]'(event) {
        // We don't allow direct keyboard up/down input on the
        // image sliders since the natural direction is reversed (0 is at the top)

        // Store the KeyCodes in an object for readability
        const keys = {
            DOWN: 40,
            UP: 38
        };

        if (event.which === keys.DOWN) {
            OHIF.viewer.hotkeyFunctions.scrollDown();
            event.preventDefault();
        } else if (event.which === keys.UP) {
            OHIF.viewer.hotkeyFunctions.scrollUp();
            event.preventDefault();
        }
    },
    'input input[type=range], change input[type=range]'(event) {
        // Note that we throttle requests to prevent the
        // user's ultrafast scrolling from firing requests too quickly.
        clearTimeout(slideTimeout);
        slideTimeout = setTimeout(() => {
            // Using the slider in an inactive viewport
            // should cause that viewport to become active
            const slider = $(event.currentTarget);
            const newActiveElement = slider.parents('.viewportContainer').find('.imageViewerViewport');
            setActiveViewport(newActiveElement);

            // Subtract 1 here since the slider goes from 1 to N images
            // But the stack indexing starts at 0
            const newImageIdIndex = parseInt(slider.val(), 10) - 1;
            OHIF.viewerbase.switchToImageByIndex(newImageIdIndex);
        }, slideTimeoutTime);

        return false;
    }
});
