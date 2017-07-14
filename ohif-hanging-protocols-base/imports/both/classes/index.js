
/**
 * Define Namespace.
 */

const entity = {};

/**
 * Import entities into namespace.
 */

import { Protocol } from './Protocol';
entity.Protocol = Protocol;

import { Rule } from './Rule';
entity.Rule = Rule;

import { Screen } from './Screen';
entity.Screen = Screen;

import { Stage } from './Stage';
entity.Stage = Stage;

import { Viewport } from './Viewport';
entity.Viewport = Viewport;

import { ViewportStructure } from './ViewportStructure';
entity.ViewportStructure = ViewportStructure;

// Rules

import { ImageMatchingRule } from './rules/ImageMatchingRule';
entity.ImageMatchingRule = ImageMatchingRule;

import { ProtocolMatchingRule } from './rules/ProtocolMatchingRule';
entity.ProtocolMatchingRule = ProtocolMatchingRule;

import { SeriesMatchingRule } from './rules/SeriesMatchingRule';
entity.SeriesMatchingRule = SeriesMatchingRule;

import { StudyMatchingRule } from './rules/StudyMatchingRule';
entity.StudyMatchingRule = StudyMatchingRule;

/**
 * Import Ramaining Classes
 */

import { Matcher } from './Matcher';
import { ProtocolDataSource } from './ProtocolDataSource';
import { ProtocolEngine } from './ProtocolEngine';

/**
 * Export relevant objects
 */

export { entity, Matcher, ProtocolDataSource, ProtocolEngine };
