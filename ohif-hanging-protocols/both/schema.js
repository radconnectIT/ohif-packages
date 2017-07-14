import { HangingProtocols } from 'meteor/ohif:hanging-protocols-base';

// Main Entities
HP.Protocol = HangingProtocols.entity.Protocol;
HP.Screen = HangingProtocols.entity.Screen;
HP.Stage = HangingProtocols.entity.Stage;
HP.Viewport = HangingProtocols.entity.Viewport;
HP.ViewportStructure = HangingProtocols.entity.ViewportStructure;

// Rules
HP.ImageMatchingRule = HangingProtocols.entity.ImageMatchingRule;
HP.ProtocolMatchingRule = HangingProtocols.entity.ProtocolMatchingRule;
HP.SeriesMatchingRule = HangingProtocols.entity.SeriesMatchingRule;
HP.StudyMatchingRule = HangingProtocols.entity.StudyMatchingRule;

// Matcher
HP.Matcher = HangingProtocols.Matcher;
