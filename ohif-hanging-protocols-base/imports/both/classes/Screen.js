import { Random } from 'meteor/random';
// Local Imports
import { ViewportStructure } from './ViewportStructure';
import { Viewport } from './Viewport';
/**
 * A Screen is one step in the Display Set Sequence for a Hanging Protocol
 *
 * Screens are defined as a ViewportStructure and an array of Viewports
 *
 * @type {Screen}
 */
export class Screen {

    constructor(ViewportStructure, name) {
        // Create a new UUID for this Screen
        this.id = Random.id();

        // Assign the name and ViewportStructure provided
        this.name = name;
        this.viewportStructure = ViewportStructure;

        // Create an empty array for the Viewports
        this.viewports = [];

        // New Properties For Improved Display Matching
        this.position = null;
        this.selectors = null;

    }

    /**
     * Creates a clone of the current Screen with a new name
     *
     * Note! This method absolutely cannot be renamed 'clone', because
     * Minimongo's insert method uses 'clone' internally and this
     * somehow causes very bizarre behaviour
     *
     * @param name
     * @returns {Screen|*}
     */
    createClone(name) {
        // Create a new JavaScript independent of the current Protocol
        const currentScreen = Object.assign({}, this);

        // Create a new Screen to return
        const clonedScreen = new Screen();

        // Assign the desired properties
        currentScreen.id = clonedScreen.id;
        clonedScreen.fromObject(currentScreen);

        // If we have specified a name, assign it
        if (name) {
            clonedScreen.name = name;
        }

        // Return the cloned Screen
        return clonedScreen;
    }

    /**
     * Occasionally the Screen class needs to be instantiated from a JavaScript Object.
     * This function fills in a Protocol with the Object data.
     *
     * @param {Object}  input    A Screen as a JavaScript Object, e.g. retrieved from MongoDB or JSON
     * @param {Boolean} resetIds If true, create a new ID for the object
     */
    fromObject(input, resetIds = false) {
        // Check if the input already has an ID or it should be reset
        // If so, keep it. If not, create a new UUID
        this.id = (!resetIds && input.id) || Random.id();

        // Assign the input name to the Screen
        this.name = input.name;

        // The current screen should not be skipped, so return
        if (!('viewportStructure' in input) || !('viewports' in input)) {
            return;
        }

        // If a ViewportStructure is present in the input, add it from the
        // input data
        this.viewportStructure = new ViewportStructure();
        this.viewportStructure.fromObject(input.viewportStructure);

        // If any viewports are present in the input object
        if (input.viewports) {
            input.viewports.forEach(viewportObject => {
                // Create a new Viewport with their data
                const viewport = new Viewport();
                viewport.fromObject(viewportObject);

                // Add it to the viewports array
                this.viewports.push(viewport);
            });
        }

        this.position = input.position || null;
        this.selectors = input.selectors || null;

    }

    /**
     * Add a viewport object to the current screen
     * @param {Viewport} viewport The Viewport instance to be appended to the internal list of viewports
     */
    addViewport(viewport) {
        if (viewport instanceof Viewport) {
            this.viewports.push(viewport);
        }
    }

    /**
     * Turn this instance into a plain JS Object
     */
    toPlainObject() {
        return JSON.parse(JSON.stringify(this));
    }

    /**
     * Utility to iterate over each viewport.
     * @param {function} callback The callback which will be executed for each existing viewport of the screen
     */
    forEachViewport(callback) {
        this.viewports.forEach(callback);
    }

    /**
     * Static Methods
     */

    /**
     * Utility to create a new Screen instance using the grid layout.
     * @param {number} rows    The number of rows of the grid layout
     * @param {number} columns The number of columns of the grid layout
     * @param {String} name    The name of the Screen. Default is null
     */
    static withGridLayout(rows, columns, name = null) {
        const viewportStructure = new ViewportStructure('grid', { rows, columns });
        const screen = new Screen(viewportStructure, name);
        for (let i = 0, limit = rows * columns; i < limit; i++) {
            screen.addViewport(new Viewport());
        }
        return screen;
    }

}
