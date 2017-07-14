import { HangingProtocols } from '../../namespace';

import { entity, Matcher, ProtocolDataSource, ProtocolEngine } from './classes'
HangingProtocols.entity = entity;
HangingProtocols.Matcher = Matcher;
HangingProtocols.ProtocolDataSource = ProtocolDataSource;
HangingProtocols.ProtocolEngine = ProtocolEngine;

import { utils } from './lib/utils';
HangingProtocols.utils = utils;
