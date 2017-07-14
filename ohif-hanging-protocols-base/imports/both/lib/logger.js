/**
 * Temporary utility to replace OHIF.log within this package.
 * @param {string} type The type of logging that will be used.
 * @param {*} messages The messages that will be logged.
 */

const loggers = Object.create(null);

export default function logger(type, ...messages) {
    if (type in loggers) {
        const { context, handler } = loggers[type];
        handler.apply(context, messages);
    } else if (typeof console !== 'undefined' && type in console && typeof console[type] === 'function') {
        const context = console;
        const handler = console[type];
        loggers[type] = { context, handler };
        handler.apply(context, messages);
    }
};
