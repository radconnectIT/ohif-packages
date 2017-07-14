import { Random } from 'meteor/random';
// Local Imports
import { Screen } from './Screen';
/**
 * A Stage is one step in the Display Set Sequence for a Hanging Protocol
 *
 * Stages are defined as a ViewportStructure and an array of Viewports
 *
 * @type {Stage}
 */
export class Stage {
    constructor(name) {
        // Create a new UUID for this Stage
        this.id = Random.id();

        this.name = name;
        this.screens = [];

        // Set the created date to Now
        this.createdDate = new Date();
    }

    /**
     * Sets the main screen of the stage.
     * @param {Screen} screen The screen which must me set as the main screen
     */
    setMainScreen(screen) {
        if (screen instanceof Screen) {
            const foundAtIndex = this.screens.indexOf(screen);
            if (foundAtIndex > 0) {
                const oldFirst = this.screens[0];
                this.screens[0] = screen;
                this.screens[foundAtIndex] = oldFirst;
            } else if (foundAtIndex < 0) {
                this.screens.unshift(screen);
            }
        }
    }

    /**
     * Creates a clone of the current Stage with a new name
     *
     * Note! This method absolutely cannot be renamed 'clone', because
     * Minimongo's insert method uses 'clone' internally and this
     * somehow causes very bizarre behaviour
     *
     * @param name
     * @returns {Stage|*}
     */
    createClone(name) {
        // Create a new JavaScript independent of the current Protocol
        const currentStage = Object.assign({}, this);

        // Create a new Stage to return
        const clonedStage = new Stage();

        // Assign the desired properties
        currentStage.id = clonedStage.id;
        clonedStage.fromObject(currentStage);

        // If we have specified a name, assign it
        if (name) {
            clonedStage.name = name;
        }

        // Return the cloned Stage
        return clonedStage;
    }

    /**
     * Occasionally the Stage class needs to be instantiated from a JavaScript Object.
     * This function fills in a Protocol with the Object data.
     *
     * @param {Object}  input    A Stage as a JavaScript Object, e.g. retrieved from MongoDB or JSON
     * @param {Boolean} resetIds If true, create a new ID for the object
     */
    fromObject(input, resetIds = false) {
        // Check if the input already has an ID or it should be reset
        // If so, keep it. If not, create a new UUID
        this.id = (!resetIds && input.id) || Random.id();

        // Assign the input name to the Stage
        this.name = input.name;

        if (input.screens instanceof Array) {
            input.screens.forEach(screen => {
                const screenInstance = new Screen();
                screenInstance.fromObject(screen, resetIds);
                this.screens.push(screenInstance);
            });
        } else if ('viewportStructure' in input && 'viewports' in input) {
            // In case we are still using the old format (without screens)
            const screenInstance = new Screen();
            screenInstance.fromObject(input, resetIds);
            this.screens.push(screenInstance);
        }

    }
}
