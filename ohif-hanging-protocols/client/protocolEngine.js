// Define a global variable that will be used to refer to the Protocol Engine
// It must be populated by HP.setEngine when the Viewer is initialized and a ProtocolEngine
// is instantiated on top of the LayoutManager. If the global ProtocolEngine variable remains
// undefined, none of the HangingProtocol functions will operate.
ProtocolEngine = undefined;

/**
 * Sets the ProtocolEngine global given an instantiated ProtocolEngine. This is done so that
 * The functions in the package can depend on a ProtocolEngine variable, but this variable does
 * not have to be exported from the application level.
 *
 * (There may be a better way to do this, but for now this works with no real downside)
 *
 * @param protocolEngine An instantiated ProtocolEngine linked to a LayoutManager from the
 *                       Viewerbase package
 */
HP.setEngine = function(protocolEngine) {
    ProtocolEngine = protocolEngine;
};

HP.getEngine = function() {
    return ProtocolEngine;
};

HP.ProtocolEngine = null;
