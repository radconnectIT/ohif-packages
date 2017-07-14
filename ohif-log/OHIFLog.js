import { Meteor } from 'meteor/meteor';
import { loglevel } from 'meteor/practicalmeteor:loglevel';

/**
 * OHIF Logger object provides some minimal console logger. It uses loglevel as default logger.
 * LogLevel docs can be found here: https://github.com/practicalmeteor/meteor-loglevel
 * To use a custom Logger, just pass it during instantiation or call 'setLogger' function.
 * If the custom Logger does not have the required logging function, nothing is done.
 */
export default class OHIFLog {
  /**
   * Constructor
   *
   * @param {Object} logger Logger object with logging functions. Not required.
   *                        If not given, 'loglevel' is used instead.
   */
  constructor(logger) {
    Object.defineProperties(this, {
      _logger: {
        configurable: false,
        enumerable: false,
        writable: true,
        value: logger
      } });

    // If no logger has been given, set the default
    if (!logger) {
      this.setDefaultLogger();
    }
  }

  /**
   * Call the given logging function.
   *
   * @param  {String} type Logging function name (e.g. 'debug', 'info')
   * @param  {*}      args List of arguments to be logged
   */
  _log(type, ...args) {
    const logFunction = this._logger[type];
    if (typeof logFunction === 'function') {
      logFunction.call(null, ...args);
    }
  }

  /**
   * Set the loglevel as the default current logger.
   */
  setDefaultLogger() {
    const defaultLevel = Meteor.isProduction ? 'error' : 'trace';
    const defaultLogger = loglevel.createLogger('', defaultLevel);

    this.setLogger(defaultLogger);
  }

  /**
   * Set the current logger as the given logger object.
   *
   * @param {Object} logger Logger object with logging functions.
   */
  setLogger(logger) {
    if (logger !== null && typeof logger === 'object') {
      this._logger = logger;
    } else {
      throw Error('OHIFLog::setLogger Invalid given logger');
    }
  }

  /**
   * Trace logging function.
   *
   * @param  {*} args List of arguments to be logged
   */
  trace(...args) {
    this._log('trace', ...args);
  }

  /**
   * Fine logging function.
   *
   * @param  {*} args List of arguments to be logged
   */
  fine(...args) {
    this._log('fine', ...args);
  }

  /**
   * Debug logging function.
   *
   * @param  {*} args List of arguments to be logged
   */
  debug(...args) {
    this._log('debug', ...args);
  }

  /**
   * Info logging function.
   *
   * @param  {*} args List of arguments to be logged
   */
  info(...args) {
    this._log('info', ...args);
  }

  /**
   * Warning logging function.
   *
   * @param  {*} args List of arguments to be logged
   */
  warn(...args) {
    this._log('warn', ...args);
  }

  /**
   * Error logging function.
   *
   * @param  {*} args List of arguments to be logged
   */
  error(...args) {
    this._log('error', ...args);
  }
}
