import { expect } from 'meteor/practicalmeteor:chai';
import { describe, it, beforeEach } from 'meteor/practicalmeteor:mocha';
import { sinon } from 'meteor/practicalmeteor:sinon';
import { OHIF, OHIFLog } from '../main';

describe('OHIF Log', () => {
  beforeEach(() => {
    this.sandbox = sinon.sandbox.create();
    this.infoStub = this.sandbox.stub().returns('info');
    this.traceStub = this.sandbox.stub().returns('trace');
    this.logger = {
      info: this.infoStub,
      trace: this.traceStub
    };
  });

  afterEach(() => {
    this.sandbox.restore();
  });

  it('Should be available in OHIF namespace', () => {
    expect(OHIF.log).to.not.be.undefined;
  });

  it('Should have main logging functions', () => {
    const loggingFunctions = ['info', 'debug', 'trace', 'warn', 'error'];

    loggingFunctions.forEach(loggingFunction => {
      expect(OHIF.log[loggingFunction]).to.be.instanceOf(Function);
    });
  });

  it('Should be able to set a custom logger on instantiation', () => {
    const customLogger = new OHIFLog(this.logger);
    customLogger.info('Custom Info');
    expect(this.infoStub.called).to.be.true;
  });

  it('Should be able to set a custom logger after instantiation', () => {
    const customLogger = new OHIFLog();
    customLogger.setLogger(this.logger);
    customLogger.info('Custom Info');
    expect(this.infoStub.called).to.be.true;
  });

  it('Should be able to set default logger after a custom logger setting', () => {
    const customLogger = new OHIFLog(this.logger);
    customLogger.info('Custom Info');
    expect(this.infoStub.called).to.be.true;

    customLogger.setDefaultLogger();
    customLogger.warn('Default Trace');
    expect(this.traceStub.called).to.be.false;
  });

  it('Should not thrown an error if logging function does not exist for a custom logger', () => {
    const customLogger = new OHIFLog(this.logger);
    expect(customLogger.debug('Does not exist')).to.be.undefined;
  });

  it('Should throw an error for invalid given custom logger', () => {
    const customLogger = new OHIFLog();
    const logger = () => {};
    const fn = () => { customLogger.setLogger(logger); };
    expect(fn).to.throw();
  });
});
